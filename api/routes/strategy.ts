import express from "express";
import * as strategyController from "../controllers/strategy";
const sessionController = require("../controllers/account").sessionController;

// eslint-disable-next-line
const router = express.Router();

router.post("/add", sessionController, strategyController.createStrategy);
router.post("/get", sessionController, strategyController.getStrategies);
router.post("/delete", sessionController, strategyController.deleteStrategy);
router.post("/update", sessionController, strategyController.updateStrategy);
export { router as strategyRoutes };
