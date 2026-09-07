import { UAParser } from "ua-parser-js";
import type { Request, Response } from "express";
import { type IUser } from "../../models/user/user.types.js";
import envConfig from "../../config/env.js";

import User from "../../models/user/user.model.js";
import Profile from "../../models/profile/profile.model.js";

import {
	apiResponse,
	asyncHandler,
	buildEmailVerificationLink,
	generateEmailVerificationToken,
	vericationEmailTemplate,
	sendEmail,
	ApiError,
	verifyRawToken,
	generatePasswordResetToken,
	buildPasswordResetLink,
	passwordResetEmailTemplate,
	loginAlertEmailTemplate,
	formatTime,
	createHash,
	getFirebaseUser,
	verifyJwt,
	passwordResetAlertTemplate,
	setSessioinCookie,
	setRefreshTokenCookie,
} from "../../utils/index.js";

/**
 * Builds a URL-safe, unique username from a base string (typically the
 * part of an email before "@") and ensures it does not collide with an
 * existing user by appending an incrementing suffix when needed.
 */
const generateUniqueUsername = async (base: string): Promise<string> => {
	const sanitized = base.toLowerCase().replace(/[^a-z0-9_]/g, "");
	let candidate = sanitized.length >= 3 ? sanitized.slice(0, 30) : `user_${sanitized}`;
	if (candidate.length < 3) candidate = candidate.padEnd(3, "0");
	candidate = candidate.slice(0, 30);

	let unique = candidate;
	let suffix = 1;
	while (await User.exists({ username: unique })) {
		unique = `${candidate}${suffix}`.slice(0, 30);
		suffix++;
	}

	return unique;
};

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 REGISTER USER
 └──────────────────────────────────────────────────────────────────────┘*/
export const register = asyncHandler(async (req: Request, res: Response) => {
	const { name, username, email, password } = req.body;

	const existingUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existingUser) {
		const whichOneExists = existingUser.email === email ? "email" : "username";

		throw new ApiError({
			statusCode: 409,
			message: `An account with this ${whichOneExists} already exists`,
		});
	}

	const userData = {
		name,
		username,
		email,
		password,
		auth: {
			isEmailVerified: false,
		},
	};

	const createdUser = await User.create(userData);

	// send verification email
	const { rawToken, hashedToken, expiry } = generateEmailVerificationToken();

	const verificationLink = buildEmailVerificationLink(rawToken);
	const emailTemplate = vericationEmailTemplate(verificationLink);

	const isEmailSent = await sendEmail({
		to: email,
		subject: emailTemplate.subject,
		html: emailTemplate.html,
	});

	if (!isEmailSent) {
		return apiResponse({
			res,
			statusCode: 201,
			message:
				"Account created. Verification email could not be sent — please request a new one",
			data: { user: createdUser.generateSafeUserObject() },
		});
	}

	createdUser.auth.emailVerificationToken = hashedToken;
	createdUser.auth.emailVerificationTokenExpiry = expiry;

	// create user profile and inject profile id to user doc
	const newProfile = await Profile.create({
		userId: createdUser._id,
	});
	createdUser.profile = newProfile._id;
	await createdUser.save();

	const safeUserObject = createdUser.generateSafeUserObject();

	apiResponse({
		res,
		statusCode: 201,
		message: "User registered successfully. Please check your email to verify your email address",
		data: { user: safeUserObject },
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 LOGIN USER
 └──────────────────────────────────────────────────────────────────────┘*/
export const login = asyncHandler(async (req: Request, res: Response) => {
	const { email, username, password } = req.body;

	const existingUser = await User.findOne({
		$or: [{ username }, { email }],
	}).select("+password +auth.isEmailVerified +auth.sessions");

	if (!existingUser) {
		throw new ApiError({
			statusCode: 401,
			message: "Invalid credentials",
		});
	}

	if (existingUser.auth.authType !== "raw") {
		throw new ApiError({
			statusCode: 401,
			message: "Invalid credentials. Please set a password before login",
		});
	}

	const isPasswordCorrect = await existingUser.comparePassword(password);
	if (!isPasswordCorrect) {
		throw new ApiError({
			statusCode: 401,
			message: "Invalid credentials",
		});
	}

	if (!existingUser.auth.isEmailVerified) {
		throw new ApiError({
			statusCode: 403,
			message:
				"Your email needs to be verified. Please check your email for the verification link",
		});
	}

	const { accessToken, refreshToken } = existingUser.generateAccessAndRefreshToken();
	// =========== 🍪 SET TOKEN IN COOKIE 🍪 ============
	setSessioinCookie(res, accessToken, refreshToken);

	// extract device info from user-agent header
	const { browser, device } = UAParser(req.headers["user-agent"] || "");
	const deviceInfo = `${browser.name} / ${device.type} / ${device.vendor} / ${device.model}`;
	const ip = req.ip || "Unknown";

	// send alert email
	const emailTemplate = loginAlertEmailTemplate(deviceInfo, ip, formatTime(new Date()));
	sendEmail({
		to: existingUser.email,
		subject: emailTemplate.subject,
		html: emailTemplate.html,
	});

	// save login session
	const hashedRefreshToken = createHash(refreshToken);
	existingUser.auth.sessions.push({
		refreshToken: hashedRefreshToken,
		deviceInfo,
		ip,
	});
	await existingUser.save();
	res.cookie("sessionId", existingUser.auth.sessions[existingUser.auth.sessions.length - 1]?._id, {
		httpOnly: true,
		secure: true,
		sameSite: "strict",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	// remove password and auth from user object to send to client
	const userObject = existingUser.toObject() as Record<string, any>;
	delete userObject.password;
	delete userObject.auth;

	apiResponse({
		res,
		statusCode: 200,
		message: "Successfully logged in",
		data: {
			user: userObject,
			accessToken,
		},
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 SOCIAL LOGIN (Google / GitHub via Firebase)
 └──────────────────────────────────────────────────────────────────────┘*/
export const socialLogin = asyncHandler(async (req: Request, res: Response) => {
	const { userId } = req.body as {
		userId: string;
	};

	// 1) Verify the Firebase identity and fetch the linked account details.
	//    This validates the UID (already regex-checked by the validator) and
	//    gives us the email we need to match against local accounts.
	let firebaseUser;
	try {
		firebaseUser = await getFirebaseUser(userId);
	} catch (error) {
		console.log(error);
		throw new ApiError({
			statusCode: 401,
			message: "Invalid social credentials. Please sign in again",
		});
	}

	const email = firebaseUser.email;
	if (!email) {
		throw new ApiError({
			statusCode: 400,
			message: "This social account has no email address associated with it",
		});
	}

	// 2) Look up an existing local account by the Firebase email.
	const existingUser = await User.findOne({ email }).select(
		"+auth.sessions +auth.isEmailVerified +auth.authType +auth.socialCredentials",
	);

	let user: IUser;

	if (existingUser) {
		if (existingUser.auth.authType === "social") {
			// Social account -> direct login (no email-verification gate).
			user = existingUser;
		} else {
			// Raw account -> login based on verification status.
			if (!existingUser.auth.isEmailVerified) {
				throw new ApiError({
					statusCode: 403,
					message:
						"Your email needs to be verified. Please check your email for the verification link",
				});
			}

			user = existingUser;
		}
	} else {
		// 3) No local account yet -> create one from the Firebase profile.
		const username = await generateUniqueUsername(email.split("@")[0] ?? "user");

		const createdUser = await User.create({
			name: firebaseUser.displayName || email.split("@")[0] || "User",
			username,
			email,
			avatar: {
				url:
					firebaseUser.photoURL ||
					`https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
			},
			auth: {
				authType: "social",
				socialCredentials: {
					provider: firebaseUser.providerData[0]?.providerId?.split(".")[0] as
						| "google"
						| "github",
					userId,
				},
				isEmailVerified: true,
			},
		});

		// create user profile and inject profile id to user doc
		const newProfile = await Profile.create({
			userId: createdUser._id,
		});
		createdUser.profile = newProfile._id;
		await createdUser.save();

		user = createdUser;
	}

	// 4) Issue tokens, persist the session, and respond (mirrors `login`).
	const { accessToken, refreshToken } = user.generateAccessAndRefreshToken();
	setSessioinCookie(res, accessToken, refreshToken);

	// extract device info from user-agent header
	const { browser, device } = UAParser(req.headers["user-agent"] || "");
	const deviceInfo = `${browser.name} / ${device.type} / ${device.vendor} / ${device.model}`;
	const ip = req.ip || "Unknown";

	// send alert email
	const emailTemplate = loginAlertEmailTemplate(deviceInfo, ip, formatTime(new Date()));
	sendEmail({
		to: user.email,
		subject: emailTemplate.subject,
		html: emailTemplate.html,
	});

	// save login session
	const hashedRefreshToken = createHash(refreshToken);
	user.auth.sessions.push({
		refreshToken: hashedRefreshToken,
		deviceInfo,
		ip,
	});
	await user.save();
	res.cookie("sessionId", user.auth.sessions[user.auth.sessions.length - 1]?._id, {
		httpOnly: true,
		secure: true,
		sameSite: "strict",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});

	// remove password and auth from user object to send to client
	const userObject = user.toObject() as Record<string, any>;
	delete userObject.password;
	delete userObject.auth;

	apiResponse({
		res,
		statusCode: 200,
		message: "Successfully logged in",
		data: {
			user: userObject,
			accessToken,
		},
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 RESEND VERIFICATION EMAIL
 └──────────────────────────────────────────────────────────────────────┘*/
export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
	const { email } = req.body;

	const existingUser = await User.findOne({ email }).select("+auth.isEmailVerified");

	if (!existingUser) {
		return apiResponse({
			res,
			statusCode: 200,
			message: "If an account with that email exists, a verification email has been sent",
		});
	}

	if (existingUser.auth.isEmailVerified) {
		return apiResponse({
			res,
			statusCode: 200,
			message: "If an account with that email exists, a verification email has been sent",
		});
	}

	const { rawToken, hashedToken, expiry } = generateEmailVerificationToken();
	const verificationLink = buildEmailVerificationLink(rawToken);
	const emailTemplate = vericationEmailTemplate(verificationLink);

	const isEmailSent = await sendEmail({
		to: email,
		subject: emailTemplate.subject,
		html: emailTemplate.html,
	});

	if (!isEmailSent) {
		throw new ApiError({
			statusCode: 500,
			message: "Failed to send verification email. Please try again later",
		});
	}

	existingUser.auth.emailVerificationToken = hashedToken;
	existingUser.auth.emailVerificationTokenExpiry = expiry;
	await existingUser.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "If an account with that email exists, a verification email has been sent",
		data: {
			verificationLink,
		},
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 VERIFY EMAIL
 └──────────────────────────────────────────────────────────────────────┘*/
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
	const { token: rawToken } = req.body as {
		token: string;
	};

	const existingUser = await User.findOne({
		"auth.emailVerificationToken": createHash(rawToken),
		"auth.emailVerificationTokenExpiry": { $gt: new Date() }, // not expired
		"auth.isEmailVerified": false, // not already verified
	});

	if (!existingUser) {
		throw new ApiError({
			statusCode: 400,
			message: "Invalid or expired verification link",
		});
	}

	existingUser.auth.isEmailVerified = true;
	existingUser.auth.emailVerificationToken = null;
	existingUser.auth.emailVerificationTokenExpiry = null;
	await existingUser.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "Email verified successfully",
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 FORGOT PASSWORD
 └──────────────────────────────────────────────────────────────────────┘*/
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
	const { email } = req.body;

	const existingUser = await User.findOne({ email });

	if (!existingUser) {
		throw apiResponse({
			res,
			statusCode: 200,
			message: "If an account with that email exists, a password reset link has been sent",
		});
	}

	const { rawToken, hashedToken, expiry } = generatePasswordResetToken();
	const resetLink = buildPasswordResetLink(rawToken);
	const emailTemplate = passwordResetEmailTemplate(resetLink);

	const isEmailSent = await sendEmail({
		to: email,
		subject: emailTemplate.subject,
		html: emailTemplate.html,
	});

	if (!isEmailSent) {
		throw new ApiError({
			statusCode: 500,
			message: "Failed to send password reset email. Please try again later",
		});
	}

	existingUser.auth.passwordResetToken = hashedToken;
	existingUser.auth.passwordResetTokenExpiry = expiry;
	await existingUser.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "If an account with that email exists, a password reset link has been sent",
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 RESET PASSWORD
 └──────────────────────────────────────────────────────────────────────┘*/
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
	const { token: rawToken, newPassword } = req.body;

	const existingUser = await User.findOne({
		"auth.passwordResetToken": createHash(rawToken),
		"auth.passwordResetTokenExpiry": { $gt: new Date() },
	});

	if (!existingUser) {
		throw new ApiError({
			statusCode: 400,
			message: "Invalid or expired reset link",
		});
	}

	existingUser.password = newPassword;
	existingUser.auth.passwordResetToken = null;
	existingUser.auth.passwordResetTokenExpiry = null;
	await existingUser.save();

	// send alert email
	const { browser, device } = UAParser(req.headers["user-agent"] || "");
	const deviceInfo = `${browser.name} / ${device.type} / ${device.vendor} / ${device.model}`;
	const ip = req.ip || "Unknown";

	const { subject, html } = passwordResetAlertTemplate(deviceInfo, ip, formatTime(new Date()));
	sendEmail({
		to: existingUser.email,
		subject,
		html,
	});

	apiResponse({
		res,
		statusCode: 200,
		message: "Password reset successfully",
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 REFRESH TOKEN
 └──────────────────────────────────────────────────────────────────────┘*/
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
	const { refreshToken: token } = req.cookies;

	if (!token) {
		throw new ApiError({
			statusCode: 401,
			message: "Refresh token cookie is missing",
		});
	}

	const decodedJwt = verifyJwt<{ _id: string }>(token, envConfig.refreshTokenSecret);
	if (!decodedJwt) {
		res.clearCookie("refreshToken");
		throw new ApiError({
			statusCode: 401,
			message: "Session expired. Please log in again",
		});
	}

	const existingUser = await User.findById(decodedJwt._id).select("+auth.sessions");

	if (!existingUser) {
		res.clearCookie("refreshToken");
		throw new ApiError({
			statusCode: 401,
			message: "Session expired. Please log in again",
		});
	}

	// Find session with matching refresh token
	const sessionIndex = existingUser.auth.sessions.findIndex((session) =>
		verifyRawToken(token, session.refreshToken),
	);

	if (sessionIndex === -1) {
		res.clearCookie("refreshToken");
		throw new ApiError({
			statusCode: 401,
			message: "Session expired. Please log in again",
		});
	}

	const { accessToken, refreshToken: newRefreshToken } =
		existingUser.generateAccessAndRefreshToken();

	// Update session with new hashed refresh token
	existingUser.auth.sessions[sessionIndex]!.refreshToken = createHash(newRefreshToken);
	await existingUser.save();

	// setRefreshTokenCookie(res, newRefreshToken);
	// set both token in cookies since i switched to using cookies
	setSessioinCookie(res, accessToken, newRefreshToken);

	apiResponse({
		res,
		statusCode: 200,
		message: "Token refreshed successfully",
		data: { accessToken },
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 LOGOUT CURRENT DEVICE
 └──────────────────────────────────────────────────────────────────────┘*/
export const logout = asyncHandler(async (req: Request, res: Response) => {
	const { refreshToken: token, sessionId } = req.cookies;

	if (!token) {
		throw new ApiError({
			statusCode: 400,
			message: "Refresh token cookie is missing",
		});
	}

	const decodedJwt = verifyJwt<{ _id: string }>(token, envConfig.refreshTokenSecret);

	if (!decodedJwt) {
		if (sessionId) {
			await User.updateOne(
				{ "auth.sessions._id": sessionId },
				{ $pull: { "auth.sessions": { _id: sessionId } } },
			);
		}
		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");
		res.clearCookie("sessionId");
		return apiResponse({ res, statusCode: 200, message: "Logged out successfully" });
	}

	const existingUser = (await User.findById(decodedJwt._id).select("+auth.sessions")) as IUser;

	// ---- If client send accessToken instead refreshToken then it will be treated as invalid token since i have: separate access and refresh token secret 💪

	// Remove session with matching refresh token
	existingUser.auth.sessions = existingUser.auth.sessions.filter(
		(session) => !verifyRawToken(token, session.refreshToken),
	);
	await existingUser.save();

	res.clearCookie("accessToken");
	res.clearCookie("refreshToken");
	res.clearCookie("sessionId");

	apiResponse({
		res,
		statusCode: 200,
		message: "Logged out successfully",
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   📌 LOGOUT ALL DEVICES
 └──────────────────────────────────────────────────────────────────────┘*/
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
	const { refreshToken: token, sessionId } = req.cookies;

	if (!token) {
		throw new ApiError({
			statusCode: 400,
			message: "Refresh token cookie is missing",
		});
	}

	const decodedJwt = verifyJwt<{ _id: string }>(token, envConfig.refreshTokenSecret);

	if (!decodedJwt) {
		if (sessionId) {
			await User.updateOne(
				{ "auth.sessions._id": sessionId },
				{ $pull: { "auth.sessions": { _id: sessionId } } },
			);
		}
		res.clearCookie("refreshToken");
		res.clearCookie("sessionId");
		return apiResponse({ res, statusCode: 200, message: "Logged out successfully" });
	}

	const existingUser = (await User.findById(decodedJwt._id).select("+auth.sessions")) as IUser;

	// Clear all sessions
	res.clearCookie("refreshToken");
	existingUser.auth.sessions = [];
	await existingUser.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "Logged out from all devices successfully",
	});
});
