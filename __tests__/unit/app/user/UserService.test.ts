import UserTestFixture from "../../../fixtures/UserTestFixture";
import UserRepository from "../../../../src/infrastructure/database/repositories/user/UserRepository";
import UserProfileDAO from "../../../../src/dao/UserProfileDAO";
import UserGroupsDAO from "../../../../src/dao/UserGroupsDAO";
import FollowDAO from "../../../../src/dao/FollowDAO";
import UserService from "../../../../src/app/user/UserService";
import UserRequest from "../../../../src/app/user/dto/UserRequest";
import User from "../../../../src/infrastructure/database/entity/user/User";
import BcryptUtil from "../../../../src/common/utils/BcryptUtil";
import { UserDocument } from "../../../../src/infrastructure/database/models/user/userModel";
import { UserResponse } from "../../../../src/app/user/dto/userDto";
import mongoose, { ClientSession } from "mongoose";
import { APIError } from "../../../../src/common/errors/APIError";
import { MongoServerError } from "mongodb";
import { DatabaseError } from "../../../../src/common/errors/DatabaseError";
import { AuthError } from "../../../../src/common/errors/AuthError";
import { Error as MongooseError } from "mongoose";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { UserModel } from "../../../../src/infrastructure/database/models/user/userModel";
import { UserProfileModel } from "../../../../src/model/userProfile";
import { UserGroupsModel } from "../../../../src/model/userGroups";
import { FollowModel } from "../../../../src/model/followModel";
import { mock } from "node:test";

jest.mock(
    "../../../../src/infrastructure/database/repositories/user/UserRepository",
);
jest.mock("../../../../src/dao/UserProfileDAO");
jest.mock("../../../../src/dao/UserGroupsDAO");
jest.mock("../../../../src/dao/FollowDAO");

describe("UserService Unit Tests", () => {
    let userRepository: jest.Mocked<UserRepository>;
    let userProfileDAO: jest.Mocked<UserProfileDAO>;
    let userGroupsDAO: jest.Mocked<UserGroupsDAO>;
    let followDAO: jest.Mocked<FollowDAO>;
    let userService: UserService;
    let mockSession: jest.Mocked<ClientSession>;

    beforeEach(() => {
        userRepository = new UserRepository(
            UserModel,
        ) as jest.Mocked<UserRepository>;
        userProfileDAO = new UserProfileDAO(
            UserProfileModel,
        ) as jest.Mocked<UserProfileDAO>;
        userGroupsDAO = new UserGroupsDAO(
            UserGroupsModel,
        ) as jest.Mocked<UserGroupsDAO>;
        followDAO = new FollowDAO(FollowModel) as jest.Mocked<FollowDAO>;
        // userRepository = jest.requireMock(
        //     "../../../../src/infrastructure/database/repositories/user/UserRepository",
        // );
        // userProfileDAO = jest.requireMock("../../../../src/dao/UserProfileDAO");
        // userGroupsDAO = jest.requireMock("../../../../src/dao/UserGroupsDAO");
        // followDAO = jest.requireMock("../../../../src/dao/FollowDAO");

        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        } as unknown as jest.Mocked<ClientSession>;

        jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession);

        userService = new UserService(
            userRepository,
            userProfileDAO,
            userGroupsDAO,
            followDAO,
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("registerUser", () => {
        it("should register a user successfully", async () => {
            // Arrange
            const username = "user_0111";
            const hashedPassword = "hashedPassword123";
            const mockUserRequest = UserTestFixture.createUserRequest();
            mockUserRequest.setPassword(hashedPassword);
            mockUserRequest.setUsername(username);
            const mockUser = UserTestFixture.createUserEntity();
            const mockUserResponse = UserTestFixture.updateUserResponse({
                username,
            });

            userService.generateUniqueUsername = jest
                .fn()
                .mockReturnValue(username);

            userRepository.findOne = jest.fn().mockResolvedValue(null);
            (BcryptUtil.hashPassword as jest.Mock) = jest
                .fn()
                .mockResolvedValue(hashedPassword);
            userRepository.toDocument = jest.fn().mockReturnValue({});
            userRepository.create = jest.fn().mockResolvedValue(mockUser);
            userProfileDAO.create = jest.fn().mockResolvedValue({});
            userGroupsDAO.create = jest.fn().mockResolvedValue({});
            followDAO.create = jest.fn().mockResolvedValue({});
            userService.generateAuthToken = jest
                .fn()
                .mockResolvedValue(UserTestFixture.TOKEN);
            userRepository.toResponse = jest
                .fn()
                .mockReturnValue(mockUserResponse);

            // Act
            const userResponse: UserResponse =
                await userService.registerUser(mockUserRequest);

            // Assert
            expect(userResponse).toEqual(mockUserResponse);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                $or: [
                    { email: mockUserRequest.getEmail() },
                    { username: username },
                ],
            });
            expect(BcryptUtil.hashPassword).toHaveBeenCalledWith(
                mockUserRequest.getPassword(),
            );

            expect(userRepository.toDocument).toHaveBeenCalledWith(
                mockUserRequest,
            );

            // verify user creation
            expect(userRepository.create).toHaveBeenCalledWith(
                {},
                { session: mockSession },
            );

            // Verify related document creation
            expect(userProfileDAO.create).toHaveBeenCalledWith(
                {
                    userId: mockUser.getId(),
                    name: mockUserRequest.getName(),
                    username: mockUser.getUsername(),
                },
                { session: mockSession },
            );
            expect(userGroupsDAO.create).toHaveBeenCalledWith(
                { userId: mockUser.getId() },
                { session: mockSession },
            );
            expect(followDAO.create).toHaveBeenCalledWith(
                { userId: mockUser.getId() },
                { session: mockSession },
            );

            // Verify token generation
            expect(userService.generateAuthToken).toHaveBeenCalledWith(
                mockUserRequest.getName(),
                mockUser.getId(),
            );

            // Verify response creation
            expect(userRepository.toResponse).toHaveBeenCalledWith(
                mockUser,
                UserTestFixture.TOKEN,
                mockUserRequest.getName(),
            );
            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
            expect(mockSession.abortTransaction).not.toHaveBeenCalled();
        });

        it("should throw Conflict error when user with same email exists", async () => {
            // Arrange
            const existingUser = UserTestFixture.createUserEntity();
            existingUser.setUsername("existingUser");
            const mockUserRequest = UserTestFixture.createUserRequest();
            mockUserRequest.setUsername("newUser");

            userRepository.findOne = jest.fn().mockResolvedValue(existingUser);

            // Act and Assert
            await expect(
                userService.registerUser(mockUserRequest),
            ).rejects.toThrow(APIError);

            expect(userRepository.findOne).toHaveBeenCalled();
            expect(mockSession.startTransaction).not.toHaveBeenCalled();
        });

        it("should throw Conflict error when user with same username exists", async () => {
            // Arrange
            const existingUser = UserTestFixture.createUserEntity();
            existingUser.setEmail("test1@gmail.com");
            const mockUserRequest = UserTestFixture.createUserRequest();
            mockUserRequest.setEmail("test3@yahoo.com");

            userRepository.findOne = jest.fn().mockResolvedValue(existingUser);

            // Act and Assert
            await expect(
                userService.registerUser(mockUserRequest),
            ).rejects.toThrow(APIError);

            expect(userRepository.findOne).toHaveBeenCalled();
            expect(mockSession.startTransaction).not.toHaveBeenCalled();
        });

        it("should handle database errors during user creation", async () => {
            // Arrange
            const mockUserRequest = UserTestFixture.createUserRequest();
            const dbError = new MongoServerError({
                code: 11000,
                message: "Duplicate key error",
            });
            userRepository.findOne = jest.fn().mockResolvedValue(null);
            userRepository.create = jest.fn().mockRejectedValue(dbError);

            // Act & Assert
            await expect(
                userService.registerUser(mockUserRequest),
            ).rejects.toThrow(DatabaseError);

            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });

        it("should abort transaction if userProfile creation fails", async () => {
            // Arrange
            const mockUserRequest = UserTestFixture.createUserRequest();
            userRepository.findOne = jest.fn().mockResolvedValue(null);
            userProfileDAO.create = jest
                .fn()
                .mockRejectedValue(new Error("UserProfile creation failed"));

            // Act & Assert
            await expect(
                userService.registerUser(mockUserRequest),
            ).rejects.toThrow(DatabaseError);

            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });

        it("should abort transaction if userGroups creation fails", async () => {
            // Arrange
            const mockUserRequest = UserTestFixture.createUserRequest();
            userRepository.findOne = jest.fn().mockResolvedValue(null);
            userGroupsDAO.create = jest
                .fn()
                .mockRejectedValue(new Error("UserGroups creation failed"));

            // Act & Assert
            await expect(
                userService.registerUser(mockUserRequest),
            ).rejects.toThrow(DatabaseError);

            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });

        it("should abort transaction if follow creation fails", async () => {
            // Arrange
            const mockUsername = "user_0111";
            const hashPassword = "hashedPassword123";
            const mockUserRequest = UserTestFixture.createUserRequest();
            mockUserRequest.setUsername(mockUsername);
            mockUserRequest.setPassword(hashPassword);

            const mockUserDocument = UserTestFixture.updateUserDocument({
                username: mockUserRequest.getUsername(),
                password: hashPassword,
            });

            userService.generateUniqueUsername = jest
                .fn()
                .mockReturnValue(mockUsername);
            userRepository.findOne = jest.fn().mockResolvedValue(null);
            userRepository.toDocument = jest
                .fn()
                .mockReturnValue(mockUserDocument);
            followDAO.create = jest
                .fn()
                .mockRejectedValue(new Error("Follow creation failed"));

            // Act & Assert
            await expect(
                userService.registerUser(mockUserRequest),
            ).rejects.toThrow(DatabaseError);

            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
        });
    });

    describe("loginUser", () => {
        it("should log in a user successfully", async () => {
            // Arrange
            const mockUserLoginRequest =
                UserTestFixture.createUserLoginRequest();
            const mockUser = UserTestFixture.createUserEntity();
            const mockUserProfile = UserTestFixture.createUserProfile({
                id: mockUser.getId(),
            });
            const mockUserResponse = UserTestFixture.updateUserResponse({
                username: "user_0111",
            });

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            (BcryptUtil.comparePassword as jest.Mock) = jest
                .fn()
                .mockResolvedValue(true);
            userProfileDAO.findOne = jest
                .fn()
                .mockResolvedValue(mockUserProfile);
            userRepository.toResponse = jest
                .fn()
                .mockReturnValue(mockUserResponse);
            userService.generateAuthToken = jest
                .fn()
                .mockResolvedValue(UserTestFixture.TOKEN);

            // Act
            const userResponse: UserResponse =
                await userService.loginUser(mockUserLoginRequest);

            // Assert
            expect(userResponse).toEqual(mockUserResponse);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                email: mockUserLoginRequest.email,
            });
            expect(BcryptUtil.comparePassword).toHaveBeenCalledWith(
                mockUserLoginRequest.password,
                mockUser.getPassword(),
            );
            expect(userProfileDAO.findOne).toHaveBeenCalledWith({
                userId: mockUser.getId(),
            });
            expect(userService.generateAuthToken).toHaveBeenCalledWith(
                mockUserProfile.name,
                mockUser.getId(),
            );
            expect(userRepository.toResponse).toHaveBeenCalledWith(
                mockUser,
                UserTestFixture.TOKEN,
                mockUserProfile.name,
            );
        });

        it("should throw NotFound error if user does not exist", async () => {
            // Arrange
            const mockUserLoginRequest =
                UserTestFixture.createUserLoginRequest();
            userRepository.findOne = jest.fn().mockResolvedValue(null);

            // Act & Assert
            await expect(
                userService.loginUser(mockUserLoginRequest),
            ).rejects.toThrow(APIError);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                email: mockUserLoginRequest.email,
            });
        });

        it("should throw AuthError when password comparison fails", async () => {
            // Arrange
            const mockUserLoginRequest = UserTestFixture.createUserLoginRequest(
                { password: "Password98" },
            );

            const mockUser = UserTestFixture.createUserEntity();
            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            (BcryptUtil.comparePassword as jest.Mock) = jest
                .fn()
                .mockReturnValue(false);

            // Act & Assert
            await expect(
                userService.loginUser(mockUserLoginRequest),
            ).rejects.toThrow(AuthError);
        });

        it("should throw AuthError when generating token fails", async () => {
            // Arrange
            const mockUserLoginRequest =
                UserTestFixture.createUserLoginRequest();
            const mockUser = UserTestFixture.createUserEntity();
            const mockUserProfile = UserTestFixture.createUserProfile({
                id: mockUser.getId(),
            });

            userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
            (BcryptUtil.comparePassword as jest.Mock) = jest
                .fn()
                .mockResolvedValue(true);
            userProfileDAO.findOne = jest
                .fn()
                .mockResolvedValue(mockUserProfile);
            userService.generateAuthToken = jest
                .fn()
                .mockRejectedValue(
                    AuthError.handleJWTError("Token generation failed"),
                );

            // Act
            await expect(
                userService.loginUser(mockUserLoginRequest),
            ).rejects.toThrow(AuthError);
        });

        it("should handle database errors during login", async () => {
            // Arrange
            const mockUserLoginRequest =
                UserTestFixture.createUserLoginRequest();
            const dbError = new MongooseError.DocumentNotFoundError(
                "User not found",
            );

            userRepository.findOne = jest.fn().mockRejectedValue(dbError);

            // Act & Assert
            await expect(
                userService.loginUser(mockUserLoginRequest),
            ).rejects.toThrow(DatabaseError);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                email: mockUserLoginRequest.email,
            });
        });
    });

    describe("authenticateWithGoogle", () => {
        it("should authenticate an existing Google user", async () => {
            // Arrange
            const decodedToken: DecodedIdToken =
                UserTestFixture.createDecodedIdToken();
            const providedName = "Test User";
            const mockExistingUser = UserTestFixture.createUserEntity();
            const mockUserProfile = UserTestFixture.createUserProfile({
                userId: mockExistingUser.getId(),
            });
            const mockUserResponse = UserTestFixture.updateUserResponse({
                userId: mockExistingUser.getId().toString(),
                username: mockExistingUser.getUsername(),
                name: mockUserProfile.name,
            });
            userRepository.findOne = jest
                .fn()
                .mockResolvedValue(mockExistingUser);
            userProfileDAO.findOne = jest
                .fn()
                .mockResolvedValue(mockUserProfile);
            userService.generateAuthToken = jest
                .fn()
                .mockResolvedValue(UserTestFixture.TOKEN);
            userRepository.toResponse = jest
                .fn()
                .mockReturnValue(mockUserResponse);

            // Act
            const userResponse: UserResponse =
                await userService.authenticateWithGoogle(
                    decodedToken,
                    providedName,
                );

            // Assert
            expect(userResponse).toEqual(mockUserResponse);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                googleId: decodedToken.uid,
            });
            expect(userProfileDAO.findOne).toHaveBeenCalledWith({
                userId: mockExistingUser.getId(),
            });
            expect(userRepository.toResponse).toHaveBeenCalledWith(
                mockExistingUser,
                UserTestFixture.TOKEN,
                mockUserProfile.name,
            );
        });

        it("should create a new user when Google user does not exist", async () => {
            // Arrange
            const decodedToken: DecodedIdToken =
                UserTestFixture.createDecodedIdToken();
            const providedName = "Test User";
            const mockUsername = "user_0111";

            const mockUserRequest = UserTestFixture.createUserRequest();
            mockUserRequest.setUsername(mockUsername);
            mockUserRequest.setAuthProvider("google");
            const mockUserDocument = UserTestFixture.updateUserDocument({
                username: mockUserRequest.getUsername(),
                googleId: decodedToken.uid,
                authProvider: "google",
            });

            const mockNewUser = UserTestFixture.createUserEntity();
            mockNewUser.setUsername(mockUsername);
            mockNewUser.setGoogleId(decodedToken.uid);
            mockNewUser.setAuthProvider("google");

            const mockUserResponse = UserTestFixture.updateUserResponse({
                userId: mockNewUser.getId().toString(),
                username: mockNewUser.getUsername(),
                name: providedName,
            });

            userRepository.findOne = jest.fn().mockResolvedValue(null);
            userService.generateUniqueUsername = jest
                .fn()
                .mockReturnValue(mockUsername);
            userRepository.toDocument = jest
                .fn()
                .mockReturnValue(mockUserDocument);
            userRepository.create = jest.fn().mockResolvedValue(mockNewUser);
            userProfileDAO.create = jest.fn().mockResolvedValue({});
            userGroupsDAO.create = jest.fn().mockResolvedValue({});
            followDAO.create = jest.fn().mockResolvedValue({});
            userService.generateAuthToken = jest
                .fn()
                .mockResolvedValue(UserTestFixture.TOKEN);
            userRepository.toResponse = jest
                .fn()
                .mockReturnValue(mockUserResponse);

            // Act
            const userResponse: UserResponse =
                await userService.authenticateWithGoogle(
                    decodedToken,
                    providedName,
                );

            // Assert
            expect(userResponse).toEqual(mockUserResponse);
            expect(userRepository.findOne).toHaveBeenCalledWith({
                googleId: decodedToken.uid,
            });
            expect(userService.generateUniqueUsername).toHaveBeenCalledWith(
                decodedToken.email,
            );
            expect(userRepository.toDocument).toHaveBeenCalled();

            expect(userRepository.create).toHaveBeenCalledWith(
                mockUserDocument,
                { session: mockSession },
            );

            // Verify related document creation
            expect(userProfileDAO.create).toHaveBeenCalledWith(
                {
                    userId: mockNewUser.getId(),
                    name: providedName,
                    username: mockNewUser.getUsername(),
                },
                { session: mockSession },
            );
            expect(userGroupsDAO.create).toHaveBeenCalledWith(
                { userId: mockNewUser.getId() },
                { session: mockSession },
            );
            expect(followDAO.create).toHaveBeenCalledWith(
                { userId: mockNewUser.getId() },
                { session: mockSession },
            );

            // Verify token generation
            expect(userService.generateAuthToken).toHaveBeenCalledWith(
                providedName,
                mockNewUser.getId(),
            );

            // Verify response creation
            expect(userRepository.toResponse).toHaveBeenCalledWith(
                mockNewUser,
                UserTestFixture.TOKEN,
                providedName,
            );
            expect(mockSession.startTransaction).toHaveBeenCalled();
            expect(mockSession.commitTransaction).toHaveBeenCalled();
            expect(mockSession.endSession).toHaveBeenCalled();
            expect(mockSession.abortTransaction).not.toHaveBeenCalled();
        });

        it("should throw APIError.Conflict if user with same email exists", async () => {
            // Arrange
            const decodedToken: DecodedIdToken =
                UserTestFixture.createDecodedIdToken();
            const providedName = "Test User";
            const mockUsername = "user_0111";
            const mockExistingUser = UserTestFixture.createUserEntity();
            mockExistingUser.setUsername(mockUsername);

            userService.generateUniqueUsername = jest
                .fn()
                .mockReturnValue(mockUsername);
            userRepository.findOne = jest
                .fn()
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(mockExistingUser);

            // Act & Assert
            await expect(
                userService.authenticateWithGoogle(decodedToken, providedName),
            ).rejects.toThrow(APIError);

            expect(userRepository.findOne).toHaveBeenNthCalledWith(1, {
                googleId: decodedToken.uid,
            });
            expect(userRepository.findOne).toHaveBeenNthCalledWith(2, {
                $or: [
                    { email: mockExistingUser.getEmail() },
                    { username: mockExistingUser.getUsername() },
                ],
            });
        });

        it("should throw AuthError when generating token fails when logging in existing user", async () => {
            // Arrange
            const decodedToken: DecodedIdToken =
                UserTestFixture.createDecodedIdToken();
            const providedName = "Test User";
            const mockExistingUser = UserTestFixture.createUserEntity();
            const mockUserProfile = UserTestFixture.createUserProfile({
                userId: mockExistingUser.getId(),
            });

            userRepository.findOne = jest
                .fn()
                .mockResolvedValue(mockExistingUser);
            userProfileDAO.findOne = jest
                .fn()
                .mockResolvedValue(mockUserProfile);
            userService.generateAuthToken = jest
                .fn()
                .mockRejectedValue(
                    AuthError.handleJWTError("Token generation failed"),
                );

            // Act & Assert
            await expect(
                userService.authenticateWithGoogle(decodedToken, providedName),
            ).rejects.toThrow(AuthError);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                googleId: decodedToken.uid,
            });
            expect(userProfileDAO.findOne).toHaveBeenCalledWith({
                userId: mockExistingUser.getId(),
            });
        });

        it("should handle database errors when logging in existing user", async () => {
            // Arrange
            const decodedToken: DecodedIdToken =
                UserTestFixture.createDecodedIdToken();
            const providedName = "Test User";
            const mockExistingUser = UserTestFixture.createUserEntity();
            const dbError = new MongooseError.DocumentNotFoundError(
                "User not found",
            );
            userRepository.findOne = jest
                .fn()
                .mockResolvedValue(mockExistingUser);
            userProfileDAO.findOne = jest.fn().mockRejectedValue(dbError);

            // Act & Assert
            await expect(
                userService.authenticateWithGoogle(decodedToken, providedName),
            ).rejects.toThrow(MongooseError.DocumentNotFoundError);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                googleId: decodedToken.uid,
            });
            expect(userProfileDAO.findOne).toHaveBeenCalledWith({
                userId: mockExistingUser.getId(),
            });
        });

        it("should throw AuthError when generating token fails when creating a new user", async () => {
            // Arrange
            const decodedToken: DecodedIdToken =
                UserTestFixture.createDecodedIdToken();
            const providedName = "Test User";
            const mockUsername = "user_0111";

            const mockNewUser = UserTestFixture.createUserEntity();
            mockNewUser.setUsername(mockUsername);
            mockNewUser.setGoogleId(decodedToken.uid);
            mockNewUser.setAuthProvider("google");

            const mockUserRequest = UserTestFixture.createUserRequest();
            mockUserRequest.setUsername(mockUsername);
            mockUserRequest.setAuthProvider("google");
            const mockUserDocument = UserTestFixture.updateUserDocument({
                username: mockUserRequest.getUsername(),
                googleId: decodedToken.uid,
                authProvider: "google",
            });

            userRepository.findOne = jest.fn().mockResolvedValue(null);
            userService.generateUniqueUsername = jest
                .fn()
                .mockReturnValue(mockUsername);
            userRepository.toDocument = jest
                .fn()
                .mockReturnValue(mockUserDocument);
            userRepository.create = jest.fn().mockResolvedValue(mockNewUser);
            userService.generateAuthToken = jest
                .fn()
                .mockRejectedValue(
                    AuthError.handleJWTError("Token generation failed"),
                );

            // Act & Assert
            await expect(
                userService.authenticateWithGoogle(decodedToken, providedName),
            ).rejects.toThrow(AuthError);

            expect(userRepository.findOne).toHaveBeenCalledWith({
                googleId: decodedToken.uid,
            });
        });

        it("should handle database errors when creating a new user", async () => {
            // Arrange
            const decodedToken: DecodedIdToken =
                UserTestFixture.createDecodedIdToken();
            const providedName = "Test User";
            const mockUsername = "user_0111";
            const dbError = new MongooseError.DocumentNotFoundError(
                "User not found",
            );

            const mockUserRequest = UserTestFixture.createUserRequest();
            mockUserRequest.setUsername(mockUsername);
            mockUserRequest.setAuthProvider("google");
            const mockUserDocument = UserTestFixture.updateUserDocument({
                username: mockUserRequest.getUsername(),
                googleId: decodedToken.uid,
                authProvider: "google",
            });

            userRepository.findOne = jest.fn().mockResolvedValue(null);
            userService.generateUniqueUsername = jest
                .fn()
                .mockReturnValue(mockUsername);
            userRepository.toDocument = jest
                .fn()
                .mockReturnValue(mockUserDocument);
            userRepository.create = jest.fn().mockRejectedValue(dbError);

            // Act & Assert
            await expect(
                userService.authenticateWithGoogle(decodedToken, providedName),
            ).rejects.toThrow(MongooseError.DocumentNotFoundError);
        });
    });
});
