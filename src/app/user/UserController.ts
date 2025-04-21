import { NextFunction, Request, Response } from "express";
import UserService from "./UserService";
import { Types } from "mongoose";
import {
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    GoogleAuthRequest,
} from "./dto/userDto";

export default class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public register = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const userRegisterRequest: UserRegisterRequest = req.body;

            const userRegisterResponse: UserResponse =
                await this.userService.registerUser(userRegisterRequest);

            return res.status(201).json(userRegisterResponse);
        } catch (error) {
            next(error);
        }
    };

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userLoginRequest: UserLoginRequest = req.body;

            const userLoginResponse: UserResponse =
                await this.userService.loginUser(userLoginRequest);
            return res.status(201).json(userLoginResponse);
        } catch (error) {
            next(error);
        }
    };

    googleAuth = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name } = req.body as GoogleAuthRequest;
            const decodedToken = req.firebaseUser;
            console.log("Firebase User:", decodedToken);

            const userResponse = await this.userService.authenticateWithGoogle(
                decodedToken,
                name,
            );
            console.log("User Response 2:", userResponse);
            return res.status(200).json(userResponse);
        } catch (error) {
            console.error("Error in Google Auth:", error);
            next(error);
        }
    };

    // findUserById = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const { userId } = req.params;
    //         let id = new Types.ObjectId(userId);
    //         const user = await this.userService.findUserById(id);
    //         return res.status(201).json(user);
    //     } catch (error) {
    //         next(error);
    //     }
    // };

    // deleteUserAccount = async (
    //     req: Request,
    //     res: Response,
    //     next: NextFunction,
    // ) => {
    //     const { userId } = req.params;
    //     let userID = new Types.ObjectId(userId);

    //     try {
    //         await this.userService.deleteUserAccount(userID);
    //         return res.status(201).json({ success: true });
    //     } catch (error) {
    //         next(error);
    //     }
    // };
}
