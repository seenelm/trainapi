export interface ErrorDetail {
    [key: string]: any;
}

export interface ErrorResponse {
    message: string;
    errorCode: string;
    details?: unknown;
    path?: string;
}

export interface ServerResponse {
    statusCode: number;
    error: ErrorResponse;
    requestId: string;
    userId?: string;
    message?: string;
}
