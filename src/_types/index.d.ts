import type { IUser } from "../models/user.model.ts";

type MongooseCache = {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
};

declare global {
	namespace Express {
		interface Request {
			user: IUser;
		}
	}

	var mongooseConn: MongooseCache | undefined;
}
