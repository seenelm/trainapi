export enum ProfileAccess {
    Public = 1,
    Private = 2,
}

export enum EventStatus {
    Pending = 1,
    Accepted = 2,
    Rejected = 3,
}

export enum ProgramDifficulty {
    Beginner = "Beginner",
    Intermediate = "Intermediate",
    Advanced = "Advanced",
}

export enum MongoServerErrorType {
    ValidationError = "ValidationError",
    CastError = "CastError",
    DocumentNotFoundError = "DocumentNotFoundError",
    DuplicateKeyError = "DuplicateKeyError",
    MongoServerError = "MongoServerError",
}

export enum ValidateRegisterUser {
    PasswordRequired = "Password is required",
    EmailRequired = "Email is required",
    NameRequired = "Name is required",
    EmailAndPasswordRequired = "Email and password are required",
}
