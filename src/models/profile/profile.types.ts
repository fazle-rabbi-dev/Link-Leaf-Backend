import type { Document, Types } from "mongoose";
import type {
	ThemeType,
	PresetTheme,
	ButtonShape,
	ButtonStyle,
	BackgroundType,
} from "../../_types/theme.types.js";

/**
 * Literal Types
 */
type SocialIconPosition = "top" | "bottom";
type LinkType = "social" | "custom";

/** 
*
*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 THEME
└──────────────────────────────────────────────────────────────────────┘*/
export interface IThemeButton {
	bgColor?: string;
	fgColor?: string;
	shape?: ButtonShape;
	style?: ButtonStyle;
}

export interface IThemeCustom {
	background?: {
		type?: BackgroundType;
		color?: string;
		image?: {
			url?: string;
			publicId?: string;
		};
		gradient?: string;
	};
	foregroundColor?: string;
	fontName?: string;
	button?: IThemeButton;
}

export interface ITheme {
	type: ThemeType;
	preset: PresetTheme;
	custom?: IThemeCustom;
}

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 LINKS
└──────────────────────────────────────────────────────────────────────┘*/
export const SOCIAL_PLATFORMS = {
	Email: "email",
	Facebook: "facebook",
	Twitter: "twitter",
	Instagram: "instagram",
	Youtube: "youtube",
	BuyMeACoffee: "buy_me_a_coffee",
	OneOnOne: "1_on_1",
	Spotify: "spotify",
	Github: "github",
	Behance: "behance",
	Dribbble: "dribbble",
	Discord: "discord",
	Medium: "medium",
	Reddit: "reddit",
	GiftApp: "gift_app",
	Tiktok: "tiktok",
	SoundCloud: "sound_cloud",
	Bandcamp: "bandcamp",
	Linkedin: "linkedin",
	Clubhouse: "clubhouse",
	Telegram: "telegram",
	Signal: "signal",
	Twitch: "twitch",
	Patreon: "patreon",
	Substack: "substack",
	Pinterest: "pinterest",
	ProductHunt: "product_hunt",
	Amazon: "amazon",
	Cameo: "cameo",
	Whatsapp: "whatsapp",
	Goodreads: "goodreads",
	Figma: "figma",
	Strava: "strava",
	Tumblr: "tumblr",
	Mastodon: "mastodon",
	Phone: "phone",
	Music: "music",
	Apple: "apple",
	GooglePlay: "google_play",
	Etsy: "etsy",
	Poshmark: "poshmark",
	Snapchat: "snapchat",
	Website: "website",
	Bluesky: "bluesky",
} as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[keyof typeof SOCIAL_PLATFORMS];

/* 
typeof SOCIAL_PLATFORM
// → { Facebook: "facebook", Instagram: "instagram", Github: "github" }

keyof typeof SOCIAL_PLATFORM
// → "Facebook" | "Instagram" | "Github"   (the keys)

typeof SOCIAL_PLATFORM[keyof typeof SOCIAL_PLATFORM]
// → "facebook" | "instagram" | "github"   (the values)
*/

export interface ILinkCustom {
	_id: string;
	title: string;
	url: string;
	isActive: boolean;
	order: number;
	icon?: {
		kind: "emoji" | "gif" | "image";
		value: string;
		imageIconPublicId?: string;
	};
}

export interface ILinkSocial {
	_id: string;
	platform: SocialPlatform;
	url: string;
	isActive: boolean;
	order: number;
}

export interface ILinks {
	social: ILinkSocial[];
	custom: ILinkCustom[];
}

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 SEO
└──────────────────────────────────────────────────────────────────────┘*/
export interface ISEO {
	title?: string;
	description?: string;
	ogImage?: string;
}

/* 
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 ROOT INTERFACE
└──────────────────────────────────────────────────────────────────────┘*/
export interface IProfile extends Document {
	userId: Types.ObjectId;
	bio?: string;
	views: number;
	isPublished: boolean;
	socialIconPosition: SocialIconPosition;

	theme: ITheme;
	links: ILinks;
	seo?: ISEO;

	createdAt: Date;
	updatedAt: Date;
}
