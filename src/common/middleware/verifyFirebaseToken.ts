import admin from "../../infrastructure/firebase";
import { NextFunction, Request, Response } from "express";

export const verifyFirebaseToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Token:", token);

    if (!token) {
        console.log("No token provided");
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log("Decoded Token:", decodedToken);
        req.firebaseUser = decodedToken;
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(403).json({ message: "Unauthorized" });
    }
};
