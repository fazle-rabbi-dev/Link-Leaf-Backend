import crypto from "crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

import envConfig from "../config/env.js";
import { TOKEN_EXPIRY } from "../constants/index.js";

// ------------------------------------------------------------------------
// 		JWT
// ------------------------------------------------------------------------

export const createJwt = (payload: object, expiry: SignOptions["expiresIn"]): string => {
	return jwt.sign(payload, envConfig.jwtSecret, { expiresIn: expiry! });
};

export const verifyJwt = <T extends JwtPayload>(
	token: string,
	secret: string = envConfig.jwtSecret,
): T | null => {
	try {
		return jwt.verify(token, secret) as T;
	} catch {
		return null;
	}
};

// ------------------------------------------------------------------------
// 		HASHING
// ------------------------------------------------------------------------

export const createHash = (token: string) => {
	return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyRawToken = (rawToken: string, hashedToken: string) => {
	if (!rawToken || !hashedToken) return false;

	// to prevent timing attack it's better to use "crypto.timingSafeEqual()" function
	const rawTokenBuffer = Buffer.from(createHash(rawToken));
	const hashedTokenBuffer = Buffer.from(hashedToken);

	if (rawTokenBuffer.length !== hashedTokenBuffer.length) return false;

	return crypto.timingSafeEqual(rawTokenBuffer, hashedTokenBuffer);
};

// ------------------------------------------------------------------------
// 		GENERATE TOKENS
// ------------------------------------------------------------------------

const createToken = (expiryTime: number) => {
	const rawToken = crypto.randomBytes(32).toString("hex");
	const hashedToken = createHash(rawToken);
	const expiry = new Date(Date.now() + expiryTime);

	return { rawToken, hashedToken, expiry };
};

export const generateEmailVerificationToken = () => createToken(TOKEN_EXPIRY.EMAIL_VERIFY);
export const generatePasswordResetToken = () => createToken(TOKEN_EXPIRY.PASSWORD_RESET);
export const generateRevertPasswordChangeToken = () =>
	createToken(TOKEN_EXPIRY.REVERT_PASSWORD_CHANGE);
export const generateEmailChangeToken = () => createToken(TOKEN_EXPIRY.EMAIL_CHANGE);
export const generateEmailChangeRevertToken = () => createToken(TOKEN_EXPIRY.EMAIL_CHANGE_REVERT);

// ------------------------------------------------------------------------
// 		BUILD LINKS
// ------------------------------------------------------------------------

export const buildEmailVerificationLink = (token: string) => {
	return `${envConfig.clientUrl}/auth/verify-email?token=${token}`;
};

export const buildPasswordResetLink = (token: string) => {
	return `${envConfig.clientUrl}/auth/reset-password?token=${token}`;
};

// 🚨
export const buildRevertPasswordChangeLink = (token: string) => {
	return `${envConfig.clientUrl}/auth/secure-account?type=revert-password-change?token=${token}`;
};

export const buildEmailChangeVerifyLink = (token: string) => {
	return `${envConfig.clientUrl}/auth/change-email/verify?token=${token}`;
};

// 🚨
export const buildRevertEmailChangeLink = (token: string) => {
	return `${envConfig.clientUrl}/auth/secure-account?type=revert-email-change&token=${token}`;
};
