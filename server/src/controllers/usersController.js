import db from "../db.js";
import bcrypt from "bcrypt";

export const listUsers = (req, res) => {
  try {
    const users = db.prepare("SELECT id, email, role, first_login FROM users WHERE role = 'client'").all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar utilizadores." });
  }
};

export const createUser = (req, res) => {
  const { email } = req.body;
  const role = 'client'; // Forçar criação apenas de clientes

  if (!email) {
    return res.status(400).json({ error: "Email é obrigatório." });
  }

  // Verificar se já existe
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(400).json({ error: "Utilizador já existe." });
  }

  try {
    // Gerar password aleatória (8 caracteres)
    const generatedPassword = Math.random().toString(36).slice(-8);
    const hash = bcrypt.hashSync(generatedPassword, 10);

    const info = db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").run(email, hash, role);
    
    // TODO: Enviar email com a password gerada
    console.log(`[EMAIL] Para: ${email} | Password: ${generatedPassword}`);

    // Retornar sucesso (sem a password)
    res.status(201).json({ 
      id: info.lastInsertRowid, 
      email, 
      role
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar utilizador." });
  }
};

export const deleteUser = (req, res) => {
  const { id } = req.params;

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
