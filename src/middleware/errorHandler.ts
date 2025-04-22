import { NextFunction, Request, Response } from "express";
import { Logger } from "../common/logger2";
import { ServerError } from "../common/errors/ServerError";
import { APIError } from "../common/errors/APIError";
import { StatusCodes as HttpStatusCode } from "http-status-codes";

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const logger = Logger.getInstance();

    if (error instanceof ServerError) {
        const errorResponse = error.toErrorResponse();
        return res.status(error.statusCode).json(errorResponse);
    }

    const unknownError = APIError.InternalServerError("Unknown error occurred");
    const errorResponse = unknownError.toErrorResponse();

    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
};
