import express from "express";
import { listUsers, createUser, deleteUser } from "../controllers/usersController.js";
import { validateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Todas as rotas requerem autenticação
router.get("/", validateToken, listUsers);
router.post("/", validateToken, createUser);
router.delete("/:id", validateToken, deleteUser);

export default router;
