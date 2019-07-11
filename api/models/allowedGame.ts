import mongoose from "mongoose";
import { allowedGameSchema } from "./schemas";
import { allowedGamesInterface } from "./modelInterfaces";

interface IAllowedGamesModel extends allowedGamesInterface, mongoose.Document {}
let AllowedGames = mongoose.model<IAllowedGamesModel>(
  "AllowedGames",
  allowedGameSchema
);
export { AllowedGames };
export { IAllowedGamesModel };
