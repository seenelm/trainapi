import express, { Application } from "express";
import "dotenv/config";
import bodyParser from "body-parser";
import cors from "cors";

import MongoDB from "./dao/MongoDB";
import { errorHandler } from "./middleware/errorHandler";

import userRouter from "./app/user/userRouter";
import groupRouter from "./route/groupRouter";
import userProfileRouter from "./route/userProfileRouter";
import searchRouter from "./route/searchRouter";
import eventRouter from "./route/eventRouter";
import fileRouter from "./route/fileRouter";
import programRouter from "./app/programs/routes/programRoutes";
import exerciseLibraryRouter from "./app/exerciseLibrary/exerciseLibraryRouter";
import mediaHubRouter from "./app/mediaHub/mediaHubRouter";

import { Event } from "./model/eventModel";
import admin from "./infrastructure/firebase";
import Agenda from "agenda";
import { EventRequest } from "./dto/EventRequest";
import { EventResponse } from "./dto/EventResponse";
import { AlertModel } from "./model/alertModel";

import config from "./common/config";
import { Logger } from "./common/logger2";

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

export default class App {
    private static instance: App;
    public app: Application;
    public db: MongoDB;
    public agenda: Agenda;
    private logger: Logger;

    private constructor() {
        this.app = express();
        this.db = new MongoDB(config.database.uri);
        this.agenda = new Agenda({
            db: {
                address: config.database.uri,
                collection: "notificationschedular",
            },
            processEvery: "30 seconds",
        });
        this.logger = Logger.getInstance();

        this.configureMiddleware();
        this.configureSwagger();
        this.configureRoutes();
        this.configureErrorHandler();
    }

    public static getInstance(): App {
        if (!App.instance) {
            App.instance = new App();
        }
        return App.instance;
    }

    public getApp(): Application {
        return this.app;
    }

    public async initialize(): Promise<void> {
        try {
            await this.db.connect();
            this.logger.info("Database connected successfully");
        } catch (error) {
            this.logger.error("Failed to connect to the database", error);
            throw error;
        }
    }

    private configureMiddleware(): void {
        this.app.use(bodyParser.json());
        this.app.use(cors());
    }

    private configureRoutes(): void {
        this.app.use("/api", userRouter);
        this.app.use("/api/users", userProfileRouter);
        this.app.use("/api/groups", groupRouter);
        this.app.use("/api/events", eventRouter);
        this.app.use("/api", searchRouter);
        this.app.use("/api/files", fileRouter);
        this.app.use("/api/programs", programRouter);
        this.app.use("/api/exercise-library", exerciseLibraryRouter);
        this.app.use("/api/media-hub", mediaHubRouter);
    }

    private configureErrorHandler(): void {
        this.app.use(errorHandler);
    }

    private configureSwagger(): void {
        const options = {
            definition: {
                openapi: "3.0.0",
                info: {
                    title: "Train API",
                    version: "1.0.0",
                    description: "Train API",
                },
                servers: [
                    {
                        url:
                            process.env.NODE_ENV === "production"
                                ? "https://train-api-staging.ue.r.appspot.com/api"
                                : "/api",
                        description:
                            process.env.NODE_ENV === "production"
                                ? "Production server"
                                : "Development server",
                    },
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: "http",
                            scheme: "bearer",
                            bearerFormat: "JWT",
                        },
                    },
                },
                security: [
                    {
                        bearerAuth: [],
                    },
                ],
            },
            apis: ["./config/*.yaml"],
        };

        const swaggerSpec = swaggerJSDoc(options);
        this.app.use(
            "/api-docs",
            swaggerUi.serve,
            swaggerUi.setup(swaggerSpec),
        );
    }
}

// const app = express();

// const dbUri: string = config.database.uri;

// const db = new MongoDB(dbUri);
// const agenda = new Agenda({
//     db: { address: dbUri, collection: "notificationschedular" },
//     processEvery: "30 seconds",
// });

// const options = {
//     definition: {
//         openapi: "3.0.0",
//         info: {
//             title: "Train API",
//             version: "1.0.0",
//             description: "Train API",
//         },
//         servers: [
//             {
//                 url:
//                     process.env.NODE_ENV === "production"
//                         ? "https://train-api-staging.ue.r.appspot.com/api"
//                         : "/api",
//                 description:
//                     process.env.NODE_ENV === "production"
//                         ? "Production server"
//                         : "Development server",
//             },
//         ],
//         components: {
//             securitySchemes: {
//                 bearerAuth: {
//                     type: "http",
//                     scheme: "bearer",
//                     bearerFormat: "JWT",
//                 },
//             },
//         },
//         security: [
//             {
//                 bearerAuth: [],
//             },
//         ],
//     },
//     apis: ["./config/*.yaml"],
// };

// const swaggerSpec = swaggerJSDoc(options);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// // Middleware
// app.use(bodyParser.json());
// app.use(cors());

// agenda.define("send push notification", async (job) => {
//     const { token, title, body, data } = job.attrs.data;
//     try {
//         const response = await admin.messaging().send({
//             token,
//             notification: {
//                 title,
//                 body,
//             },
//             data: data || {},
//         });
//         console.log("Successfully sent notification:", response);
//         return response;
//     } catch (error) {
//         console.error("Error sending notification:", error);
//         throw error;
//     }
// });

// agenda.define("send push notification", async (job) => {
//     const { eventId, scheduledTime, title } = job.attrs.data;
//     try {
//         const event = (await Event.findById(eventId)).populated("invitees");
//         if (!event) {
//             console.error("Event not found");
//             return;
//         }

//         const invitees = event.invitees;
//         const deviceTokens = invitees.map((invitee) => invitee.deviceToken);

//         if (deviceTokens.length === 0) {
//             console.error("No device tokens found");
//             return;
//         }

//         const message = {
//             notification: {
//                 title,
//                 body: `Event starts in ${scheduledTime} minutes`,
//             },
//             tokens: deviceTokens,
//         };

//         const response = await admin.messaging().sendEachForMulticast(message);
//         console.log(
//             `Sent reminders for event ${event.title}. Success: ${response.successCount}, Failure: ${response.failureCount}`,
//         );

//         if (response.failureCount > 0) {
//             response.responses.forEach((resp, idx) => {
//                 if (!resp.success) {
//                     console.error(
//                         `Failed to send notification to token: ${deviceTokens[idx]}, Error:`,
//                         resp.error,
//                     );
//                 }
//             });
//         }
//     } catch (error) {
//         console.error("Error sending notification:", error);
//         throw error;
//     }
// });

// async function scheduleNotification(event: EventResponse) {
//     const alerts = await AlertModel.findById(event.getAlerts());
//     if (!alerts) {
//         console.error("Alerts not found");
//         return;
//     }

//     for (const alert of alerts.alerts) {
//         const scheduledTime = event.getStartTime();
//         scheduledTime.setMinutes(
//             scheduledTime.getMinutes() - alert.getMinutes(),
//         );

//         if (scheduledTime > new Date()) {
//             const jobId = `alert-event-${event.getId()}-${alert.getMinutes()}`;

//             await agenda.schedule(scheduledTime, "send push notification", {
//                 eventId: event.getId(),
//                 alert,
//                 title: event.getName(),
//             });
//         }
//     }
// }

// app.use("/api", userRouter);
// app.use("/api/users", userProfileRouter);
// app.use("/api/groups", groupRouter);
// app.use("/api/events", eventRouter);
// app.use("/api", searchRouter);
// app.use("/api/files", fileRouter);
// app.use("/api/programs", programRouter);
// app.use("/api/exercise-library", exerciseLibraryRouter);
// app.use("/api/media-hub", mediaHubRouter);

// app.use(errorHandler);

// export { app, db };
