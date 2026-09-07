import jwt from "jsonwebtoken";

import User from "../models/user/user.model.js";
import { type IUser } from "../models/user/user.types.js";
import config from "../config/env.js";
import { ApiError, asyncHandler } from "../utils/index.js";

//
// extend Request with guaranteed user for protected routes
export interface AuthRequest extends Request {
	user: IUser;
}

export const verifyAuth = asyncHandler(async (req, res, next) => {
	const authHeader = req.header("Authorization")?.trim();

	if (!authHeader?.startsWith("Bearer ") && !req.cookies.accessToken) {
		throw new ApiError({
			statusCode: 401,
			message:
				"Either authorization header is required with bearer prefix or accessToken cookie is required",
		});
	}
	const token = authHeader?.replace("Bearer ", "") || req.cookies.accessToken;

	if (!token) {
		throw new ApiError({
			statusCode: 401,
			message: "Unauthorized access",
		});
	}

	let jwtPayload;
	try {
		jwtPayload = jwt.verify(token, config.accessTokenSecret) as { _id: string };
	} catch (error) {
		throw new ApiError({
			statusCode: 401,
			message: "Unauthorized access",
		});
	}

	const user = await User.findById(jwtPayload._id).select("+auth.pendingEmail");

	if (!user) {
		throw new ApiError({
			statusCode: 401,
			message: "Unauthorized access",
		});
	}

	req.user = user;
	next();
});

export default verifyAuth;
