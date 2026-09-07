import multer from "multer";
import type { Request } from "express";

import { MAX_ICON_SIZE, ALLOWED_ICON_TYPE } from "../constants/index.js";
import ApiError from "../utils/ApiError.js";

const limits = {
	fileSize: MAX_ICON_SIZE,
};

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	const allowedTypes = ALLOWED_ICON_TYPE;
	const fileType = file.mimetype.split("/")[1] as string;

	if (allowedTypes.test(fileType)) {
		cb(null, true);
	} else {
		const error = new ApiError({
			statusCode: 400,
			message: "Only jpg, jpeg, png, webp, avif and svg icon files are allowed!",
		});

		cb(error);
	}
};

export const uploadIcon = multer({
	storage: multer.memoryStorage(),
	limits,
	fileFilter,
});
