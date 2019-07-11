const fs = require("fs");
const account = require("../build/api/controllers/account");
const otherUtils = require("../build/api/utils/other");
const request = require("supertest");
const app = require("./testServer").app;
const db = require("./testServer").db;
const connection = require("./testServer").connection;
// Before all tests create a test db with exported data from real server.
// TODO: from json to mongo db load data maybe with bash script or mongodb shell scripts
// const usersList = [
//   "test1@test.com",
//   "test2@test.com",
//   "test3@test.com",
//   "test4@test.com",
//   "test5@test.com",
//   "test6@test.com",
//   "test7@test.com",
//   "test8@test.com",
//   "test9@test.com",
//   "test10@test.com",
//   "test11@test.com",
//   "test12@test.com",
//   "test13@test.com",
//   "test14@test.com",
//   "test15@test.com",
//   "test16@test.com"
// ];
// const password = "test123";
// const FCMToken = "123123123123";
// load testData for GameIndex from json
// TODO: Retire this shitty piece of code
const testUser1Json = fs.readFileSync("./test_data/user/testUser1.json");
const testUser1 = JSON.parse(testUser1Json);
const testUser2Json = fs.readFileSync("./test_data/user/testUser2.json");
const testUser2 = JSON.parse(testUser2Json);
const testGameName1 = "Overwatch";
const testGameName2 = "Path Of Exile";
const testGameName3 = "Other";
const testGameName4 = "Dota 2";
const notFoundGameIndex = -1;
const expectedGameIndex1 = 0;
const expectedGameIndex2 = 0;
const expectedGameIndex3 = 1;
const expectedGameIndex4 = 2;
const FCMToken = "123123123123";
let sidContent = fs.readFileSync("./test_data/team/sids.txt");
let sessionIDs = sidContent.toString().split(",");

// findGameIndex
test("Finds game index of user given user and game", () => {
  expect(account.findGameIndex(testUser1, testGameName1)).toBe(
    expectedGameIndex1
  );
  expect(account.findGameIndex(testUser1, testGameName2)).toBe(
    notFoundGameIndex
  );
  expect(account.findGameIndex(testUser2, testGameName2)).toBe(
    expectedGameIndex2
  );
  expect(account.findGameIndex(testUser2, testGameName3)).toBe(
    expectedGameIndex3
  );
  expect(account.findGameIndex(testUser2, testGameName4)).toBe(
    expectedGameIndex4
  );
});
// Create Six Digit Code
test("Create Six Digit Code for Verification and Recovery", () => {
  for (let i = 0; i < 10000; i++) {
    expect(otherUtils.createSixDigitCode().toString()).toHaveLength(6);
  }
});

test("Get Allowed Games Request", async () => {
  await new Promise((resolve, reject) => {
    request(app)
      .get("/account/getAllowedGames")
      // .expect(200)
      .then(response => {
        expect(response.body.success).toBeTruthy();
        resolve(true);
      });
  });
  await new Promise((resolve, reject) => {
    request(app)
      .get("/account/getAllowedGames")
      .set("Cookie", ["connect.sid=" + sessionIDs[0]])
      .send()
      .then(response => {
        expect(response.body.games).toHaveLength(15);
        resolve(true);
      });
  });
});

test("Sign Up Password Criteria", async () => {
  let testEmails = [
    "passwordTest1@testUnique9948.com",
    "passwordTest2@testUnique9948.com",
    "passwordTest3@testUnique9948.com"
  ];
  let testPasswords = ["1234567", "abcdefgh", "12abc"];
  for (let i = 0; i < 3; i++) {
    await new Promise((resolve, reject) => {
      request(app)
        .post("/account/signup")
        .send({
          email: testEmails[i],
          password: testPasswords[i],
          FCMToken: FCMToken
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).toBeFalsy();
          resolve(true);
        });
    });
  }
});

afterAll(() => {
  db.close();
  connection.disconnect();
});
