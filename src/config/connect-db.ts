import mongoose from "mongoose";
import envConfig from "./env.js";
import logger from "../utils/logger.js";

// module-scope cache — survives across invocations on a WARM instance
let cached = global.mongooseConn;

if (!cached) {
	cached = global.mongooseConn = { conn: null, promise: null };
}

const connectDb = async (): Promise<typeof mongoose> => {
	if (cached.conn) {
		return cached.conn; // already connected, reuse
	}

	if (!cached.promise) {
		cached.promise = mongoose
			.connect(envConfig.mongodbUri)
			.then((mongooseInstance) => {
				logger.info("MongoDB connected");
				return mongooseInstance;
			})
			.catch((error) => {
				logger.error("MongoDB connection error", error);
				cached.promise = null; // allow retry on next call
				throw error;
			});
	}

	cached.conn = await cached.promise;
	return cached.conn;
};

export default connectDb;

// ------------------------------------------------------------------------
// ------------------- OLD PATTERN
// ------------------------------------------------------------------------
// import mongoose from "mongoose";

// import envConfig from "./env.js";
// import logger from "../utils/logger.js";

// const connectDb = async (): Promise<void> => {
// 	try {
// 		await mongoose.connect(envConfig.mongodbUri);
// 		logger.info("MongoDB connected");
// 	} catch (error) {
// 		logger.error("MongoDB connection error", error);
// 	}
// };

// export default connectDb;
