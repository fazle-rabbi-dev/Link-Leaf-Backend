import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import logger, { morganStream } from "./utils/logger.js";
import { rateLimiter } from "./middlewares/rateLimiter.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import authRouter from "./routes/v1/auth.routes.js";
import userRouter from "./routes/v1/user.routes.js";
import profileRouter from "./routes/v1/profile.routes.js";
import seedRouter from "./routes/v1/seed.routes.js";
import { swaggerSpec } from "./docs/apiDocs.js";
import envConfig from "./config/env.js";

const app = express();

app.use(
	cors({
		origin: envConfig.ALLOWED_CORS_ORIGIN,
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

// temporary debug middleware — remove after verifying
app.use((req, res, next) => {
	logger.debug("req.ip:", req.ip);
	logger.debug("x-forwarded-for:", req.headers["x-forwarded-for"]);
	logger.debug("req.ips:", req.ips); // full chain, if trust proxy is set
	next();
});

// for 1 reverse proxy hop use 1; if the server is behind a reverse proxy than to get client ip need to trust the: 'x-forwarded-for' header
app.set("trust proxy", 1);
app.use("/api", rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev", { stream: morganStream }));

// ------------------- ROUTES ------------------- //
app.get("/health", (_req, res) => {
	res.status(200).json({ message: "Server is up & running 🚀" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/seed", seedRouter);

// ------------------- API DOCS ------------------- //
app.get("/api-docs/spec", (_req, res) => {
	res.json(swaggerSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handler
app.use(notFound);
app.use(errorHandler);

export default app;
