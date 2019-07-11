import express from "express";
import * as teamController from "../controllers/team";
const router = express.Router();

router
  .route("/createTeam")
  // POST /
  .post(teamController.createTeam);
router
  .route("/kickFromTeam")
  // POST /
  .post(teamController.kickFromTeam);
router
  .route("/getTeamMembers")
  // POST /
  .post(teamController.getTeamMembers);
router
  .route("/getBestTimes")
  // POST /
  .post(teamController.getBestTimes);
router
  .route("/deleteTeam")
  // POST /
  .post(teamController.deleteTeam);
router
  .route("/leaveTeam")
  // POST /
  .post(teamController.leaveTeam);
router
  .route("/isLeader")
  // POST /
  .post(teamController.isUserLeader);
router
  .route("/regenerateToken")
  // POST /
  .post(teamController.regenerateTeamToken);
router
  .route("/enterWithToken")
  // POST /
  .post(teamController.enterWithToken);
router
  .route("/getToken")
  // POST /
  .post(teamController.getToken);
router
  .route("/getInviteLink")
  // POST /
  .post(teamController.getInviteLink);
router
  .route("/regenerateInviteLink")
  // POST /
  .post(teamController.regenerateInviteLink);
router
  .route("/isAvailableAt")
  // POST /
  .post(teamController.isAvailableAt);
router
  .route("/challengeOtherTeams")
  // POST /
  .post(teamController.challengeOtherTeams);
router
  .route("/acceptChallenges")
  // POST /
  .post(teamController.acceptChallenge);
router
  .route("/getPendingChallenges")
  // POST /
  .post(teamController.getPendingChallenges);
router
  .route("/getChallengableTeams")
  // POST /
  .post(teamController.findChallengeTeams);
router
  .route("/getChallenges")
  // POST /
  .post(teamController.getChallenges);
router
  .route("/changeTeamName")
  // POST /
  .post(teamController.changeTeamName);
router
  .route("/createEvent")
  // POST /
  .post(teamController.createEvent);
router
  .route("/getEvents")
  // POST /
  .post(teamController.getEvents);
router
  .route("/joinEvent")
  // POST /
  .post(teamController.joinEvent);
router
  .route("/leaveEvent")
  // POST /
  .post(teamController.leaveEvent);
router
  .route("/deleteEvent")
  // POST /
  .post(teamController.deleteEvent);

export { router as teamRoutes };
