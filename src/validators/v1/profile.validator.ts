import { body, param } from "express-validator";
import type { ValidationChain } from "express-validator";
import { SOCIAL_PLATFORMS } from "../../models/profile/profile.types.js";
import mongoose from "mongoose";

// ✅
const getPublicProfile: ValidationChain[] = [
	param("username")
		.trim()
		.toLowerCase()
		.notEmpty()
		.withMessage("Username is required")
		.isLength({ min: 3, max: 30 })
		.withMessage("Username must be between 3 and 30 characters")
		.matches(/^[a-z0-9_]+$/)
		.withMessage("Username can only contain letters, numbers, and underscores")
		.custom((value) => {
			if (value.startsWith("_") || value.endsWith("_")) {
				throw new Error("Username cannot start or end with underscore");
			}
			return true;
		}),
];

// ✅
const updateSocialIconPosition: ValidationChain[] = [
	body("position")
		.notEmpty()
		.withMessage("Position is required")
		.isIn(["top", "bottom"])
		.withMessage("Position must be 'top' or 'bottom'"),
];

const updateSEO: ValidationChain[] = [
	body("title")
		.optional()
		.trim()
		.isLength({ min: 4, max: 60 })
		.withMessage("SEO title must be between 4 and 60 characters"),
	body("description")
		.optional()
		.trim()
		.isLength({ min: 10, max: 160 })
		.withMessage("SEO description must be between 10 and 160 characters"),
	body("ogImage").optional().trim().isURL().withMessage("Invalid URL format"),
];

const addCustomLink: ValidationChain[] = [
	body("title")
		.trim()
		.notEmpty()
		.withMessage("Link title is required")
		.isLength({ max: 50 })
		.withMessage("Link title must be less than 50 characters"),
	body("url")
		.trim()
		.notEmpty()
		.withMessage("URL is required")
		.isURL()
		.withMessage("Please provide a valid URL"),

	// note: "image" handled via file upload (req.file), not body
	body("icon.kind")
		.if(body("icon").exists())
		.notEmpty()
		.withMessage("Icon kind is required when icon is provided")
		.isIn(["emoji", "gif"])
		.withMessage("Icon kind must be emoji or gif"),

	body("icon.value")
		.if(body("icon").exists())
		.notEmpty()
		.withMessage("Icon value is required when icon is provided")
		.custom((value, { req }) => {
			const kind = req.body?.icon?.kind;

			// TODO: understand this piece of cake!
			if (kind === "emoji") {
				// grapheme cluster count — handles multi-byte emojis correctly
				const segments = [...new Intl.Segmenter().segment(value)];
				if (segments.length !== 1) {
					throw new Error("Emoji icon must be a single emoji character");
				}
			}

			if (kind === "gif") {
				const isUrl = /^https?:\/\/.+/.test(value);
				if (!isUrl) {
					throw new Error("GIF icon must be a valid URL");
				}
			}

			return true;
		}),
];

const updateCustomLink: ValidationChain[] = [
	param("linkId")
		.trim()
		.notEmpty()
		.withMessage("Link ID is required")
		.isMongoId()
		.withMessage("Invalid link ID"),

	body("title")
		.optional()
		.trim()
		.isLength({ max: 50 })
		.withMessage("Link title must be less than 50 characters"),

	body("url").optional().trim().isURL().withMessage("Please provide a valid URL"),

	// note: "image" handled via file upload (req.file), not body
	body("icon.kind")
		.if(body("icon").exists())
		.notEmpty()
		.withMessage("Icon kind is required when icon is provided")
		.isIn(["emoji", "gif"])
		.withMessage("Icon kind must be emoji or gif"),

	body("icon.value")
		.if(body("icon").exists())
		.notEmpty()
		.withMessage("Icon value is required when icon is provided")
		.custom((value, { req }) => {
			const kind = req.body?.icon?.kind;

			// TODO: understand this piece of cake!
			if (kind === "emoji") {
				// grapheme cluster count — handles multi-byte emojis correctly
				const segments = [...new Intl.Segmenter().segment(value)];
				if (segments.length !== 1) {
					throw new Error("Emoji icon must be a single emoji character");
				}
			}

			if (kind === "gif") {
				const isUrl = /^https?:\/\/.+/.test(value);
				if (!isUrl) {
					throw new Error("GIF icon must be a valid URL");
				}
			}

			return true;
		}),
];

const deleteLinkWithId: ValidationChain[] = [
	param("linkId")
		.trim()
		.notEmpty()
		.withMessage("Link ID is required")
		.isMongoId()
		.withMessage("Invalid link ID"),
];

const reorderCustomLinks: ValidationChain[] = [
	body("links")
		.isArray({ min: 2 })
		.withMessage("Links must be an array of at least 2 links")
		.custom((links: string[]) => {
			// If any link ID is not a valid MongoDB ObjectId, throw an error
			if (!links.every((id: string) => mongoose.isValidObjectId(id))) {
				throw new Error("Invalid link ID in array");
			}
			return true;
		}),
];

const toggleLinkActive: ValidationChain[] = [
	param("linkId")
		.trim()
		.notEmpty()
		.withMessage("Link ID is required")
		.isMongoId()
		.withMessage("Invalid link ID"),
];

const addSocialLink: ValidationChain[] = [
	body("platform")
		.notEmpty()
		.withMessage("Platform is required")
		.isIn(Object.values(SOCIAL_PLATFORMS))
		.withMessage("Invalid social platform"),
	body("url")
		.trim()
		.notEmpty()
		.withMessage("URL is required")
		.isURL()
		.withMessage("Please provide a valid URL"),
];

const updateSocialLink: ValidationChain[] = [
	param("linkId")
		.notEmpty()
		.withMessage("Link ID is required")
		.isMongoId()
		.withMessage("Invalid link ID"),
	body("url")
		.trim()
		.notEmpty()
		.withMessage("URL is required")
		.isURL()
		.withMessage("Please provide a valid URL"),
];

const reorderSocialLinks: ValidationChain[] = [
	body("links")
		.isArray({ min: 2 })
		.withMessage("Links must be an array of at least 2 links")
		.custom((links: string[]) => {
			// If any link ID is not a valid MongoDB ObjectId, throw an error
			if (!links.every((id: string) => mongoose.isValidObjectId(id))) {
				throw new Error("Invalid link ID in array");
			}
			return true;
		}),
];

export default {
	getPublicProfile,
	updateSocialIconPosition,
	updateSEO,
	addCustomLink,
	updateCustomLink,
	deleteLinkWithId,
	reorderCustomLinks,
	toggleLinkActive,
	addSocialLink,
	updateSocialLink,
	reorderSocialLinks,
};
