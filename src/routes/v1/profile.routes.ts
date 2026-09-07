import { Router } from "express";
import VALIDATOR from "../../validators/v1/profile.validator.js";
import { verifyAuth } from "../../utils/index.js";
import runValidation from "../../middlewares/runValidation.js";
import { uploadFile } from "../../middlewares/uploadFile.js";

// Import from modular controllers
import { getPublicProfile } from "../../controllers/v1/profile/profile.controller.js";
import {
	updateSocialIconPosition,
	togglePublish,
	updateTheme,
	updateSEO,
} from "../../controllers/v1/profile/settings.controller.js";
import {
	addCustomLink,
	updateCustomLink,
	deleteCustomLink,
	reorderCustomLinks,
	toggleCustomLinkActive,
} from "../../controllers/v1/profile/customLinks.controller.js";
import {
	addSocialLink,
	updateSocialLink,
	deleteSocialLink,
	reorderSocialLinks,
	toggleSocialLinkActive,
} from "../../controllers/v1/profile/socialLinks.controller.js";
import runZodValidation from "../../middlewares/runZodValidation.js";
import themeSchema from "../../validators/v1/schemas/theme.schema.js";

const router = Router();

// ─── Public Routes ───────────────────────────────────────────────────────
router.get("/:username", VALIDATOR.getPublicProfile, runValidation, getPublicProfile);

// ─── Authenticated Routes ───────────────────────────────────────────────────
// ─── Profile Settings ────────────────────────────────────────────────────────
router.patch(
	"/social-icon-position",
	verifyAuth,
	VALIDATOR.updateSocialIconPosition,
	runValidation,
	updateSocialIconPosition,
);
router.patch("/publish", verifyAuth, togglePublish);
router.patch("/theme", verifyAuth, runZodValidation(themeSchema), updateTheme);
router.patch("/seo", verifyAuth, VALIDATOR.updateSEO, runValidation, updateSEO);

// ─── Custom Links ─────────────────────────────────────────────────────────────
router.post(
	"/links/custom",
	verifyAuth,
	uploadFile("customLinkIcon").single("icon"),
	VALIDATOR.addCustomLink, // validator won't get icon in body because, req.body is the parsed object via express.
	runValidation,
	addCustomLink,
);
router.patch(
	"/links/custom/reorder",
	verifyAuth,
	VALIDATOR.reorderCustomLinks,
	runValidation,
	reorderCustomLinks,
);
router.patch(
	"/links/custom/:linkId",
	verifyAuth,
	uploadFile("customLinkIcon").single("icon"),
	VALIDATOR.updateCustomLink,
	runValidation,
	updateCustomLink,
);
router.delete(
	"/links/custom/:linkId",
	verifyAuth,
	VALIDATOR.deleteLinkWithId,
	runValidation,
	deleteCustomLink,
);
router.patch(
	"/links/custom/:linkId/toggle",
	verifyAuth,
	VALIDATOR.toggleLinkActive,
	runValidation,
	toggleCustomLinkActive,
);

// ─── Social Links ─────────────────────────────────────────────────────────────
router.post("/links/social", verifyAuth, VALIDATOR.addSocialLink, runValidation, addSocialLink);
router.patch(
	"/links/social/reorder",
	verifyAuth,
	VALIDATOR.reorderSocialLinks,
	runValidation,
	reorderSocialLinks,
);
router.patch(
	"/links/social/:linkId",
	verifyAuth,
	VALIDATOR.updateSocialLink,
	runValidation,
	updateSocialLink,
);
router.delete(
	"/links/social/:linkId",
	verifyAuth,
	VALIDATOR.deleteLinkWithId,
	runValidation,
	deleteSocialLink,
);
router.patch(
	"/links/social/:linkId/toggle",
	verifyAuth,
	VALIDATOR.toggleLinkActive,
	runValidation,
	toggleSocialLinkActive,
);

export default router;
