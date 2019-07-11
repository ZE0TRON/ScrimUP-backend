import express from "express";
import { mainRoutes } from "./main";
const sessionController = require("../controllers/account").sessionController;
import { accountRoutes } from "./account.js";
import { authRoutes } from "./auth.js";
import { teamRoutes } from "./team.js";
import { taskRoutes } from "./task";
import { strategyRoutes } from "./strategy";
const router = express.Router();

// Server heart beat for checking if its alive
router.get("/server-stat", (req: express.Request, res: express.Response) =>
  res.sendStatus(200)
);

router.use("/", mainRoutes);
router.use("/account", accountRoutes);
router.use("/team", sessionController, teamRoutes);
router.use("/auth", authRoutes);
router.use("/strategy", strategyRoutes);
router.use("/task", taskRoutes);
export { router };
