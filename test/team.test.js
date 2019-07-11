const fs = require("fs");
const TeamController = require("../build/api/controllers/team");
const TeamModel = require("../build/api/models/team");
const request = require("supertest");
const app = require("./testServer").app;
const db = require("./testServer").db;
const connection = require("./testServer").connection;
const State = require("./testHelpers").State;
const numberOfTeams = 4;
const team1Users = [
  "test1@test.com",
  "test2@test.com",
  "test3@test.com",
  "test4@test.com",
  "test5@test.com"
];
const team1Nicks = ["t1", "t2", "t3", "t4", "t5"];
const team1Name = "team1";
const team1game = "Overwatch";

const team2Users = [
  "test6@test.com",
  "test7@test.com",
  "test8@test.com",
  "test9@test.com",
  "test10@test.com"
];
const team2Nicks = ["t6", "t7", "t8", "t9", "t10"];
const team2game = "Overwatch";
const team2Name = "team2";

const team3Users = [
  "test11@test.com",
  "test12@test.com",
  "test13@test.com",
  "test14@test.com",
  "test15@test.com"
];
const team3Nicks = ["t11", "t12", "t13", "t14", "t15"];
const team3game = "Overwatch";
const team3Name = "team3";

const team4Users = ["test16@test.com"];
const team4Nicks = ["t16"];
const team4game = "Path Of Exile";
const team4Name = "team4";
const teamNames = [team1Name, team2Name, team3Name, team4Name];
const teamGames = [team1game, team2game, team3game, team4game];
const teamNicks = [team1Nicks, team2Nicks, team3Nicks, team4Nicks];
const teamMails = [team1Users, team2Users, team3Users, team4Users];
let allTeamSIDs = [];
// let sidContent = fs.readFileSync("./test_data/team/sids.txt");
// let sessionIDs = sidContent.toString().split(",");

let tsidContent = fs.readFileSync("./test_data/team/tsids.txt");
tsidContent
  .toString()
  .trimEnd("\n")
  .split("\n")
  .forEach(sids => {
    allTeamSIDs.push(sids.split(",").slice(0, -1));
  });
let teamBestTimes = [];
let teamBestTimesJson1 = fs.readFileSync("./test_data/team/bestTimes1.json");
teamBestTimes[0] = JSON.parse(teamBestTimesJson1);
let teamBestTimesJson2 = fs.readFileSync("./test_data/team/bestTimes2.json");
teamBestTimes[1] = JSON.parse(teamBestTimesJson2);
test("Get Members", async () => {
  for (let i = 0; i < numberOfTeams; i++) {
    for (let j = 0; j < teamNicks[i].length; j++) {
      await new Promise((resolve, reject) => {
        request(app)
          .post("/team/getTeamMembers")
          .set("Cookie", ["connect.sid=" + allTeamSIDs[i][j]])
          .send({
            gameName: teamGames[i],
            teamName: teamNames[i]
          })
          .expect(200)
          .then(response => {
            expect(response.body.success).toBe(true);
            let leader = response.body.leader;
            let members = response.body.members;
            let you = response.body.you;
            expect(leader).toEqual(teamNicks[i][0]);
            expect(members).toEqual(teamNicks[i]);
            expect(you).toEqual(teamNicks[i][j]);
            resolve(true);
          });
      });
    }
  }
});

test("Get Best Times", async () => {
  for (let i = 0; i < 2; i++) {
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/getBestTimes")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
        .send({
          gameName: teamGames[i],
          teamName: teamNames[i]
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBe(true);
          let times = response.body.bests;
          expect(times).toBeTruthy();
          times.forEach(time => {
            let parsedTime = time.time.split(" ");
            let day =
              parsedTime[0].charAt(0).toUpperCase() + parsedTime[0].slice(1);
            let hour = parsedTime[1].slice(1);
            let dayHour = day + "-" + hour;
            let value = time.numberOfPlayers.toString();
            expect(value).toBe(teamBestTimes[i][dayHour]);
          });
          resolve(true);
        });
    });
  }
});

test("Get Challengable Teams", async () => {
  for (let i = 0; i < 2; i++) {
    for (let a = 1; a < 6; a++) {
      for (let b = 1; b < 6; b++) {
        await new Promise((resolve, reject) => {
          request(app)
            .post("/team/getChallengableTeams")
            .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
            .send({
              gameName: teamGames[i],
              teamName: teamNames[i],
              v1: a,
              v2: b
            })
            .expect(200)
            .then(response => {
              expect(response.body.success).toBe(true);
              let challengeList = response.body.teams;
              expect(challengeList.length).toBeGreaterThan(0);
              challengeList.forEach(challenge => {
                let parsedTime = challenge.time.split(" ");
                let day =
                  parsedTime[0].charAt(0).toUpperCase() +
                  parsedTime[0].slice(1);
                let hour = parsedTime[1].slice(1);
                let dayHour = day + "-" + hour;
                let value = challenge.numberOfPlayers;
                expect(
                  parseInt(teamBestTimes[i][dayHour])
                ).toBeGreaterThanOrEqual(value);
              });
              resolve(true);
            });
        });
      }
    }
  }
});

test("Change Team Name", async () => {
  for (let i = 0; i < 2; i++) {
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/changeTeamName")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
        .send({
          game: teamGames[i],
          team: teamNames[i],
          newTeamName: teamNames[i] + "a"
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBe(true);
          teamNames[i] = teamNames[i] + "a";
          resolve(true);
        });
    });
    for (let j = 0; j < teamNicks[i].length; j++) {
      await new Promise((resolve, reject) => {
        request(app)
          .get("/account/getGames")
          .set("Cookie", ["connect.sid=" + allTeamSIDs[i][j]])
          .send()
          .expect(200)
          .then(response => {
            expect(response.body.success).toBe(true);
            let games = response.body.games;
            games.forEach(game => {
              if (game.game == teamGames[i]) {
                expect(game.team).toBe(teamNames[i]);
              }
            });
            resolve(true);
          });
      });
    }
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/changeTeamName")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
        .send({
          game: teamGames[i],
          team: teamNames[i],
          newTeamName: teamNames[i].slice(0, teamNames[i].length)
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBe(true);
          teamNames[i] = teamNames[i].slice(0, teamNames[i].length);
          resolve(true);
        });
    });
  }
});
test("Leave Team", async () => {
  let state = State();
  await state.setState();
  // leader is trying to leave
  for (let j = 0; j < 4; j++) {
    // giving the leader name from another team
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/leaveTeam")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[0][j]])
        .send({
          gameName: teamGames[0],
          teamName: teamNames[0],
          leaderNick: teamNicks[1][j]
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBeFalsy();
          resolve(true);
        });
    });
    // leaders are leaving from the team, making the next person leader
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/leaveTeam")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[0][j]])
        .send({
          gameName: teamGames[0],
          teamName: teamNames[0],
          leaderNick: teamNicks[0][j + 1]
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBe(true);
          resolve(true);
        });
    });
  }
  // user trying to leave
  for (let j = 4; j > 0; j--) {
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/leaveTeam")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[1][j]])
        .send({
          gameName: teamGames[1],
          teamName: teamNames[1]
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBe(true);
          resolve(true);
        });
    });
  }

  let isReverted = await state.revertState();
  expect(isReverted).toBe(true);
}, 30000);

describe("Event Tests", () => {
  test("Create Event", async () => {
    // Non leader trying to add event team 0
    for (let j = 0; j < 5; j++) {
      await new Promise((resolve, reject) => {
        request(app)
          .post("/team/createEvent")
          .set("Cookie", ["connect.sid=" + allTeamSIDs[0][j]])
          .send({
            game: teamGames[0],
            team: teamNames[0],
            eventName: "Test Event" + j.toString(),
            eventTime: "monday t" + j.toString(),
            eventExactTime: "30",
            numberOfPlayers: 1,
            eventNote: "Optional Note"
          })
          .expect(200)
          .then(response => {
            expect(response.body.success).toBeTruthy();
            resolve(true);
          });
      });
    }
  });
  // Leader adding a event

  test("Join Event", async () => {
    // Team members trying to join event
    for (let j = 1; j < 5; j++) {
      await new Promise((resolve, reject) => {
        request(app)
          .post("/team/joinEvent")
          .set("Cookie", ["connect.sid=" + allTeamSIDs[0][j]])
          .send({
            game: teamGames[0],
            team: teamNames[0],
            eventName: "Test Event" + (j - 1).toString(),
            eventTime: "monday t" + (j - 1).toString()
          })
          .then(response => {
            if (response.err) {
              console.log(response.err);
            }
            console.log(response.body);
            expect(response.body.success).toBe(true);
            resolve(true);
          });
      });
    }
    // Members that already in the event or members from another team trying to join
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 5; j++) {
        await new Promise((resolve, reject) => {
          request(app)
            .post("/team/joinEvent")
            .set("Cookie", ["connect.sid=" + allTeamSIDs[i][j]])
            .send({
              game: teamGames[i],
              team: teamNames[i],
              eventName: "Test Event" + j.toString(),
              eventTime: "monday t" + j.toString()
            })
            .expect(200)
            .then(response => {
              expect(response.body.success).toBeFalsy();
              resolve(true);
            });
        });
      }
    }
  }, 15000);

  test("Is Available At Test", async () => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        await new Promise((resolve, reject) => {
          request(app)
            .post("/team/isAvailableAt")
            .set("Cookie", ["connect.sid=" + allTeamSIDs[i][j]])
            .send({
              gameName: teamGames[i],
              teamName: teamNames[i],
              day: "monday",
              hour: "t3"
            })
            .expect(200)
            .then(response => {
              expect(response.body.success).toBe(true);
              resolve(true);
            });
        });
      }
    }
  });

  /*
  test("Is leader Test", async () => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        if (j == 0) {
          expect(
            team.isLeader(teamNames[i], teamGames[i], teamMails[i][j])
          ).toBeTruthy();
        } else {
          expect(
            team.isLeader(teamNames[i], teamGames[i], teamMails[i][j])
          ).toBeFalsy();
        }
      }
    }
  });
  */

  test("Leave Event", async () => {
    // event members trying to leave event
    for (let j = 1; j < 5; j++) {
      await new Promise((resolve, reject) => {
        request(app)
          .post("/team/leaveEvent")
          .set("Cookie", ["connect.sid=" + allTeamSIDs[0][j]])
          .send({
            game: teamGames[0],
            team: teamNames[0],
            eventName: "Test Event" + (j - 1).toString()
          })
          .expect(200)
          .then(response => {
            expect(response.body.success).toBe(true);
            resolve(true);
          });
      });
    }
    // Non members trying to leave
    for (let j = 1; j < 4; j++) {
      await new Promise((resolve, reject) => {
        request(app)
          .post("/team/leaveEvent")
          .set("Cookie", ["connect.sid=" + allTeamSIDs[0][j]])
          .send({
            game: teamGames[0],
            team: teamNames[0],
            eventName: "Test Event" + (j - 1).toString()
          })
          .expect(200)
          .then(response => {
            expect(response.body.success).toBeFalsy();
            resolve(true);
          });
      });
    }
  });

  test("Delete Event", async () => {
    // non members or non leader trying to delete event
    for (let j = 1; j < 5; j++) {
      await new Promise((resolve, reject) => {
        request(app)
          .post("/team/deleteEvent")
          .set("Cookie", ["connect.sid=" + allTeamSIDs[0][j]])
          .send({
            game: teamGames[0],
            team: teamNames[0],
            eventName: "Test Event" + j.toString()
          })
          .expect(200)
          .then(response => {
            expect(response.body.success).toBeFalsy();
            resolve(true);
          });
      });
    }
    // leader deleting the event
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/deleteEvent")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[0][0]])
        .send({
          game: teamGames[0],
          team: teamNames[0],
          eventName: "Test Event" + 0
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBe(true);
          resolve(true);
        });
    });
  });
}, 30000);

test("Find Member Index By Mail", async () => {
  for (let i = 0; i < 2; i++) {
    let is0k = await new Promise((resolve, reject) => {
      TeamModel.Team.findOne(
        {
          name: teamNames[i],
          game: teamGames[i]
        },
        (err, foundTeam) => {
          if (err) {
            console.log(err);
            resolve(false);
          } else {
            expect(foundTeam).toBeTruthy();
            for (let j = 0; j < 5; j++) {
              expect(
                // trying to find member from same team
                TeamController.findMemberIndexByMail(
                  foundTeam,
                  teamMails[i][j]
                ) == j
              ).toBe(true);
              // trying to find member from different team
              expect(
                TeamController.findMemberIndexByMail(
                  foundTeam,
                  teamMails[i + 1][j]
                ) == j
              ).toBeFalsy();
            }
            resolve(true);
          }
        }
      );
    });
    expect(is0k).toBeTruthy();
  }
}, 20000);

test("Find Member Index By Nick", async () => {
  for (let i = 0; i < 2; i++) {
    let is0k = await new Promise((resolve, reject) => {
      TeamModel.Team.findOne(
        {
          name: teamNames[i],
          game: teamGames[i]
        },
        (err, foundTeam) => {
          if (err) {
            console.log(err);
            resolve(false);
          } else {
            expect(foundTeam).toBeTruthy();
            for (let j = 0; j < 5; j++) {
              expect(
                TeamController.findMemberIndexByNick(
                  foundTeam,
                  teamNicks[i][j]
                ) == j
              ).toBe(true);
              expect(
                TeamController.findMemberIndexByNick(
                  foundTeam,
                  teamNicks[i + 1][j]
                ) == j
              ).toBeFalsy();
            }
            resolve(true);
          }
        }
      );
    });
    expect(is0k).toBeTruthy();
  }
});

test("Kick From Team", async () => {
  let state = State();
  await state.setState();
  // non leader trying to kick
  for (let j = 0; j < 5; j++) {
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/kickFromTeam")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[0][1]])
        .send({
          game: teamGames[0],
          team: teamNames[0],
          kickedUser: teamNicks[0][j]
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBeFalsy();
          resolve(true);
        });
    });
  }
  // leader trying to kick
  for (let j = 1; j < 5; j++) {
    // leader kicking from own team
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/kickFromTeam")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[0][0]])
        .send({
          game: teamGames[0],
          team: teamNames[0],
          kickedUser: teamNicks[0][j]
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBeTruthy();
          resolve(true);
        });
    });
    // checking if the player still in the team by making it to try leaving from the team
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/leaveTeam")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[0][j]])
        .send({
          gameName: teamGames[0],
          teamName: teamNames[0]
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBeFalsy();
          resolve(true);
        });
    });
    // checking best times, if the user left in any of them after kicking it out
    await new Promise((resolve, reject) => {
      request(app)
        .post("/team/getBestTimes")
        .set("Cookie", ["connect.sid=" + allTeamSIDs[0][0]])
        .send({
          gameName: teamGames[0],
          teamName: teamNames[0]
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBe(true);
          let times = response.body.bests;
          expect(times).toBeTruthy();
          times.forEach(time => {
            expect(time.available.indexOf(teamNicks[0][j]) > -1).toBeFalsy();
            expect(time.absent.indexOf(teamNicks[0][j]) > -1).toBeFalsy();
            expect(time.notActive.indexOf(teamNicks[0][j]) > -1).toBeFalsy();
          });
          resolve(true);
        });
    });
  }
  let isReverted = await state.revertState();
  expect(isReverted).toBe(true);
}, 30000);

test("Find Users", async () => {
  let is0k = await new Promise((resolve, reject) => {
    TeamModel.Team.findOne(
      {
        name: teamNames[0],
        game: teamGames[0]
      },
      (err, foundTeam) => {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          expect(foundTeam).toBeTruthy();
          let userList = TeamModel.findUsers(foundTeam.members);
          userList.then(function(response) {
            expect(response.length).toEqual(foundTeam.members.length);
            for (let i = 0; i < response.length; i++) {
              expect(response[i].games.length).toBeGreaterThanOrEqual(1);
              expect(response[i].email == foundTeam.members[i].email);
            }
          });
          resolve(true);
        }
      }
    );
  });
  expect(is0k).toBeTruthy();
});

// describe("Challenge Tests", () => {
//   test("Challenge Other Teams", async () => {
//     // leader challenging other team(1 to 2  1-2)
//     for (let i = 0; i < 2; i++) {
//       await new Promise((resolve, reject) => {
//         request(app)
//           .post("/team/challengeOtherTeams")
//           .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
//           .send({
//             gameName: teamGames[i],
//             teamName: teamNames[i],
//             otherTeam: teamNames[i + 1],
//             time: "monday t" + ((7 * i) % 24),
//             exactTime: "" + ((29 * i) % 60),
//             v2: "" + ((7 * i) % 10),
//             note: "Note"
//           })
//           .expect(200)
//           .then(response => {
//             expect(response.body.success).toBe(true);
//             resolve(true);
//           });
//       });
//       // trying to challenge other team in the same time(1-3)
//       await new Promise((resolve, reject) => {
//         request(app)
//           .post("/team/challengeOtherTeams")
//           .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
//           .send({
//             gameName: teamGames[i],
//             teamName: teamNames[i],
//             otherTeam: teamNames[i + 2],
//             time: "monday t" + ((7 * i) % 24),
//             exactTime: "" + ((29 * i) % 60),
//             v2: "" + ((7 * i) % 10),
//             note: "Note"
//           })
//           .expect(200)
//           .then(response => {
//             expect(response.body.success).toBeFalsy();
//             resolve(true);
//           });
//       });
//       // trying to challenge same team in the same time again(1-2)
//       await new Promise((resolve, reject) => {
//         request(app)
//           .post("/team/challengeOtherTeams")
//           .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
//           .send({
//             gameName: teamGames[i],
//             teamName: teamNames[i],
//             otherTeam: teamNames[i + 1],
//             time: "monday t" + ((7 * i) % 24),
//             exactTime: "" + ((29 * i) % 60),
//             v2: "" + ((7 * i) % 10),
//             note: "Note"
//           })
//           .expect(200)
//           .then(response => {
//             expect(response.body.success).toBeFalsy();
//             resolve(true);
//           });
//       });
//       // trying to challenge the challenge sender team from other test (2-1)
//       await new Promise((resolve, reject) => {
//         request(app)
//           .post("/team/challengeOtherTeams")
//           .set("Cookie", ["connect.sid=" + allTeamSIDs[i][0]])
//           .send({
//             gameName: teamGames[i + 1],
//             teamName: teamNames[i + 1],
//             otherTeam: teamNames[i],
//             time: "monday t" + ((7 * i) % 24),
//             exactTime: "" + ((29 * i) % 60),
//             v2: "" + ((7 * i) % 10),
//             note: "Note"
//           })
//           .expect(200)
//           .then(response => {
//             expect(response.body.success).toBeTruthy();
//             resolve(true);
//           });
//       });
//     }
//   });
// });

afterAll(async () => {
  // db.close();
  // connection.disconnect();
});
