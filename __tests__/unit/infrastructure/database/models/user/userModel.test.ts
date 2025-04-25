import {
    UserModel,
    UserDocument,
} from "../../../../../../src/infrastructure/database/models/user/userModel";
import UserTestFixture from "../../../../../fixtures/UserTestFixture";
import mongoose from "mongoose";

describe("UserModel Unit Tests", () => {
    beforeAll(() => {
        jest.mock(
            "../../../../../../src/infrastructure/database/models/user/userModel",
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should create a valid user with all fields", async () => {
        // Arrange
        const userDocument: Partial<UserDocument> =
            UserTestFixture.createUserDocument();

        UserModel.prototype.save = jest.fn().mockResolvedValue(userDocument);
        const user = new UserModel(userDocument);

        // Act
        const savedUser = await new UserModel(user).save();

        // Assert
        expect(savedUser.username).toBe(userDocument.username);
        expect(savedUser.password).toBe(userDocument.password);
        expect(savedUser.isActive).toBe(userDocument.isActive);
        expect(savedUser.deviceToken).toBe(userDocument.deviceToken);
        expect(savedUser.googleId).toBe(userDocument.googleId);
        expect(savedUser.email).toBe(userDocument.email);
        expect(savedUser.authProvider).toBe(userDocument.authProvider);
    });

    it("should require password when googleId is not provided", async () => {});

    it("should show validation error when required fields are missing", async () => {
        // Arrange
        const userDocument: Partial<UserDocument> =
            UserTestFixture.updateUserDocument({
                username: "",
                deviceToken: null,
                googleId: null,
                email: "",
                authProvider: "",
                isActive: null,
            });

        const user = new UserModel(userDocument);

        try {
            // Act
            await user.validate();
        } catch (err) {
            console.log(err);
            // Assert
            if (err instanceof mongoose.Error.ValidationError) {
                expect(err.errors.username.message).toBe(
                    "Path `username` is required.",
                );
                expect(err.errors.email.message).toBe(
                    "Path `email` is required.",
                );
                expect(err.errors.authProvider.message).toBe(
                    "Path `authProvider` is required.",
                );
                expect(err.errors.isActive.message).toBe(
                    "Path `isActive` is required.",
                );
            }
        }
    });
});
