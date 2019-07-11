// Clean the availability of a day when its in past
import crypto from "crypto";
import express from "express";
import { Team, ITeamModel } from "../models/team";
import { User, IUserModel } from "../models/user";
import { Game, IGameModel } from "../models/game";
import { Member, IMemberModel } from "../models/member";
import { Event, IEventModel } from "../models/event";
import { Availability } from "../models/availability";
import { AllowedGames, IAllowedGamesModel } from "../models/allowedGame";
import { AllHours } from "../models/allHours";
import {
  challengeRequestAcceptedNotification,
  challengeRequestReceivedNotification,
  someoneJoinedTeamNotification
} from "../utils/notifications";
import { Challenge, IChallengeModel } from "../models/challenge";
import { bestTimeInterface } from "../models/modelInterfaces";
import { createTeamInvite } from "../utils/dynamicLinks";
// eslint-disable-next-line
export const findGameIndex = (user: IUserModel, gameName: string) => {
  let wantedGameIndex = -1;
  user.games.forEach((game, gameIndex) => {
    if (game.name === gameName) {
      wantedGameIndex = gameIndex;
    }
  });
  return wantedGameIndex;
};

const isLeader = (
  teamName: string,
  gameName: string,
  leaderEmail: string
): Promise<ITeamModel | null> => {
  return new Promise((resolve, reject) => {
    Team.findOne(
      {
        name: teamName,
        game: gameName,
        "leader.email": leaderEmail
      },
      (err, team) => {
        if (err) {
          console.log(err);
          resolve(null);
        } else if (!team) {
          resolve(null);
        } else {
          resolve(team);
        }
      }
    );
  });
};

export const isMember = (
  teamName: string,
  gameName: string,
  memberEmail: string
): Promise<ITeamModel | null> => {
  return new Promise((resolve, reject) => {
    Team.findOne(
      {
        name: teamName,
        game: gameName,
        "members.email": { $eq: memberEmail } // if works change all in team querys like that
      },
      (err, team) => {
        if (err || !team) {
          console.log(err);
          resolve(null);
        }
        resolve(team);
      }
    );
  });
};

const deleteUserGame = (
  user: IUserModel,
  gameName: string
): Promise<boolean | null> => {
  return new Promise((resolve, reject) => {
    const gameIndex = findGameIndex(user, gameName);
    if (gameIndex == -1) {
      resolve(false);
    }
    user.games.splice(gameIndex, 1);
    user.save((err: any) => {
      if (err) {
        console.log("error saving user");
        reject(false);
      }
      resolve(true);
    });
  });
};

const clone = (a: Object) => {
  return JSON.parse(JSON.stringify(a));
};
const teamReCalculateAvailability = (
  team: ITeamModel,
  user: IUserModel,
  kickedIndex: number,
  gameIndex: number
): Promise<boolean | null> => {
  return new Promise((resolve, reject) => {
    let prevAvailability;
    let currentAvailability;
    let days;
    const gamePrev = clone(user.games[gameIndex]["availability"]);
    days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    ];
    for (let day of days) {
      // console.log("Changing day " + day);
      const prevNumberOfFilled =
        team["availability"][day]["filledUsers"].length;
      let filledIndex = -1;
      for (
        let i = 0;
        i < team["availability"][day]["filledUsers"].length;
        i++
      ) {
        if (team["availability"][day]["filledUsers"][i].email == user.email) {
          filledIndex = i;
        }
      }
      if (filledIndex != -1) {
        team["availability"][day]["filledUsers"].splice(filledIndex, 1);
      }
      // TODO: why it thinks its always 1 ?
      const currentNumberOfFilled: any =
        team["availability"][day]["filledUsers"].length;
      let hours = [
        "t0",
        "t1",
        "t2",
        "t3",
        "t4",
        "t5",
        "t6",
        "t7",
        "t8",
        "t9",
        "t10",
        "t12",
        "t13",
        "t14",
        "t15",
        "t16",
        "t17",
        "t18",
        "t19",
        "t20",
        "t21",
        "t22",
        "t23"
      ];
      for (let j = 0; j < hours.length; j++) {
        let hour = hours[j];
        if (currentNumberOfFilled != 0) {
          // eslint-disable-next-line
          let current = 0;
          // eslint-disable-next-line
          // console.log("Current : "+current);
          // console.log("prev : " + gamePrev[day][hour]);
          // TODO : check this any find a solution
          let tA: any = team["availability"][day][hour];
          prevAvailability = tA * prevNumberOfFilled;
          currentAvailability =
            prevAvailability - gamePrev[day][hour] + current;
          team["availability"][day][hour] =
            currentAvailability / currentNumberOfFilled;
        } else {
          team["availability"][day][hour] = 0;
        }
      }
      //console.log("setting hours");
    }
    team.members.splice(kickedIndex, 1);
    user.games.splice(gameIndex, 1);
    user.save((err: any) => {
      if (err) {
        console.log(err);
        resolve(false);
      }
      team.generateBestTimes().then((isOkey: boolean) => {
        console.log("I am resolving");
        resolve(isOkey);
      });
    });
  });
};

export const findMemberIndexByMail = (team: ITeamModel, userMail: string) => {
  let wantedMemberIndex = -1;
  team.members.forEach((member, memberIndex) => {
    if (member.email == userMail) {
      wantedMemberIndex = memberIndex;
    }
  });
  return wantedMemberIndex;
};
export const findMemberIndexByNick = (team: ITeamModel, userNick: string) => {
  let wantedMemberIndex = -1;
  team.members.forEach((member, memberIndex) => {
    if (member.nickName === userNick) {
      wantedMemberIndex = memberIndex;
    }
  });
  return wantedMemberIndex;
};

export const getTeamMembers = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;

  const names: string[] = [];
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  isMember(teamName, gameName, user.email).then(team => {
    if (!team) {
      return res.send({ msg: "No such Team", success: false });
    }
    for (let i = 0; i < team.members.length; i++) {
      names.push(team.members[i].nickName);
    }
    const gameIndex = findGameIndex(user, gameName);
    if (gameIndex == -1) {
      return res.send({
        msg: "You dont have a team in this game.",
        success: false
      });
    }
    return res.send({
      leader: team.leader.nickName,
      members: names,
      success: true,
      you: user.games[gameIndex].nickName
    });
  });
};

export const findChallengeTeams = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // TODO: add not to challenge same team in same time
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  const v1 = parseInt(req.body.v1, 10); // Number of players of first team
  const v2 = parseInt(req.body.v2, 10); // Number of players of second team

  // console.log(user.email);
  isLeader(teamName, gameName, user.email).then(team => {
    if (!team) {
      // console.log(err);
      // // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    const t1BestTimes: string[] = [];
    let maxPlayer = 0;
    team.bestTimes.forEach(time => {
      if (time.numberOfPlayers > maxPlayer) {
        maxPlayer = time.numberOfPlayers;
      }
      if (time.numberOfPlayers >= v1) {
        t1BestTimes.push(time.time);
      }
    });
    if (v1 > maxPlayer) {
      return res.send({
        msg: "Sorry no teams with your schedule",
        success: false
      });
    }
    // console.log(t1BestTimes);
    Team.aggregate(
      [
        {
          $match: {
            name: { $ne: teamName },
            game: gameName,
            "bestTimes.time": { $in: t1BestTimes }
          }
        },
        {
          $match: {
            "bestTimes.numberOfPlayers": { $gte: v2 }
          }
        }
      ],

      (err: any, teams: ITeamModel[]) => {
        // teams = teams.slice(0, teams.length > 10 ? 10 : teams.length-1);
        //                 numberOfPlayers: { $gte: v2 }
        if (err || teams.length == 0) {
          // console.log(err);
          return res.send({
            msg: "Sorry no teams with your schedule",
            success: false
          });
        }
        let i = 0;
        // TODO: create an interfaces for the challengeList and change any to it.
        const challengeList: any = [];
        let counter = 0;
        while (i < 5) {
          const vTeam = teams[counter];
          vTeam.bestTimes.forEach((bestTime: bestTimeInterface) => {
            // console.log(bestTime);
            if (
              bestTime.time == t1BestTimes[0] ||
              bestTime.time == t1BestTimes[1] ||
              bestTime.time == t1BestTimes[2]
            ) {
              // console.log("I am here ? ");
              if (
                bestTime.numberOfPlayers >= v2 &&
                !team.occupied.includes(bestTime.time) &&
                !vTeam.occupied.includes(bestTime.time)
              ) {
                challengeList.push({
                  time: bestTime.time,
                  numberOfPlayers: bestTime.numberOfPlayers,
                  teamName: vTeam.name
                });
                i += 1;
              }
            }
          });
          if (counter < teams.length - 1) {
            counter += 1;
          } else {
            i = 5;
          }
          return res.send({ teams: challengeList, success: true });
        }
        res.send({ teams: challengeList, success: true });
      }
    );
  });
};

export const challengeOtherTeams = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  // let v1 = parseInt(req.body.v1, 10); // Number of players of first team
  const v2 = parseInt(req.body.v2, 10); // Number of players of second team
  const time = req.body.time.trim();
  const otherTeam = req.body.otherTeam.trim();
  const exactTime = req.body.exactTime.trim();
  const challengeNote = req.body.note.trim();
  console.log("I am challenging");
  isLeader(teamName, gameName, user.email).then(team => {
    if (!team) {
      // // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    Team.findOne(
      {
        name: otherTeam,
        game: gameName
      },
      (err, team2) => {
        if (err || !team2) {
          return res.send({ msg: "Error at finding the t2", success: false });
        }
        // TODO: add occupied check
        const challenge = new Challenge({
          hostTeam: team.name,
          otherTeam: team2.name,
          time: time,
          numberOfPlayers: v2,
          exactTime: exactTime,
          note: challengeNote
        });

        team2.pendingChallenges.push(challenge);
        team.occupied.push(time);
        team2.save((err: any) => {
          if (err) {
            return res.send({ msg: "Error at saveing t2", success: false });
          } else {
            team.save((err: any) => {
              if (err) {
                return res.send({
                  msg: "Error at saveing t1",
                  success: false
                });
              } else {
                challengeRequestReceivedNotification(
                  team2.leader.email,
                  team2.name,
                  team.name
                );
                return res.send({ success: true });
              }
            });
          }
        });
      }
    );
  });
};

export const getPendingChallenges = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim(); // Number of players of second team

  isLeader(teamName, gameName, user.email).then(team => {
    if (!team) {
      // // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    return res.send({ challenges: team.pendingChallenges, success: true });
  });
};

export const acceptChallenge = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  // let v1 = parseInt(req.body.v1, 10); // Number of players of first team
  const v2 = parseInt(req.body.v2, 10); // Number of players of second team
  const time = req.body.time.trim();
  const otherTeam = req.body.otherTeam.trim();
  const acceptReject = req.body.accept.trim();

  console.log(user.email);
  isLeader(teamName, gameName, user.email).then(team => {
    if (!team) {
      // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    let challengeIndex = -1;
    team.pendingChallenges.forEach((challenge, index) => {
      if (
        challenge.hostTeam === otherTeam &&
        challenge.time == time &&
        challenge.numberOfPlayers == v2
      ) {
        challengeIndex = index;
      }
    });
    console.log(challengeIndex);
    const challenge = team.pendingChallenges[challengeIndex];
    team.pendingChallenges.splice(challengeIndex, 1);
    if (acceptReject == "Accept") {
      team.challenges.push(challenge);
      team.occupied.push(time); // TODO: check this
      // TODO: Send notification here
      Team.findOne(
        {
          name: challenge.hostTeam,
          game: gameName
        },
        (err, team2: ITeamModel | null) => {
          if (err || !team2) {
            console.log(err);
            return res.send({ msg: "Error at saving t1", success: false });
          }
          team2.challenges.push(challenge);
          team2.occupied.push(time);
          team.save((err: any) => {
            if (err) {
              console.log(err);
            }
            team2.save((err: any) => {
              if (err) {
                console.log(err);
                return res.send({
                  msg: "Error at saving t2",
                  success: false
                });
              } else {
                challengeRequestAcceptedNotification(
                  team2.leader.email,
                  team2.name,
                  team.name
                );
                return res.send({ success: true });
              }
            });
          });
        }
      );
    } else {
      Team.findOne(
        {
          name: challenge.hostTeam,
          game: gameName
        },
        (err, team2: ITeamModel | null) => {
          if (err || !team2) {
            console.log(err);
            return res.send({ msg: "No such challenges", success: false });
          }
          let occupyIndex = -1;
          team2.occupied.forEach((occupy, index) => {
            if (occupy === time) {
              occupyIndex = index;
            }
          });
          team2.occupied.splice(occupyIndex, 1);
          team.save((err: any) => {
            if (err) {
              console.log(err);
              return res.send({ msg: "Error at saving t1", success: false });
            }
            team2.save((err: any) => {
              if (err) {
                console.log(err);
                return res.send({
                  msg: "Error at saving t2",
                  success: false
                });
              } else {
                return res.send({ success: true });
              }
            });
          });
        }
      );
    }
  });
};

export const getChallenges = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;

  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  isMember(teamName, gameName, user.email).then(team => {
    if (!team) {
      return res.send({ msg: "No such Team", success: false });
    }
    return res.send({ challenges: team.challenges, success: true });
  });
};

export const getBestTimes = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  isMember(teamName, gameName, user.email).then(team => {
    if (!team) {
      return res.send({ msg: "No such Team", success: false });
    }
    return res.send({
      bests: team.bestTimes,
      success: true
    });
  });
};

export const getToken = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = (req.body.teamName || req.body.team).trim();
  const gameName = (req.body.gameName || req.body.game).trim();

  isLeader(teamName, gameName, user.email).then(team => {
    if (!team) {
      return res.send({ msg: "Error at finding team", success: false });
    }
    res.send({ token: team.token, success: true });
  });
};

export const getInviteLink = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();

  isLeader(teamName, gameName, user.email).then(team => {
    if (!team) {
      return res.send({ msg: "Error at finding team", success: false });
    }
    createTeamInvite(teamName, team.token).then((link: string) => {
      res.send({ link: link, success: true });
    });
  });
};

export const enterWithToken = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const token = req.body.token.trim();
  const nickName = req.body.nickName.trim();

  if (nickName.length < 1) {
    return res.send({ msg: "Nickname cant be empty", success: false });
  }
  Team.findOne(
    {
      token: token
    },
    (err, team) => {
      if (err || !team) {
        console.log(err);
        return res.send({ msg: "Invalid Token", success: false });
      }
      const gameIndex = findGameIndex(user, team.game);
      if (gameIndex != -1) {
        return res.send({
          msg: "You have a team in this game",
          success: false
        });
      }
      for (let i = 0; i < team.members.length; i++) {
        if (team.members[i].nickName == nickName) {
          return res.send({
            msg: "Nickname already exists in the team",
            success: false
          });
        }
      }
      const newGame = new Game();
      newGame.nickName = nickName;
      newGame.team = team.name;
      newGame.name = team.game;
      newGame.availability = new Availability({
        monday: new AllHours(),
        tuesday: new AllHours(),
        wednesday: new AllHours(),
        thursday: new AllHours(),
        friday: new AllHours(),
        saturday: new AllHours(),
        sunday: new AllHours()
      });
      newGame.prevAvailability = new Availability({
        monday: new AllHours(),
        tuesday: new AllHours(),
        wednesday: new AllHours(),
        thursday: new AllHours(),
        friday: new AllHours(),
        saturday: new AllHours(),
        sunday: new AllHours()
      });
      user.games.push(newGame);
      let newMember = new Member();
      newMember.nickName = nickName;
      newMember.email = user.email;
      team.members.push(newMember);
      team.save((err: any) => {
        if (err) {
          return res.send({
            msg: "Error while saving the team",
            success: false
          });
        }
        user.save((err: any) => {
          if (err) {
            return res.send({
              msg: "Error while saving the game",
              success: false
            });
          }
          someoneJoinedTeamNotification(team.leader.email, team.name, nickName);
          return res.send({
            msg: "Successful accept",
            team: team.name,
            game: team.game,
            success: true
          });
        });
      });
    }
  );
};

export const regenerateInviteLink = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();

  //console.log(user.email);
  isLeader(teamName, gameName, user.email).then(team => {
    if (!team) {
      // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    crypto.randomBytes(48, function(err, buffer) {
      if (err) {
        return res.send({
          msg: "error while creating team token",
          success: false
        });
      }
      const token = buffer.toString("hex");
      team.token = token;
      team.save((err: any) => {
        if (err) {
          return res.send({
            msg: "error while saving team token",
            success: false
          });
        }
        createTeamInvite(teamName, team.token).then((link: string) => {
          res.send({ link: link, success: true });
        });
      });
    });
  });
};

export const regenerateTeamToken = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();

  //console.log(user.email);
  isLeader(teamName, gameName, user.email).then(team => {
    if (!team) {
      // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    crypto.randomBytes(48, function(err, buffer) {
      if (err) {
        return res.send({
          msg: "error while creating team token",
          success: false
        });
      }
      const token = buffer.toString("hex");
      team.token = token;
      team.save((err: any) => {
        if (err) {
          return res.send({
            msg: "error while saving team token",
            success: false
          });
        }
        res.send({ token: token, success: true });
      });
    });
  });
};

export const createTeam = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;

  const teamName = req.body.teamName.trim();
  const nickName = req.body.nickName.trim();
  if (!teamName) {
    return res.send({ msg: "Team Name cannot be empty", success: false });
  }
  if (!nickName) {
    return res.send({ msg: "Nick Name cannot be empty", success: false });
  }
  const gameName = req.body.gameName.trim();
  const locale = req.body.locale;
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex != -1) {
    return res.send({ msg: "You have a team in this game", success: false });
  }
  AllowedGames.findOne({ name: gameName }, (err, game) => {
    if (err || !game) {
      return res.send({ msg: "not in the list", success: false });
    }
    Team.findOne({ name: teamName, game: gameName }, (err, team) => {
      if (err || !team) {
        let leader = user;
        crypto.randomBytes(48, function(err, buffer) {
          const token = buffer.toString("hex");
          let newTeam = new Team();
          let newMember = new Member();
          newMember.nickName = nickName;
          newMember.email = leader.email;
          newTeam.leader = newMember;
          newTeam.game = gameName;
          newTeam.name = teamName;
          newTeam.token = token;
          newTeam.members.push(newMember);
          newTeam.availability = new Availability({
            monday: new AllHours(),
            tuesday: new AllHours(),
            wednesday: new AllHours(),
            thursday: new AllHours(),
            friday: new AllHours(),
            saturday: new AllHours(),
            sunday: new AllHours()
          });
          newTeam.save((err: any) => {
            if (err) {
              console.log(err);
              return res.send({
                msg: "error while saving team",
                success: false
              });
            }
            let newGame = new Game();
            newGame.name = gameName;
            newGame.team = teamName;
            newGame.nickName = nickName;
            newGame.locale = locale;
            newGame.availability = new Availability({
              monday: new AllHours(),
              tuesday: new AllHours(),
              wednesday: new AllHours(),
              thursday: new AllHours(),
              friday: new AllHours(),
              saturday: new AllHours(),
              sunday: new AllHours()
            });
            newGame.prevAvailability = new Availability({
              monday: new AllHours(),
              tuesday: new AllHours(),
              wednesday: new AllHours(),
              thursday: new AllHours(),
              friday: new AllHours(),
              saturday: new AllHours(),
              sunday: new AllHours()
            });
            leader.games.push(newGame);
            leader.save((err: any) => {
              if (err) {
                console.log(err);
                return res.send({
                  msg: "error while saving leader",
                  success: false
                });
              }
              return res.send({
                msg: "Successful creating team",
                success: true
              });
            });
          });
        });
      } else {
        return res.send({ msg: "This team already exist", success: false });
      }
    });
  });
};

export const deleteTeam = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  const userMail = req.user.email;
  isLeader(teamName, gameName, userMail).then(team => {
    if (!team) {
      // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    team.members.forEach(async member => {
      await new Promise((resolve, reject) => {
        User.findOne(
          {
            email: member.email
          },
          async (err, user) => {
            if (err || !user) {
              console.log(err, "No such user");
              return res.send({ msg: "No such user", success: false });
              // TODO: does it cause unhandled rejection
            }
            await deleteUserGame(user, gameName);
            resolve(true);
          }
        );
      });
    });
    Team.deleteOne(
      {
        name: teamName,
        game: gameName,
        "leader.email": userMail
      },
      err => {
        if (err) {
          console.log(err, "Error deleting team");
          return res.send({ msg: "Error deleting team", success: false });
        }
        return res.send({ msg: "Success", success: true });
      }
    );
  });
};
export const leaveTeam = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex == -1) {
    console.log("You dont have  a team");
    return res.send({
      msg: "You dont have  a team in this game",
      success: false
    });
  }
  if (user.games[gameIndex].team === teamName) {
    //console.log("Team is right");
    Team.findOne({ name: teamName, game: gameName }, (err, team) => {
      if (err || !team) {
        console.log("No such team");
        return res.send({ msg: "No Such Team", success: false });
      }
      const memberIndex = findMemberIndexByMail(team, user.email);
      if (memberIndex == -1) {
        console.log("You are not in this team");
        return res.send({ msg: "You are not in this team", success: false });
      }
      team.members.splice(memberIndex, 1);
      if (team.leader.email === user.email) {
        //console.log("User email is ", user.email);
        const newLeaderNick = req.body.leaderNick;
        const leaderIndex = findMemberIndexByNick(team, newLeaderNick);
        if (leaderIndex == -1) {
          // console.log("No such member in team");
          return res.send({
            msg: "Member is not in this team",
            success: false
          });
        }
        team.leader = new Member();
        team.leader.email = team.members[leaderIndex].email;
        team.leader.nickName = team.members[leaderIndex].nickName;
      }
      const numberOfUsers = team.members.length;
      //console.log("Number of users is : " + numberOfUsers);
      [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      ].forEach(day => {
        //console.log(" Number of Filled users");
        //console.log(team["availability"][day]["filledUsers"].length);
        const prevNumberOfFilled =
          team["availability"][day]["filledUsers"].length;
        let filledUserIndex = -1;
        team["availability"][day]["filledUsers"].forEach(
          (filledUser, index) => {
            if (filledUser.email === user.email) {
              filledUserIndex = index;
            }
          }
        );
        if (filledUserIndex != -1) {
          team["availability"][day]["filledUsers"].splice(filledUserIndex, 1);
        }
        const currentNumberOfFilled: any =
          team["availability"][day]["filledUsers"].length;
        [
          "t0",
          "t1",
          "t2",
          "t3",
          "t4",
          "t5",
          "t6",
          "t7",
          "t8",
          "t9",
          "t10",
          "t12",
          "t13",
          "t14",
          "t15",
          "t16",
          "t17",
          "t18",
          "t19",
          "t20",
          "t21",
          "t22",
          "t23"
        ].forEach(hour => {
          const current = 0;
          // console.log("Current : "+current);
          // console.log("prev : " + gamePrev[day][hour]);
          // TODO: same of the problem in aboce
          let tA: any = team["availability"][day][hour];
          let uA: any = user.games[gameIndex].availability[day][hour];
          let prevAvailability = tA * prevNumberOfFilled;
          let currentAvailability = prevAvailability - uA + current;
          team["availability"][day][hour] =
            // eslint-disable-next-line
            currentNumberOfFilled != 0
              ? currentAvailability / currentNumberOfFilled
              : 0;
        });
        //console.log("setting hours");
      });
      user.games.splice(gameIndex, 1);
      user.save((err: any) => {
        //console.log("members : ");
        //console.log(team.members);
        team.generateBestTimes().then((isOkey: boolean) => {
          if (!isOkey) {
            return res.send({
              msg: "Error generating best times",
              success: false
            });
          }
          team.save((err: any) => {
            if (err) {
              console.log(err);
              return res.send({ msg: err, success: false });
            }
            return res.send({ msg: "successful", success: true });
          });
        });
      });
    });
  } else {
    console.log("You are not in this team");
    return res.send({ msg: "You are not in this team", success: false });
  }
};

export const isUserLeader = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();

  isLeader(teamName, gameName, user.email).then(team => {
    if (!team) {
      // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    return res.send({ success: true });
  });
};
export const isAvailableAt = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  const day = req.body.day.trim();
  const hour = req.body.hour.trim();

  Team.findOne(
    {
      name: teamName,
      game: gameName
    },
    (err, team) => {
      if (err) {
        console.log(err);
        return res.send({ msg: "No such team", success: false });
      } else if (!team) {
        return res.send({ msg: "No such team", success: false });
      } else {
        return res.send({
          result: team.isAvailableAt(day, hour),
          success: true
        });
      }
    }
  );
};

const updateTeamName = (
  userEmail: string,
  game: string,
  newTeamName: string
) => {
  return new Promise((resolve, reject) => {
    User.findOne({ email: userEmail }, (err, user: IUserModel | null) => {
      if (err) {
        console.log(err);
        resolve(false);
      } else if (!user) {
        console.log("User not found");
        resolve(false);
      } else {
        const gameIndex = findGameIndex(user, game);
        user.games[gameIndex].team = newTeamName;
        user.save((err: any) => {
          if (err) {
            console.log(err);
            resolve(false);
          }
          resolve(true);
        });
      }
    });
  });
};

export const changeTeamName = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.team;
  const game = req.body.game;
  const newTeamName = req.body.newTeamName;
  // TODO: change this to isLeader
  Team.findOne(
    {
      name: teamName,
      game: game,
      "leader.email": user.email
    },
    async (err, team) => {
      if (err || !team) {
        console.log(err);
        // console.log("No such team or you are not the leader");
        return res.send({ msg: "Error at finding team", success: false });
      }
      team.name = newTeamName;
      for (let i = 0; i < team.members.length; i++) {
        let currentMember = team.members[i];
        const success = await updateTeamName(
          currentMember.email,
          game,
          newTeamName
        );
        if (!success) {
          return res.send({ msg: "Error at saving user", success: false });
        }
      }
      team.save((err: any) => {
        if (err) {
          console.log(err);
          return res.send({ msg: "Error at saving team", success: false });
        } else {
          user.save((err: any) => {
            if (err) {
              console.log(err);
              return res.send({ msg: "Error at saving user", success: false });
            }
            return res.send({ msg: "Team Name Changed", success: true });
          });
        }
      });
    }
  );
};

export const createEvent = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.team.trim();
  const game = req.body.game.trim();
  // After a force update no need for eventName parameters
  // Its like a migration form
  const eventName = (req.body.name || req.body.eventName).trim();
  const eventTime = (req.body.time || req.body.eventTime).trim();
  const eventExactTime = (req.body.exactTime || req.body.eventExactTime).trim();
  const eventNote = (req.body.note || req.body.eventNote).trim();

  // const players = req.body.players;
  isMember(teamName, game, user.email).then(team => {
    if (!team) {
      // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    const event = new Event();
    event.name = eventName;
    event.time = eventTime;
    event.exactTime = eventExactTime;
    event.note = eventNote;
    event.numberOfPlayers = 1;
    let member = new Member();
    member.email = user.email;
    member.nickName = user.games[findGameIndex(user, game)].nickName;
    event.players.push(member);
    team.events.push(event);
    team.occupied.push(eventTime);
    team.generateBestTimes().then(success => {
      if (success) {
        return res.send({ msg: "Event Created", success: true });
      } else {
        return res.send({
          msg: "Error at generating availability",
          success: false
        });
      }
    });
  });
};
export const getEvents = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;

  const teamName = req.body.teamName.trim();
  const gameName = req.body.gameName.trim();
  const nickName = user.games[findGameIndex(user, gameName)].nickName;
  isMember(teamName, gameName, user.email).then(team => {
    if (!team) {
      return res.send({ msg: "No such Team", success: false });
    }
    return res.send({
      nickName: nickName,
      events: team.events,
      success: true
    });
  });
};

export const joinEvent = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // TODO: make this function better :)

  const user: IUserModel = req.user;
  const game = req.body.game.trim();
  const teamName = req.body.team.trim();
  const eventName = (req.body.eventName || req.body.name).trim();
  const eventTime = (req.body.time || req.body.eventTime).trim();
  const nickName = user.games[findGameIndex(user, game)].nickName;
  let flag = false;
  let processing = false;
  isMember(teamName, game, user.email).then(team => {
    if (!team) {
      return res.send({ msg: "No such Team", success: false });
    }
    for (let i = 0; i < team.events.length; i++) {
      if (
        team.events[i].time == eventTime &&
        team.events[i].name == eventName
      ) {
        flag = true;
        for (let j = 0; j < team.events[i].players.length; j++) {
          if (team.events[i].players[j].nickName == nickName) {
            flag = false;
          }
        }
        if (flag) {
          processing = true;
          let member = new Member();
          member.email = user.email;
          member.nickName = nickName;
          team.events[i].players.push(member);
          team.events[i].numberOfPlayers += 1;
          team.save((err: any) => {
            if (err) {
              console.log(err);
              return res.send({
                msg: "Error at saving team",
                success: false
              });
            }
            return res.send({
              msg: "You have joined the event",
              success: true
            });
          });
        } else {
          return res.send({
            msg: "You are already in this event",
            success: false
          });
        }
      }
    }
    if (!processing) {
      return res.send({
        msg: "No such  event",
        success: false
      });
    }
  });
};
export const leaveEvent = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const game = req.body.game.trim();
  const teamName = req.body.team.trim();
  const eventName = req.body.eventName.trim();
  //console.log("Leaving event");
  isMember(teamName, game, user.email).then(team => {
    if (!team) {
      return res.send({ msg: "No such Team", success: false });
    }
    let memberIndex = -1;
    let eventIndex = -1;
    for (let i = 0; i < team.events.length; i++) {
      if (team.events[i].name == eventName) {
        eventIndex = i;
        for (let j = 0; j < team.events[i].players.length; j++) {
          if (team.events[i].players[j].email == user.email) {
            memberIndex = j;
          }
        }
        if (team.events[eventIndex].players.length == 1) {
          team.events.splice(eventIndex, 1);
        } else {
          team.events[eventIndex].players.splice(memberIndex, 1);
        }
        if (memberIndex == -1 || eventIndex == -1) {
          return res.send({ msg: "You are not in this event", success: false });
        } else {
          team.save((err: any) => {
            if (err) {
              console.log(err);
              return res.send({ msg: "Error at saving team", success: false });
            }
            // console.log("Leaving event");
            return res.send({ msg: "You have left the event", success: true });
          });
        }
      }
    }
  });
};

export const deleteEvent = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.team.trim();
  const game = req.body.game.trim();
  const eventName = (req.body.name || req.body.eventName).trim();
  // const players = req.body.players;
  Team.findOne(
    {
      name: teamName,
      game: game,
      "leader.email": user.email
    },
    (err, team) => {
      if (err || !team) {
        console.log(err);
        // console.log("No such team or you are not the leader");
        return res.send({ msg: "Error at finding team", success: false });
      }
      let eventIndex = -1;
      for (let i = 0; i < team.events.length; i++) {
        if (team.events[i].name == eventName) {
          eventIndex = i;
        }
      }
      if (eventIndex == -1) {
        return res.send({ msg: "You are not in this event", success: false });
      }
      team.events.splice(eventIndex, 1);
      team.save((err: any) => {
        if (err) {
          return res.send({ msg: "Error at saving team", success: false });
        }
        console.log("Leaving event");
        return res.send({ msg: "You have left the event", success: true });
      });
    }
  );
};

export const kickFromTeam = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const teamName = req.body.team.trim();
  const game = req.body.game.trim();
  const kickedUserNick = req.body.kickedUser.trim();
  // const players = req.body.players;
  isLeader(teamName, game, user.email).then(team => {
    if (!team) {
      // console.log("No such team or you are not the leader");
      return res.send({ msg: "Error at finding team", success: false });
    }
    let kickedIndex = -1;
    for (let i = 0; i < team.members.length; i++) {
      if (team.members[i].nickName == kickedUserNick) {
        kickedIndex = i;
      }
    }
    if (kickedIndex == -1) {
      return res.send({ msg: "No such player in team", success: false });
    }
    let kickedEmail = team.members[kickedIndex].email;
    console.log(kickedEmail);
    console.log(kickedIndex);
    User.findOne({ email: kickedEmail }, (err, kickedUser) => {
      if (err) {
        console.log(err);
        return res.send({ msg: "No such player in team", success: false });
      } else if (!kickedUser) {
        return res.send({ msg: "No such player in team", success: false });
      }
      console.log(kickedUser);
      let gameIndex = findGameIndex(kickedUser, game);
      teamReCalculateAvailability(
        team,
        kickedUser,
        kickedIndex,
        gameIndex
      ).then(success => {
        if (!success) {
          return res.send({
            msg: "Error at saving user",
            success: false
          });
        }
        return res.send({
          msg: "Player kicked from the team",
          success: true
        });
      });
    });
  });
};
