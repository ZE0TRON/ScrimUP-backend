import mongoose from "mongoose";
import { allHoursSchema } from "./schemas";

import { allHoursInterface } from "./modelInterfaces";

//interface IAllHoursModel extends mongoose.Document , allHoursInterface {}
let AllHours = mongoose.model<any>("AllHours", allHoursSchema);
export { AllHours };
//export {IAllHoursModel};
