import { NextFunction, Request, Response } from "express";
import JWTUtil from "../common/utils/JWTUtil";
import {
    InternalServerError,
    ResourceNotFoundError,
    UnauthorizedError,
} from "../utils/errors";
import {
    UserModel,
    UserDocument,
} from "../infrastructure/database/models/user/userModel";
import { Types } from "mongoose";
import { TokenPayload } from "../app/user/UserService";

import * as jwt from "jsonwebtoken";
import CustomLogger from "../common/logger";

const logger = new CustomLogger("authenticate");

// declare global {
//     namespace Express {
//         interface Request {
//             user: any;
//         }
//     }
// }

export const getAccessToken = (authorization: string): string => {
    let token: string;

    if (!authorization || authorization.trim() === "") {
        throw new UnauthorizedError("Missing Authorization Header", {
            authorization,
        });
    }

    let size = authorization.split(" ");

    if (
        size.length > 1 &&
        authorization &&
        authorization.startsWith("Bearer")
    ) {
        token = size[1];
    } else {
        throw new UnauthorizedError("Invalid Authorization", {
            authorization,
            size,
        });
    }

    return token;
};

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const token = getAccessToken(req.headers.authorization);
    let user: UserDocument;

    try {
        const decodedToken = await JWTUtil.verify(
            token,
            process.env.SECRET_CODE,
        );
        const payload = decodedToken as TokenPayload;

        user = await UserModel.findById(payload.userId);

        if (!user) {
            throw new ResourceNotFoundError("User is not found");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError(error.message);
        } else {
            throw error;
        }
    }
};
