import type { Response } from "express";
import envConfig from "../config/env.js";

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});
};

export const setSessioinCookie = (res: Response, accessToken: string, refreshToken: string) => {
	res.cookie("accessToken", accessToken, {
		// intentinally "not httpOnly" to read from nextjs client side during crud operations
		httpOnly: false,
		secure: true,
		sameSite: "lax",
		maxAge: envConfig.isDev ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000, // if dev mode: 7d else 1 h
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});
};
// 7d * 24h * 60m * 60s * 1000ms = 7 day's ms
