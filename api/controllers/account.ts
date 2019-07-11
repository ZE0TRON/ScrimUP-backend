import passport from "passport";
import express from "express";
const LocalStrategy = require("passport-local").Strategy;
import { User, IUserModel } from "../models/user";
import { AllowedGames, IAllowedGamesModel } from "../models/allowedGame";
import { Team } from "../models/team";
import { sendForgotPasswordMail, sendVerificationMail } from "../utils/emails";
import rateLimit from "express-rate-limit";
import { specificNotification } from "../utils/notifications";
import { createSixDigitCode, dayHours } from "./../utils/other";
import { clone } from "../utils/other";
import { IDictionary } from "./../models/modelInterfaces";
import { Game } from "../models/game";

// TODO: better logging for errors

// Time of a session where limiter applied
const accountLimiterWindowTime: number = 60 * 60 * 1000;
// Maximum number of accounts that can be created in a session time
let maxCreateAccountInWindowTime: number = 0;
// Reset limiter after 1 hour

// Session controller middleware used to determine auth before requests
export const sessionController = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user) {
    return res.send({ msg: "Login First", success: false });
  } else {
    next();
  }
};

// Given a user and a game name returns the index of this game in user model.
export const findGameIndex = (user: IUserModel, gameName: string) => {
  let wantedGameIndex = -1;

  for (let i = 0; i < user.games.length; i++) {
    if (gameName === user.games[i].name) {
      wantedGameIndex = i;
    }
  }
  return wantedGameIndex;
};

/**
 * Local Login NextFunction
 */

export const userLogin = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const FCMToken = req.body.FCMToken;
  passport.authenticate("login", function(err, user, info) {
    if (err) {
      console.log(err);
      return next(err);
    }
    if (!user) {
      return res.send(info);
    }
    req.logIn(user, function(err) {
      if (err) {
        console.log(err);
        return next(err);
      }
      if (!user.verified) {
        return res.send({ msg: "Not verified", success: false });
      }
      if (user.FCMToken != FCMToken) {
        user.FCMToken = FCMToken;
        user.save((err: any) => {
          if (err) {
            console.log(err);
            return res.send({ msg: "Error on firebase token", success: false });
          }
          return res.send({ msg: "Successful login", success: true });
        });
      } else {
        return res.send({ msg: "Successful login", success: true });
      }
    });
  })(req, res, next);
};
// Create Account rate limiter
if (process.env.PROJECT_ENV == "production") {
  maxCreateAccountInWindowTime = 2;
}
export const createAccountLimiter = new rateLimit({
  windowMs: accountLimiterWindowTime, // 1 hour window
  max: maxCreateAccountInWindowTime, // start blocking after 5 requests
  message: { message: "You have exceed request limit", status: 400 }
});

/**
 * Serialize-Deserialize User
 */
passport.serializeUser(function(user: IUserModel, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user: IUserModel) {
    done(err, user);
  });
});
// Create User  request handler
export const createUser = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const email: string = req.body.email.trim().toLowerCase();
  const password: string = req.body.password.trim();
  const FCMToken: string = req.body.FCMToken.trim();
  if (password.length <= 5) {
    return res.send({
      msg: "Password Length Should Be Greater Than 5",
      success: false
    });
  }
  // Password criteria with min length 6 and includes a digit and a number
  var letters = "[A-Za-z]";
  var numbers = "[0-9]";
  if (!password.match(letters) || !password.match(numbers)) {
    return res.send({
      msg: "Password Must Include A Digit And Letter",
      success: false
    });
  }
  User.findOne({ email: email }, (err, user) => {
    if (err) throw err;
    if (user) {
      return res.send({ msg: "User Already Exists.", success: false });
    } else {
      const newUser = new User();
      let verificationCode = createSixDigitCode().toString();
      let recoverKey = createSixDigitCode().toString();
      newUser.generateHash(password).then((hash: string) => {
        newUser.password = hash;
        newUser.email = email;
        newUser.recoverKey = recoverKey;
        newUser.FCMToken = FCMToken;
        newUser.verificationCode = verificationCode;
        newUser.save((err: any) => {
          if (err) {
            console.log(err);
          }
          sendVerificationMail(req.body.email, verificationCode);
          // Update the Bilge with new user count
          User.countDocuments({}, (err, number) => {
            specificNotification(
              "cmpbilge@gmail.com",
              `New user, current number of users : ${number}`,
              "Email register"
            );
          });
          userLogin(req, res, next);
          // res.send({ msg: "Verification Sent", success: true });
        });
      });
    }
  });
};

// Verification handle
export const verifyUser = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const verificationCode = req.body.verificationCode.trim();
  User.findOne({ email: user.email }, (err, user) => {
    if (err || !user) {
      console.log(err);
      return res.send({ msg: "No such user", success: false });
    }
    if (user.verificationCode == verificationCode) {
      user.verified = true;
      user.save((err: any) => {
        if (err) {
          console.log(err);
          return res.send({ msg: "Error saving user", success: false });
        } else {
          return res.send({ msg: "Successful", success: true });
        }
      });
    } else {
      return res.send({ msg: "Wrong Verification Code", success: false });
    }
  });
};
// Sends verification mail again
export const sendVerifyMail = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  let verificationCode = createSixDigitCode().toString();
  user.verificationCode = verificationCode;
  user.save((err: any) => {
    if (err) {
      console.log(err);
    }
    sendVerificationMail(user.email, verificationCode);
    res.send({ msg: "Verification Sent", success: true });
  });
};
// LOCAL LOGIN

/**
 * Local Login Strategy
 */
passport.use(
  "login",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    (username: string, password: string, done: CallableFunction) => {
      username = username.toLowerCase();
      User.findOne(
        {
          email: username
        },
        (err, user) => {
          if (err) return done(err);
          if (!user)
            return done(null, false, {
              msg: "No Such User",
              success: false
            });
          user
            .comparePassword(password, user.password)
            .then((isMatch: Boolean) => {
              if (!isMatch)
                return done(null, false, {
                  msg: "Wrong Password",
                  success: false
                });
              return done(null, user);
            });
        }
      );
    }
  )
);

export const logout = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  req.logout();
  // TODO: delete session from db
  return res.send({ success: true });
};

// Password change handle
export const changePassword = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // TODO: check if passwords ending with comma gets errors
  let currentPassword = req.body.currentPassword.trim();
  let newPassword = req.body.newPassword.trim();
  let user: IUserModel = req.user;

  user
    .comparePassword(currentPassword, user.password)
    .then((isMatch: Boolean) => {
      if (!isMatch) {
        return res.send({ msg: "Wrong Password", success: false });
      }
      user.generateHash(newPassword).then((hash: string) => {
        user.password = hash;
        user.save((err: any) => {
          if (err) {
            console.log(err);
            return res.send({
              msg: "Error while saving new password",
              success: false
            });
          }
          return res.send({ msg: "Success", success: true });
        });
      });
    });
};
// Sends the recovery code to the user so user can reset his/her password
export const forgotPassword = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  let email = req.body.email.trim();
  User.findOne({ email: email }, (err, user) => {
    if (err || !user) {
      console.log(err);
      return res.send({
        msg:
          "If there is a account associated with this email we will send a recover mail",
        success: true
      });
    }
    let recoverKey = createSixDigitCode().toString();
    user.recoverKey = recoverKey;
    user.save((err: any) => {
      if (err) {
        console.log(err);
        return res.send({
          msg:
            "If there is a account associated with this email we will send a recover mail",
          success: true
        });
      }
      sendForgotPasswordMail(email, recoverKey);
      return res.send({
        msg:
          "If there is a account associated with this email we will send a recover mail",
        success: true
      });
    });
  });
};
// Resets the user's passwords with the given new password
export const resetPassword = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  let email = req.body.email.trim();
  // Six digit key
  let recoverKey = req.body.recoverKey.trim();
  let newPassword = req.body.newPassword.trim();
  User.findOne({ email: email, recoverKey: recoverKey }, (err, user) => {
    if (err || !user) {
      console.log(err);
      return res.send({ msg: "Wrong Key", success: false });
    }
    user.generateHash(newPassword).then((hash: string) => {
      user.password = hash;
      user.save((err: any) => {
        if (err) {
          console.log(err);
          return res.send({
            msg: "Error while saving new password",
            success: false
          });
        }
        return res.send({ msg: "Success", success: true });
      });
    });
  });
};

// Saves the user's new FCM token
export const setFCMToken = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const FCMToken: string = req.body.FCMToken;
  user.FCMToken = FCMToken;
  user.save({}, err => {
    if (err) {
      console.log(err);
      return res.send({ msg: "Error at saving token", success: false });
    }
    return res.send({ msg: "Token saved", success: true });
  });
};

export const setHours = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Key Value pair array hours
  const gameName: string = req.body.gameName.trim();
  const teamName: string = req.body.teamName.trim();
  // hourType is 'General' by default its a parameter from legacy implementation
  // still haven't changed it.
  const hourType: string = req.body.hourType;
  // An array of hours
  // Hour format is : key value pair in dictionary
  // Format of the keys
  // <day>-t<hour>
  // Example monday-t23
  // Format of the values
  // 0 or 1 - available or not
  const hours: [IDictionary] = req.body.hours;
  const user: IUserModel = req.user; //
  if (hourType !== "general" && hourType !== "single") {
    return res.send({ msg: "Invalid Hour Type", success: false });
  }
  User.findOne(
    {
      email: user.email,
      "games.name": { $eq: gameName },
      "games.team": { $eq: teamName }
    },
    (err, user) => {
      let day;
      let hour;
      let dayHour;
      if (err) {
        console.log(err);
        return res.send({ msg: "Error while finding user", success: false });
      }
      if (!user) {
        return res.send({ msg: "You are not in this team", success: false });
      }
      const gameIndex = findGameIndex(user, gameName);
      const game = user.games[gameIndex];
      const gamePrev = clone(user.games[gameIndex]["availability"]);
      let changedDays = new Set();
      hours.forEach((date: IDictionary) => {
        dayHour = date.key.split("-");
        day = dayHour[0];
        changedDays.add(day);
        hour = dayHour[1];
        const value = date.value;
        user["games"][gameIndex]["availability"][day][hour] = value;
      });
      // Save the users local availability
      // Then update the teams availability
      user.save((err: any) => {
        if (err) {
          return res.send({
            msg: "Error while saving user",
            success: false
          });
        }
        Team.findOne(
          {
            game: gameName,
            name: teamName,
            "members.email": { $eq: user.email }
          },
          (err, team) => {
            if (err) {
              return res.send({ msg: "No such team", success: false });
            }
            if (!team) {
              return res.send({ msg: "No such team", success: false });
            }
            let prevAvailability;
            let currentAvailability;
            let days;
            team.members.forEach(member => {
              if (member.email == user.email) {
                member.active = true;
              }
            });
            days = changedDays;
            for (let day of days) {
              let isFilled = false;
              const prevNumberOfFilled =
                team["availability"][day]["filledUsers"].length;
              team["availability"][day]["filledUsers"].forEach(filledUser => {
                if (filledUser["email"] === user.email) {
                  isFilled = true;
                }
              });
              if (!isFilled) {
                team["availability"][day]["filledUsers"].push({
                  nick: game["nickName"],
                  email: user.email
                });
              }
              const currentNumberOfFilled =
                team["availability"][day]["filledUsers"].length;
              for (let j = 0; j < dayHours.length; j++) {
                let hour = dayHours[j];
                let current =
                  user["games"][gameIndex]["availability"][day][hour];
                // Type is any not number because the of the interface
                // otherwise typescript gives error but its a number
                let tA: any = team["availability"][day][hour];
                prevAvailability = tA * prevNumberOfFilled;
                if (typeof current == "number") {
                  currentAvailability =
                    prevAvailability - gamePrev[day][hour] + current;
                  team["availability"][day][hour] =
                    currentAvailability / currentNumberOfFilled;
                }
              }
            }
            // Save the new team availability
            team.save((err: any) => {
              if (err) {
                console.log(err);
                return res.send({ msg: err, success: false });
              }
              // Regenerate the best times depending on the new team availability
              team.generateBestTimes().then((isOkey: Boolean) => {
                if (!isOkey) {
                  return res.send({
                    msg: "Error generating best times",
                    success: false
                  });
                }
                return res.send({ msg: "successful", success: true });
              });
            });
          }
        );
      });
    }
  );
};
// Just a util function for debugging purposes
export const checkEmail = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log(JSON.stringify(req.headers));
  res.send({ email: req.user.email, success: true });
};

export const addGame = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const gameName = req.body.game.trim();
  const nick = req.body.nick.trim();
  const gameIndex = findGameIndex(user, gameName);
  if (gameIndex != -1) {
    return res.send({ msg: "You already have this game", success: false });
  }
  const game = new Game({
    name: gameName,
    isSolo: true,
    nickName: nick
  });
  user.games.push(game);
  user.save({}, err => {
    if (err) {
      return res.send({
        msg: "Error while saving user",
        success: false
      });
    } else {
      return res.send({
        success: true
      });
    }
  });
};

export const getGames = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.user) {
    res.send({ games: req.user.games, success: true });
  } else {
    res.send({ msg: "Login first", success: false });
  }
};
// Returns the defined games in the database
export const getAllowedGames = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const allowedGames: string[] = [];
  AllowedGames.find({}, (err, games) => {
    games.forEach((game: IAllowedGamesModel) => {
      allowedGames.push(game.name);
    });
    res.send({ games: allowedGames, success: true });
  });
};
// Checks is the session of the user valid
export const isSessionActive = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.user) {
    return res.send({ success: true, verified: req.user.verified });
  } else {
    return res.send({ success: false });
  }
};
// Returns the user's availability in the given game
// Used for showing the user which days and hours the user filled before
export const getDayAvailability = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  const game = req.body.game.trim();
  const gameIndex = findGameIndex(user, game);
  console.log(game);
  console.log(gameIndex);
  if (gameIndex != -1) {
    return res.send({
      availability: user.games[gameIndex].availability,
      prevAvailability: user.games[gameIndex].prevAvailability,
      success: true
    });
  } else {
    return res.send({ msg: "No such game", success: false });
  }
};

export const updateAvatar = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  let newAvatarCode = createSixDigitCode();
  user.avatar =
    "https://avatars.dicebear.com/v2/male/" + newAvatarCode.toString() + ".svg";
  user.save(err => {
    if (err) {
      return res.send({ msg: "Error saving avatar", success: false });
    } else {
      return res.send({ avatar: user.avatar, success: true });
    }
  });
};
export const getAvatar = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user: IUserModel = req.user;
  if (user.avatar) {
    return res.send({ avatar: user.avatar, success: true });
  } else {
    let newAvatarCode = createSixDigitCode();
    user.avatar =
      "https://avatars.dicebear.com/v2/male/" +
      newAvatarCode.toString() +
      ".svg";
    user.save(err => {
      if (err) {
        return res.send({ msg: "Error saving avatar", success: false });
      } else {
        return res.send({ avatar: user.avatar, success: true });
      }
    });
  }
};
