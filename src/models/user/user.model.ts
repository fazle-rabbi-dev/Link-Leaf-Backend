import { model } from "mongoose";
import userSchema from "./user.schema.js";
import type { IUser } from "./user.types.js";

const User = model<IUser>("User", userSchema);

export default User;
