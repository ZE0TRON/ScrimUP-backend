import mongoose from "mongoose";
import { StrategySchema } from "./schemas";

import { StrategyInterface } from "./modelInterfaces";

interface IStrategyModel extends StrategyInterface, mongoose.Document {}
let Strategy = mongoose.model<IStrategyModel>("Strategy", StrategySchema);
export { Strategy };
export { IStrategyModel };
