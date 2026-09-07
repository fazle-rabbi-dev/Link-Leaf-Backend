import { Router } from "express";
import VALIDATOR from "../../validators/v1/user.validator.js";
import runValidation from "../../middlewares/runValidation.js";
import verifyAuth from "../../middlewares/verifyAuth.js";

import {
	changePassword,
	getMe,
	updateUserDetails,
	revertPasswordChange,
	changeEmailRequest,
	changeEmailVerify,
	changeEmailRevert,
} from "../../controllers/v1/user.controller.js";
import { uploadFile } from "../../middlewares/uploadFile.js";

const router = Router();

// url --> /api/v1/users

router.get("/me", verifyAuth, getMe);
router.patch(
	"/me",
	verifyAuth,
	uploadFile("avatar").single("avatar"),
	VALIDATOR.updateUserDetails,
	runValidation,
	updateUserDetails,
);
router.post(
	"/change-password",
	VALIDATOR.changePassword,
	runValidation,
	verifyAuth,
	changePassword,
);

// router.post(
// 	"/revert-password-change",
// 	VALIDATOR.revertPasswordChange,
// 	runValidation,
// 	revertPasswordChange,
// );

// email
router.post(
	"/change-email/request",
	verifyAuth,
	VALIDATOR.changeEmailRequest,
	runValidation,
	changeEmailRequest,
);
router.post("/change-email/verify", VALIDATOR.changeEmailVerify, runValidation, changeEmailVerify);
router.post("/change-email/revert", VALIDATOR.changeEmailRevert, runValidation, changeEmailRevert);

export default router;
