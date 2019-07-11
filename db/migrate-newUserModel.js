const dotenv = require("dotenv");
let mongoose = require("mongoose");
const isTest = process.env.PROJECT_ENV != "DEVELOPMENT";
if (!isTest) {
  dotenv.load({ path: "../.env.dev" });
  // eslint-disable-next-line
} else if (process.env.PROJECT_ENV == "TEST") {
  dotenv.load({ path: "../.env.test" });
}
let mongoDB = process.env.MONGO_URL;
if (isTest) {
  let mongoUser = process.env.MONGO_USER;
  let mongoPassword = process.env.MONGO_PASS;
  let options = {
    db: { native_parser: true },
    server: { poolSize: 5 },
    user: mongoUser,
    pass: mongoPassword,
    promiseLibrary: global.Promise
  };
  mongoose.connect(
    mongoDB,
    options
  );
} else {
  mongoose.connect(mongoDB);
}
let db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
let User = require("../api/models/user");
let Availability = require("../api/models/availability");
const AllHours = require("../api/models/allHours");
User.find({}, (err, users) => {
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users[i].games.length; j++) {
      users[i].games[j].prevAvailability = new Availability({
        monday: new AllHours(),
        tuesday: new AllHours(),
        wednesday: new AllHours(),
        thursday: new AllHours(),
        friday: new AllHours(),
        saturday: new AllHours(),
        sunday: new AllHours()
      });
    }
    users[i].save(err => {
      if (err) {
        console.log(err);
      }
    });
  }
  console.log("Done");
});
