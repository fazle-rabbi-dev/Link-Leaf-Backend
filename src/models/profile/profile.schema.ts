import { Schema } from "mongoose";
import {
	type IThemeButton,
	type IThemeCustom,
	type ITheme,
	type ISEO,
	type ILinks,
	type IProfile,
	type ILinkCustom,
	type ILinkSocial,
	SOCIAL_PLATFORMS,
} from "./profile.types.js";
import {
	BACKGROUND_TYPES,
	BUTTON_SHAPES,
	BUTTON_STYLES,
	PRESET_THEMES,
	THEME_TYPES,
} from "../../constants/index.js";

/** 
*
*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 THEME
└──────────────────────────────────────────────────────────────────────┘*/
export const themeButtonSchema = new Schema<IThemeButton>(
	{
		bgColor: { type: String },
		fgColor: { type: String },
		shape: { type: String, enum: BUTTON_SHAPES },
		style: { type: String, enum: BUTTON_STYLES },
	},
	{ _id: false },
);

export const themeCustomSchema = new Schema<IThemeCustom>(
	{
		background: {
			type: { type: String, enum: BACKGROUND_TYPES },
			color: { type: String },
			image: {
				url: { type: String },
				publicId: { type: String },
			},
			gradient: { type: String },
		},
		foregroundColor: { type: String },
		fontName: { type: String },
		button: { type: themeButtonSchema },
	},
	{ _id: false },
);

// Root Theme Schema
export const themeSchema = new Schema<ITheme>(
	{
		type: { type: String, enum: THEME_TYPES, default: "preset" },
		preset: { type: String, enum: PRESET_THEMES, default: "leaf" },
		custom: { type: themeCustomSchema },
	},
	{ _id: false },
);

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 LINKS
└──────────────────────────────────────────────────────────────────────┘*/
export const customLinkSchema = new Schema<ILinkCustom>(
	{
		title: { type: String, required: true },
		url: { type: String, required: true },
		isActive: { type: Boolean, default: true },
		order: { type: Number }, // assign on new link push from controller
		icon: {
			kind: {
				type: String,
				enum: ["emoji", "gif", "image"],
			},
			imageIconPublicId: { type: String },
			value: { type: String }, // either emoji string, gif url or uploaded image url
		},
	},
	{ _id: true },
);

export const socialLinkSchema = new Schema<ILinkSocial>(
	{
		platform: {
			type: String,
			required: true,
			enum: Object.values(SOCIAL_PLATFORMS),
		},
		url: { type: String, required: true },
		isActive: { type: Boolean, default: true },
		order: { type: Number, required: true },
	},
	{ _id: true },
);

export const linksSchema = new Schema<ILinks>(
	{
		social: { type: [socialLinkSchema], default: [] },
		custom: { type: [customLinkSchema], default: [] },
	},
	{ _id: false },
);

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SEO
└──────────────────────────────────────────────────────────────────────┘*/
export const seoSchema = new Schema<ISEO>(
	{
		title: { type: String },
		description: { type: String },
		ogImage: { type: String },
	},
	{ _id: false },
);

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 MAIN SCHEMA
└──────────────────────────────────────────────────────────────────────┘*/
export const profileSchema = new Schema<IProfile>(
	{
		userId: { type: Schema.Types.ObjectId, required: true, unique: true },
		bio: { type: String, maxlength: 200 },
		views: { type: Number, default: 0 },
		isPublished: { type: Boolean, default: false },
		socialIconPosition: { type: String, enum: ["top", "bottom"], default: "top" },

		// default: {} is required to trigger sub-schema field initialization
		// without it, Mongoose skips the field entirely and it won't exist in DB
		theme: { type: themeSchema, default: {} },
		links: { type: linksSchema, default: {} },
		seo: { type: seoSchema },
	},
	{ timestamps: true, versionKey: false },
);
