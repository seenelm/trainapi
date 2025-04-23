import UserRepository from "../../infrastructure/database/repositories/user/UserRepository";
import * as Errors from "../../utils/errors";
import JWTUtil from "../../utils/JWTUtil";
import BcryptUtil from "../../utils/BcryptUtil";
import admin from "../../infrastructure/firebase";
import UserProfileDAO from "../../dao/UserProfileDAO";
import UserGroupsDAO from "../../dao/UserGroupsDAO";
import FollowDAO from "../../dao/FollowDAO";
import CustomLogger from "../../common/logger";
import { Types } from "mongoose";
import User from "../../infrastructure/database/entity/user/User";

import {
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
} from "./dto/userDto";

import mongoose from "mongoose";
import { APIError } from "../../common/errors/APIError";

export interface TokenPayload {
    name: string;
    userId: Types.ObjectId;
}

export default class UserService {
    private userRepository: UserRepository;
    private userProfileDAO: UserProfileDAO;
    private userGroupsDAO: UserGroupsDAO;
    private followDAO: FollowDAO;
    private logger: CustomLogger;

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
        this.logger = new CustomLogger(this.constructor.name);
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
            this.logger.logError(
                `Error validating password for user ${username}`,
                error,
            );
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
            this.logger.logError(
                `Error signing JWT for user ${username}`,
                error,
            );
        });

        // TODO: FIX THIS.
        if (!token) {
            throw new Errors.InternalServerError("Error signing JWT");
        }

        this.logger.logInfo("User logged in", {
            username,
            userId: user.getId(),
        });

        return this.userRepository.toResponse(user, token, userProfile.name);
    }

    public async authenticateWithGoogle(idToken: string, providedName?: string): Promise<UserResponse> {
        try {
            // Verify the ID token with Firebase
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            
            // Extract user information
            const { uid: googleId, email, name: googleName } = decodedToken;
            const name = providedName || googleName || email.split('@')[0];
            
            // Generate a username (could be email or a random string)
            const username = email || `user_${Date.now()}`;
            
            // Check if user already exists by googleId
            let user = await this.userRepository.findOne({ googleId });
            
            if (!user) {
                // Check if user exists by username/email
                user = await this.userRepository.findOne({ username });
                
                if (user) {
                    // User exists but doesn't have googleId linked
                    // You might want to handle this case differently
                    throw APIError.Conflict("Account with this email already exists but not linked to Google");
                }
                
                // Create a new user
                const session = await mongoose.startSession();
                session.startTransaction();
                
                try {
                    // Create user without password
                    const newUser = await this.userRepository.create({
                        username,
                        googleId,
                        email,
                        authProvider: 'google',
                        isActive: true,
                    });
                    
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
                    const payload: TokenPayload = {
                        name,
                        userId: newUser.getId(),
                    };
                    
                    const token = await JWTUtil.sign(payload, process.env.SECRET_CODE);
                    
                    if (!token) {
                        throw APIError.InternalServerError("Failed to generate JWT authentication token");
                    }
                    
                    return this.userRepository.toResponse(newUser, token, name);
                } catch (error) {
                    await session.abortTransaction();
                    throw error;
                } finally {
                    session.endSession();
                }
            } else {
                // User exists, log them in
                const userProfile = await this.userProfileDAO.findOne({
                    userId: user.getId(),
                });
                
                const payload: TokenPayload = {
                    name: userProfile.name,
                    userId: user.getId(),
                };
                
                const token = await JWTUtil.sign(payload, process.env.SECRET_CODE);
                
                if (!token) {
                    throw APIError.InternalServerError("Failed to generate JWT authentication token");
                }
                
                this.logger.logInfo("User logged in with Google", {
                    username: user.getUsername(),
                    userId: user.getId(),
                });
                
                return this.userRepository.toResponse(user, token, userProfile.name);
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.logger.logError("Error authenticating with Google", err);
            throw err;
        }
    }
}
