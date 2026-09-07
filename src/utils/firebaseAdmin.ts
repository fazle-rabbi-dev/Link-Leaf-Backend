import { initializeApp, cert, getApps, getApp, type App } from "firebase-admin/app";
import { getAuth, type Auth, type UserRecord } from "firebase-admin/auth";

import envConfig from "../config/env.js";
import logger from "./logger.js";

let cachedApp: App | null = null;

/**
 * Lazily initializes (and caches) the Firebase Admin app.
 * We avoid initializing at import time so the app can boot even when
 * Firebase credentials are not yet configured.
 */
const getFirebaseApp = (): App => {
	if (cachedApp) return cachedApp;
	if (getApps().length > 0) return getApp();

	const credential = envConfig.firebase?.credential;
	if (!credential) {
		throw new Error(
			"Firebase Admin is not configured. Set the service-account env vars (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) or GOOGLE_APPLICATION_CREDENTIALS.",
		);
	}

	cachedApp = initializeApp({
		credential: cert(credential),
	});

	logger.info("Firebase Admin SDK initialized");
	return cachedApp;
};

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());

/**
 * Fetches a Firebase user record by UID.
 * Throws if the UID is invalid / does not exist.
 */
export const getFirebaseUser = async (uid: string): Promise<UserRecord> => {
	return getFirebaseAuth().getUser(uid);
};
