import { Request, Response, NextFunction, RequestHandler } from "express";

interface Rule<T> {
    hasError: (req: T) => boolean;
    message: string;
}

export type RuleSet<T> = Record<string, Rule<T>>;

export class CreateValidator {
    constructor() {}

    /**
     *
     * Validate against any RuleSet
     *
     * @param req   - the object you want to validate (e.g. req.body)
     * @param rules - a RuleSet describing your checks + messages
     * @returns     - { null } or { errors: [...] }
     *
     */

    public static validate<T>(req: T, rules: RuleSet<T>): string[] {
        const errors = Object.values(rules)
            .filter((rule) => !rule.hasError(req))
            .map((rule) => rule.message);

        return errors;
    }
}
