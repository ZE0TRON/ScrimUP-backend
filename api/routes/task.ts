import express from "express";
import * as taskController from "../controllers/task";
const sessionController = require("../controllers/account").sessionController;

// eslint-disable-next-line
const router = express.Router();

router.post("/add", sessionController, taskController.createTask);
router.post("/get", sessionController, taskController.getTasks);
router.post("/delete", sessionController, taskController.deleteTask);
router.post("/progress", sessionController, taskController.updateTask);
export { router as taskRoutes };
