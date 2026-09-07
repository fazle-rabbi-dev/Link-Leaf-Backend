import type { Request, Response } from "express";
import Profile from "../../../models/profile/profile.model.js";
import { apiResponse, asyncHandler, ApiError } from "../../../utils/index.js";
import type { ILinkSocial } from "../../../models/profile/profile.types.js";

/*┌──────────────────────────────────────────────────────────────────────┐
   🔗 SOCIAL LINKS 🌐
 └──────────────────────────────────────────────────────────────────────┘*/
export const addSocialLink = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { platform, url } = req.body;

	const profile = await Profile.findOne({ userId });
	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	// Check if platform already exists
	const existingLink = profile.links.social.find((link) => link.platform === platform);
	if (existingLink) {
		throw new ApiError({
			statusCode: 409,
			message: `Social platform: ${platform} already exists`,
		});
	}

	const newLink = {
		platform,
		url,
		order: profile.links.social.length + 1,
	} as ILinkSocial;

	profile.links.social.push(newLink);
	await profile.save();

	apiResponse({
		res,
		statusCode: 201,
		message: "Social link added successfully",
		data: { link: profile.links.social[profile.links.social.length - 1] },
	});
});

export const updateSocialLink = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { linkId } = req.params;
	const { url } = req.body;

	const profile = await Profile.findOne({ userId });
	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	const socialLinks = profile.links.social;
	const existingLink = socialLinks.find((link) => link._id?.toString() === linkId);
	if (!existingLink) {
		throw new ApiError({
			statusCode: 404,
			message: "Link not found",
		});
	}

	existingLink.url = url;
	await profile.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "Social link updated successfully",
		data: { link: existingLink },
	});
});

export const deleteSocialLink = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { linkId } = req.params;

	const profile = await Profile.findOneAndUpdate(
		{ userId, "links.social._id": linkId },
		{ $pull: { "links.social": { _id: linkId } } },
		{ new: true },
	);

	if (!profile) {
		throw new ApiError({ statusCode: 404, message: "Link not found" });
	}

	apiResponse({ res, statusCode: 200, message: "Social link deleted successfully" });
});

export const reorderSocialLinks = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { links } = req.body;

	const profile = await Profile.findOne({ userId });
	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	const socialLinks = profile.links.social;
	if (socialLinks.length === 0) {
		throw new ApiError({
			statusCode: 400,
			message: "No social links found",
		});
	}

	if (links.length !== socialLinks.length)
		throw new ApiError({
			statusCode: 400,
			message: "All link id's must be provided",
		});

	profile.links.social = links.map((id: string, index: number) => {
		const existing = socialLinks.find((link) => link._id?.toString() === id);
		if (!existing)
			throw new ApiError({ statusCode: 400, message: `Link with id: "${id}" not found` });
		existing.order = index + 1;
		return existing;
	});

	await profile.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "Social links reordered successfully",
		data: { links: profile.links.social },
	});
});

export const toggleSocialLinkActive = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { linkId } = req.params;

	const profile = await Profile.findOne({ userId, "links.social._id": linkId });
	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Link not found",
		});
	}

	const link = profile.links.social.find((link) => link._id?.toString() === linkId)!;
	link.isActive = !link.isActive;
	await profile.save();

	apiResponse({
		res,
		statusCode: 200,
		message: `Social link ${link.isActive ? "activated" : "deactivated"} successfully`,
		data: { link },
	});
});
