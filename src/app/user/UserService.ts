import UserRepository from "../../infrastructure/database/repositories/user/UserRepository";
import JWTUtil from "../../utils/JWTUtil";
import BcryptUtil from "../../utils/BcryptUtil";
import { UserDocument } from "../../infrastructure/database/models/user/userModel";
import UserProfileDAO from "../../dao/UserProfileDAO";
import UserGroupsDAO from "../../dao/UserGroupsDAO";
import FollowDAO from "../../dao/FollowDAO";
import { MongooseError, Types } from "mongoose";
import User from "../../infrastructure/database/entity/user/User";

import { UserLoginRequest, UserResponse } from "./dto/userDto";

import mongoose from "mongoose";
import { APIError } from "../../common/errors/APIError";
import { Logger } from "../../common/logger2";

import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { MongoServerError } from "mongodb";
import { DatabaseError } from "../../common/errors/DatabaseError";
import { AuthError } from "../../common/errors/AuthError";
import { v4 as uuidv4 } from "uuid";
import UserRequest from "./dto/UserRequest";

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

    public async registerUser(userRequest: UserRequest): Promise<UserResponse> {
        try {
            const email = userRequest.getEmail();

            const username = this.generateUniqueUsername(
                userRequest.getEmail(),
            );

            const user = await this.userRepository.findOne({
                $or: [{ email }, { username }],
            });

            if (user) {
                throw APIError.Conflict(
                    "Account with this email/username already exists",
                    { email, username },
                );
            }

            const hash = await BcryptUtil.hashPassword(
                userRequest.getPassword(),
            );

            userRequest.setUsername(username);
            userRequest.setIsActive(true);
            userRequest.setPassword(hash);

            const userDocument = this.userRepository.toDocument(userRequest);

            return this.createUser(userDocument, userRequest.getName());
        } catch (error) {
            throw error;
        }
    }

    public async loginUser(
        userLoginRequest: UserLoginRequest,
    ): Promise<UserResponse> {
        const { email, password } = userLoginRequest;
        try {
            const user: User = await this.userRepository.findOne({ email });

            if (!user) {
                throw APIError.NotFound("User not found", { email });
            }

            await BcryptUtil.comparePassword(password, user.getPassword());

            const userProfile = await this.userProfileDAO.findOne({
                userId: user.getId(),
            });

            const token = await this.generateAuthToken(
                userProfile.name,
                user.getId(),
            );

            return this.userRepository.toResponse(
                user,
                token,
                userProfile.name,
            );
        } catch (error) {
            if (
                error instanceof MongooseError ||
                error instanceof MongoServerError
            ) {
                throw DatabaseError.handleMongoDBError(error);
            }

            throw APIError.InternalServerError(
                "An error occurred while logging in",
                { error },
            );
        }
    }

    public async authenticateWithGoogle(
        decodedToken: DecodedIdToken,
        providedName?: string,
    ): Promise<UserResponse> {
        try {
            const { uid: googleId, email, name: googleName } = decodedToken;
            const name = providedName || googleName || email.split("@")[0];

            let user = await this.userRepository.findOne({ googleId });

            if (user) {
                return this.loginExistingGoogleUser(user);
            }

            const username = this.generateUniqueUsername(email);

            user = await this.userRepository.findOne({
                $or: [{ email: email }, { username: username }],
            });

            if (user) {
                throw APIError.Conflict(
                    "Account with this email/username already exists but not linked to this authentication provider",
                    { email, username },
                );
            }

            const userRequest = UserRequest.builder()
                .setUsername(username)
                .setIsActive(true)
                .setEmail(email)
                .setAuthProvider("google")
                .build();

            const userDocument = this.userRepository.toDocument(
                userRequest,
                googleId,
            );

            return this.createUser(userDocument, name);
        } catch (error) {
            throw error;
        }
    }

    private async loginExistingGoogleUser(user: User): Promise<UserResponse> {
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

    private async createUser(
        userDocument: Partial<UserDocument>,
        name: string,
    ): Promise<UserResponse> {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const newUser = await this.userRepository.create(userDocument, {
                session,
            });

            await Promise.all([
                this.userProfileDAO.create(
                    {
                        userId: newUser.getId(),
                        name,
                        username: newUser.getUsername(),
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

            this.logger.info("New user created", {
                username: newUser.getUsername(),
                userId: newUser.getId(),
                authProvider: newUser.getAuthProvider(),
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

    private generateUniqueUsername(email: string): string {
        const username = email.split("@")[0];
        const uniqueId = uuidv4().split("-")[0]; // Generate a short unique ID
        return `${username}_${uniqueId}`;
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
