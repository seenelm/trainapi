import TestUtil from "../fixtures/UserTestFixture";
import UserRegisterRequest from "../../src/dto/UserRegisterRequest";

describe("UserRegisterRequest", () => {
    it("should build a valid UserRegisterRequest", () => {
        const userRegisterRequest = TestUtil.createUserRegisterRequest();
        expect(userRegisterRequest.getUsername()).toBe(TestUtil.USERNAME);
        expect(userRegisterRequest.getPassword()).toBe(TestUtil.PASSWORD);
        expect(userRegisterRequest.getName()).toBe(TestUtil.NAME);
    });
    it("should update the UserRegisterRequest", () => {
        const userRegisterRequest: UserRegisterRequest =
            TestUtil.createUserRegisterRequest();

        const updatedUsername = "updatedUsername";
        const updatedPassword = "updatedPassword";
        const updatedName = "updatedName";

        userRegisterRequest.setUsername(updatedUsername);
        userRegisterRequest.setPassword(updatedPassword);
        userRegisterRequest.setName(updatedName);

        expect(userRegisterRequest.getUsername()).toBe(updatedUsername);
        expect(userRegisterRequest.getPassword()).toBe(updatedPassword);
        expect(userRegisterRequest.getName()).toBe(updatedName);
    });
});
