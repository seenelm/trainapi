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
import mongoose from "mongoose";

jest.mock("mongoose");

describe("UserService Unit Tests", () => {
    let userRepository: UserRepository;
    let userProfileDAO: UserProfileDAO;
    let userGroupsDAO: UserGroupsDAO;
    let followDAO: FollowDAO;
    let userService: UserService;
    let mockSession: Partial<mongoose.ClientSession>;

    beforeEach(() => {
        userRepository = jest.requireMock(
            "../../../../src/infrastructure/database/repositories/user/UserRepository",
        );
        userProfileDAO = jest.requireMock("../../../../src/dao/UserProfileDAO");
        userGroupsDAO = jest.requireMock("../../../../src/dao/UserGroupsDAO");
        followDAO = jest.requireMock("../../../../src/dao/FollowDAO");

        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        };

        (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

        userService = new UserService(
            userRepository,
            userProfileDAO,
            userGroupsDAO,
            followDAO,
        );
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("generateUniqueUsername", () => {
        it("should generate a unique username", () => {
            // Arrange
            const email = "test@gmail.com";

            // Act
            const username = userService.generateUniqueUsername(email);
            console.log("Generated username:", username);

            // Assert
            expect(username).toBeDefined();
            // expect(username).toMatch(/test\d+/);
        });
    });

    describe("registerUser", () => {
        it("should register a user successfully", async () => {
            // Arrange
            (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);
            const userRequest = UserTestFixture.createUserRequest();
            const mockUser = UserTestFixture.createUserEntity();
            const username = "user_0111";
            const hashedPassword = "hashedPassword123";
            userRequest.setPassword(hashedPassword);
            const userDocument = UserTestFixture.updateUserDocument({
                password: hashedPassword,
            });

            userService.generateUniqueUsername = jest
                .fn()
                .mockReturnValue(username);
            userRepository.findOne = jest.fn().mockResolvedValue(null);
            (BcryptUtil.hashPassword as jest.Mock) = jest
                .fn()
                .mockResolvedValue(hashedPassword);
            userRepository.toDocument = jest.fn().mockReturnValue(userDocument);

            userRepository.create = jest.fn().mockResolvedValue(mockUser);
            userProfileDAO.create = jest.fn().mockResolvedValue({});
            userGroupsDAO.create = jest.fn().mockResolvedValue({});
            followDAO.create = jest.fn().mockResolvedValue({});
            userService.generateAuthToken = jest
                .fn()
                .mockResolvedValue("token");
            userRepository.toResponse = jest
                .fn()
                .mockReturnValue(UserTestFixture.createUserResponse());

            // Act
            const userResponse: UserResponse =
                await userService.registerUser(userRequest);
            console.log("User response:", userResponse);

            // Assert
            expect(userRepository.findOne).toHaveBeenCalledWith({
                $or: [
                    { email: userRequest.getEmail() },
                    { username: username },
                ],
            });
            expect(BcryptUtil.hashPassword).toHaveBeenCalledWith(
                userRequest.getPassword(),
            );
            expect(userRequest.setUsername).toHaveBeenCalledWith(username);
            expect(userRequest.setIsActive).toHaveBeenCalledWith(true);
            expect(userRequest.setPassword).toHaveBeenCalledWith(
                hashedPassword,
            );
            expect(userRepository.toDocument).toHaveBeenCalledWith(userRequest);
        });
    });
});
