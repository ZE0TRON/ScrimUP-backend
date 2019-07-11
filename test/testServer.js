"use strict";
let express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
// const schedule = require("node-schedule");
const MongoStore = require("connect-mongo")(session);
let mongoose = require("mongoose");
const bodyParser = require("body-parser");
// const clearAvailability = require("../api/utils/clearAvailability");
// const notifications = require("../api/utils/notifications");

let mongoDB = "mongodb://localhost/scrimUpTest";
const sessionSecret = "scrimUp";
dotenv.load({ path: "../.env.test" });
let app = express();
// const https = require("https");
app.enable("trust proxy");
// eslint-disable-next-line
const routes = require('../build/api/routes').router;
// eslint-disable-next-line

// Configure Session Db
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// const port = process.env.PORT || 3000;

mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  connectTimeoutMS: 30000,
  keepAlive: 1
});

let db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

let conf = {
  db: {
    db: "sessions",
    host: mongoDB
  },
  secret: sessionSecret
};
app.use(
  session({
    secret: conf.secret,
    maxAge: new Date(Date.now() + 3600000),
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: true,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/", routes);
app.use(function(req, res) {
  res.send({ msg: "NotFound", url: req.url });
});
app.use(function(req, res) {
  res.status(500).send({
    url: req.url,
    title: "No Such Thing",
    user: req.user
  });
});
// Routine Jobs //
// let availabilityRepeatingRule = new schedule.RecurrenceRule(); // TODO:Change this according to local time vs utc time
// availabilityRepeatingRule.minute = 0;
// let clearEventsRule = new schedule.RecurrenceRule();
// clearEventsRule.minute = 0;

// let clearOccupiedRule = new schedule.RecurrenceRule();
// clearOccupiedRule.minute = 0;

// /* let activityRepeatingRule = new schedule.RecurrenceRule();
// activityRepeatingRule.dayOfWeek = 1;
// activityRepeatingRule.hour = 0; // TODO:Change this according to local time vs utc time
// activityRepeatingRule.minute = 0;
//  */
// let availabilityNotificationRule = new schedule.RecurrenceRule();
// availabilityNotificationRule.hour = 9; // TODO:Change this according to local time vs utc time
// availabilityNotificationRule.minute = 20;

// // eslint-disable-next-line
// let clearAvailabilityJob = schedule.scheduleJob(
//   availabilityRepeatingRule,
//   clearAvailability.resetHour
// );

// // eslint-disable-next-line
// let clearEventsJob = schedule.scheduleJob(
//   clearEventsRule,
//   clearAvailability.clearEvents
// );

// // eslint-disable-next-line
// let clearOccupiedJob = schedule.scheduleJob(
//   clearOccupiedRule,
//   clearAvailability.clearOccupied
// );

// // eslint-disable-next-line
// // eslint-disable-next-line
// let availabilityNotificationJob = schedule.scheduleJob(
//   availabilityNotificationRule,
//   clearAvailability.notifyUnavailable
// );
// console.log("Server started on: " + port);
// process.on("unhandledRejection", function(reason, p) {
//   console.log(reason);
//   console.log(reason.stack);
//   console.log(p);
//   let message = `On promise ${p} error  at ${reason.stack} which is ${reason}`;
//   notifications.specificNotification("cmpbilge@gmail.com", message);
//   // application specific logging here
// });
//  apply to all requests

exports.db = db;
exports.app = app;
exports.connection = mongoose;
exports.session = session;
