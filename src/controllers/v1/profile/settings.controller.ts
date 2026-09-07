import type { Request, Response } from "express";
import Profile from "../../../models/profile/profile.model.js";
import { apiResponse, asyncHandler, ApiError } from "../../../utils/index.js";

/*┌──────────────────────────────────────────────────────────────────────┐
   ⚙️ SOCIAL ICON POSITION
 └──────────────────────────────────────────────────────────────────────┘*/
export const updateSocialIconPosition = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { position } = req.body;

	const profile = await Profile.findOneAndUpdate(
		{ userId },
		{ socialIconPosition: position },
		{ returnDocument: "after", runValidators: true },
	);

	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	apiResponse({
		res,
		statusCode: 200,
		message: "Social icon position updated successfully",
		data: { socialIconPosition: profile.socialIconPosition },
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   ⚙️ TOGGLE PROFILE PUBLISH
 └──────────────────────────────────────────────────────────────────────┘*/
export const togglePublish = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;

	const profile = await Profile.findOneAndUpdate(
		{ userId },
		[{ $set: { isPublished: { $not: "$isPublished" } } }], // ← pipeline update
		{ returnDocument: "after", updatePipeline: true },
	);

	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	apiResponse({
		res,
		statusCode: 200,
		message: `Profile ${profile.isPublished ? "published" : "unpublished"} successfully`,
		data: { isPublished: profile.isPublished },
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   ⚙️ SEO METADATA UPDATE: (title, description, ogImage)
 └──────────────────────────────────────────────────────────────────────┘*/
//  TODO: google search console verification
export const updateSEO = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const seoData = req.body;
	const { title, description, ogImage } = seoData ?? {};

	if (!title && !description && !ogImage) {
		throw new ApiError({
			statusCode: 400,
			message: "At least one field is required (title, description or ogImage) in the body",
		});
	}

	const profile = await Profile.findOneAndUpdate(
		{ userId },
		{ seo: seoData },
		{ returnDocument: "after", runValidators: true },
	);

	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	apiResponse({
		res,
		statusCode: 200,
		message: "SEO settings updated successfully",
		data: { seo: profile.seo },
	});
});

/*┌──────────────────────────────────────────────────────────────────────┐
   ⚙️ THEME UPDATE
 └──────────────────────────────────────────────────────────────────────┘*/
/*
 * body data shape for theme update:
		{
			"type": "custom" or "preset",
			"preset": "leaf",      // if type = preset
			"custom": {
				"background": {
					"type": "color",
					"color": "#ff0000"
				},
				"foregroundColor": "#ffffff",
				"fontName": "Inter",
				"button": {
					"bgColor": "#000000",
					"fgColor": "#ffffff",
					"shape": "rounded",
					"style": "solid"
				}
			}
		}
 */
// TODO: background image implementation
export const updateTheme = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { type, preset, custom } = req.body;

	// prepare updates
	const updates: Record<string, unknown> = {};

	if (type) updates["theme.type"] = type;
	if (preset) updates["theme.preset"] = preset;

	if (custom?.background) updates["theme.custom.background"] = custom.background;
	if (custom?.foregroundColor) updates["theme.custom.foregroundColor"] = custom.foregroundColor;
	if (custom?.fontName) updates["theme.custom.fontName"] = custom.fontName;
	if (custom?.button) updates["theme.custom.button"] = custom.button;

	const profile = await Profile.findOneAndUpdate({ userId }, { $set: updates }, { new: true });

	if (!profile) {
		throw new ApiError({ statusCode: 404, message: "Profile not found" });
	}

	apiResponse({
		res,
		statusCode: 200,
		message: "Theme updated successfully",
		data: { theme: profile.theme },
	});
});
