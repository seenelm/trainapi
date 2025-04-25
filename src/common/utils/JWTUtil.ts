import * as jwt from "jsonwebtoken";

class JWTUtil {
    public static sign(payload: object, secret: string): Promise<string> {
        return new Promise((resolve, reject) => {
            jwt.sign(payload, secret, (error, token) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(token);
                }
            });
        });
    }

    public static verify(token: string, secret: string): Promise<object> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, secret, (error, decoded) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(decoded as object);
                }
            });
        });
    }
}

export default JWTUtil;
