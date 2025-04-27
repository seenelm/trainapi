import { NextFunction, Request, Response } from "express";
import UserService from "./UserService";
import {
    UserLoginRequest,
    UserResponse,
    GoogleAuthRequest,
} from "./dto/userDto";
import UserRequest from "./dto/UserRequest";
import { Logger } from "../../common/logger2";

export default class UserController {
    private userService: UserService;
    private logger: Logger = Logger.getInstance();

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public register = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const {email, password, name} = req.body;
            
            const userRequest = UserRequest.builder()
            .setEmail(email)
            .setPassword(password)
            .setName(name)
            .build();

            const userResponse: UserResponse =
                await this.userService.registerUser(userRequest);

            this.logger.info("Register User", userResponse);

            return res.status(201).json(userResponse);
        } catch (error) {
            next(error);
        }
    };

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userLoginRequest: UserLoginRequest = req.body;

            const userResponse: UserResponse =
                await this.userService.loginUser(userLoginRequest);
            return res.status(201).json(userResponse);
        } catch (error) {
            next(error);
        }
    };

    googleAuth = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name } = req.body as GoogleAuthRequest;
            const decodedToken = req.firebaseUser;

            const userResponse = await this.userService.authenticateWithGoogle(
                decodedToken,
                name,
            );
            return res.status(200).json(userResponse);
        } catch (error) {
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
