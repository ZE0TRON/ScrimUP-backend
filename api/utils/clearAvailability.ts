import { Team, ITeamModel } from "../models/team";
import * as notifications from "./notifications";
import { User, IUserModel } from "../models/user";
import { userInterface, teamInterface } from "../models/modelInterfaces";
import { days } from "./other";
// Clears the availability of all users for the past hour and update the team availability and best times
const resetHour = () => {
  const date = new Date();
  const today = date.getUTCDay();
  const UTCHour = date.getUTCHours();
  let hour: Number;
  let clearDay: string;
  if (UTCHour == 0) {
    hour = 23;
    clearDay = today != 0 ? days[today - 1] : days[6];
  } else {
    hour = (UTCHour - 1) % 24;
    clearDay = days[today];
  }
  const clearHour = "t" + hour.toString();
  const clearString = "availability." + clearDay + "." + clearHour;
  let query: any = {};
  query[clearString] = 0;
  // TODO: Fix this shit
  User.find({}, (err, users) => {
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users[i].games.length; j++) {
        users[i].games[j].prevAvailability[clearDay][clearHour] =
          users[i].games[j].availability[clearDay][clearHour];
        users[i].games[j].availability[clearDay][clearHour] = 0;
      }
      users[i].save(err => {
        if (err) {
          console.log(err);
        }
      });
    }
    Team.updateMany({}, query, err => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Cleared ${clearDay} ${clearHour}`);
        console.log("Generating new availabilities");
        Team.find({}, (err, teams) => {
          if (err || !teams) {
            console.log(err);
          } else {
            teams.forEach(team => {
              team.generateBestTimes();
            });
          }
        });
      }
    });
  });
};

// TODO: fix this function causing not active bug.
/* exports.resetActive = () => {
  Team.updateMany(
    {
      "members.active": true
    },
    { $set: { "members.$.active": false } },
    { multi: true },
    err => {
      if (err) {
        console.log(err);
      }
    }
  );
}; */

// Find not active players and notify them
const notifyUnavailable = () => {
  let users: string[] = [];
  Team.find({ "members.active": false })
    .select({ members: { $elemMatch: { active: false } } })
    .select({ "members.email": 1 })
    .exec((err: any, team: ITeamModel[]) => {
      if (err) {
        return console.log(err);
      }
      for (let i = 0; i < team.length; i++) {
        for (let j = 0; j < team[i].members.length; j++) {
          let email = team[i].members[j].email;
          users.push(email);
        }
      }
      notifications.enterAvailabilityNotification(users);
    });
};

// Clear teams occupied times
const clearOccupied = () => {
  const date = new Date();
  const today = date.getUTCDay();

  const hour = (date.getUTCHours() - 1) % 24;
  const clearDay = days[today];
  const clearHour = "t" + hour.toString();
  const clearString = clearDay + " " + clearHour;
  console.log(clearString);
  Team.find({ occupied: clearString }, (err: any, teams: ITeamModel[]) => {
    if (err) {
      console.log(err);
      return;
    }
    if (!teams) {
      return;
    }
    for (let i = 0; i < teams.length; i++) {
      let team = teams[i];

      let clearIndex = -1;
      for (let j = 0; j < team.occupied.length; j++) {
        if (team.occupied[j] == clearString) {
          clearIndex = j;
        }
      }
      if (clearIndex != -1) {
        team.occupied.splice(clearIndex, 1);
        team.save(err => {
          if (err) {
            console.log(err);
          }
        });
      }
    }
  });
};

// Deletes the events from the past hour
const clearEvents = () => {
  const date = new Date();
  const today = date.getUTCDay();
  const hour = (date.getUTCHours() - 1) % 24;
  const clearDay = days[today];
  const clearHour = "t" + hour.toString();
  const clearString = clearDay + " " + clearHour;
  console.log(clearString);
  Team.find({ "events.time": clearString }, (err, teams) => {
    if (err) {
      console.log(err);
      return;
    }
    if (!teams) {
      return;
    }
    for (let i = 0; i < teams.length; i++) {
      let team = teams[i];

      let clearIndex = -1;
      for (let j = 0; j < team.events.length; j++) {
        if (team.events[j].time == clearString) {
          clearIndex = j;
        }
      }
      if (clearIndex != -1) {
        team.events.splice(clearIndex, 1);
        team.save(err => {
          if (err) {
            console.log(err);
          }
        });
      }
    }
  });
};

export { resetHour };
export { clearEvents };
export { notifyUnavailable };
export { clearOccupied };
