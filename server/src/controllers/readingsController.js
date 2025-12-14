import db from "../db.js";
import { sendMail } from "../services/emailService.js";

let lastFireAlert = 0;
const FIRE_ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutos

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

    // --- ALERTA DE FOGO (10 leituras consecutivas) ---
    if (Number(fire) === 1) {
      // Verificar apenas as leituras que contêm informação de fogo
      const last10 = db.prepare("SELECT fire FROM readings WHERE fire IS NOT NULL ORDER BY ts DESC LIMIT 10").all();
      
      if (last10.length >= 10) {
        const allFire = last10.every(r => Number(r.fire) === 1);
        
        if (allFire) {
          const now = Date.now();
          if (now - lastFireAlert > FIRE_ALERT_COOLDOWN) {
            lastFireAlert = now;
            
            // Buscar todos os emails (ou apenas admin, aqui enviamos para todos)
            const users = db.prepare("SELECT email FROM users").all();
            console.log(`[FOGO] Detetado fogo por 10 leituras! A enviar emails...`);

            users.forEach(user => {
              sendMail({
                to: user.email,
                subject: "PERIGO: FOGO DETETADO",
                body: `
                  <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1 style="color: #d9534f;">FOGO DETETADO</h1>
                    <p>O sistema de câmaras detetou fogo consistentemente.</p>
                    <div style="background: #f9f2f4; padding: 15px; border-left: 5px solid #d9534f; margin: 20px 0;">
                      <p style="margin: 0; font-size: 18px;"><strong>Local:</strong> Sala (Câmara 1)</p>
                      <p style="margin: 5px 0 0 0;"><strong>Estado:</strong> CRÍTICO</p>
                    </div>
                    <p>Por favor, verifique o local imediatamente ou contacte os bombeiros.</p>
                    <hr>
                    <small>Sistema de Monitorização Ambiental</small>
                  </div>
                `
              }).catch(err => console.error(`[ERRO] Falha ao enviar email de fogo para ${user.email}:`, err));
            });

            // Guardar alerta na BD (Global - user_email NULL)
            try {
              db.prepare(`
                INSERT INTO alerts (sensor_id, user_email, message, type, timestamp)
                VALUES (?, ?, ?, ?, ?)
              `).run(null, null, `FOGO DETETADO (Câmara)`, 'critical', new Date().toISOString());
            } catch (e) { console.error(e); }
          }
        }
      }
    }
    
  } catch (err) {
    console.error("Erro ao guardar leitura:", err);
  }
}

export function getLast(req, res) {
  try {
    const last = db.prepare("SELECT * FROM readings ORDER BY ts DESC LIMIT 1").get();
    
    if (!last) return res.status(204).send();

    // Recalcular fireDanger (10 leituras)
    const last10 = db.prepare("SELECT fire FROM readings ORDER BY ts DESC LIMIT 10").all();
    let fireDanger = false;
    if (last10.length >= 10) {
      fireDanger = last10.every(r => Number(r.fire) === 1);
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
