import winston, { format } from "winston";
import { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import { LoggingWinston } from "@google-cloud/logging-winston";
import { v4 as uuidv4 } from "uuid";

const { combine, timestamp, json, prettyPrint, errors } = winston.format;
const loggingWinston = new LoggingWinston();

interface LogContext {
    userId?: string;
    requestId?: string;
    correlationId?: string;
    sessionId?: string;
    sourceIP?: string;
    deviceInfo?: string;
    location?: string;
    status?: number | string;
    path?: string;
    method?: string;
}

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
};
winston.addColors(colors);

const consoleFormat = format.combine(
    format.colorize({ all: true }),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ level, message, timestamp, ...meta }) => {
        let metaString = "";
        if (Object.keys(meta).length > 0) {
            metaString = ` ${JSON.stringify(meta)}`;
        }
        return `${timestamp} ${level}: ${message}${metaString}`;
    }),
);

const fileFormat = format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json(),
);

const googleCloudLoggingFormat = format.combine(
    format.timestamp(),
    format.json(),
);

export class Logger {
    private static instance: Logger;
    private logger: winston.Logger;
    private loggingWinston: LoggingWinston;

    private constructor() {
        this.loggingWinston = new LoggingWinston();

        this.logger = winston.createLogger({
            levels: logLevels,
            defaultMeta: { service: "train-api" },
            transports: [
                new winston.transports.Console({
                    format: consoleFormat,
                    level: "debug",
                }),
                new winston.transports.File({
                    filename: "logs/error.log",
                    level: "error",
                    format: fileFormat,
                }),
                new winston.transports.File({
                    filename: "logs/combined.log",
                    format: fileFormat,
                }),
                this.loggingWinston,
            ],
        });
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public error(message: string, meta?: any): void {
        this.logger.error(message, meta);
    }

    public warn(message: string, meta?: any): void {
        this.logger.warn(message, meta);
    }

    public info(message: string, meta?: any): void {
        this.logger.info(message, meta);
    }

    public http(message: string, meta?: any): void {
        this.logger.http(message, meta);
    }

    public debug(message: string, meta?: any): void {
        this.logger.debug(message, meta);
    }

    public assignRequestId(req: Request, res: Response, next: NextFunction) {
        req["requestId"] = req.headers["x-request-id"] || uuidv4();
        next();
    }

    public logRequest = (req: Request, res: Response, next: NextFunction) => {
        // TODO: Remove this method only use morgan
        // In production, filter or mask sensitive data
        this.http(`Incoming request: ${req.method} ${req.url}`, {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            body: req.body,
            query: req.query,
        });
        next();
    };

    public logResponse = (req: Request, res: Response, next: NextFunction) => {
        res.on("finish", () => {
            this.http(
                `Outgoing response: ${req.method} ${req.url} - ${res.statusCode}`,
                {
                    statusCode: res.statusCode,
                    contentLength: res.get("Content-Length"),
                    requestId: req["requestId"],
                },
            );
        });
        next();
    };

    // TODO: only log errors in production
    public morgnaMiddleware = morgan(
        ":method :url :status :res[content-length] - :response-time ms",
        {
            stream: {
                write: (message: string) => {
                    this.http(message.trim());
                },
            },
            skip: (req: Request, res: Response) => res.statusCode < 400,
        },
    );

    public logError = (
        error: Error,
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        this.error("Unhandled error", {
            message: error.message,
            stack: error.stack,
            method: req.method,
            url: req.url,
            body: req.body,
            query: req.query,
            statusCode: res.statusCode,
        });
        next(error); // Pass the error to the next error handling middleware
    };
}
