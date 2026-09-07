// constants/themes.ts
export const PRESET_THEMES = {
	leaf: {
		bgColor: "#f0fdf4",
		fontName: "Inter",
		socialIconPosition: "bottom",
		button: {
			bgColor: "#16a34a",
			fgColor: "#ffffff",
			textColor: "#ffffff",
			shape: "rounded",
		},
	},
	purple: {
		bgColor: "#faf5ff",
		fontName: "Poppins",
		socialIconPosition: "top",
		button: {
			bgColor: "#9333ea",
			fgColor: "#ffffff",
			textColor: "#ffffff",
			shape: "pill",
		},
	},
	blue: {
		bgColor: "#eff6ff",
		fontName: "Inter",
		socialIconPosition: "bottom",
		button: {
			bgColor: "#2563eb",
			fgColor: "#ffffff",
			textColor: "#ffffff",
			shape: "rounded",
		},
	},
} as const;

export type PresetThemeName = keyof typeof PRESET_THEMES;
