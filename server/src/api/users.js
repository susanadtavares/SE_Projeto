import express from "express";
import { listUsers, createUser, deleteUser } from "../controllers/usersController.js";

const router = express.Router();

router.get("/", listUsers);
router.post("/", createUser);
router.delete("/:id", deleteUser);

export default router;
