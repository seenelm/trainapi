import TestUtil from "../fixtures/UserTestFixture";

describe("UserRegisterResponse", () => {
    it("should build a valid UserRegisterResponse", () => {
        const userRegisterResponse = TestUtil.createUserRegisterResponse();

        expect(userRegisterResponse.getUserId()).toBe(TestUtil.USER_ID);
        expect(userRegisterResponse.getToken()).toBe(TestUtil.TOKEN);
        expect(userRegisterResponse.getUsername()).toBe(TestUtil.USERNAME);
        expect(userRegisterResponse.getName()).toBe(TestUtil.NAME);
    });

    it("should update the UserRegisterResponse", () => {
        const userRegisterResponse = TestUtil.createUserRegisterResponse();
        const updatedUserId = "123456";
        const updatedToken = "updatedToken";
        const updatedUsername = "updatedUsername";
        const updatedName = "Tom Brady";

        userRegisterResponse.setUserId(updatedUserId);
        userRegisterResponse.setToken(updatedToken);
        userRegisterResponse.setUsername(updatedUsername);
        userRegisterResponse.setName(updatedName);

        expect(userRegisterResponse.getUserId()).toBe(updatedUserId);
        expect(userRegisterResponse.getToken()).toBe(updatedToken);
        expect(userRegisterResponse.getUsername()).toBe(updatedUsername);
        expect(userRegisterResponse.getName()).toBe(updatedName);
    });
});
