import express from "express";
import cors from "cors";
import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;
const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const MQTT_TOPIC = process.env.MQTT_TOPIC || "sala/ambiente";

const app = express();
app.use(cors());
app.use(express.json()); // útil para endpoints POST no futuro

// estado em memória
let last = null;

// liga ao MQTT
const client = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  console.log(`[MQTT] ligado em ${MQTT_URL}`);
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) console.error("[MQTT] erro a subscrever:", err.message);
    else console.log(`[MQTT] subscrito ao tópico: ${MQTT_TOPIC}`);
  });
});

client.on("error", (err) => {
  console.error("[MQTT] erro:", err.message);
});

client.on("message", (topic, payload) => {
  try {
    const msg = JSON.parse(payload.toString());
    // normalizar para o frontend
    last = {
      temp: Number(msg.temp ?? msg.temperature),
      hum: Number(msg.hum ?? msg.humidity),
      aqi: Number(msg.aqi ?? msg.airQuality ?? 40),
      ts: msg.ts ? Number(msg.ts) : Date.now(),
      topic
    };
  } catch (e) {
    console.warn("[MQTT] mensagem inválida:", payload.toString());
  }
});

// endpoint principal
app.get("/api/last", (_req, res) => {
  if (!last) return res.status(204).end(); // sem dados ainda
  res.json(last);
});

// saúde / debug
app.get("/health", (_req, res) => {
  res.json({ ok: true, mqtt: client.connected, topic: MQTT_TOPIC, hasLast: !!last });
});

app.listen(PORT, () => {
  console.log(`[HTTP] server a escutar em http://localhost:${PORT}`);
});

// no teu index.js, antes do app.listen
app.get("/", (_req, res) => {
  res.type("text").send("OK — usa /health ou /api/last");
});

