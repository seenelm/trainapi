import App from "./app";
import { Application } from "express";
import mongoose from "mongoose";
import config from "./common/config";
import { Logger } from "./common/logger2";

let server: any = null;
const port = config.server.port || 3000;
const appInstance = App.getInstance();
const app: Application = appInstance.getApp();
const logger = Logger.getInstance();

async function startServer() {
    try {
        // Initialize the application
        await appInstance.initialize();

        // Configure mongoose
        mongoose.set("debug", process.env.NODE_ENV !== "production");

        // Start the Express server
        server = app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });

        // Handle shutdown signals
        setupGracefulShutdown();
    } catch (error) {
        logger.error("Failed to start server", error);
        process.exit(1);
    }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown() {
    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
        logger.error("Unhandled Rejection", new Error(String(reason)));
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
        logger.error("Uncaught Exception", error);
        gracefulShutdown(1);
    });

    // Handle termination signals
    const signals = ["SIGINT", "SIGTERM", "SIGQUIT"];
    signals.forEach((signal) => {
        process.on(signal, () => {
            logger.info(`Received ${signal}, shutting down gracefully`);
            gracefulShutdown(0);
        });
    });
}

/**
 * Perform graceful shutdown
 */
async function gracefulShutdown(exitCode: number) {
    try {
        if (server) {
            // Close HTTP server
            await new Promise<void>((resolve) => {
                server.close(() => {
                    logger.info("HTTP server closed");
                    resolve();
                });
            });
        }

        // Stop agenda
        await appInstance.agenda.stop();
        logger.info("Agenda stopped");

        // Close database connection
        await appInstance.db.close();
        logger.info("Database connection closed");

        // Exit process
        process.exit(exitCode);
    } catch (error) {
        logger.error("Error during graceful shutdown", error);
        process.exit(1);
    }
}

// Start the server
startServer();

export { server };

// db.connect()
//     .then(() => {
//         mongoose.set("debug", true);
//         server = app.listen(port, () => {
//             console.log(`Server is running on port ${port}`);
//         });
//     })
//     .catch((error) => {
//         console.error("Failed to connect to the database", error);
//         process.exit(1);
//     });

// process.on("unhandledRejection", (reason, promise) => {
//     console.log("Unhandled Rejection at:", promise, "reason:", reason);
// });

// process.on("SIGINT", () => {
//     db.close().then(() => {
//         console.log("Database connection closed");
//         process.exit(0);
//     });
// });

// export { server, db };
