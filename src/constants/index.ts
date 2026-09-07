import type { SignOptions } from "jsonwebtoken";
import envConfig from "../config/env.js";

export const APP_NAME = "Link-Leaf";

type Expiry = SignOptions["expiresIn"];
export const TOKEN_EXPIRY = {
	ACCESS: envConfig.isDev ? "7d" : "1h",
	REFRESH: "7d",

	EMAIL_VERIFY: 24 * 60 * 60 * 1000,
	PASSWORD_RESET: 1 * 60 * 60 * 1000,
	REVERT_PASSWORD_CHANGE: 24 * 60 * 60 * 1000,
	EMAIL_CHANGE: 24 * 60 * 60 * 1000,
	EMAIL_CHANGE_REVERT: 7 * 24 * 60 * 60 * 1000,
} as const satisfies Record<string, Expiry>;

export const SALT_ROUNDS = 10;

// Avatar
export const MAX_AVATAR_SIZE = 100 * 1024; // 100 KB
export const ALLOWED_AVATAR_TYPE = /jpg|jpeg|png|webp|svg/;

// Custom Link Icons
export const MAX_ICON_SIZE = 50 * 1024; // 50 KB
export const ALLOWED_ICON_TYPE = /jpg|jpeg|png|webp|avif|svg/;

export const CLOUDINARY_UPLOAD_USER_IMAGE_DIR = "foliyo/users/avatars";
export const CLOUDINARY_UPLOAD_LINK_ICON_DIR = "foliyo/links/icons";

// THEMES
export const THEME_TYPES = ["preset", "custom"] as const;
export const PRESET_THEMES = ["leaf", "island", "ocean", "sunset"] as const;
export const BUTTON_SHAPES = ["rounded", "pill", "square"] as const;
export const BUTTON_STYLES = ["solid", "outline"] as const;
export const BACKGROUND_TYPES = ["color", "image", "gradient"] as const;

export { mockUsers } from "./seedData.js";
