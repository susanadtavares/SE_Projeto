import db from "../db.js";
import bcrypt from "bcrypt";

// Middleware ou função auxiliar para verificar se é admin
const isAdmin = (userId) => {
  const user = db.prepare("SELECT role FROM users WHERE id = ?").get(userId);
  return user && user.role === 'admin';
};

export const listUsers = (req, res) => {
  if (!isAdmin(req.user.id)) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
  }

  try {
    const users = db.prepare("SELECT id, email, role, first_login FROM users WHERE role = 'client'").all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar utilizadores." });
  }
};

export const createUser = (req, res) => {
  if (!isAdmin(req.user.id)) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
  }

  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password e role são obrigatórios." });
  }

  // Verificar se já existe
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(400).json({ error: "Utilizador já existe." });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").run(email, hash, role);
    res.status(201).json({ id: info.lastInsertRowid, email, role });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar utilizador." });
  }
};

export const deleteUser = (req, res) => {
  if (!isAdmin(req.user.id)) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
  }

  const { id } = req.params;

  // Impedir que o admin se apague a si próprio (opcional mas recomendado)
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "Não pode apagar a sua própria conta." });
  }

  try {
    const info = db.prepare("DELETE FROM users WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: "Utilizador não encontrado." });
    }
    res.json({ message: "Utilizador removido com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover utilizador." });
  }
};
