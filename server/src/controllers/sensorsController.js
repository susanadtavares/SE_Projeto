import db from "../db.js";

export const getAllSensors = (req, res) => {
  try {
    const sensors = db.prepare("SELECT * FROM sensors").all();
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
