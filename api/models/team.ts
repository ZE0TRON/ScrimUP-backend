import mongoose from "mongoose";
import { teamSchema } from "./schemas";
import { bestTimeSchema } from "./schemas";
const BestTimes = mongoose.model("BestTimes", bestTimeSchema);
import {
  teamInterface,
  availabilityInterface,
  memberInterface
} from "./modelInterfaces";
import { User, IUserModel } from "./user";
import { IMemberModel } from "./member";
import { isAvailableAt } from "../controllers/team";
import { findGameIndex } from "./../controllers/account";
import { weekDays } from "../utils/other";
import { dayHours } from "./../utils/other";

// Interface for the schema methods
interface ITeamMethods {
  generateBestTimes: () => Promise<boolean>;
  isAvailableAt: (day: string, hour: string) => Promise<any>;
}

teamSchema.methods.generateBestTimes = function() {
  let self = this;
  return new Promise(async (resolve, reject) => {
    // Number of best times to generate
    // Gonna lower it when we release the premium features
    const numberOfTimes = 10;
    // Get the utc time
    const today = new Date().getUTCDay();
    const currentHour = new Date().getUTCHours();
    // Order the days from close to far
    let days = [];
    for (let i = 0; i < 7; i++) {
      let index = today - 1 + i;
      if (index < 0) {
        index += 7;
      }
      days.push(weekDays[index % 7]);
    }
    let bests: any = {};
    // TODO: find a way to fix that any
    const availability: any = this.availability;
    let currentAvailability = 0;
    // Make a new map of the availability
    days.forEach((day, dIndex) => {
      dayHours.forEach((hour, hIndex) => {
        let currentLabel = day + " " + hour;
        if (!self.occupied.includes(currentLabel)) {
          currentAvailability =
            availability[day][hour] * availability[day]["filledUsers"].length;
          if (currentAvailability > 0) {
            bests[day + " " + hour] = currentAvailability;
          }
        }
      });
    });
    // Create a key value array from the map
    let bestsArray = Object.keys(bests).map(function(key) {
      return [key, bests[key]];
    });
    // Sort the array based on the second element
    // Priority listing
    // 1) Number of available players
    // 2) Closest date
    bestsArray.sort(function(second, first) {
      // TODO: so many splitting and indexing make it faster

      // The efforts for sorting the array according to priority listing above
      let currentBestDay1 = first[0].split(" ")[0];
      let dayDifference1 = weekDays.indexOf(currentBestDay1) - today + 1;
      let currentBestDay2 = second[0].split(" ")[0];
      let dayDifference2 = weekDays.indexOf(currentBestDay2) - today + 1;
      let hour1 = first[0].split(" ")[1].substring(1);
      let hour2 = second[0].split(" ")[1].substring(1);
      dayDifference1 =
        dayDifference1 >= 0 ? dayDifference1 : dayDifference1 + 7;
      dayDifference2 =
        dayDifference2 >= 0 ? dayDifference2 : dayDifference2 + 7;
      let hour1Difference = hour1 - currentHour;
      let hour2Difference = hour2 - currentHour;
      if (dayDifference1 == 0) {
        if (hour1Difference < 0) {
          dayDifference1 = 2;
        }
        hour1Difference =
          hour1Difference >= 0 ? hour1Difference : hour1Difference + 24;
      } else {
        hour1Difference = hour1;
      }
      if (dayDifference2 == 0) {
        if (hour2Difference < 0) dayDifference2 = 2;
        hour2Difference =
          hour2Difference >= 0 ? hour2Difference : hour2Difference + 24;
      } else {
        hour2Difference = hour2;
      }
      return -(
        (second[1] - first[1]) * 1000 +
        (dayDifference1 - dayDifference2) * 24 +
        (hour1Difference - hour2Difference)
      );
    });
    // Get the first 10 element if less then 10 element get all
    bestsArray = bestsArray.slice(
      0,
      numberOfTimes < bestsArray.length ? numberOfTimes : bestsArray.length
    );
    let day;
    let hour;
    // Reset the best times
    self.bestTimes.splice(0, this.bestTimes.length);
    // Construct the new best times
    for (let i = 0; i < bestsArray.length; i++) {
      day = bestsArray[i][0].split(" ")[0];
      hour = bestsArray[i][0].split(" ")[1];
      // Returns who is available, absent and not active at given time.
      let bestResult = await this.isAvailableAt(day, hour);
      let bestTime: any = new BestTimes({
        time: bestsArray[i][0],
        numberOfPlayers: bestsArray[i][1],
        precision: bestsArray[i][1],
        available: bestResult.okey,
        absent: bestResult.absent,
        notActive: bestResult.notActive
      });
      self.bestTimes.push(bestTime);
    }
    self.save((err: any) => {
      if (err) {
        console.log(err);
        return reject(false);
      }
      return resolve(true);
    });
  });
};
// Convert member to user
function findUser(user: IUserModel): Promise<IUserModel | null> {
  return User.findOne({ email: user.email }).exec();
}
// Convert members to users
export let findUsers = (users: IUserModel[]): Promise<IUserModel[] | null> => {
  return new Promise(async (resolve, reject) => {
    let realUsers: IUserModel[] = [];

    for (let i = 0; i < users.length; i++) {
      let realUser = await findUser(users[i]);
      if (realUser) {
        realUsers.push(realUser);
      }
    }
    resolve(realUsers);
  });
};

// Returns who is available, absent and not active at given time.
// TODO: fix this for least computation cost
teamSchema.methods.isAvailableAt = function(day: string, hour: string) {
  let self: any = this;
  return new Promise((resolve, reject) => {
    let okey: string[] = [];
    let absent: string[] = [];
    let notActive: string[] = [];
    // Check activity
    self.members.forEach((member: memberInterface) => {
      if (member.active == false) {
        notActive.push(member.nickName);
      }
    });
    // Check if the user is available at that time
    findUsers(this.members).then((users: IUserModel[] | null) => {
      if (users) {
        for (let i = 0; i < users.length; i++) {
          let user = users[i];
          let gameIndex = findGameIndex(user, this.game);
          if (gameIndex != -1) {
            if (user["games"][gameIndex]["availability"][day][hour] != 0) {
              okey.push(user["games"][gameIndex]["nickName"]);
            } else {
              absent.push(user["games"][gameIndex]["nickName"]);
            }
          }
        }
        const result = {
          okey: okey,
          absent: absent,
          notActive: notActive
        };
        resolve(result);
      } else {
        console.log("ERR:Users are null");
      }
    });
  });
};

interface ITeamModel extends teamInterface, mongoose.Document, ITeamMethods {}
let Team = mongoose.model<ITeamModel>("Team", teamSchema);
export { Team };
export { ITeamModel };
