import { challengeSchema } from "./schemas";
import mongoose from "mongoose";

import { challengeInterface } from "./modelInterfaces";

interface IChallengeModel extends challengeInterface, mongoose.Document {}
let Challenge = mongoose.model<IChallengeModel>("Challenge", challengeSchema);
export { Challenge };
export { IChallengeModel };
