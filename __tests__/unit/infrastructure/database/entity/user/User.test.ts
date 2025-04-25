import UserTestFixture from "../../../../../fixtures/UserTestFixture";
import User from "../../../../../../src/infrastructure/database/entity/user/User";

describe("User Entity Unit Tests", () => {
    it("should create a user entity", () => {
        // Arrange
        const user: User = UserTestFixture.createUserEntity();

        // Assert
        expect(user.getId()).toEqual(UserTestFixture.ID);
        expect(user.getUsername()).toEqual(UserTestFixture.USERNAME);
        expect(user.getPassword()).toEqual(UserTestFixture.PASSWORD);
        expect(user.getIsActive()).toEqual(UserTestFixture.IS_ACTIVE);
        expect(user.getDeviceToken()).toEqual(UserTestFixture.DEVICE_TOKEN);
        expect(user.getGoogleId()).toEqual(UserTestFixture.GOOGLE_ID);
        expect(user.getEmail()).toEqual(UserTestFixture.EMAIL);
        expect(user.getAuthProvider()).toEqual(UserTestFixture.AUTH_PROVIDER);
        expect(user.getCreatedAt()).toEqual(UserTestFixture.CREATED_AT);
        expect(user.getUpdatedAt()).toEqual(UserTestFixture.UPDATED_AT);
    });

    it("should update a user entity", () => {
        // Arrange
        const user: User = UserTestFixture.createUserEntity();
        user.setUsername("updatedUser");
        user.setPassword("updatedPassword");
        user.setIsActive(false);
        user.setDeviceToken("updatedDeviceToken");
        user.setGoogleId("updatedGoogleId");
        user.setEmail("updated@gmail.com");
        user.setAuthProvider("google");
        user.setUpdatedAt(new Date("2023-01-01T00:00:00Z"));

        // Assert
        expect(user.getId()).toEqual(UserTestFixture.ID);
        expect(user.getUsername()).toEqual("updatedUser");
        expect(user.getPassword()).toEqual("updatedPassword");
        expect(user.getIsActive()).toEqual(false);
        expect(user.getDeviceToken()).toEqual("updatedDeviceToken");
        expect(user.getGoogleId()).toEqual("updatedGoogleId");
        expect(user.getEmail()).toEqual("updated@gmail.com");
        expect(user.getAuthProvider()).toEqual("google");
        expect(user.getCreatedAt()).toEqual(UserTestFixture.CREATED_AT);
        expect(user.getUpdatedAt()).toEqual(new Date("2023-01-01T00:00:00Z"));
    });
});
