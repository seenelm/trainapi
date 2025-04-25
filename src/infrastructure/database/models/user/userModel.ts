import { Schema, model, Document } from "mongoose";

export interface UserDocument extends Document {
    username: string;
    password: string;
    isActive: boolean;
    deviceToken?: string;
    googleId?: string;
    email: string;
    authProvider: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema: Schema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: function (this: any) {
                return !this.googleId; // Password is required only if not using Google auth
            },
        },
        deviceToken: {
            type: String,
            required: false,
        },
        googleId: {
            type: String,
            sparse: true,
            unique: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
            required: true,
        },
        isActive: {
            type: Boolean,
            required: true,
        },
    },
    { timestamps: true },
);

export const UserModel = model<UserDocument>("User", userSchema);
