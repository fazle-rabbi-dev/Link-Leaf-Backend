import {
	PRESET_THEMES,
	THEME_TYPES,
	BUTTON_SHAPES,
	BUTTON_STYLES,
	BACKGROUND_TYPES,
} from "../constants/index.js";

/*
 * typeof THEME_TYPES[0]  // → "preset"
 * typeof THEME_TYPES[1]  // → "custom"
 * typeof THEME_TYPES[number] // → "preset" | "custom"  (all of them)
 */
export type ThemeType = (typeof THEME_TYPES)[number];
export type PresetTheme = (typeof PRESET_THEMES)[number];
export type ButtonShape = (typeof BUTTON_SHAPES)[number];
export type ButtonStyle = (typeof BUTTON_STYLES)[number];
export type BackgroundType = (typeof BACKGROUND_TYPES)[number];
