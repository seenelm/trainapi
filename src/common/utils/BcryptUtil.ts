import * as bcrypt from "bcrypt";
import { AuthError } from "../errors/AuthError";
import { Logger } from "../logger2";

class BcryptUtil {
    private static logger: Logger = Logger.getInstance();

    public static async hashPassword(password: string): Promise<string> {
        try {
            return await bcrypt.hash(password, 12);
        } catch (error) {
            throw AuthError.HashingFailed(error);
        }
    }

    public static async comparePassword(
        password: string,
        hashedPassword: string,
    ): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            this.logger.error("Error comparing password", error);
            return false;
        }
    }

    // public static hashPassword(password: string): Promise<string> {
    //   return new Promise<string>((resolve, reject) => {
    //     bcrypt.hash(password, 12, (error, hash) => {
    //       if (error) {
    //         reject(error);
    //       } else {
    //         resolve(hash);
    //       }
    //     });
    //   });
    // }

    // public static comparePassword(
    //     password: string,
    //     hashedPassword: string,
    // ): Promise<boolean> {
    //     return new Promise<boolean>((resolve, reject) => {
    //         bcrypt.compare(password, hashedPassword, (error, result) => {
    //             if (error) {
    //                 reject(error);
    //             } else {
    //                 resolve(result);
    //             }
    //         });
    //     });
    // }
}

export default BcryptUtil;
