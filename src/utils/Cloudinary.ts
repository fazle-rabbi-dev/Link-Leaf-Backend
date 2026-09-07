import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";

import envConfig from "../config/env.js";
import {
	CLOUDINARY_UPLOAD_USER_IMAGE_DIR,
	CLOUDINARY_UPLOAD_LINK_ICON_DIR,
} from "../constants/index.js";
import logger from "./logger.js";

cloudinary.config({
	cloud_name: envConfig.cloudinary.cloudName,
	api_key: envConfig.cloudinary.apiKey,
	api_secret: envConfig.cloudinary.apiSecret,
	secure: true,
});

class Cloudinary {
	static uploadFile = (buffer: Buffer, folder?: string): Promise<UploadApiResponse> => {
		return new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{ folder: folder || CLOUDINARY_UPLOAD_USER_IMAGE_DIR },
				(error, result) => {
					if (error) reject(error);
					else resolve(result!);
				},
			);
			streamifier.createReadStream(buffer).pipe(stream);
		});
	};

	static deleteFile = async (publicId: string) => {
		try {
			const res = await cloudinary.uploader.destroy(publicId);
			logger.info("File deleted successfully from cloudinary.");
			console.log({ res });

			return res;
		} catch (error) {
			logger.error(`\nError occured while deleting file from cloudinary.js. Cause: ${error}`);
			return null;
		}
	};
}

export default Cloudinary;
