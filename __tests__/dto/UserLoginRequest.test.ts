import TestUtil from "../fixtures/UserTestFixture";

describe("UserLoginRequest", () => {
    it("should validate the UserLoginRequest", () => {
        const userLoginRequest = TestUtil.createUserLoginRequest();

        expect(userLoginRequest.getUsername()).toBe(TestUtil.USERNAME);
        expect(userLoginRequest.getPassword()).toBe(TestUtil.PASSWORD);
    });
    it("should update the UserLoginRequest", () => {
        const userLoginRequest = TestUtil.createUserLoginRequest();
        userLoginRequest.setUsername("newUsername");
        userLoginRequest.setPassword("newPassword");

        expect(userLoginRequest.getUsername()).toBe("newUsername");
        expect(userLoginRequest.getPassword()).toBe("newPassword");
    });
});
