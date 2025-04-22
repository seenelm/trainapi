import { ServerError } from "./ServerError";
import { StatusCodes as HttpStatusCode } from "http-status-codes";
import {
    JsonWebTokenError,
    TokenExpiredError,
    NotBeforeError,
} from "jsonwebtoken";

export class AuthError extends ServerError {
    static Unauthorized(
        message: string = "Unauthorized",
        details?: unknown,
    ): AuthError {
        return new AuthError(
            message,
            HttpStatusCode.UNAUTHORIZED,
            "UNAUTHORIZED",
            details,
        );
    }

    static Forbidden(
        message: string = "Forbidden",
        details?: unknown,
    ): AuthError {
        return new AuthError(
            message,
            HttpStatusCode.FORBIDDEN,
            "FORBIDDEN",
            details,
        );
    }

    static handleJWTError(error: unknown): AuthError {
        if (error instanceof JsonWebTokenError) {
            return new AuthError(
                "Invalid token",
                HttpStatusCode.UNAUTHORIZED,
                "INVALID_TOKEN",
                error,
            );
        }
        if (error instanceof TokenExpiredError) {
            return new AuthError(
                "Token expired",
                HttpStatusCode.UNAUTHORIZED,
                "TOKEN_EXPIRED",
                error,
            );
        }
        if (error instanceof NotBeforeError) {
            return new AuthError(
                "Token not active",
                HttpStatusCode.UNAUTHORIZED,
                "TOKEN_NOT_ACTIVE",
                error,
            );
        }

        return new AuthError(
            "Authentication failed",
            HttpStatusCode.UNAUTHORIZED,
            "AUTH_FAILED",
            error,
        );
    }

    static HashingFailed(details?: unknown) {
        return new AuthError(
            "Failed to hash password",
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            "PASSWORD_HASHING_FAILED",
            details,
        );
    }
}
