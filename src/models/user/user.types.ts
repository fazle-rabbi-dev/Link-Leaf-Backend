import type { Types, Document } from "mongoose";

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SESSION
└──────────────────────────────────────────────────────────────────────┘*/
export interface ISession {
	_id?: Types.ObjectId;
	refreshToken: string; // hashed jwt in db
	deviceInfo: string;
	ip: string;
	createdAt?: Date;
}

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 AUTH
└──────────────────────────────────────────────────────────────────────┘*/
export interface IAuth {
	// auth type & social credentials
	authType: "social" | "raw";
	socialCredentials: {
		provider: "google" | "github";
		userId: string;
	} | null;

	// email verification (signup flow)
	isEmailVerified: boolean;
	emailVerificationToken: string | null;
	emailVerificationTokenExpiry: Date | null;

	// password reset
	passwordResetToken: string | null;
	passwordResetTokenExpiry: Date | null;
	passwordChangedAt: Date | null;

	// password change
	revertPasswordChangeToken: string | null;
	revertPasswordChangeTokenExpiry: Date | null;

	// email change (post-signup flow)
	pendingEmail: string | null;
	oldEmail: string | null;
	emailChangedAt: Date | null;
	emailChangeToken: string | null;
	emailChangeTokenExpiry: Date | null;
	emailChangeRevertToken: string | null;
	emailChangeRevertTokenExpiry: Date | null;

	sessions: ISession[];
}

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SAFE USER OBJECT
└──────────────────────────────────────────────────────────────────────┘*/
export type SafeUserObject = {
	_id: string;
	name: string;
	username: string;
	email: string;
	avatar: string;
};

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 ROOT INTERFACE
└──────────────────────────────────────────────────────────────────────┘*/
export interface IUser extends Document {
	name: string;
	username: string;
	email: string;
	password?: string;
	avatar: {
		url: string;
		publicId?: string;
	};
	auth: IAuth;
	profile: Types.ObjectId;

	generateAccessAndRefreshToken(): {
		accessToken: string;
		refreshToken: string;
	};
	comparePassword(candidatePassword: string): Promise<boolean>;
	generateSafeUserObject(options?: { profile?: boolean }): SafeUserObject;
}
