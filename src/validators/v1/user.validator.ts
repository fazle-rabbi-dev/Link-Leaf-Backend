import { body, query } from "express-validator";
import type { ValidationChain } from "express-validator";

export const changePassword: ValidationChain[] = [
	body("currentPassword")
		.notEmpty()
		.withMessage("Current password is required")
		.isLength({ min: 6 })
		.withMessage("Current password must be at least 6 characters long"),

	body("newPassword")
		.notEmpty()
		.withMessage("New password is required")
		.isLength({ min: 6 })
		.withMessage("New password must be at least 6 characters long")

		.custom((value, { req }) => {
			if (value === req.body.currentPassword) {
				throw new Error("New password must be different from current password");
			}
			return true;
		}),
];

export const updateUserDetails: ValidationChain[] = [
	body("name")
		.optional()
		.trim()
		.isLength({ min: 2, max: 50 })
		.withMessage("Name must be between 2 and 50 characters")
		.matches(/^[a-zA-Z\s]+$/)
		.withMessage("Name can only contain letters and spaces"),

	body("username")
		.optional()
		.trim()
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

	body("bio")
		.optional()
		.trim()
		.isLength({ min: 1, max: 200 })
		.withMessage("Bio must be between 1 and 200 characters"),

	body("avatarUrl")
		.optional()
		.trim()
		.isURL()
		.withMessage("Avatar url must be a valid URL")
		.isLength({ min: 14, max: 500 })
		.withMessage("Avatar url must be between 14 and 500 characters"),
];

// 🛑 Currently revert password feature: turned off
export const revertPasswordChange: ValidationChain[] = [
	body("newPassword")
		.notEmpty()
		.withMessage("Password is required")
		.isLength({ min: 6, max: 30 })
		.withMessage("Password must be between 6 and 30 characters"),

	body("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.isEmail()
		.withMessage("Invalid email address"),

	body("token")
		.trim()
		.notEmpty()
		.withMessage("Token is required")
		.isLength({ min: 64, max: 64 })
		.withMessage("Invalid token"),
];

export const changeEmailRequest: ValidationChain[] = [
	// don't trim password because it may contain leading/trailing spaces which are part of the password
	body("currentPassword")
		.notEmpty()
		.withMessage("Current password is required")
		.isLength({ min: 6, max: 30 })
		.withMessage("Password must be between 6 and 30 characters"),

	body("newEmail")
		.trim()
		.notEmpty()
		.withMessage("New email is required")
		.normalizeEmail()
		.isEmail()
		.withMessage("Invalid email format"),
];

export const changeEmailVerify: ValidationChain[] = [
	body("token")
		.trim()
		.notEmpty()
		.withMessage("Token is required")
		.isLength({ min: 64, max: 64 })
		.withMessage("Invalid token"),
];

export const changeEmailRevert: ValidationChain[] = [
	body("token")
		.trim()
		.notEmpty()
		.withMessage("Token is required")
		.isLength({ min: 64, max: 64 })
		.withMessage("Invalid token"),
];

export default {
	changePassword,
	updateUserDetails,
	revertPasswordChange,

	changeEmailRequest,
	changeEmailVerify,
	changeEmailRevert,
};
