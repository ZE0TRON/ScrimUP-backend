import express from "express";
import { IUserModel } from "../models/user";
import { Team } from "../models/team";
import { findGameIndex } from "./account";
import { Strategy } from "../models/strategy";
import { isMember } from "./team";
import { IGameModel } from "../models/game";
export const createStrategy = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const strategyTitle = req.body.strategy.title.trim();
  const strategyDetail = req.body.strategy.detail.trim();
  const gameName = req.body.game.trim();
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex == -1) {
    return res.send({ msg: "Cannot find the game", success: false });
  }
  const game = user.games[gameIndex];
  const strategy = new Strategy();
  strategy.title = strategyTitle;
  strategy.detail = strategyDetail;
  // if solo add to game.strategies else add team.strategies
  if (game.isSolo) {
    game.strategies.push(strategy);
    user.save((err: any) => {
      if (err) {
        console.log(err);
        return res.send({
          msg: "Error at saving strategy",
          success: false
        });
      } else {
        return res.send({ success: true });
      }
    });
  } else {
    isMember(game.team, gameName, user.email).then(team => {
      if (!team) {
        return res.send({ msg: "Cannot find the team", success: false });
      }
      team.strategies.push(strategy);
      team.save((err: any) => {
        if (err) {
          console.log(err);
          return res.send({
            msg: "Error at saving strategy",
            success: false
          });
        } else {
          return res.send({ success: true });
        }
      });
    });
  }
};

export const getStrategies = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const gameName = req.body.game.trim();
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex == -1) {
    return res.send({ msg: "Cannot find the game", success: false });
  }
  const game = user.games[gameIndex];
  //if game is Solo return game.strategies else return team's strategies.
  if (game.isSolo) {
    return res.send({ strategies: game.strategies, success: true });
  } else {
    isMember(game.team, gameName, user.email).then(team => {
      if (!team) {
        return res.send({ msg: "Cannot find the team", success: false });
      }
      return res.send({ strategies: team.strategies, success: true });
    });
  }
};
export const deleteStrategy = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const gameName = req.body.game.trim();
  const strategyTitle = req.body.strategy.title.trim();
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex == -1) {
    return res.send({ msg: "Cannot find the game", success: false });
  }
  const game = user.games[gameIndex];
  let deleteIndex = -1;
  if (game.isSolo) {
    for (let i = 0; i < game.strategies.length; i++) {
      if (game.strategies[i].title == strategyTitle) {
        deleteIndex = i;
      }
    }
    if (deleteIndex == -1) {
      return res.send({ msg: "Cannot find the strategy", success: false });
    } else {
      game.strategies.splice(deleteIndex, 1);
      user.save(err => {
        if (err) {
          console.log(err);
          return res.send({
            msg: "Error at saving strategy",
            success: false
          });
        }
        return res.send({ success: true });
      });
    }
  } else {
    isMember(game.team, gameName, user.email).then(team => {
      if (!team) {
        return res.send({ msg: "Cannot find the team", success: false });
      }
      for (let i = 0; i < team.strategies.length; i++) {
        if (team.strategies[i].title == strategyTitle) {
          deleteIndex = i;
        }
      }
      if (deleteIndex == -1) {
        return res.send({ msg: "Cannot find the strategy", success: false });
      } else {
        team.strategies.splice(deleteIndex, 1);
        team.save(err => {
          if (err) {
            console.log(err);
            return res.send({
              msg: "Error at saving strategy",
              success: false
            });
          }
          return res.send({ success: true });
        });
      }
    });
  }
};

//updates the strategy win/lose counts
export const updateStrategy = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const gameName = req.body.game.trim();
  const strategyTitle = req.body.strategy.title.trim();
  const isWin: boolean = req.body.isWin;
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex == -1) {
    return res.send({ msg: "Cannot find the game", success: false });
  }
  const game = user.games[gameIndex];
  let isFound = false;
  //if game is Solo update game.strategies else update team's strategies.
  if (game.isSolo) {
    for (let i = 0; i < game.strategies.length; i++) {
      if (game.strategies[i].title == strategyTitle) {
        isFound = true;
        if (isWin) {
          game.strategies[i].winCount += 1;
        } else {
          game.strategies[i].loseCount += 1;
        }
      }
    }
    if (!isFound) {
      return res.send({ msg: "Cannot find the strategy", success: false });
    } else {
      user.save(err => {
        if (err) {
          console.log(err);
          return res.send({
            msg: "Error at saving strategy",
            success: false
          });
        }
        return res.send({ success: true });
      });
    }
  } else {
    isMember(game.team, gameName, user.email).then(team => {
      if (!team) {
        return res.send({ msg: "Cannot find the team", success: false });
      }
      for (let i = 0; i < team.strategies.length; i++) {
        if (team.strategies[i].title == strategyTitle) {
          isFound = true;
          if (isWin) {
            team.strategies[i].winCount += 1;
          } else {
            team.strategies[i].loseCount += 1;
          }
        }
      }
      if (!isFound) {
        return res.send({ msg: "Cannot find the strategy", success: false });
      } else {
        team.save(err => {
          if (err) {
            console.log(err);
            return res.send({
              msg: "Error at saving strategy",
              success: false
            });
          }
          return res.send({ success: true });
        });
      }
    });
  }
};
