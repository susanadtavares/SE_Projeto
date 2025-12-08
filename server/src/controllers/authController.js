import db from "../db.js";
import bcrypt from "bcrypt";
import {
  generateToken,
  generateRefreshToken,
  generateTokenFor1stLog
} from "../utils/tokenutils.js";

export function login(req, res) {
  const { email, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) return res.status(401).json({ error: "Email ou password inválidos" });

  const validPass = bcrypt.compareSync(password, user.password);
  if (!validPass) return res.status(401).json({ error: "Email ou password inválidos" });

  const accessToken = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const firstLogin = user.first_login === 1;
  const firstLoginToken = firstLogin ? generateTokenFor1stLog(user.id) : null;

  // Simplificação: Enviar o objeto completo para o frontend lidar (ou concatenar IV:DATA)
  // O ideal seria o frontend receber { iv, encryptedData } e enviar de volta no header
  
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    first_login: firstLogin,
    token: accessToken, // Objeto { iv, encryptedData }
    refresh: refreshToken,
    token_first_login: firstLoginToken
  });
}
