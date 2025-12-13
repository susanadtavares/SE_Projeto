import express from "express";
import { getAllAlerts, sendAqiAlert } from "../controllers/alertsController.js";

const router = express.Router();

router.get("/", getAllAlerts);
router.post("/notify", sendAqiAlert);

export default router;
