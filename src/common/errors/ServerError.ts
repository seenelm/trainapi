import { ErrorResponse, ServerResponse } from "./types";
import { Request } from "express";

export abstract class ServerError extends Error {
    constructor(
        public readonly message: string,
        public readonly statusCode: number,
        public readonly errorCode: string,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    public toErrorResponse(): ErrorResponse {
        return {
            message: this.message,
            errorCode: this.errorCode,
            details: this.details,
        };
    }

    public toServerResponse(req: Request): ServerResponse {
        return {
            statusCode: this.statusCode,
            error: {
                message: this.message,
                errorCode: this.errorCode,
                details: this.details,
                path: req.path,
            },
            requestId: req.headers["x-request-id"] as string,
            userId: req.user,
        };
    }
}
