import mongoose from "mongoose";

import { memberInterface } from "./modelInterfaces";
import { memberSchema } from "./schemas";

interface IMemberModel extends memberInterface, mongoose.Document {}
let Member = mongoose.model<IMemberModel>("Member", memberSchema);
export { Member };
export { IMemberModel };
