import { Types } from "mongoose";
import { UserDocument } from "../../src/infrastructure/database/models/user/userModel";
import User from "../../src/infrastructure/database/entity/user/User";
import UserRequest from "../../src/app/user/dto/UserRequest";
import { UserResponse, UserLoginRequest } from "../../src/app/user/dto/userDto";
import { IUserProfile } from "../../src/model/userProfile";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";

export default class UserTestFixture {
    public static ID: Types.ObjectId = new Types.ObjectId();
    public static USERNAME: string = "testUser";
    public static NAME: string = "testName";
    public static PASSWORD: string = "testPassword";
    public static IS_ACTIVE: boolean = true;
    public static DEVICE_TOKEN: string = "testDeviceToken";
    public static GOOGLE_ID: string = "testGoogleId";
    public static EMAIL: string = "test@gmail.com";
    public static AUTH_PROVIDER: string = "local";
    public static CREATED_AT: Date = new Date();
    public static UPDATED_AT: Date = new Date();

    public static USER_ID: string = new Types.ObjectId().toString();
    public static TOKEN: string = "token";

    public static createUserDocument(): Partial<UserDocument> {
        return {
            username: this.USERNAME,
            password: this.PASSWORD,
            isActive: this.IS_ACTIVE,
            deviceToken: this.DEVICE_TOKEN,
            googleId: this.GOOGLE_ID,
            email: this.EMAIL,
            authProvider: this.AUTH_PROVIDER,
        };
    }

    public static updateUserDocument(
        updatedData: Partial<UserDocument>,
    ): UserDocument {
        const userDocument = this.createUserDocument();
        const updatedUserDocument = { ...userDocument, ...updatedData };
        return updatedUserDocument as UserDocument;
    }

    public static createUserEntity(): User {
        return User.builder()
            .setId(this.ID)
            .setUsername(this.USERNAME)
            .setPassword(this.PASSWORD)
            .setIsActive(this.IS_ACTIVE)
            .setDeviceToken(this.DEVICE_TOKEN)
            .setGoogleId(this.GOOGLE_ID)
            .setEmail(this.EMAIL)
            .setAuthProvider(this.AUTH_PROVIDER)
            .setCreatedAt(this.CREATED_AT)
            .setUpdatedAt(this.UPDATED_AT)
            .build();
    }

    public static updateUserEntity(updatedData: Partial<User>): Partial<User> {
        const userEntity = this.createUserEntity();
        const updatedUserEntity = { ...userEntity, ...updatedData };
        return updatedUserEntity;
    }

    public static createUserRequest(): UserRequest {
        return UserRequest.builder()
            .setUsername(this.USERNAME)
            .setName(this.NAME)
            .setPassword(this.PASSWORD)
            .setIsActive(this.IS_ACTIVE)
            .setEmail(this.EMAIL)
            .setAuthProvider(this.AUTH_PROVIDER)
            .build();
    }

    public static createUserLoginRequest(
        request?: Partial<UserLoginRequest>,
    ): UserLoginRequest {
        return {
            email: this.EMAIL,
            password: this.PASSWORD,
            ...request,
        };
    }

    public static createUserResponse(): UserResponse {
        return {
            userId: this.USER_ID,
            token: this.TOKEN,
            username: this.USERNAME,
            name: this.NAME,
        };
    }

    public static updateUserResponse(
        updatedData: Partial<UserResponse>,
    ): UserResponse {
        const userResponse = this.createUserResponse();
        const updatedUserResponse = { ...userResponse, ...updatedData };
        return updatedUserResponse;
    }

    public static createUserProfile(
        updatedData?: Partial<IUserProfile>,
    ): IUserProfile {
        return {
            userId: this.ID,
            username: this.USERNAME,
            name: this.NAME,
            bio: "",
            accountType: 0,
            createdAt: this.CREATED_AT,
            updatedAt: this.UPDATED_AT,
            ...updatedData,
        } as IUserProfile;
    }

    public static createDecodedIdToken(
        updatedData?: Partial<DecodedIdToken>,
    ): DecodedIdToken {
        return {
            uid: this.GOOGLE_ID,
            email: this.EMAIL,
            name: this.NAME,
            ...updatedData,
        } as DecodedIdToken;
    }
}
