import type { Request, Response } from "express";
import Profile from "../../../models/profile/profile.model.js";
import { apiResponse, asyncHandler, ApiError } from "../../../utils/index.js";
import User from "../../../models/user/user.model.js";

/*┌──────────────────────────────────────────────────────────────────────┐
   👤 GET PROFILE
 └──────────────────────────────────────────────────────────────────────┘*/
export const getPublicProfile = asyncHandler(async (req, res) => {
	const { username } = req.params as { username: string };

	const existingUser = await User.findOne({ username });

	if (!existingUser) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	const profile = await Profile.findOne({ userId: existingUser._id });

	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	if (!profile.isPublished) {
		throw new ApiError({
			statusCode: 403,
			message: "Profile is not published",
		});
	}

	const publicProfile = {
		name: existingUser.name,
		username: existingUser.username,
		avatar: existingUser.avatar.url,
		bio: profile.bio,
		socialIconPosition: profile.socialIconPosition,
		theme: profile.theme,
		links: profile.links,
		seo: profile.seo,
	};

	apiResponse({
		res,
		statusCode: 200,
		message: "Profile retrieved successfully",
		data: { profile: publicProfile },
	});
});