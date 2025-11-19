import express from "express";
import { getLast, getHistory } from "../controllers/readingsController.js";

const router = express.Router();

router.get("/last", getLast);
router.get("/history", getHistory);

export default router;
