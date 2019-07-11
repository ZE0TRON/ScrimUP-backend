import mongoose from "mongoose";
import { availabilitySchema } from "./schemas";
import { availabilityInterface } from "./modelInterfaces";

//interface IAvailabilityModel extends availabilityInterface, mongoose.Document { }
let Availability = mongoose.model<any>("Availability", availabilitySchema);
export { Availability };
//export {IAva};
