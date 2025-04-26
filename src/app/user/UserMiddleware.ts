import { Request, Response, NextFunction } from "express";
import UserRequest from "./dto/UserRequest";
import { StatusCodes as HttpStatusCode } from "http-status-codes";
import { ValidateRegisterUser } from "../../common/enums";
import { CreateValidator, RuleSet } from "../../common/utils/validation";

export default class UserMiddleware {
    constructor() {}

    public static registerRules: RuleSet<UserRequest> = {
        email: {
            hasError: (u) => !!u.getEmail(),
            message: ValidateRegisterUser.EmailRequired,
        },
        password: {
            hasError: (u) => !!u.getPassword(),
            message: ValidateRegisterUser.PasswordRequired,
        },
        name: {
            hasError: (u) => !!u.getName(),
            message: ValidateRegisterUser.NameRequired,
        },
    };

    validateRegisterUser = async (
        req: Request<{}, {}, UserRequest>,
        res: Response,
        next: NextFunction,
    ) => {
        const userRequest: UserRequest = req.body;
        const errors = CreateValidator.validate(
            userRequest,
            this.registerRules,
        );

        if (errors && errors.length > 0) {
            return res.status(HttpStatusCode.BAD_REQUEST).json(errors);
        }
        next();
    };
}
