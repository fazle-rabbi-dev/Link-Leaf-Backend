// to fix dns query issue (especially for srv query failure) happens with nodejs 24.x.x
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import "dotenv/config";
import envConfig from "./config/env.js";
import app from "./app.js";
import connectDb from "./config/connect-db.js";
import logger from "./utils/logger.js";

const port = envConfig.port;

connectDb();

app.listen(port, () => {
	logger.info(`Server running on http://localhost:${port}`);
});

export default app;
