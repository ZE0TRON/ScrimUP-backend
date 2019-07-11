import mongoose from "mongoose";
import { TaskSchema } from "./schemas";

import { TaskInterface } from "./modelInterfaces";

interface ITaskModel extends TaskInterface, mongoose.Document {}
let Task = mongoose.model<ITaskModel>("Task", TaskSchema);
export { Task };
export { ITaskModel };
