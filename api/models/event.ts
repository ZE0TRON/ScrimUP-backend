import mongoose from "mongoose";
import { eventSchema } from "./schemas";

import { eventInterface } from "./modelInterfaces";

interface IEventModel extends eventInterface, mongoose.Document {}
let Event = mongoose.model<IEventModel>("Event", eventSchema);
export { Event };
export { IEventModel };
