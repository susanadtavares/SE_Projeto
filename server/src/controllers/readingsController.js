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
    // Debug: Log incoming data
    console.log(`[SAVE] Data:`, JSON.stringify(data));

    // Inserir na BD (SEM MERGE - guardamos exatamente o que recebemos)
    db.prepare(`
      INSERT INTO readings (temp, hum, aqi, fire, ts)
      VALUES (?, ?, ?, ?, ?)
    `).run(temp, hum, aqi, fire, ts);

    // --- ALERTA DE FOGO (8 em 10 leituras) ---
    if (Number(fire) === 1) {
      // Verificar apenas as leituras que contêm informação de fogo
      const last10 = db.prepare("SELECT fire FROM readings WHERE fire IS NOT NULL ORDER BY ts DESC LIMIT 10").all();
      
      if (last10.length >= 10) {
        // Contar quantos '1' existem nas últimas 10 leituras
        const fireCount = last10.filter(r => Number(r.fire) === 1).length;
        
        // Se 8 ou mais forem positivos (permite 2 falhas/flickers)
        if (fireCount >= 8) {
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
    // 1. Obter a leitura mais recente absoluta (para heartbeat do sistema)
    const last = db.prepare("SELECT * FROM readings ORDER BY ts DESC LIMIT 1").get();
    if (!last) return res.status(204).send();

    const now = Date.now();
    const MAX_AGE = 60 * 1000; // 60 segundos de validade

    // 2. Função auxiliar para buscar o valor mais recente não-nulo de uma coluna
    const getLatestValid = (col) => {
      const row = db.prepare(`SELECT ${col}, ts FROM readings WHERE ${col} IS NOT NULL ORDER BY ts DESC LIMIT 1`).get();
      if (row && (now - new Date(row.ts).getTime() < MAX_AGE)) {
        return row[col];
      }
      return null; // Dado expirado ou inexistente
    };

    // 3. Construir objeto de resposta combinando as fontes mais recentes
    const response = {
      ts: last.ts, // Mantém o timestamp da última atividade geral
      temp: getLatestValid('temp'),
      hum: getLatestValid('hum'),
      aqi: getLatestValid('aqi'),
      fire: getLatestValid('fire'),
      fireCount: 0
    };

    // 4. Calcular fireCount (Soma das últimas 20 leituras, em vez de streak consecutiva)
    if (response.fire !== null) {
      const recent = db.prepare("SELECT fire FROM readings WHERE fire IS NOT NULL ORDER BY ts DESC LIMIT 20").all();
      
      // DEBUG: Ver o que está a vir da BD
      console.log("[DEBUG] Recent fire readings:", JSON.stringify(recent));

      // Conta quantos '1' existem nas últimas 20 amostras
      response.fireCount = recent.filter(r => Number(r.fire) === 1).length;
    }

    res.json(response);
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
