import type { Request, Response } from "express";
import Profile from "../../../models/profile/profile.model.js";
import { apiResponse, asyncHandler, ApiError, Cloudinary } from "../../../utils/index.js";
import type { ILinkCustom } from "../../../models/profile/profile.types.js";
import { CLOUDINARY_UPLOAD_LINK_ICON_DIR } from "../../../constants/index.js";

type CustomLinkIcon = {
	kind: "emoji" | "gif" | "image";
	value: string;
	imageIconPublicId?: string;
};

/*┌──────────────────────────────────────────────────────────────────────┐
   🔗 CUSTOM LINKS 🌐
 └──────────────────────────────────────────────────────────────────────┘*/
export const addCustomLink = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { title, url, icon } = req.body;
	const iconFile = req.file;

	// Handle icon upload
	let iconField = {} as CustomLinkIcon;

	if (iconFile) {
		const result = await Cloudinary.uploadFile(iconFile.buffer, CLOUDINARY_UPLOAD_LINK_ICON_DIR);
		if (!result?.secure_url)
			throw new ApiError({
				statusCode: 500,
				message: "Failed to update icon. Try again later or ignore updating icon",
			});

		iconField.kind = "image";
		iconField.value = result.secure_url;
		iconField.imageIconPublicId = result.public_id;
	}

	// check if icon filed present in req.body: if then -> emoji | gif
	if (!iconFile && icon) {
		const { kind, value } = icon;
		iconField = { kind, value };
	}

	const profile = await Profile.findOne({ userId });
	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	const newLink = {
		title,
		url,
		icon: iconField,
		order: profile.links.custom.length + 1,
	} as ILinkCustom;

	profile.links.custom.push(newLink);
	await profile.save();

	apiResponse({
		res,
		statusCode: 201,
		message: "Custom link added successfully",
		data: { link: profile.links.custom[profile.links.custom.length - 1] },
	});
});

export const updateCustomLink = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const iconFile = req.file;

	const { linkId } = req.params;
	const { title, url, icon, shouldRemoveIcon } = req.body ?? {};

	if (!title && !url && !icon && !iconFile) {
		throw new ApiError({
			statusCode: 400,
			message: "At least one field is required (title, url, icon) in the body",
		});
	}

	const profile = await Profile.findOne({ userId });
	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	const linkIndex = profile.links.custom.findIndex((link) => link._id.toString() === linkId);
	if (linkIndex === -1) {
		throw new ApiError({
			statusCode: 404,
			message: "Link not found",
		});
	}

	// Handle icon update
	let iconField = {} as CustomLinkIcon;
	const currentLink = profile.links.custom[linkIndex] as ILinkCustom;

	if (iconFile) {
		// Delete old image icon if exists
		if (currentLink.icon?.imageIconPublicId) {
			await Cloudinary.deleteFile(currentLink.icon.imageIconPublicId);
		}

		// Upload new icon
		const result = await Cloudinary.uploadFile(iconFile.buffer, CLOUDINARY_UPLOAD_LINK_ICON_DIR);
		if (!result?.secure_url)
			throw new ApiError({
				statusCode: 500,
				message: "Failed to update icon. Try again later or ignore updating icon",
			});

		iconField.kind = "image";
		iconField.value = result.secure_url;
		iconField.imageIconPublicId = result.public_id;
	}

	// Check if icon field present in req.body; which contains: emoji | gif
	// prioritize iconFile over icon
	if (!iconFile && icon) {
		// Delete old image icon if switching to emoji/gif
		if (currentLink.icon?.imageIconPublicId) {
			await Cloudinary.deleteFile(currentLink.icon.imageIconPublicId);
		}

		const { kind, value } = icon;
		iconField = { kind, value };
	}

	if ((!iconFile && !icon) || shouldRemoveIcon) {
		// Delete old image icon if exists
		if (currentLink.icon?.imageIconPublicId) {
			await Cloudinary.deleteFile(currentLink.icon.imageIconPublicId);
		}

		// Todo (need refactor): Set empty icon field
		iconField = { kind: "emoji", value: "" };
	}

	// Update fields
	if (title) currentLink.title = title;
	if (url) currentLink.url = url;
	if (iconFile || icon || shouldRemoveIcon) currentLink.icon = iconField;

	await profile.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "Custom link updated successfully",
		data: { link: currentLink },
	});
});

export const deleteCustomLink = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { linkId } = req.params;

	const profile = await Profile.findOne({ userId });
	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	const customLinks = profile.links.custom;

	const linkIndex = customLinks.findIndex((link) => link._id?.toString() === linkId);
	if (linkIndex === -1) {
		throw new ApiError({
			statusCode: 404,
			message: "Link not found",
		});
	}

	// Delete image icon from cloudinary if exists
	const linkIcon = customLinks[linkIndex]?.icon;
	if (linkIcon?.imageIconPublicId) {
		await Cloudinary.deleteFile(linkIcon.imageIconPublicId);
	}

	customLinks.splice(linkIndex, 1);
	await profile.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "Custom link deleted successfully",
	});
});

export const reorderCustomLinks = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { links } = req.body;

	const profile = await Profile.findOne({ userId });
	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	const customLinks = profile.links.custom;
	if (customLinks.length === 0) {
		throw new ApiError({
			statusCode: 400,
			message: "No custom links found",
		});
	}

	if (links.length !== customLinks.length)
		throw new ApiError({
			statusCode: 400,
			message: "All link id's must be provided",
		});

	profile.links.custom = links.map((id: string, index: number) => {
		const existing = customLinks.find((link) => link._id?.toString() === id);
		if (!existing)
			throw new ApiError({ statusCode: 400, message: `Link with id: "${id}" not found` });
		existing.order = index + 1;
		return existing;
	});

	await profile.save();

	apiResponse({
		res,
		statusCode: 200,
		message: "Custom links reordered successfully",
		data: { links: profile.links.custom },
	});
});

export const toggleCustomLinkActive = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id;
	const { linkId } = req.params;

	const profile = await Profile.findOne({ userId });
	if (!profile) {
		throw new ApiError({
			statusCode: 404,
			message: "Profile not found",
		});
	}

	const linkIndex = profile.links.custom.findIndex((link) => link._id?.toString() === linkId);
	if (linkIndex === -1) {
		throw new ApiError({
			statusCode: 404,
			message: "Link not found",
		});
	}

	const currentLink = profile.links.custom[linkIndex] as ILinkCustom;
	currentLink.isActive = !currentLink.isActive;
	await profile.save();

	apiResponse({
		res,
		statusCode: 200,
		message: `Custom link ${currentLink.isActive ? "activated" : "deactivated"} successfully`,
		data: { link: currentLink },
	});
});
