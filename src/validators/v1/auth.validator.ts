import { body, param, query, cookie } from "express-validator";
import type { ValidationChain } from "express-validator";

export const register: ValidationChain[] = [
	body("name")
		.trim()
		.notEmpty()
		.withMessage("Name is required")
		.isLength({ min: 2, max: 50 })
		.withMessage("Name must be between 2 and 50 characters")
		.matches(/^[a-zA-Z\s]+$/)
		.withMessage("Name can only contain letters and spaces"),

	body("username")
		.trim()
		.toLowerCase()
		.notEmpty()
		.withMessage("Username is required")
		.isLength({ min: 3, max: 30 })
		.withMessage("Username must be between 3 and 30 characters")
		.matches(/^[a-z0-9_]+$/)
		.withMessage("Username can only contain lowercase letters, numbers, and underscores")
		.custom((value) => {
			if (value.startsWith("_") || value.endsWith("_")) {
				throw new Error("Username cannot start or end with underscore");
			} else {
				const RESERVED = ["auth", "api", "admin", "settings", "login", "signup", "_next"];

				if (RESERVED.includes(value)) {
					throw new Error("Username cannot be a reserved word. Pick another one.");
				}
			}
			return true;
		}),

	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.normalizeEmail()
		.isEmail()
		.withMessage("Invalid email format"),

	body("password")
		.notEmpty()
		.withMessage("Password is required")
		.isLength({ min: 6, max: 30 })
		.withMessage("Password must be between 6 and 30 characters"),
];

export const login: ValidationChain[] = [
	body("email").optional().trim().normalizeEmail().isEmail().withMessage("Invalid email format"),

	body("username")
		.optional()
		.trim()
		.toLowerCase()
		.isLength({ min: 3, max: 30 })
		.withMessage("Username must be between 3 and 30 characters")
		.matches(/^[a-z0-9_]+$/)
		.withMessage("Username can only contain lowercase letters, numbers, and underscores")
		.custom((value) => {
			if (value.startsWith("_") || value.endsWith("_")) {
				throw new Error("Username cannot start or end with underscore");
			}
			return true;
		}),

	body("password")
		.notEmpty()
		.withMessage("Password is required")
		.isLength({ min: 6, max: 30 })
		.withMessage("Password must be between 6 and 30 characters"),

	body("email/username").custom((_, { req }) => {
		if (!req.body?.email && !req.body?.username) {
			throw new Error("Email or username is required");
		}
		return true;
	}),
];

export const socialLogin: ValidationChain[] = [
	body("userId")
		.trim()
		.notEmpty()
		.withMessage("Firebase User ID is required")
		.isLength({ min: 20, max: 128 })
		.withMessage("Invalid Firebase User ID length")
		.matches(/^[a-zA-Z0-9]{20,128}$/)
		.withMessage("Invalid Firebase User ID format"),
];

export const resendVerificationEmail: ValidationChain[] = [
	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.normalizeEmail()
		.isEmail()
		.withMessage("Invalid email format"),
];

export const verifyEmail: ValidationChain[] = [
	body("token").trim().notEmpty().withMessage("Verification token is required"),
];

export const forgotPassword: ValidationChain[] = [
	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.normalizeEmail()
		.isEmail()
		.withMessage("Invalid email format"),
];

export const resetPassword: ValidationChain[] = [
	body("token").trim().notEmpty().withMessage("Reset password token is required"),

	body("newPassword")
		.notEmpty()
		.withMessage("Password is required")
		.isLength({ min: 6, max: 30 })
		.withMessage("Password must be between 6 and 30 characters"),
];

export default {
	register,
	login,
	socialLogin,
	resendVerificationEmail,
	verifyEmail,
	forgotPassword,
	resetPassword,
};
