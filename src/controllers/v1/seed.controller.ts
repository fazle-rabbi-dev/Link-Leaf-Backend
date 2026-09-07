import User from "../../models/user/user.model.js";
import envConfig from "../../config/env.js";
import { ApiError, apiResponse, asyncHandler } from "../../utils/index.js";
import { mockUsers } from "../../constants/seedData.js";
import Profile from "../../models/profile/profile.model.js";

export const getUsers = asyncHandler(async (req, res) => {
	if (!envConfig.isDev) {
		throw new ApiError({
			statusCode: 403,
			message: "Seed functionality is only available in development mode",
		});
	}

	// select all users
	const users = await User.find().select("+auth.sessions");

	apiResponse({
		res,
		statusCode: 200,
		message: "Users fetched successfully",
		data: { users },
	});
});

export const seedUsers = asyncHandler(async (req, res) => {
	if (!envConfig.isDev) {
		throw new ApiError({
			statusCode: 403,
			message: "Seed functionality is only available in development mode",
		});
	}

	await User.deleteMany({});

	// Create users one by one to trigger password hashing middleware
	const createdUsers = [];
	for (const userData of mockUsers) {
		const user = await User.create(userData);
		// CREATE PROFILE
		const createdProfile = await Profile.create({ userId: user._id });
		user.profile = createdProfile._id;
		await user.save();
		createdUsers.push(user);
	}

	apiResponse({
		res,
		statusCode: 201,
		message: "Users seeded successfully",
		data: { count: createdUsers.length },
	});
});
