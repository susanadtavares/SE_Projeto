import Database from "better-sqlite3";
import bcrypt from "bcrypt";

const db = new Database("database.db");

// Criar tabela users
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'client')),
    first_login BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temp REAL,
    hum REAL,
    aqi INTEGER,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Inserir admin default
const admin = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@iot.com");

if (!admin) {
  const hash = bcrypt.hashSync("admin123", 10);

  db.prepare(`
    INSERT INTO users (email, password, role)
    VALUES (?, ?, 'admin')
  `).run("admin@iot.com", hash);

  console.log("[DB] Admin criado: admin@iot.com / admin123");
}

// Inserir cliente default
const client = db.prepare("SELECT * FROM users WHERE email = ?").get("cliente@iot.com");

if (!client) {
  const hash = bcrypt.hashSync("cliente123", 10);

  db.prepare(`
    INSERT INTO users (email, password, role)
    VALUES (?, ?, 'client')
  `).run("cliente@iot.com", hash);

  console.log("[DB] Cliente criado: cliente@iot.com / cliente123");
}

export default db;
