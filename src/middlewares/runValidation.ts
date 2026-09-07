import type { Request, Response, NextFunction } from "express";
import { validationResult, type ValidationError } from "express-validator";
import ApiError from "../utils/ApiError.js";

const runValidation = (req: Request, res: Response, next: NextFunction) => {
	// 🧺 errors is a basket that contains errors.
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		// Take first error per field and format with only field + message
		const existingErrors = errors.array();
		let path = null;
		const newErrors = [];

		for (let i = 0; i < existingErrors.length; i++) {
			const currentItem = existingErrors[i];

			// skip non-field errors:
			if (currentItem?.type !== "field") continue;
			/*
			 * 💡 express-validator returns ALL validation failures per field
			 *  e.g. "email" fails both isEmail() and notEmpty() → 2 errors for same field
			 *  i want only first error per field → skip if same path as previous
			 */
			if (currentItem.path === path) continue;

			path = currentItem.path;
			newErrors.push({
				field: currentItem.type === "field" ? currentItem.path : "unknown",
				message: currentItem.msg,
				location: currentItem.location,
			});
		}

		const error = new ApiError({
			statusCode: 422,
			message: "Invalid Inputs",
			errors: newErrors,
		});
		return next(error);
	}

	next();
};

export default runValidation;
