import express from "express";
const userRouter = express.Router();
import {
    validateLogin,
    validateRegistration,
} from "../../validators/userValidator";
import { authenticate } from "../../middleware/authenticate";
import UserService from "./UserService";
import UserRepository from "../../infrastructure/database/repositories/user/UserRepository";
import UserProfileDAO from "../../dao/UserProfileDAO";
import UserGroupsDAO from "../../dao/UserGroupsDAO";
import FollowDAO from "../../dao/FollowDAO";
import { UserModel } from "../../infrastructure/database/models/user/userModel";
import { UserProfileModel } from "../../model/userProfile";
import { UserGroupsModel } from "../../model/userGroups";
import { FollowModel } from "../../model/followModel";
import UserController from "./UserController";
import { verifyFirebaseToken } from "../../common/middleware/verifyFirebaseToken";

const userService = new UserService(
    new UserRepository(UserModel),
    new UserProfileDAO(UserProfileModel),
    new UserGroupsDAO(UserGroupsModel),
    new FollowDAO(FollowModel),
);

const userController = new UserController(userService);

userRouter.post("/register", validateRegistration, userController.register);

userRouter.post("/login", verifyFirebaseToken, userController.login);

userRouter.post("/google-auth", verifyFirebaseToken, userController.googleAuth);

// userRouter.get("/:userId", authenticate, userController.findUserById);

// userRouter.get("/:userId/profile-data", authenticate, userController.fetchUserData);

// userRouter.delete("/:userId", authenticate, userController.deleteUserAccount);

export default userRouter;
