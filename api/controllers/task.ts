import express from "express";
import { IUserModel } from "../models/user";
import { findGameIndex } from "./account";
import { Task } from "../models/task";
import { isMember } from "./team";
import { TaskInterface } from "../models/modelInterfaces";
export const createTask = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const taskTitle = req.body.task.title.trim();
  const taskDetail = req.body.task.detail.trim();
  const taskGoal = req.body.task.goal;
  const taskAssignedNick = req.body.task.assigned.trim();
  const gameName = req.body.game.trim();
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex == -1) {
    return res.send({ msg: "Cannot find the game", success: false });
  }
  const game = user.games[gameIndex];
  const task = new Task();
  task.title = taskTitle;
  task.detail = taskDetail;
  task.goal = taskGoal;
  task.assigned = taskAssignedNick;
  // if solo add to game.tasks else add team.tasks
  if (game.isSolo) {
    game.tasks.push(task);
    user.save((err: any) => {
      if (err) {
        console.log(err);
        return res.send({
          msg: "Error at saving task",
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
      team.tasks.push(task);
      team.save((err: any) => {
        if (err) {
          console.log(err);
          return res.send({
            msg: "Error at saving task",
            success: false
          });
        } else {
          return res.send({ success: true });
        }
      });
    });
  }
};

export const getTasks = (
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
  //if solo return game.tasks else return the team tasks which has assigned to the requester.
  if (game.isSolo) {
    return res.send({ tasks: game.tasks, success: true });
  } else {
    isMember(game.team, gameName, user.email).then(team => {
      if (!team) {
        return res.send({ msg: "Cannot find the team", success: false });
      }
      const returnTaskList: TaskInterface[] = [];
      team.tasks.forEach((task, taskIndex) => {
        if (task.assigned == game.nickName) {
          returnTaskList.push(task);
        }
      });
      return res.send({ tasks: returnTaskList, success: true });
    });
  }
};
export const deleteTask = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const gameName = req.body.game.trim();
  const taskTitle = req.body.task.title.trim();
  const assigned = req.body.task.assigned.trim();
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex == -1) {
    return res.send({ msg: "Cannot find the game", success: false });
  }
  const game = user.games[gameIndex];
  let deleteIndex = -1;
  if (game.isSolo) {
    for (let i = 0; i < game.tasks.length; i++) {
      if (game.tasks[i].title == taskTitle) {
        deleteIndex = i;
      }
    }
    if (deleteIndex == -1) {
      return res.send({ msg: "Cannot find the tasks", success: false });
    } else {
      game.tasks.splice(deleteIndex, 1);
      user.save(err => {
        if (err) {
          console.log(err);
          return res.send({
            msg: "Error at saving tasks",
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
      for (let i = 0; i < team.tasks.length; i++) {
        if (
          team.tasks[i].title == taskTitle &&
          team.tasks[i].assigned == assigned
        ) {
          deleteIndex = i;
        }
      }
      if (deleteIndex == -1) {
        return res.send({ msg: "Cannot find the task", success: false });
      } else {
        team.tasks.splice(deleteIndex, 1);
        team.save(err => {
          if (err) {
            console.log(err);
            return res.send({
              msg: "Error at saving task",
              success: false
            });
          }
          return res.send({ success: true });
        });
      }
    });
  }
};

//increments the current value of given task by one
export const updateTask = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const gameName = req.body.game.trim();
  const taskTitle = req.body.task.title.trim();
  const assigned = req.body.task.assigned.trim();
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex == -1) {
    return res.send({ msg: "Cannot find the game", success: false });
  }
  const game = user.games[gameIndex];
  //if solo update the task in game.tasks, else team.tasks
  if (game.isSolo) {
    for (let i = 0; i < game.tasks.length; i++) {
      if (game.tasks[i].title == taskTitle) {
        if (game.tasks[i].goal == game.tasks[i].current) {
          return res.send({ msg: "Goal already reached", success: false });
        } else {
          game.tasks[i].current += 1;
          user.save(err => {
            if (err) {
              console.log(err);
              return res.send({
                msg: "Error at saving tasks",
                success: false
              });
            }
            return res.send({ success: true });
          });
        }
      }
    }
  } else {
    isMember(game.team, gameName, user.email).then(team => {
      if (!team) {
        return res.send({ msg: "Cannot find the team", success: false });
      }
      for (let i = 0; i < team.tasks.length; i++) {
        if (
          team.tasks[i].title == taskTitle &&
          team.tasks[i].assigned == assigned
        ) {
          if (team.tasks[i].goal == team.tasks[i].current) {
            return res.send({ msg: "Goal already reached", success: false });
          } else {
            team.tasks[i].current += 1;
            team.save(err => {
              if (err) {
                console.log(err);
                return res.send({
                  msg: "Error at saving tasks",
                  success: false
                });
              }
              return res.send({ success: true });
            });
          }
        }
      }
    });
  }
};
