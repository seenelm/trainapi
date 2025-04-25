import { UserDocument } from "../../models/user/userModel";
import User from "../../entity/user/User";
import { IBaseRepository } from "../../interfaces/IBaseRepository";
import BaseRepository from "../BaseRepository";
import { Model, Types } from "mongoose";
import { UserResponse } from "../../../../app/user/dto/userDto";
import UserRequest from "../../../../app/user/dto/UserRequest";

// import { GroupModel } from "../model/groupModel";
// import { IUserProfile, UserProfileModel } from "../model/userProfile";
// import { IUserGroups, UserGroupsModel } from "../model/userGroups";
// import { ResourceNotFoundError } from "../utils/errors";

interface IUserRepository extends IBaseRepository<User, UserDocument> {}

export default class UserRepository
    extends BaseRepository<User, UserDocument>
    implements IUserRepository
{
    private userModel: Model<UserDocument>;

    constructor(userModel: Model<UserDocument>) {
        super(userModel);
        this.userModel = userModel;
    }

    toDocument(
        request: UserRequest,
        googleId?: string,
        deviceToken?: string,
    ): Partial<UserDocument> {
        if (!request) return null;

        return {
            username: request.getUsername(),
            password: request.getPassword(),
            isActive: request.getIsActive(),
            deviceToken,
            googleId,
            email: request.getEmail(),
            authProvider: request.getAuthProvider(),
        };
    }

    toEntity(doc: UserDocument): User {
        if (!doc) return null;
        return User.builder()
            .setId(doc._id)
            .setUsername(doc.username)
            .setPassword(doc.password)
            .setIsActive(doc.isActive)
            .setDeviceToken(doc.deviceToken)
            .setGoogleId(doc.googleId)
            .setEmail(doc.email)
            .setAuthProvider(doc.authProvider)
            .setCreatedAt(doc.createdAt)
            .setUpdatedAt(doc.updatedAt)
            .build();
    }

    toResponse(user: User, token: string, name: string): UserResponse {
        if (!user) return null;

        return {
            userId: user.getId().toString(),
            token,
            username: user.getUsername(),
            name,
        };
    }

    // public async findUserById(
    //     userId: Types.ObjectId,
    //     field: string,
    // ): Promise<IUser | null> {
    //     return await this.userModel.findById(userId).select(field).exec();
    // }

    // public async fetchUserData(
    //     userId: Types.ObjectId,
    // ): Promise<(IUser & IUserProfile & IUserGroups)[] | null> {
    //     const userData = await this.userModel.aggregate([
    //         {
    //             $match: {
    //                 _id: userId,
    //             },
    //         },
    //         {
    //             $lookup: {
    //                 from: "userprofiles",
    //                 localField: "_id",
    //                 foreignField: "userId",
    //                 as: "userProfile",
    //             },
    //         },
    //         {
    //             $lookup: {
    //                 from: "usergroups",
    //                 localField: "_id",
    //                 foreignField: "userId",
    //                 as: "userGroups",
    //             },
    //         },
    //         {
    //             $project: {
    //                 username: 1,
    //                 userProfile: 1,
    //                 userGroups: 1,
    //             },
    //         },
    //     ]);

    //     return userData;
    // }

    // public async deleteUserAccount(userId: Types.ObjectId): Promise<void> {
    //     const user = await this.userModel.findByIdAndDelete(userId).exec();

    //     if (!user) {
    //         throw new ResourceNotFoundError("User not found");
    //     }
    //     this.logger.logInfo(`User "${user.username}" was deleted`, {
    //         userId,
    //         username: user.username,
    //     });

    //     await UserProfileModel.deleteOne({ userId }).exec();
    //     this.logger.logInfo(`User "${user.username}" Profile was deleted`, {
    //         userId,
    //         username: user.username,
    //     });

    //     // Get the document first
    //     const userGroupsDoc = await UserGroupsModel.findOne({ userId }).exec();

    //     // Store the groups before deletion if they exist
    //     const groups = userGroupsDoc?.groups || [];

    //     // Then delete the document
    //     await UserGroupsModel.deleteOne({ userId }).exec();

    //     this.logger.logInfo(
    //         `User Groups for User ${user.username} was deleted`,
    //     );

    //     if (groups.length > 0) {
    //         await GroupModel.deleteMany({ _id: { $in: groups } }).exec();
    //     }
    // }
}
