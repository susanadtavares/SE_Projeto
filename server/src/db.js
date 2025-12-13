import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";

// Garantir que a pasta data existe
const dbPath = path.resolve("data", "database.db");
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

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
    fire INTEGER,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sensors (
    id TEXT PRIMARY KEY,
    name TEXT,
    location TEXT,
    status TEXT DEFAULT 'offline',
    last_seen DATETIME
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id TEXT,
    message TEXT,
    type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sensor_id) REFERENCES sensors(id)
  );
`);

// Migração para adicionar coluna fire se não existir (para bases de dados antigas)
try {
  db.exec("ALTER TABLE readings ADD COLUMN fire INTEGER");
} catch (err) {
  // Ignora erro se a coluna já existir
}

// Seed Sensors (Exemplo inicial)
const sensorCount = db.prepare("SELECT count(*) as count FROM sensors").get();
if (sensorCount.count === 0) {
  const stmt = db.prepare("INSERT INTO sensors (id, name, location, status, last_seen) VALUES (?, ?, ?, ?, ?)");
  stmt.run("sensor_01", "Sensor Sala", "Sala de Estar", "active", new Date().toISOString());
  stmt.run("sensor_02", "Sensor Cozinha", "Cozinha", "active", new Date().toISOString());
  stmt.run("sensor_03", "Sensor Quarto", "Quarto Principal", "inactive", new Date(Date.now() - 86400000).toISOString());
  console.log("[DB] Sensores de exemplo criados.");
}

// Seed Alerts (Exemplo inicial)
const alertCount = db.prepare("SELECT count(*) as count FROM alerts").get();
if (alertCount.count === 0) {
  const stmt = db.prepare("INSERT INTO alerts (sensor_id, message, type, timestamp) VALUES (?, ?, ?, ?)");
  stmt.run("sensor_02", "Temperatura elevada detetada (> 50°C)", "critical", new Date().toISOString());
  stmt.run("sensor_01", "Qualidade do ar moderada", "warning", new Date(Date.now() - 3600000).toISOString());
  console.log("[DB] Alertas de exemplo criados.");
}


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
