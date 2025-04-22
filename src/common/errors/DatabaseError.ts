import { ServerError } from "./ServerError";
import { StatusCodes as HttpStatusCode } from "http-status-codes";
import { Error as MongooseError } from "mongoose";
import { MongoServerError } from "mongodb";
import { MongoServerErrorType } from "../enums";

export class DatabaseError extends ServerError {
    constructor(
        message: string,
        errorCode: string = "DATABASE_ERROR",
        statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
        details?: unknown,
    ) {
        super(message, statusCode, errorCode, details);
    }

    static handleMongoDBError(error: unknown): DatabaseError {
        if (error instanceof MongooseError.ValidationError) {
            return new DatabaseError(
                "Validation failed",
                MongoServerErrorType.ValidationError,
                HttpStatusCode.BAD_REQUEST,
                Object.values(error.errors).map((err) => ({
                    field: err.path,
                    message: err.message,
                    value: err.value,
                })),
            );
        }
        if (error instanceof MongooseError.CastError) {
            return new DatabaseError(
                "Invalid data format",
                MongoServerErrorType.CastError,
                HttpStatusCode.BAD_REQUEST,
                { field: error.path, value: error.value },
            );
        }
        if (error instanceof MongooseError.DocumentNotFoundError) {
            return new DatabaseError(
                "Resource not found",
                MongoServerErrorType.DocumentNotFoundError,
                HttpStatusCode.NOT_FOUND,
            );
        }
        if (error instanceof MongoServerError) {
            if (error.code === 11000) {
                return new DatabaseError(
                    "Duplicate entry",
                    MongoServerErrorType.DuplicateKeyError,
                    HttpStatusCode.CONFLICT,
                    error.keyValue,
                );
            }
            return new DatabaseError(
                "Database operation failed",
                MongoServerErrorType.MongoServerError,
                HttpStatusCode.SERVICE_UNAVAILABLE,
            );
        }

        return new DatabaseError(
            "Unknown database error occurred",
            "UNKNOWN_DATABASE_ERROR",
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            error,
        );
    }
}
