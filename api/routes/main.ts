import express from "express";
import mainController from "../controllers/main";

const router = express.Router();

router
  .route("/")
  // GET /
  .post(mainController.hello);

export { router as mainRoutes };
