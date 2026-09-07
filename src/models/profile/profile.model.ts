import { model } from "mongoose";
import { profileSchema } from "./profile.schema.js";
import type { IProfile } from "./profile.types.js";

const Profile = model<IProfile>("profile", profileSchema);

export default Profile;
