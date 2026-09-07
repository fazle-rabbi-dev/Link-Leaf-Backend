import multer from "multer";
import type { Request } from "express";
import { ApiError, logger } from "../utils/index.js";
import {
	MAX_AVATAR_SIZE,
	ALLOWED_AVATAR_TYPE,
	MAX_ICON_SIZE,
	ALLOWED_ICON_TYPE,
} from "../constants/index.js";

export const uploadFile = (purpose: "avatar" | "customLinkIcon") => {
	if (!purpose) {
		throw new Error("Missing purpose argument on uploadFile middleware");
	}

	const limits = {
		fileSize: purpose == "avatar" ? MAX_AVATAR_SIZE : MAX_ICON_SIZE,
	};

	const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
		const allowedFileTypes = purpose == "avatar" ? ALLOWED_AVATAR_TYPE : ALLOWED_ICON_TYPE;
		const fileType = file.mimetype.split("/")[1] as string;

		if (allowedFileTypes.test(fileType)) {
			cb(null, true);
		} else {
			const error = new ApiError({
				statusCode: 400,
				message: "Only jpg, jpeg, png, svg and webp image files are allowed!",
			});

			cb(error);
		}
	};

	return multer({
		storage: multer.memoryStorage(),
		limits,
		fileFilter,
	});
};
