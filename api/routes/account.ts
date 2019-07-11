import express from "express";
import * as accountController from "../controllers/account";
const sessionController = require("../controllers/account").sessionController;
// eslint-disable-next-line
const router = express.Router();

router
  .route("/login")
  // POST /
  .post(accountController.userLogin);
// If its in live add account create rate limiter
if (process.env.PROJECT_ENV == "production") {
  router
    .route("/signup")
    // POST /
    .post(accountController.createAccountLimiter, accountController.createUser);
} else {
  router
    .route("/signup")
    // POST /
    .post(accountController.createUser);
}
router
  .route("/logout")
  // POST /
  .post(accountController.logout);
router
  .route("/setHours")
  // POST /
  .post(sessionController, accountController.setHours);
router
  .route("/getDayAvailability")
  // POST /
  .post(sessionController, accountController.getDayAvailability);
router
  .route("/checkEmail")
  // GET /
  .get(sessionController, accountController.checkEmail);
router
  .route("/addGame")
  // GET /
  .post(sessionController, accountController.addGame);
router
  .route("/getGames")
  // GET /
  .get(sessionController, accountController.getGames);
router
  .route("/getAllowedGames")
  // GET /
  .get(accountController.getAllowedGames);
router
  .route("/isSessionActive")
  // GET /
  .get(accountController.isSessionActive);
router
  .route("/verify")
  // POST /
  .post(sessionController, accountController.verifyUser);
router
  .route("/sendVerifyMail")
  // POST /
  .post(sessionController, accountController.sendVerifyMail);
router
  .route("/changePassword")
  // POST /
  .post(sessionController, accountController.changePassword);
router
  .route("/forgotPassword")
  // POST /
  .post(accountController.forgotPassword);
router
  .route("/resetPassword")
  // POST /
  .post(accountController.resetPassword);
router
  .route("/setFCMToken")
  // POST /
  .post(sessionController, accountController.setFCMToken);
router
  .route("/getAvatar")
  // POST /
  .post(sessionController, accountController.getAvatar);
router
  .route("/updateAvatar")
  // POST /
  .post(sessionController, accountController.updateAvatar);
router;

export { router as accountRoutes };
