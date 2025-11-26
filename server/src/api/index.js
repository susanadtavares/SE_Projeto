import express from "express";
import readings from "./readings.js";

const router = express.Router();

router.use("/readings", readings);

export default router;
