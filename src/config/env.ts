import { z } from "zod";
import logger from "../utils/logger.js";

const envSchema = z.object({
	ALLOWED_CORS_ORIGIN: z.string().min(15).optional(),

	PORT: z.coerce.number().default(5000),
	NODE_ENV: z.enum(["development", "production"]).default("production"),
	MONGODB_URI_DEV: z.url().min(10),
	MONGODB_URI_PROD: z.url().min(10),

	JWT_SECRET: z.string().min(8),
	ACCESS_TOKEN_SECRET: z.string().min(8),
	REFRESH_TOKEN_SECRET: z.string().min(8),
	CLIENT_URL_DEV: z.url(),
	CLIENT_URL_PROD: z.url(),

	SMTP_USER: z.email(),
	SMTP_PASSWORD: z.string().min(16),
	SMTP_FROM: z.string().min(2),

	CLOUDINARY_CLOUD_NAME: z.string().min(2),
	CLOUDINARY_API_KEY: z.string().min(2),
	CLOUDINARY_API_SECRET: z.string().min(2),

	// Firebase Admin service-account secrets (optional — social login only)
	PRIVATE_KEY_ID: z.string().min(2).optional(),
	PRIVATE_KEY: z.string().min(2).optional(),
	CLIENT_ID: z.string().min(2).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	logger.error("Invalid environment variables:");
	console.error(parsed.error.flatten().fieldErrors);
	process.exit(1); // kill app before it starts
}

const env = parsed.data;
const isDev = env.NODE_ENV === "development";

const envConfig = {
	ALLOWED_CORS_ORIGIN: isDev ? "http://localhost:3000" : env.ALLOWED_CORS_ORIGIN!,

	port: env.PORT || 5000,
	mongodbUri: isDev ? env.MONGODB_URI_DEV! : env.MONGODB_URI_PROD!,
	accessTokenSecret: env.ACCESS_TOKEN_SECRET!,
	refreshTokenSecret: env.REFRESH_TOKEN_SECRET!,
	jwtSecret: env.JWT_SECRET!,

	smtp: {
		user: env.SMTP_USER!,
		pass: env.SMTP_PASSWORD!,
		from: env.SMTP_FROM!,
	},

	clientUrl: isDev ? env.CLIENT_URL_DEV! : env.CLIENT_URL_PROD!,
	isDev,

	cloudinary: {
		cloudName: env.CLOUDINARY_CLOUD_NAME,
		apiKey: env.CLOUDINARY_API_KEY,
		apiSecret: env.CLOUDINARY_API_SECRET,
	},

	firebase: {
		credential: {
			type: "service_account",
			project_id: "link-leaf-fr",
			client_email: "firebase-adminsdk-fbsvc@link-leaf-fr.iam.gserviceaccount.com",
			auth_uri: "https://accounts.google.com/o/oauth2/auth",
			token_uri: "https://oauth2.googleapis.com/token",
			auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
			client_x509_cert_url:
				"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40link-leaf-fr.iam.gserviceaccount.com",
			universe_domain: "googleapis.com",

			// .env stores the key with escaped "\n" — convert to real newlines
			privateKey: env.PRIVATE_KEY?.replace(/\\n/g, "\n") as string,
			...(env.PRIVATE_KEY_ID ? { privateKeyId: env.PRIVATE_KEY_ID } : {}),
			...(env.CLIENT_ID ? { clientId: env.CLIENT_ID } : {}),
		},
	},
} as const;

export default envConfig;

/* ---------------------------------------------------------------------------- */
/* ------------- alternative to zod ---------------------------------------- */
/* ---------------------------------------------------------------------------- */
/* 
const required = ["MONGODB_URI", "SMTP_PASS", "ACCESS_TOKEN_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`);
    process.exit(1);
  }
}
*/
