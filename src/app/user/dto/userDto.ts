export interface UserRegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface UserLoginRequest {
    email: string;
    password: string;
}

export interface UserResponse {
    userId: string;
    token: string;
    username: string;
    name: string;
}

export interface GoogleAuthRequest {
    idToken: string;
    name?: string;
}
