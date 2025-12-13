import db from "../db.js";

export function saveReading(data) {
  // data expected: { temp, hum, aqi, fire, ts }
  
  // Add timestamp if missing
  const ts = data.ts ? new Date(data.ts).toISOString() : new Date().toISOString();
  const { temp, hum, aqi, fire } = data;

  try {
    // Inserir na BD
    db.prepare(`
      INSERT INTO readings (temp, hum, aqi, fire, ts)
      VALUES (?, ?, ?, ?, ?)
    `).run(temp, hum, aqi, fire, ts);
    
  } catch (err) {
    console.error("Erro ao guardar leitura:", err);
  }
}

export function getLast(req, res) {
  try {
    const last = db.prepare("SELECT * FROM readings ORDER BY ts DESC LIMIT 1").get();
    
    if (!last) return res.status(204).send();

    // Recalcular fireDanger
    const last5 = db.prepare("SELECT fire FROM readings ORDER BY ts DESC LIMIT 5").all();
    let fireDanger = false;
    if (last5.length >= 5) {
      fireDanger = last5.every(r => Number(r.fire) === 1);
    }

    res.json({ ...last, fireDanger });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter última leitura" });
  }
}

export function getHistory(req, res) {
  try {
    const history = db.prepare("SELECT * FROM readings ORDER BY ts DESC LIMIT 50").all();
    // Inverter para ordem cronológica (old -> new) para os gráficos
    res.json(history.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter histórico" });
  }
}
