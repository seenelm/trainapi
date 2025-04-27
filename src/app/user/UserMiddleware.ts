import { Request, Response, NextFunction } from "express";
import UserRequest from "./dto/UserRequest";
import { StatusCodes as HttpStatusCode } from "http-status-codes";
import { ValidateRegisterUser } from "../../common/enums";
import { CreateValidator, RuleSet } from "../../common/utils/validation";

export default class UserMiddleware {
    constructor() {}

    public static registerRules: RuleSet<any> = {
        email: {
            hasError: (u) => !!u.email,
            message: "Email is required",
        },
        password: {
            hasError: (u) => !!u.password,
            message: "Password is required",
        },
        name: {
            hasError: (u) => !!u.name,
            message: "Name is required",
        },
    };

    validateRegisterUser = async (
        req: Request<{}, {}, UserRequest>,
        res: Response,
        next: NextFunction,
    ) => {
        const userRequest: UserRequest = req.body;
        console.log("User Request: ", userRequest);
        const errors = CreateValidator.validate(
            userRequest,
            UserMiddleware.registerRules,
        );

        if (errors && errors.length > 0) {
            return res.status(HttpStatusCode.BAD_REQUEST).json(errors);
        }
        next();
    };
}
