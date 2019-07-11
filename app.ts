"use strict";
import express = require("express");
import dotenv from "dotenv";
import http from "http";
import https from "https";
import session from "express-session";
import passport from "passport";
import fs from "fs";
import schedule from "node-schedule";
const MongoStore = require("connect-mongo")(session);
import slowDown from "express-slow-down";
let mongoose = require("mongoose");
import rateLimit from "express-rate-limit";
import * as clearAvailability from "./api/utils/clearAvailability";
import { specificNotification } from "./api/utils/notifications";
import { router } from "./api/routes";
import bodyParser from "body-parser";

console.log(process.env.PROJECT_ENV);
// Load dot env files according to PROJECT_ENV variable(env variable)
const isTest = process.env.PROJECT_ENV != "DEVELOPMENT";
if (!isTest) {
  dotenv.load({ path: ".env.dev" });
  // eslint-disable-next-line
} else if (process.env.PROJECT_ENV == "TEST") {
  dotenv.load({ path: ".env.test" });
} else if (process.env.NODE_ENV == "production") {
  dotenv.load({ path: ".env.live" });
}
let app: express.Application = express();
// Because we are behind a proxy in the cloud
app.enable("trust proxy");
// Read https files
const key = fs.readFileSync("configs/https/server.key");
const cert = fs.readFileSync("configs/https/server.crt");
const ca = fs.readFileSync("configs/https/server.pem");
const httpsOptions = {
  key: key,
  cert: cert,
  ca: ca
};
// Create https server
let httpsServer = https.createServer(httpsOptions, app);
httpsServer.listen(443);
let conf = {
  db: {
    db: "sessions",
    host: process.env.MONGO_URL
  },
  secret: process.env.SESSION_SECRET || "SCRIMUPAN"
};
// Configure Session Db
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = process.env.PORT || 3000;
let options = {};
// Connect to mongoDB
let mongoDB = process.env.MONGO_URL;
if (isTest) {
  let mongoUser = process.env.MONGO_USER;
  let mongoPassword = process.env.MONGO_PASS;
  options = {
    db: { native_parser: true },
    server: { poolSize: 5 },
    user: mongoUser,
    pass: mongoPassword,
    promiseLibrary: global.Promise
  };
  mongoose.connect(mongoDB, options);
} else {
  mongoose.connect(mongoDB);
}

let db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});
// Setup the sessions
app.use(
  session({
    secret: conf.secret,
    // 60 Days
    cookie: { maxAge: 518400000 },
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: true
  })
);
// Setup the passport
app.use(passport.initialize());
app.use(passport.session());

// Specify the routers
app.use("/", router);
// Create http server
http.createServer(app).listen(port);

// If no handler for the url send NotFound
app.use(function(req: express.Request, res: express.Response) {
  res.send({ msg: "NotFound", url: req.url });
});

// On error 500 send server error
app.use(function(req, res) {
  res.status(500).send({
    success: false,
    msg: "Server Error"
  });
});
// Routine Jobs //
// Clear Availability  Repeating Rule
let availabilityRepeatingRule = new schedule.RecurrenceRule(); // TODO:Change this according to local time vs utc time
availabilityRepeatingRule.minute = 0;

// Clear Events Repeating Rule
let clearEventsRule = new schedule.RecurrenceRule();
clearEventsRule.minute = 0;

// Clear Team's occupied times Repeating Rule
let clearOccupiedRule = new schedule.RecurrenceRule();
clearOccupiedRule.minute = 0;

/* let activityRepeatingRule = new schedule.RecurrenceRule();
activityRepeatingRule.dayOfWeek = 1;
activityRepeatingRule.hour = 0; // TODO:Change this according to local time vs utc time
activityRepeatingRule.minute = 0;
 */

// Update availability notification Repeating Rule
let availabilityNotificationRule = new schedule.RecurrenceRule();
availabilityNotificationRule.hour = 9; // TODO:Change this according to local time vs utc time
availabilityNotificationRule.minute = 20;

let clearAvailabilityJob = schedule.scheduleJob(
  availabilityRepeatingRule,
  clearAvailability.resetHour
);

let clearEventsJob = schedule.scheduleJob(
  clearEventsRule,
  clearAvailability.clearEvents
);

let clearOccupiedJob = schedule.scheduleJob(
  clearOccupiedRule,
  clearAvailability.clearOccupied
);

/* let clearActivityJob = schedule.scheduleJob(
  activityRepeatingRule,
  clearAvailability.resetActive
); */

let availabilityNotificationJob = schedule.scheduleJob(
  availabilityNotificationRule,
  clearAvailability.notifyUnavailable
);

console.log("Server started on: " + port);

// On unhandled Promise notify Bilge about this promise and error
process
  .on("unhandledRejection", function(reason: any, p) {
    console.log(reason.stack);
    console.log(p);
    let message = `On promise ${p} error  at ${
      reason.stack
    } which is ${reason}`;
    specificNotification("cmpbilge@gmail.com", message, "Server error report");
    // application specific logging here
  })
  .on("uncaughtException", err => {
    console.error(err, "Uncaught Exception thrown");
  });

// Rate limiter for general purposes
const limiter = new rateLimit({
  windowMs: 5 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: "You have exceed request limit", status: 400 }
});

// Also delay requests after a limit
const speedLimiter = slowDown({
  windowMs: 5 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 100:
  // request # 101 is delayed by  500ms
  // request # 102 is delayed by 1000ms
  // request # 103 is delayed by 1500ms
  // etc.
});
//  apply limiters to all requests if not in development
if (process.env.NODE_ENV == "production") {
  app.use(limiter);
  app.use(speedLimiter);
}
exports.db = db;
exports.app = app;
