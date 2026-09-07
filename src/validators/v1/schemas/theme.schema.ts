import { z } from "zod";
import {
	PRESET_THEMES,
	THEME_TYPES,
	BUTTON_SHAPES,
	BUTTON_STYLES,
	BACKGROUND_TYPES,
} from "../../../constants/index.js";

const themeSchema = z
	.object({
		type: z
			.enum(THEME_TYPES, {
				message: "Theme type must be 'preset' or 'custom'",
			})
			.optional(),
		preset: z
			.enum(PRESET_THEMES, {
				message: `Preset must be one of: ${PRESET_THEMES.join(", ")}`,
			})
			.optional(),

		// -------------------------------------------------
		custom: z
			.object({
				background: z
					.object({
						type: z.enum(BACKGROUND_TYPES, {
							message: `Background type is required & must be one of: ${BACKGROUND_TYPES.join(", ")}`,
						}),
						color: z
							.string()
							.trim()
							.min(1, "Color cannot be empty")
							.max(20, "Invalid color value")
							.optional(),
						gradient: z
							.string()
							.trim()
							.min(1, "Gradient cannot be empty")
							.max(200, "Gradient value too long")
							.optional(),
					})
					.superRefine((data, ctx) => {
						if (data.type === "color" && !data.color) {
							ctx.addIssue({
								code: "custom",
								path: ["color"],
								message: "Color field is required when background type is 'color'",
							});
						}
						if (data.type === "gradient" && !data.gradient) {
							ctx.addIssue({
								code: "custom",
								path: ["gradient"],
								message: "Gradient field is required when background type is 'gradient'",
							});
						}
					})
					.optional(),

				// -------------------------------------------------
				foregroundColor: z
					.string()
					.trim()
					.min(1, "Foreground color cannot be empty")
					.max(20, "Invalid color value")
					.optional(),
				fontName: z
					.string()
					.trim()
					.min(1, "Font name cannot be empty")
					.max(50, "Font name too long")
					.optional(),

				// -------------------------------------------------
				button: z
					.object({
						bgColor: z
							.string()
							.trim()
							.min(1, "Button background color cannot be empty")
							.max(20, "Invalid color value")
							.optional(),
						fgColor: z
							.string()
							.trim()
							.min(1, "Button foreground color cannot be empty")
							.max(20, "Invalid color value")
							.optional(),
						shape: z
							.enum(BUTTON_SHAPES, {
								message: `Shape must be one of: ${BUTTON_SHAPES.join(", ")}`,
							})
							.optional(),
						style: z
							.enum(BUTTON_STYLES, {
								message: `Style must be one of: ${BUTTON_STYLES.join(", ")}`,
							})
							.optional(),
					})
					.optional(),
			})
			.optional(),
	})
	.superRefine((data, ctx) => {
		if (data.type === "preset" && !data.preset) {
			ctx.addIssue({
				code: "custom",
				path: ["preset"],
				message: "Preset field is required when type is 'preset'",
			});
		}
		if (data.type === "custom" && !data.custom) {
			ctx.addIssue({
				code: "custom",
				path: ["custom"],
				message: "Custom field is required when type is 'custom'",
			});
		}
	});

export default themeSchema;
