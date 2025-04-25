import TestUtil from "../fixtures/UserTestFixture";

describe("UserLoginResponse", () => {
    it("should create a UserLoginResponse object", () => {
        const userLoginResponse = TestUtil.createUserLoginResponse();

        expect(userLoginResponse.getUserId()).toBe(TestUtil.USER_ID);
        expect(userLoginResponse.getToken()).toBe(TestUtil.TOKEN);
        expect(userLoginResponse.getUsername()).toBe(TestUtil.USERNAME);
        expect(userLoginResponse.getName()).toBe(TestUtil.NAME);
    });

    it("should update the UserLoginResponse object", () => {
        const userLoginResponse = TestUtil.createUserLoginResponse();

        userLoginResponse.setUserId("123456");
        userLoginResponse.setToken("newToken");
        userLoginResponse.setUsername("newUsername");
        userLoginResponse.setName("newName");

        expect(userLoginResponse.getUserId()).toBe("123456");
        expect(userLoginResponse.getToken()).toBe("newToken");
        expect(userLoginResponse.getUsername()).toBe("newUsername");
        expect(userLoginResponse.getName()).toBe("newName");
    });
});
