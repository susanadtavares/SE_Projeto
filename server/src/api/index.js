import express from "express";
import readings from "./readings.js";
import auth from "./auth.js";
import users from "./users.js";
import alerts from "./alerts.js";

const router = express.Router();

router.use("/readings", readings);
router.use("/auth", auth);
router.use("/users", users);
router.use("/alerts", alerts);

export default router;
