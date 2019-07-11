import mongoose from "mongoose";
import { gameSchema } from "./schemas";

import { gameInterface } from "./modelInterfaces";

interface IGameModel extends gameInterface, mongoose.Document {}
let Game = mongoose.model<IGameModel>("Game", gameSchema);
export { Game };
export { IGameModel };
