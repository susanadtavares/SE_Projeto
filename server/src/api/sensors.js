import express from "express";
import { getAllSensors } from "../controllers/sensorsController.js";

const router = express.Router();

router.get("/", getAllSensors);

export default router;
