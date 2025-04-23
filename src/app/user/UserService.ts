import UserRepository from "../../infrastructure/database/repositories/user/UserRepository";
import * as Errors from "../../utils/errors";
import JWTUtil from "../../utils/JWTUtil";
import BcryptUtil from "../../utils/BcryptUtil";
import { UserDocument } from "../../infrastructure/database/models/user/userModel";
import UserProfileDAO from "../../dao/UserProfileDAO";
import UserGroupsDAO from "../../dao/UserGroupsDAO";
import FollowDAO from "../../dao/FollowDAO";
import CustomLogger from "../../common/logger";
import { MongooseError, Types } from "mongoose";
import User from "../../infrastructure/database/entity/user/User";

import {
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
} from "./dto/userDto";

import mongoose from "mongoose";
import { APIError } from "../../common/errors/APIError";
import { Logger } from "../../common/logger2";

import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { MongoServerError } from "mongodb";
import { DatabaseError } from "../../common/errors/DatabaseError";
import {
    JsonWebTokenError,
    TokenExpiredError,
    NotBeforeError,
} from "jsonwebtoken";
import { AuthError } from "../../common/errors/AuthError";

export interface TokenPayload {
    name: string;
    userId: Types.ObjectId;
}

export default class UserService {
    private userRepository: UserRepository;
    private userProfileDAO: UserProfileDAO;
    private userGroupsDAO: UserGroupsDAO;
    private followDAO: FollowDAO;
    private logger: Logger;

    constructor(
        userRepository: UserRepository,
        userProfileDAO: UserProfileDAO,
        userGroupsDAO: UserGroupsDAO,
        followDAO: FollowDAO,
    ) {
        this.userRepository = userRepository;
        this.userProfileDAO = userProfileDAO;
        this.userGroupsDAO = userGroupsDAO;
        this.followDAO = followDAO;
        this.logger = Logger.getInstance();
    }

    public async registerUser(
        userRegisterRequest: UserRegisterRequest,
    ): Promise<UserResponse> {
        const username = userRegisterRequest.username;
        const password = userRegisterRequest.password;
        const name = userRegisterRequest.name;
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const existingUser: User = await this.userRepository.findOne({
                username,
            });
            if (existingUser) {
                throw APIError.Conflict("username already taken");
            }

            // Hash password
            const hash = await BcryptUtil.hashPassword(password);

            const newUser: User = await this.userRepository.create({
                username,
                password: hash,
                isActive: true,
            });

            await Promise.all([
                this.userProfileDAO.create(
                    {
                        userId: newUser.getId(),
                        name,
                        username,
                    },
                    { session },
                ),
                this.userGroupsDAO.create(
                    {
                        userId: newUser.getId(),
                    },
                    { session },
                ),
                this.followDAO.create(
                    {
                        userId: newUser.getId(),
                    },
                    { session },
                ),
            ]);

            const payload: TokenPayload = {
                name,
                userId: newUser.getId(),
            };

            const token = await JWTUtil.sign(payload, process.env.SECRET_CODE);

            // TODO: FIX THIS.
            if (!token) {
                throw APIError.InternalServerError(
                    "Failed to generate JWT authentication token",
                );
            }

            return this.userRepository.toResponse(newUser, token, name);
        } catch (error) {}
    }

    public async loginUser(
        userLoginRequest: UserLoginRequest,
    ): Promise<UserResponse> {
        const { username, password } = userLoginRequest;
        const user: User = await this.userRepository.findOne({ username });
        let errors = {};

        if (!user) {
            errors = { username: "Incorrect Username or Password" };
            throw new Errors.AuthError(errors, 400);
        }

        const validPassword = await BcryptUtil.comparePassword(
            password,
            user.getPassword(),
        ).catch((error) => {
            // this.logger.logError(
            //     `Error validating password for user ${username}`,
            //     error,
            // );
        });

        if (!validPassword) {
            errors = { password: "Incorrect Username or Password" };
            throw new Errors.AuthError(errors, 400);
        }

        const userProfile = await this.userProfileDAO.findOne({
            userId: user.getId(),
        });

        const payload: TokenPayload = {
            name: userProfile.name,
            userId: user.getId(),
        };

        const token = await JWTUtil.sign(
            payload,
            process.env.SECRET_CODE,
        ).catch((error) => {
            // this.logger.logError(
            //     `Error signing JWT for user ${username}`,
            //     error,
            // );
        });

        // TODO: FIX THIS.
        if (!token) {
            throw new Errors.InternalServerError("Error signing JWT");
        }

        // this.logger.logInfo("User logged in", {
        //     username,
        //     userId: user.getId(),
        // });

        return this.userRepository.toResponse(user, token, userProfile.name);
    }

    public async authenticateWithGoogle(
        decodedToken: DecodedIdToken,
        providedName?: string,
    ): Promise<UserResponse> {
        try {
            // Extract user information
            const { uid: googleId, email, name: googleName } = decodedToken;
            const name = providedName || googleName || email.split("@")[0];

            // Check if user already exists by googleId
            let user = await this.userRepository.findOne({ googleId });

            if (user) {
                // User exists, log them in
                return this.loginExistingGoogleUser(user, name);
            }

            // Generate a username (could be email or a random string)
            const username = email ?? `user_${Date.now()}`;

            // Check if user exists by username/email
            user = await this.userRepository.findOne({
                $or: [{ email: email }, { username: username }],
            });

            if (user) {
                throw APIError.Conflict(
                    "Account with this email/username already exists but not linked to this authentication provider",
                    { email, username },
                );
            }

            // Create a new user with Google authentication
            return this.createGoogleUser(googleId, email, username, name);
        } catch (error) {
            throw error;
        }
    }

    private async loginExistingGoogleUser(
        user: User,
        name: string,
    ): Promise<UserResponse> {
        try {
            const userProfile = await this.userProfileDAO.findOne({
                userId: user.getId(),
            });

            const token = await this.generateAuthToken(
                userProfile.name,
                user.getId(),
            );

            this.logger.info("User logged in with Google", {
                username: user.getUsername(),
                userId: user.getId(),
            });

            return this.userRepository.toResponse(
                user,
                token,
                userProfile.name,
            );
        } catch (error) {
            throw DatabaseError.handleMongoDBError(error);
        }
    }

    private async createGoogleUser(
        googleId: string,
        email: string,
        username: string,
        name: string,
    ): Promise<UserResponse> {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            // Create user without password
            const newUser = await this.userRepository.create(
                {
                    username,
                    googleId,
                    email,
                    authProvider: "google",
                    isActive: true,
                },
                { session },
            );

            // Create related documents
            await Promise.all([
                this.userProfileDAO.create(
                    {
                        userId: newUser.getId(),
                        name,
                        username,
                    },
                    { session },
                ),
                this.userGroupsDAO.create(
                    {
                        userId: newUser.getId(),
                    },
                    { session },
                ),
                this.followDAO.create(
                    {
                        userId: newUser.getId(),
                    },
                    { session },
                ),
            ]);

            await session.commitTransaction();

            // Generate JWT token
            const token = await this.generateAuthToken(name, newUser.getId());

            this.logger.info("New user created with Google auth", {
                username,
                userId: newUser.getId(),
            });

            return this.userRepository.toResponse(newUser, token, name);
        } catch (error) {
            await session.abortTransaction();
            throw DatabaseError.handleMongoDBError(error);
        } finally {
            session.endSession();
        }
    }

    private async generateAuthToken(
        name: string,
        userId: Types.ObjectId,
    ): Promise<string> {
        const payload: TokenPayload = {
            name,
            userId,
        };
        try {
            return await JWTUtil.sign(payload, process.env.SECRET_CODE);
        } catch (error) {
            // TODO: throw internal server error if not JWT error
            throw AuthError.handleJWTError(error);
        }
    }

    // public async findUserById(userId: Types.ObjectId): Promise<IUser | null> {
    //     const user = await this.userRepository.findUserById(
    //         userId,
    //         "username isActive",
    //     );

    //     if (!user) {
    //         throw new Errors.ResourceNotFoundError("User not found", {
    //             userId,
    //         });
    //     }

    //     this.logger.logInfo("Find User By Id", { user });

    //     return user;
    // }

    // public async deleteUserAccount(userId: Types.ObjectId): Promise<void> {
    //     await this.userRepository.deleteUserAccount(userId);
    // }
}
