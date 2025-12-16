import db from "../db.js";
import bcrypt from "bcrypt";

export function login(req, res) {
  const { email, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) return res.status(401).json({ error: "Email ou password inválidos" });

  const validPass = bcrypt.compareSync(password, user.password);
  if (!validPass) return res.status(401).json({ error: "Email ou password inválidos" });

  const firstLogin = user.first_login === 1;

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    first_login: firstLogin
  });
}
