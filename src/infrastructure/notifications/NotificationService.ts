import type * as adminType from "firebase-admin";
import admin from "../firebase";

export default class NotificationService {
    private admin: adminType.app.App;

    constructor() {
        this.admin = admin;
    }

    sendNotification = async (message: adminType.messaging.Message) => {
        try {
            await this.admin.messaging().send(message);
        } catch (error) {
            throw error;
        }
    };
}