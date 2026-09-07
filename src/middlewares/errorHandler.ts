import { MulterError } from "multer";
import type { Request, Response, NextFunction } from "express";

import envConfig from "../config/env.js";
import { ApiError, logger } from "../utils/index.js";

const errorHandler = (err: ApiError | Error, req: Request, res: Response, next: NextFunction) => {
	if (err instanceof SyntaxError && "body" in err) {
		return res.status(400).json({
			success: false,
			message: "Invalid JSON in request body",
		});
	}

	// Multer error
	if (err instanceof MulterError) {
		let message = "File upload failed";

		switch (err.code) {
			case "LIMIT_FILE_SIZE":
				message = "File size exceeds the limit (100KB)";
				break;
			case "LIMIT_UNEXPECTED_FILE":
				message = "Unexpected file type. Please upload a valid image.";
				break;
			case "LIMIT_FILE_COUNT":
				message = "Too many files uploaded";
				break;
			case "LIMIT_FIELD_KEY":
				message = "Field name too long";
				break;
		}

		return res.status(400).json({
			success: false,
			message,
			error: err.message,
		});
	}

	if (err instanceof ApiError) {
		logger.warn(err.message);
		console.log(envConfig.isDev && err.stack);

		return res.status(err.statusCode).json({
			success: false,
			message: `${err.message}`,
			...(err.errors && { errors: err.errors }),
		});
	}

	// when multipart body is empty (no field provided)
	if (err.message === "Unexpected end of form") {
		res.status(422).json({
			success: false,
			message: "Missing required fields in multipart body",
		});
	}

	// ☠️ Unexpected errors //

	logger.error(err.message);
	// log stack in dev only
	console.log(envConfig.isDev && err.stack);

	return res.status(500).json({
		success: false,
		message: "🚨 Oops! Something went wrong on our end. Please try again later.",
		// expose stack in dev only
		// ...(envConfig.isDev && { stack: err.stack }),
	});
};

export default errorHandler;
