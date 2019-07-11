import express from "express";
import * as authController from "../controllers/auth";
// eslint-disable-next-line
const router = express.Router();

router.get("/discordCallBack", authController.discordCallback);
router.post("/discord", authController.loginWithAccessToken);
router.post("/google", authController.googleLogin);
export { router as authRoutes };
