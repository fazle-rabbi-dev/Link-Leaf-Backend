import type { Response } from "express";
import envConfig from "../config/env.js";

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});
};

export const setSessioinCookie = (res: Response, accessToken: string, refreshToken: string) => {
	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
		maxAge: envConfig.isDev ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000, // if dev mode: 7d else 1 h
	});

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});
};
// 7d * 24h * 60m * 60s * 1000ms = 7 day's ms
