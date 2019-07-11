const dotenv = require("dotenv");
let mongoose = require("mongoose");
const fs = require("fs");
const isTest = process.env.PROJECT_ENV != "DEVELOPMENT";
if (!isTest) {
  dotenv.load({ path: ".env.dev" });
  // eslint-disable-next-line
} else if (process.env.PROJECT_ENV == "TEST") {
  dotenv.load({ path: ".env.test" });
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
  mongoose.connect(mongoDB, options);
} else {
  mongoose.connect(mongoDB);
}
let db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
let AllowedGames = require("../build/api/models/allowedGame").AllowedGames;
try {
  db.collection("allowedgames").drop();
} catch (e) {
  console.log("no allowed games collection creating one");
  db.createCollection("allowedgames");
}
fs.readFile("./db/gamelist.txt", "utf8", function(err, contents) {
  if (err) {
    console.log(err);
  }
  games = contents.split("\n");
  counter = 0;
  length = games.length;
  games.forEach(game => {
    console.log(game);
    let newGame = new AllowedGames();
    newGame.name = game;
    newGame.save(err => {
      if (err) {
        console.log(err);
      }
      counter += 1;
      if (counter == length) {
        db.close();
      }
    });
  });
});

console.log("after calling readFile");
