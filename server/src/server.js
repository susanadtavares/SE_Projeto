import app from "./app.js";
import mqttService from "./services/mqttService.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;

// iniciar MQTT
mqttService();

// iniciar HTTP
app.listen(PORT, () => {
  console.log(`[HTTP] Listening on http://localhost:${PORT}`);
});
