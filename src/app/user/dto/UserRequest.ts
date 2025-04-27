export default class UserRequest {
    private username?: string;
    private name?: string;
    private password?: string;
    private isActive?: boolean;
    private email: string;
    private authProvider?: string;

    constructor(builder: UserRequestBuilder) {
        this.username = builder.username;
        this.name = builder.name;
        this.password = builder.password;
        this.isActive = builder.isActive;
        this.email = builder.email;
        this.authProvider = builder.authProvider;
    }

    static builder(): UserRequestBuilder {
        return new UserRequestBuilder();
    }

    public getUsername(): string | undefined {
        return this.username;
    }

    public getName(): string | undefined {
        return this.name;
    }

    public getPassword(): string | undefined {
        return this.password;
    }

    public getIsActive(): boolean | undefined {
        return this.isActive;
    }

    public getEmail(): string {
        return this.email;
    }

    public getAuthProvider(): string | undefined {
        return this.authProvider;
    }

    public setUsername(username: string): void {
        this.username = username;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public setPassword(password: string): void {
        this.password = password;
    }

    public setIsActive(isActive: boolean): void {
        this.isActive = isActive;
    }

    public setEmail(email: string): void {
        this.email = email;
    }

    public setAuthProvider(authProvider: string): void {
        this.authProvider = authProvider;
    }
}

class UserRequestBuilder {
    username?: string;
    name?: string;
    password?: string;
    isActive?: boolean;
    email: string;
    authProvider?: string;

    public setUsername(username: string): this {
        this.username = username;
        return this;
    }

    public setName(name: string): this {
        this.name = name;
        return this;
    }

    public setPassword(password: string): this {
        this.password = password;
        return this;
    }

    public setIsActive(isActive: boolean): this {
        this.isActive = isActive;
        return this;
    }

    public setEmail(email: string): this {
        this.email = email;
        return this;
    }

    public setAuthProvider(authProvider: string): this {
        this.authProvider = authProvider;
        return this;
    }

    public build(): UserRequest {
        return new UserRequest(this);
    }
}
