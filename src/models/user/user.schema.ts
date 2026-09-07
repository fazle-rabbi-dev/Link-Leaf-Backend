import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongooseError, Schema } from "mongoose";

import type { IAuth, ISession, IUser, SafeUserObject } from "./user.types.js";
import envConfig from "../../config/env.js";
import logger from "../../utils/logger.js";
import { SALT_ROUNDS, TOKEN_EXPIRY } from "../../constants/index.js";

const sessionSchema = new Schema<ISession>(
	{
		refreshToken: { type: String, default: null },
		deviceInfo: String,
		ip: String,
	},
	{ _id: true, timestamps: true },
);

const authSchema = new Schema<IAuth>(
	{
		// auth type & social credentials
		authType: { type: String, enum: ["social", "raw"], default: "raw" },
		socialCredentials: {
			provider: { type: String, enum: ["google", "github"] },
			userId: { type: String },
		},

		// email verification (signup flow)
		isEmailVerified: { type: Boolean, default: false },
		emailVerificationToken: { type: String, default: null },
		emailVerificationTokenExpiry: { type: Date, default: null },

		// password reset
		passwordResetToken: { type: String, default: null, select: false },
		passwordResetTokenExpiry: { type: Date, default: null, select: false },
		passwordChangedAt: { type: Date, default: null, select: false },

		// password change
		revertPasswordChangeToken: { type: String, default: null, select: false },
		revertPasswordChangeTokenExpiry: { type: Date, default: null, select: false },

		// email change (post-signup flow)
		pendingEmail: { type: String, default: null, select: false },
		oldEmail: { type: String, default: null, select: false },
		emailChangedAt: { type: Date, default: null, select: false },
		//-----
		emailChangeRevertToken: { type: String, default: null, select: false },
		emailChangeRevertTokenExpiry: { type: Date, default: null, select: false },
		//-----
		emailChangeToken: { type: String, default: null, select: false },
		emailChangeTokenExpiry: { type: Date, default: null, select: false },

		sessions: { type: [sessionSchema], select: false, default: [] },
	},
	{ _id: false },
);

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 ROOT SCHEMA
└──────────────────────────────────────────────────────────────────────┘*/
const userSchema = new Schema<IUser>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
			minlength: [3, "Username must be at least 3 characters"],
			maxlength: 30,
			trim: true,
			lowercase: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			select: false,
			minlength: [6, "Password must be at least 6 characters long"],
		},

		avatar: {
			url: { type: String },
			publicId: { type: String, default: null },
		},

		auth: authSchema,
		profile: {
			type: Schema.Types.ObjectId,
			ref: "profile",
			unique: true,
			default: null,
		},
	},
	{ timestamps: true },
);

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 HOOKS
└──────────────────────────────────────────────────────────────────────┘*/
userSchema.pre("save", async function (this: IUser) {
	if (!this.avatar?.url) {
		this.avatar.url = `https://api.dicebear.com/7.x/initials/svg?seed=${this.name}`;
	}

	if (!this.isModified("password") || !this.password) return;
	this.password = await bcrypt.hash(this.password!, SALT_ROUNDS);
});

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 STATIC METHODS
└──────────────────────────────────────────────────────────────────────┘*/
userSchema.statics.findByEmail = async function (email) {
	try {
		// 'this' refers to the UserModel created using userSchema
		return await this.findOne({ email });
	} catch (error) {
		if (error instanceof MongooseError) {
			logger.error(`Error finding user by email: ${error.message}`);
		} else logger.error(error as any);

		throw error;
	}
};

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 INSTANCE METHODS
└──────────────────────────────────────────────────────────────────────┘*/
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.password!);
};

userSchema.methods.generateAccessAndRefreshToken = function (): {
	accessToken: string;
	refreshToken: string;
} {
	const accessToken = jwt.sign(
		{ _id: this._id, username: this.username },
		envConfig.accessTokenSecret,
		{
			expiresIn: TOKEN_EXPIRY.ACCESS,
		},
	);

	const refreshToken = jwt.sign({ _id: this._id }, envConfig.refreshTokenSecret, {
		expiresIn: TOKEN_EXPIRY.REFRESH,
	});

	return { accessToken, refreshToken };
};

userSchema.methods.generateSafeUserObject = function (options?: {
	profile?: boolean;
}): SafeUserObject {
	return {
		_id: this._id,
		name: this.name,
		username: this.username,
		email: this.email,
		avatar: this.avatar.url,
		...(options?.profile && { profile: this.profile }),
	};
};

export default userSchema;
