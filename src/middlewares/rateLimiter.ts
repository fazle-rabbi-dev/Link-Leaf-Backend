import { rateLimit } from "express-rate-limit";

export const rateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many requests, please try again later.",
	},
});

export const authRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many authentication attempts, please try again later.",
	},
});

export default rateLimiter;
