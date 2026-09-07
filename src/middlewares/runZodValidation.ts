import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { ApiError } from "../utils/index.js";

const runZodValidation = (schema: ZodType) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.body) {
			throw new ApiError({
				statusCode: 400,
				message: "Request body is missing or empty",
			});
		}

		const result = schema.safeParse(req.body);
		if (!result.success) {
			throw new ApiError({
				statusCode: 400,
				message: result.error.issues[0]!.message,
				errors: result.error.issues.map((err) => ({
					field: err.path[err.path.length - 1],
					message: err.message,
				})),
			});
		}
		req.body = result.data; // replace body with parsed/typed data
		next();
	};
};

export default runZodValidation;
