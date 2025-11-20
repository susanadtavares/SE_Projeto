import mqtt from "mqtt";
import { saveReading } from "../controllers/readingsController.js";

export default function mqttService() {
  const client = mqtt.connect(process.env.MQTT_URL);

  client.on("connect", () => {
    console.log("[MQTT] connected");
    client.subscribe(process.env.MQTT_TOPIC);
  });

  client.on("message", (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      saveReading({
        ...data,
        topic,
        ts: Date.now()
      });

    } catch (err) {
      console.error("[MQTT] invalid message:", message.toString());
    }
  });
}
