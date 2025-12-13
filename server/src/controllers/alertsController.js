import db from "../db.js";
import { sendMail } from "../services/emailService.js";

const lastAlerts = {}; // { email: timestamp }
const COOLDOWN = 60 * 60 * 1000; // 1 hora

export const getAllAlerts = (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT alerts.*, sensors.name as sensor_name 
      FROM alerts 
      LEFT JOIN sensors ON alerts.sensor_id = sensors.id
      ORDER BY timestamp DESC
    `).all();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendAqiAlert = async (req, res) => {
  console.log("[ALERTA] Recebido pedido de alerta AQI");
  const { aqi, email } = req.body;

  console.log(`[ALERTA] User: ${email}, AQI: ${aqi}`);

  if (!email) return res.status(400).json({ error: "User email is required" });

  const now = Date.now();
  const lastSent = lastAlerts[email] || 0;

  if (now - lastSent < COOLDOWN) {
    console.log(`[ALERTA] Ignorado por cooldown. Faltam ${(COOLDOWN - (now - lastSent))/1000}s`);
    return res.status(429).json({ message: "Alert already sent recently" });
  }

  try {
    console.log("[ALERTA] A tentar enviar email...");
    await sendMail({
      to: email,
      subject: "ALERTA: Qualidade do Ar Má/Muito Má",
      body: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #d9534f;">Alerta de Qualidade do Ar</h1>
          <p>O sistema detetou níveis elevados de poluição no ar.</p>
          <div style="background: #f9f2f4; padding: 15px; border-left: 5px solid #d9534f; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;"><strong>Nível AQI:</strong> ${aqi}</p>
            <p style="margin: 5px 0 0 0;"><strong>Estado:</strong> Mau / Muito Mau</p>
          </div>
          <p>Por favor, verifique a ventilação do espaço imediatamente.</p>
          <hr>
          <small>Sistema de Monitorização Ambiental</small>
        </div>
      `
    });

    // Guardar alerta na Base de Dados
    try {
      db.prepare(`
        INSERT INTO alerts (sensor_id, message, type, timestamp)
        VALUES (?, ?, ?, ?)
      `).run(null, `Qualidade do ar MAU (AQI: ${aqi})`, 'critical', new Date().toISOString());
      console.log("[ALERTA] Guardado na BD.");
    } catch (dbErr) {
      console.error("[ALERTA] Erro ao guardar na BD:", dbErr);
    }

    lastAlerts[email] = now;
    console.log(`[ALERTA] Email enviado para ${email} (AQI: ${aqi})`);
    res.json({ success: true });

  } catch (error) {
    console.error("Erro ao enviar alerta:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};
