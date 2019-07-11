const assert = require("assert");
const app = require("./testServer").app;
const dotenv = require("dotenv");

const request = require("supertest");
const db = require("./testServer").db;
const connection = require("./testServer").connection;
const User = require("../build/api/models/user").User;
const fs = require("fs");
const csv = require("csv-parser");

const clone = a => {
  return JSON.parse(JSON.stringify(a));
};

const usersList = [
  "test1@test.com",
  "test2@test.com",
  "test3@test.com",
  "test4@test.com",
  "test5@test.com",
  "test6@test.com",
  "test7@test.com",
  "test8@test.com",
  "test9@test.com",
  "test10@test.com",
  "test11@test.com",
  "test12@test.com",
  "test13@test.com",
  "test14@test.com",
  "test15@test.com",
  "test16@test.com"
];
const password = "test123";
const FCMToken = "123123123123";
let sessionIDs = [];
const numberOfTeams = 4;
// const team1Users = [
//   "test1@test.com",
//   "test2@test.com",
//   "test3@test.com",
//   "test4@test.com",
//   "test5@test.com"
// ];
const team1Nicks = ["t1", "t2", "t3", "t4", "t5"];
const team1Name = "team1";
const team1game = "Overwatch";

// const team2Users = [
//   "test6@test.com",
//   "test7@test.com",
//   "test8@test.com",
//   "test9@test.com",
//   "test10@test.com"
// ];
const team2Nicks = ["t6", "t7", "t8", "t9", "t10"];
const team2game = "Overwatch";
const team2Name = "team2";

// const team3Users = [
//   "test11@test.com",
//   "test12@test.com",
//   "test13@test.com",
//   "test14@test.com",
//   "test15@test.com"
// ];
const team3Nicks = ["t11", "t12", "t13", "t14", "t15"];
const team4Nicks = ["t16"];

const team3Name = "team3";
const team3game = "Overwatch";

// const team4Users = ["test16@test.com"];
const team4Name = "team4";
const team4game = "Path Of Exile";

let team1SIDs;
let team2SIDs;
let team3SIDs;
let team4SIDs;
let allTeamSIDs;
let teamTokens = [];
let teamBestTimes = [{}, {}];
// const teamHours = [];
let playerHours = [[], [], [], [], [], [], [], [], [], []];
// const expectedBestTimes = [];
const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];
const results = [];
const readHours = () => {
  return new Promise((resolve, reject) => {
    fs.createReadStream("./test_data/hour/hours3.csv")
      .pipe(csv())
      .on("data", data => results.push(data))
      .on("end", () => {
        let hourCounter = 0;
        let dayCounter = 0;
        results.forEach(result => {
          if (hourCounter > 23) {
            hourCounter = 0;
            dayCounter += 1;
          }
          let currentBestHour = "";
          let currentNumberOfPlayers = "";
          let parsedTime = days[dayCounter] + "-t" + hourCounter;
          let a = { key: parsedTime };
          for (let j = 0; j < 2; j++) {
            for (let i = 0; i < 5; i++) {
              if (i < 5) {
                let value = parseInt(
                  result["t" + (j * 5 + (i + 1)).toString()]
                );
                if (value) {
                  a["value"] = value;
                  playerHours[i + j * 5].push(clone(a));
                }
              }
            }
            currentBestHour =
              result["Team" + (j + 1).toString() + " Best Times"];
            currentNumberOfPlayers =
              result["Team" + (j + 1).toString() + " Players"];
            if (
              currentBestHour != "" &&
              currentNumberOfPlayers != "" &&
              currentBestHour &&
              currentNumberOfPlayers
            ) {
              teamBestTimes[j][currentBestHour] = currentNumberOfPlayers;
            }
          }
          hourCounter += 1;
        });
        resolve(true);
        // console.log(playerHours);
        // [
        //   { NAME: 'Daffy Duck', AGE: '24' },
        //   { NAME: 'Bugs Bunny', AGE: '22' }
        // ]
      });
  });
};

const createTeams = () => {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < numberOfTeams; i++) {
      await new Promise((resolve, reject) => {
        request(app)
          .post("/team/createTeam")
          .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
          .send({
            teamName: teamNames[i],
            gameName: teamGames[i],
            nickName: teamNicks[i][0]
          })
          .then(response => {
            if (!response.body.success) {
              console.log(response.body.msg);
            }
            assert.strictEqual(response.body.success, true);
            resolve(true);
          });
      });
      await new Promise((resolve, reject) => {
        request(app)
          .post("/team/getToken")
          .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
          .send({
            teamName: teamNames[i],
            gameName: teamGames[i]
          })
          .then(response => {
            assert.strictEqual(response.body.success, true);
            if (!response.body.token) {
              // eslint-disable-next-line
              throw "Null token";
            }
            teamTokens.push(response.body.token);
            resolve(true);
          });
      });
      for (let j = 1; j < allTeamSIDs[i].length; j++) {
        await new Promise((resolve, reject) => {
          request(app)
            .post("/team/enterWithToken")
            .set("Cookie", ["connect.sid=" + allTeamSIDs[i][j]])
            .send({
              nickName: teamNicks[i][j],
              token: teamTokens[i]
            })
            .then(response => {
              assert.strictEqual(response.body.success, true);
              resolve(true);
            });
        });
      }
    }
    resolve(true);
  });
};

const createUsers = () => {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < usersList.length; i++) {
      await new Promise((resolve, reject) => {
        request(app)
          .post("/account/signup")
          .send({
            email: usersList[i],
            password: password,
            FCMToken: FCMToken
          })
          .expect(200)
          .then(response => {
            assert.strictEqual(response.body.success, false);
            assert.strictEqual(response.body.msg, "Not verified");
            sessionIDs.push(
              response.headers["set-cookie"][0].split(";")[0].split("=")[1]
            );
            resolve(true);
          });
      });
    }
    resolve(true);
  });
};
const verifyUsers = () => {
  return new Promise((resolve, reject) => {
    User.find({}, async (err, users) => {
      for (let i = 0; i < users.length; i++) {
        await new Promise((resolve, reject) => {
          users[i].verified = true;
          users[i].save(err => {
            if (err) {
              console.log(err);
              assert(true, true);
            }
            resolve(true);
          });
        });
      }
      resolve(true);
    });
  });
};

const setHours = () => {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < teamNicks[i].length; j++) {
        await new Promise((resolve, reject) => {
          request(app)
            .post("/account/setHours")
            .set("Cookie", ["connect.sid=" + allTeamSIDs[i][j]])
            .send({
              gameName: teamGames[i],
              teamName: teamNames[i],
              hours: playerHours[i * 5 + j],
              hourType: "general"
            })
            .expect(200)
            .then(response => {
              assert.strictEqual(response.body.success, true);
              resolve(true);
            });
        });
      }
    }
    resolve(true);
  });
};

module.exports = async () => {
  dotenv.load({ path: "../.env.test" });
  try {
    await db.collections["users"].drop();
  } catch (e) {}
  await db.createCollection("users");
  // TODO: Drop sessions
  await createUsers();
  await verifyUsers();
  team1SIDs = sessionIDs.slice(0, 5);
  team2SIDs = sessionIDs.slice(5, 10);
  team3SIDs = sessionIDs.slice(10, 15);
  team4SIDs = [sessionIDs[15]];
  allTeamSIDs = [team1SIDs, team2SIDs, team3SIDs, team4SIDs];
  teamNames = [team1Name, team2Name, team3Name, team4Name];
  teamGames = [team1game, team2game, team3game, team4game];
  teamNicks = [team1Nicks, team2Nicks, team3Nicks, team4Nicks];
  try {
    await db.collections["teams"].drop();
  } catch (e) {}
  await db.createCollection("teams");
  await createTeams();
  await readHours();
  await setHours();
  let buffer = "";
  allTeamSIDs.forEach(team => {
    team.forEach(sid => {
      buffer += sid + ",";
    });
    buffer += "\n";
  });
  // console.log(playerHours[4].slice(150));
  fs.writeFileSync("./test_data/team/tsids.txt", buffer);
  fs.writeFileSync("./test_data/team/sids.txt", sessionIDs);
  let bestTimesJson1 = JSON.stringify(teamBestTimes[0]);
  let bestTimesJson2 = JSON.stringify(teamBestTimes[1]);
  fs.writeFileSync("./test_data/team/bestTimes1.json", bestTimesJson1);
  fs.writeFileSync("./test_data/team/bestTimes2.json", bestTimesJson2);
  db.close();
  connection.disconnect();
};
