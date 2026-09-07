import Profile from "../../models/profile/profile.model.js";
import User from "../../models/user/user.model.js";
import { type IUser } from "../../models/user/user.types.js";

import {
	apiResponse,
	asyncHandler,
	ApiError,
	Cloudinary,
	generateRevertPasswordChangeToken,
	buildRevertPasswordChangeLink,
	generateEmailChangeToken,
	buildEmailChangeVerifyLink,
	verifyRawToken,
	sendEmail,
	createHash,
	generateEmailChangeRevertToken,
	emailChangeVerifyTemplate,
	emailChangedAlertTemplate,
	passwordChangedAlertTemplate,
	buildRevertEmailChangeLink,
	emailChangeRequestAlertTemplate,
} from "../../utils/index.js";

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SECTION: Get logged in user
└──────────────────────────────────────────────────────────────────────┘*/
export const getMe = asyncHandler(async (req, res) => {
	const user = await req.user!.populate("profile");
	const data = {
		user: {
			...user.generateSafeUserObject(),
			pendingEmail: user.auth.pendingEmail,
		},
		profile: user.profile,
	};

	apiResponse({
		res,
		statusCode: 200,
		message: "User fetched successfully",
		data,
	});
});

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SECTION: Update user details
└──────────────────────────────────────────────────────────────────────┘*/
export const updateUserDetails = asyncHandler(async (req, res) => {
	const { name, username, bio, avatarUrl } = req.body;
	const currentUser = req.user;
	const avatarFile = req.file;

	// check if any field is missing
	if (!name && !username && !bio && !avatarFile) {
		throw new ApiError({
			statusCode: 400,
			message:
				"At least one field must be provided to update your profile (name, username, bio, or avatar)",
		});
	}

	// check if username is taken
	if (username) {
		const taken = await User.findOne({ username, _id: { $ne: req.user._id } });
		if (taken) throw new ApiError({ statusCode: 409, message: "Username is already taken" });
	}

	// prepare update fields
	const updates = {
		...(name && { name }),
		...(username && { username }),
	};

	// handle avatar upload
	if (avatarFile) {
		// delete old avatar
		if (currentUser.avatar.publicId) {
			await Cloudinary.deleteFile(currentUser.avatar.publicId);
		}

		// upload new avatar
		const result = await Cloudinary.uploadFile(avatarFile?.buffer);
		if (!result?.secure_url)
			throw new ApiError({
				statusCode: 500,
				message: "Failed to update avatar. Try again later or ignore updating avatar",
			});

		// update url
		updates.avatar = {
			url: result.secure_url,
			publicId: result.public_id,
		};
	}

	// if avatar url is sent from client, delete old avatar and update
	if (avatarUrl) {
		if (currentUser.avatar.publicId) {
			await Cloudinary.deleteFile(currentUser.avatar.publicId);
		}

		updates.avatar = {
			url: avatarUrl,
			publicId: null,
		};
	}

	// user --> profile.bio update
	if (bio) {
		await Profile.findOneAndUpdate({ userId: req.user._id }, { bio }, { runValidators: true });
	}

	// user update (before updating user, update profile to get updated bio)
	const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
		returnDocument: "after",
		runValidators: true,
	}).populate("profile");

	apiResponse({
		res,
		statusCode: 200,
		message: "User details updated successfully",
		data: { user: updatedUser?.generateSafeUserObject({ profile: true }) },
	});
});

/* 
 ┌───────────────────────────────────────────────────────────────────────────┐
  📌 SECTION: Change password: user must be logged in + provide old password
└───────────────────────────────────────────────────────────────────────────┘*/
export const changePassword = asyncHandler(async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	const existingUser = (await User.findById(req.user?._id).select("+password")) as IUser;

	const isCurrentPasswordCorrect = await existingUser.comparePassword(currentPassword);

	if (!isCurrentPasswordCorrect) {
		throw new ApiError({
			statusCode: 401,
			message: "Current password is incorrect",
		});
	}

	existingUser.password = newPassword;
	await existingUser.save();

	const { rawToken, hashedToken, expiry } = generateRevertPasswordChangeToken();
	const revertPasswordChangeLink = buildRevertPasswordChangeLink(rawToken);
	const { subject, html } = passwordChangedAlertTemplate(revertPasswordChangeLink);

	// should be async
	sendEmail({
		to: existingUser.email,
		subject,
		html,
	});

	await User.findByIdAndUpdate(
		existingUser._id,
		{
			$set: {
				"auth.revertPasswordChangeToken": hashedToken,
				"auth.revertPasswordChangeTokenExpiry": expiry,
			},
		},
		{ returnDocument: "after" },
	);

	apiResponse({
		res,
		statusCode: 200,
		message: "Password changed successfully",
	});
});

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SECTION: Revert password change
└──────────────────────────────────────────────────────────────────────┘*/
// todo: remove email, token is enough ; since "revert" is undoing last action so there's shouldn't be newPassword in body.
// revert password change is kind of unnecessary thing because, actual "undoing" is necessary on email change and that's enough for security.
export const revertPasswordChange = asyncHandler(async (req, res) => {
	const { email, token, newPassword } = req.body;

	const existingUser = await User.findOne({
		email,
		"auth.revertPasswordChangeTokenExpiry": { $gte: new Date() },
		"auth.revertPasswordChangeToken": createHash(token),
	}).select(
		"+password +auth.revertPasswordChangeToken +auth.revertPasswordChangeTokenExpiry +auth.sessions",
	);

	if (!existingUser) {
		throw new ApiError({
			statusCode: 401,
			message: "Unauthorized access",
		});
	}

	existingUser.password = newPassword;
	existingUser.auth.revertPasswordChangeToken = null;
	existingUser.auth.revertPasswordChangeTokenExpiry = null;
	// delete all login sessions
	existingUser.auth.sessions = [];
	res.clearCookie("refreshToken");

	await existingUser.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "Password reverted successfully",
	});
});

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SECTION: Change email: REQUEST
└──────────────────────────────────────────────────────────────────────┘*/
export const changeEmailRequest = asyncHandler(async (req, res) => {
	const { currentPassword, newEmail } = req.body;

	const existingUser = await User.findById(req.user?._id).select("+password +auth.emailChangedAt");
	if (!existingUser) {
		throw new ApiError({
			statusCode: 404,
			message: "User not found",
		});
	}

	// After an email change: block email change for next 7-days
	if (existingUser.auth.emailChangedAt) {
		const diff = Date.now() - existingUser.auth.emailChangedAt.getTime();

		if (diff < 7 * 24 * 60 * 60 * 1000) {
			throw new ApiError({
				statusCode: 400,
				message: "Email can only be changed once every 7 days",
			});
		}
	}

	const isPasswordCorrect = await existingUser.comparePassword(currentPassword);
	if (!isPasswordCorrect) {
		throw new ApiError({
			statusCode: 401,
			message: "Current password is incorrect",
		});
	}

	if (existingUser.email === newEmail) {
		throw new ApiError({
			statusCode: 400,
			message: "New email must be different from current email",
		});
	}

	const emailExists = await User.findOne({ email: newEmail });
	if (emailExists) {
		throw new ApiError({
			statusCode: 409,
			message: "Email is already in use",
		});
	}

	const { rawToken, hashedToken, expiry } = generateEmailChangeToken();

	existingUser.auth.pendingEmail = newEmail;
	existingUser.auth.emailChangeToken = hashedToken;
	existingUser.auth.emailChangeTokenExpiry = expiry;
	await existingUser.save();

	const verifyLink = buildEmailChangeVerifyLink(rawToken);

	const verifyEmailTemplate = emailChangeVerifyTemplate(verifyLink);
	const alertEmailTemplate = emailChangeRequestAlertTemplate(newEmail);

	sendEmail({
		to: newEmail,
		subject: verifyEmailTemplate.subject,
		html: verifyEmailTemplate.html,
	});

	sendEmail({
		to: existingUser.email,
		subject: alertEmailTemplate.subject,
		html: alertEmailTemplate.html,
	});

	apiResponse({
		res,
		statusCode: 200,
		message: "Verification link sent to your new email address",
	});
});

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SECTION: Change email: VERIFY
└──────────────────────────────────────────────────────────────────────┘*/
export const changeEmailVerify = asyncHandler(async (req, res) => {
	const { token } = req.body;

	const existingUser = await User.findOne({
		"auth.emailChangeToken": createHash(token),
		"auth.emailChangeTokenExpiry": { $gt: new Date() },
	}).select(
		"+auth.pendingEmail +auth.oldEmail +auth.emailChangeToken +auth.emailChangeTokenExpiry +auth.emailChangedAt +auth.sessions",
	);

	if (!existingUser) {
		throw new ApiError({
			statusCode: 400,
			message: "Invalid or expired verification link",
		});
	}

	const oldEmail = existingUser.email;
	const newEmail = existingUser.auth.pendingEmail!;

	existingUser.email = newEmail;
	existingUser.auth.pendingEmail = null;
	existingUser.auth.emailChangeToken = null;
	existingUser.auth.emailChangeTokenExpiry = null;
	// Update old email field
	existingUser.auth.oldEmail = oldEmail;
	existingUser.auth.emailChangedAt = new Date();

	// Keep current session, clear others
	const currentRefreshToken = req.cookies.refreshToken;
	if (currentRefreshToken) {
		existingUser.auth.sessions = existingUser.auth.sessions.filter((session) =>
			verifyRawToken(currentRefreshToken, session.refreshToken),
		);
	} else {
		existingUser.auth.sessions = [];
	}

	await existingUser.save();

	const { rawToken, hashedToken, expiry } = generateEmailChangeRevertToken();

	existingUser.auth.emailChangeRevertToken = hashedToken;
	existingUser.auth.emailChangeRevertTokenExpiry = expiry;
	await existingUser.save();

	const recoverLink = buildRevertEmailChangeLink(rawToken);
	const alertTemplate = emailChangedAlertTemplate(oldEmail, newEmail, recoverLink);

	sendEmail({
		to: oldEmail,
		subject: alertTemplate.subject,
		html: alertTemplate.html,
	});

	apiResponse({
		res,
		statusCode: 200,
		message: "Email changed successfully",
	});
});

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SECTION: Change email: REVERT
└──────────────────────────────────────────────────────────────────────┘*/
// todo: send an alert email after recover success
export const changeEmailRevert = asyncHandler(async (req, res) => {
	const { token } = req.body;

	const existingUser = await User.findOne({
		"auth.emailChangeRevertToken": createHash(token),
		"auth.emailChangeRevertTokenExpiry": { $gt: new Date() },
	}).select(
		"+auth.emailChangeRevertToken +auth.emailChangeRevertTokenExpiry +auth.oldEmail +auth.sessions",
	);

	if (!existingUser) {
		throw new ApiError({
			statusCode: 400,
			message: "Invalid or expired recovery link",
		});
	}

	existingUser.email = existingUser.auth.oldEmail!;
	existingUser.auth.oldEmail = null;
	existingUser.auth.emailChangeRevertToken = null;
	existingUser.auth.emailChangeRevertTokenExpiry = null;
	// logout of all sessions
	existingUser.auth.sessions = [];

	await existingUser.save();

	res.clearCookie("refreshToken");

	apiResponse({
		res,
		statusCode: 200,
		message: "Account recovered. Please log in and reset your password.",
	});
});
