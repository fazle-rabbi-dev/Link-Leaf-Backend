// to fix dns query issue (especially for srv query failure) happens with nodejs 24.x.x
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import "dotenv/config";
import envConfig from "./config/env.js";
import app from "./app.js";
import connectDb from "./config/connect-db.js";
import logger from "./utils/logger.js";
import chalk from "chalk";

const PORT = envConfig.port;

(async () => {
	await connectDb();

	app.listen(PORT, (err) => {
		if (!err) {
			console.log(chalk.bold.magenta("✓ Server running on: http://localhost:" + PORT));
		} else {
			console.log(chalk.bold.red("✘ Failed to start server! Try again."));
			logger.error(err);
		}
	});
})();
