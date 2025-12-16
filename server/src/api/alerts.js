import express from "express";
import { getAllAlerts, sendAqiAlert, deleteAlert } from "../controllers/alertsController.js";

const router = express.Router();

router.get("/", getAllAlerts);
router.post("/notify", sendAqiAlert);
router.delete("/:id", deleteAlert);

export default router;
