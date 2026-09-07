import { Router } from "express";
import VALIDATOR from "../../validators/v1/auth.validator.js";
import runValidation from "../../middlewares/runValidation.js";
import { authRateLimiter } from "../../middlewares/rateLimiter.js";
import {
	register,
	login,
	socialLogin,
	resendVerificationEmail,
	verifyEmail,
	forgotPassword,
	resetPassword,
	refreshToken,
	logout,
	logoutAll,
} from "../../controllers/v1/auth.controller.js";

const router = Router();

router.post("/register", authRateLimiter, VALIDATOR.register, runValidation, register);
router.post("/login", authRateLimiter, VALIDATOR.login, runValidation, login);
router.post(
	"/resend-verification-email",
	authRateLimiter,
	VALIDATOR.resendVerificationEmail,
	runValidation,
	resendVerificationEmail,
);
router.post("/social-login", authRateLimiter, VALIDATOR.socialLogin, runValidation, socialLogin);

router.post("/verify-email", VALIDATOR.verifyEmail, runValidation, verifyEmail);
router.post("/forgot-password", authRateLimiter, VALIDATOR.forgotPassword, runValidation, forgotPassword);
// GitHub, Firebase, Auth0 all use POST for reset-password. The reasoning — password reset is an action/flow, not a direct resource update. POST for actions is widely accepted.
router.post("/reset-password", authRateLimiter, VALIDATOR.resetPassword, runValidation, resetPassword);

// Perform action based on refresh token cookie -
// \---> token validated inside controller via req.cookies — no body to validate
router.post("/refresh-token", refreshToken);
router.delete("/logout", logout);
router.delete("/logout-all", logoutAll);

export default router;
