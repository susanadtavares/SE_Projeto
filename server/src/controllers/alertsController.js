import db from "../db.js";

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
