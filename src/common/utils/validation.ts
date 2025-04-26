import { Request, Response, NextFunction, RequestHandler } from "express";

interface Rule {
    hasError: (req: Req) => boolean;
    message: string;
}

export type RuleSet<Request> = Record<string, Rule>;

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

    public static validate<Req>(req: Req, rules: RuleSet<Req>): string[] {
        const errors = Object.values(rules)
            .filter((rule) => !rule.hasError(req))
            .map((rule) => rule.message);

        return errors;
    }
}
