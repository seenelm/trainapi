import UserRequest from "../../../../../src/app/user/dto/UserRequest";
import UserTestFixture from "../../../../fixtures/UserTestFixture";

describe("UserRequest Unit Tests", () => {
    it("should create a UserRequest instance", () => {
        // Arrange
        const userRequest: UserRequest = UserTestFixture.createUserRequest();

        // Assert
        expect(userRequest.getUsername()).toBe(UserTestFixture.USERNAME);
        expect(userRequest.getPassword()).toBe(UserTestFixture.PASSWORD);
        expect(userRequest.getIsActive()).toBe(UserTestFixture.IS_ACTIVE);
        expect(userRequest.getEmail()).toBe(UserTestFixture.EMAIL);
        expect(userRequest.getAuthProvider()).toBe(
            UserTestFixture.AUTH_PROVIDER,
        );
        expect(userRequest.getName()).toBe(UserTestFixture.NAME);
    });

    it("should update the UserRequest instance", () => {
        // Arrange
        const userRequest: UserRequest = UserTestFixture.createUserRequest();
        userRequest.setUsername("newUsername");
        userRequest.setPassword("newPassword");
        userRequest.setIsActive(false);
        userRequest.setEmail("updated@email.com");
        userRequest.setAuthProvider("google");
        userRequest.setName("updatedName");

        // Assert
        expect(userRequest.getUsername()).toBe("newUsername");
        expect(userRequest.getPassword()).toBe("newPassword");
        expect(userRequest.getIsActive()).toBe(false);
        expect(userRequest.getEmail()).toBe("updated@email.com");
        expect(userRequest.getAuthProvider()).toBe("google");
        expect(userRequest.getName()).toBe("updatedName");
    });
});
