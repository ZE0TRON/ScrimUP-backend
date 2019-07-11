let DiscordStrategy = require("passport-discord").Strategy;
import * as accountController from "./account";
import { User } from "../models/user";
import { specificNotification } from "../utils/notifications";
import passport from "passport";
import express from "express";
import { createSixDigitCode } from "../utils/other";
import request from "request";
let clientID = process.env.DISCORD_CLIENT_ID;
let clientSecret = process.env.DISCORD_CLIENT_SECRET;
// console.log(clientID);
// console.log(clientSecret);
// We send his/her discord token to him/her and make it resend us to login with it.
// It's not the best practice but its the best i have think about so far.
// Finds the user with the access token and uses classical req.logIn to login
export const loginWithAccessToken = (
  req: express.Request,
  res: express.Response,
  next: express.Handler
) => {
  let accessToken = req.body.accessToken;
  let FCMToken = req.body.FCMToken;
  console.log(accessToken);
  User.findOne({ discordAccessToken: accessToken }, (err, user) => {
    if (!user || err) {
      console.log(err);
      return res.send({ msg: "No such user", success: false });
    }
    user.FCMToken = FCMToken;
    user.save(err => {
      if (err) {
        console.log(err);
        return res.send({ msg: err, success: false });
      }
      req.logIn(user, err => {
        if (err) {
          console.log(err);
          return res.send({ msg: err, success: false });
        }
        return res.send({ msg: "Successful login", success: true });
      });
    });
  });
};

// Discord redirect handler
export const discordCallback = (
  req: express.Request,
  res: express.Response,
  next: express.Handler
) => {
  console.log("I am here twice");
  // Goes to the passport discord strategy
  passport.authenticate(
    "discord",
    {
      failureRedirect: "/"
    },
    (err, user, info) => {
      //console.log(err);
      console.log(user);
      //console.log(info);
      if (err) {
        console.log(err);
        return res.send({ msg: err, success: false });
      } else if (!user) {
        return res.send({ msg: "No user", success: false });
      } else if (info == "register") {
        // If info equals register means first time authorizing our app in discord.
        // We send the access token to the user in a html so we can capture it from webview
        return res.send(
          "<html> <body> <h1 id='accessToken'>" +
            user.discordAccessToken +
            "<h1> </body></html>"
        );
      } else {
        // Already authorized before so we just login
        req.logIn(user, (err: any) => {
          if (err) {
            console.log(err);
            return res.send({ msg: err, success: false });
          } else {
            return res.send(
              `<html> <body style='background-color: white;'> <h1 id='accessToken' style='opacity: 0;'>` +
                user.discordAccessToken +
                `</h1> <h2>Success</h2> </body></html>`
            );
          }
        });
      }
    }
  )(req, res, next);
};

passport.use(
  new DiscordStrategy(
    {
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL: callbackURL,
      scope: scopes,
      proxy: true
    },
    //TODO: create discord profile interface and change any to that interface
    (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: CallableFunction
    ) => {
      // The profile has fields which has the information we take about the person from discord
      // It depends on the scopes.
      console.log(profile);
      console.log("Access Token : " + accessToken);
      console.log("Refresh Token : " + refreshToken);
      User.findOne({ email: profile.email }, (err, user) => {
        if (err || !user) {
          // Create a random password for the user.
          let code1 = createSixDigitCode();
          let code2 = createSixDigitCode();
          let nonHashedPassword = (code1 * code2).toString();
          const newUser = new User();
          newUser.generateHash(nonHashedPassword).then((hash: string) => {
            newUser.password = hash;
            newUser.email = profile.email;
            newUser.verified = true;
            newUser.discordAccessToken = accessToken;
            newUser.discordRefreshToken = refreshToken;
            newUser.avatar =
              "https://cdn.discordapp.com/avatars/" +
              profile.id +
              "/" +
              profile.avatar +
              ".png";
            newUser.save(err => {
              if (err) {
                console.log("done here");
                console.log(err);
                return done(err, null);
              } else {
                // Notify bilge with new user count
                User.countDocuments({}, (err, number) => {
                  specificNotification(
                    "cmpbilge@gmail.com",
                    `New user, current number of users : ${number}`,
                    "Discord register"
                  );
                });
                console.log(" I am done");
                // First time so register the user.
                return done(null, newUser, "register");
              }
            });
          });
        } else {
          user.discordAccessToken = accessToken;
          user.discordRefreshToken = refreshToken;
          user.avatar =
            "https://cdn.discordapp.com/avatars/" +
            profile.id +
            "/" +
            profile.avatar +
            ".png";
          user.save(err => {
            if (err) {
              console.log(err);
              console.log("Done there");
              return done(err, null);
            } else {
              console.log("Should login");
              // Authorized before just needs to login
              return done(null, user, "login");
              // TODO: Check discord token if null set  and  login
            }
          });
        }
      });
      // });
    }
  )
);
export const googleLogin = (
  req: express.Request,
  res: express.Response,
  next: express.Handler
) => {
  const accessToken = req.body.accessToken;
  const FCMToken = req.body.FCMToken;

  request.post(
    "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" +
      accessToken,
    { json: {} },
    function(error, response, body) {
      if (!error && response.statusCode == 200) {
        if (body.verified_email) {
          User.findOne({ email: body.email }, (err, user) => {
            if (user) {
              if (!user.googleID) {
                user.googleID = body.user_id;
                user.googleToken = accessToken;
                user.FCMToken = FCMToken;
                user.save(err => {
                  if (err) {
                    console.log(err);
                    return res.send({ msg: err, success: false });
                  } else {
                    req.logIn(user, (err: any) => {
                      if (err) {
                        console.log(err);
                        return res.send({ msg: err, success: false });
                      } else {
                        return res.send({ success: true });
                      }
                    });
                  }
                });
              } else {
                user.FCMToken = FCMToken;
                user.save(err => {
                  if (err) {
                    console.log(err);
                    return res.send({ msg: err, success: false });
                  } else {
                    req.logIn(user, (err: any) => {
                      if (err) {
                        console.log(err);
                        return res.send({ msg: err, success: false });
                      } else {
                        return res.send({ success: true });
                      }
                    });
                  }
                });
              }
            } else if (err) {
              console.log(err);
              return res.send({ msg: err, success: false });
            } else {
              let code1 = createSixDigitCode();
              let code2 = createSixDigitCode();
              let nonHashedPassword = (code1 * code2).toString();
              const newUser = new User();
              newUser.generateHash(nonHashedPassword).then((hash: string) => {
                newUser.password = hash;
                newUser.email = body.email;
                newUser.verified = true;
                newUser.googleToken = accessToken;
                newUser.googleID = body.user_id;
                newUser.FCMToken = FCMToken;
                newUser.save(err => {
                  if (err) {
                    console.log(err);
                    return res.send({ msg: err, success: false });
                  } else {
                    // Notify bilge with new user count
                    User.countDocuments({}, (err, number) => {
                      specificNotification(
                        "cmpbilge@gmail.com",
                        `New user, current number of users : ${number}`,
                        "Google register"
                      );
                    });
                    // First time so register the user.
                    req.logIn(newUser, (err: any) => {
                      if (err) {
                        console.log(err);
                        return res.send({ msg: err, success: false });
                      } else {
                        return res.send({ success: true });
                      }
                    });
                  }
                });
              });
            }
          });
        }
      } else {
        console.log(error);
      }
    }
  );
};
