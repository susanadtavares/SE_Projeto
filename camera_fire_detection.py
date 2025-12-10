import requests
import cv2
import numpy as np
import time
import supervision as sv
import base64
import paho.mqtt.client as mqtt
import json

# ==========================================
# CONFIGURAÇÃO MQTT
# ==========================================
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "sala/ambiente"

# ==========================================
# CONFIGURAÇÃO CÂMARA E ROBOFLOW
# ==========================================
ESP32_URL = "http://172.20.10.5/capture"
API_KEY = "bGnAKhsREJNZ5ZMOTVy6"
MODEL_ID = "little-fire-detection-huthc"
VERSION = "2"
ROBOFLOW_URL = f"https://detect.roboflow.com/{MODEL_ID}/{VERSION}"

# Fator de escala (0.5 = metade da largura e altura)
SCALE = 0.5

# ==========================================
# INICIALIZAÇÃO
# ==========================================
box_annotator = sv.BoxAnnotator()
label_annotator = sv.LabelAnnotator()

print("📡 Conectando ao MQTT...")
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
try:
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    print("✅ Conectado ao MQTT!")
except Exception as e:
    print(f"⚠️ Erro ao conectar MQTT: {e}")
    print("O script vai continuar, mas não enviará dados para o dashboard.")

prev_time = time.time()

def get_frame_from_esp32():
    resp = requests.get(ESP32_URL, timeout=5)
    resp.raise_for_status()
    img_arr = np.frombuffer(resp.content, dtype=np.uint8)
    image = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    return image

def infer_roboflow(image_bgr):
    _, buffer = cv2.imencode(".jpg", image_bgr)
    img_bytes = buffer.tobytes()
    img_b64 = base64.b64encode(img_bytes).decode("utf-8")
 
    response = requests.post(
        ROBOFLOW_URL,
        params={"api_key": API_KEY},
        data=img_b64,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()

# ==========================================
# LOOP PRINCIPAL
# ==========================================
while True:
    try:
        # 1. Buscar frame da ESP32
        image = get_frame_from_esp32()
 
        if image is None:
            print("Falha ao decodificar frame da ESP32")
            time.sleep(0.5)
            continue
 
        # 2. Redimensionar
        h, w = image.shape[:2]
        new_w, new_h = int(w * SCALE), int(h * SCALE)
        image_small = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
 
        # 3. Inferência na Roboflow
        result = infer_roboflow(image_small)
        detections = sv.Detections.from_inference(result)
 
        # 4. Lógica de Fogo para MQTT
        # Se houver pelo menos 1 deteção, assumimos que é fogo
        fire_detected = 1 if len(detections) > 0 else 0
        
        # Enviar para MQTT
        if client.is_connected():
            payload = json.dumps({"fire": fire_detected})
            client.publish(MQTT_TOPIC, payload)
            # print(f"🔥 Fire status sent: {fire_detected}")

        # 5. Anotar na imagem
        annotated = box_annotator.annotate(scene=image_small, detections=detections)
        annotated = label_annotator.annotate(scene=annotated, detections=detections)
 
        # 6. Calcular FPS
        curr_time = time.time()
        fps = 1.0 / max(curr_time - prev_time, 1e-6)
        prev_time = curr_time
        
        cv2.putText(
            annotated,
            f"FPS: {fps:.2f} | Fire: {fire_detected}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 255) if fire_detected else (0, 255, 0),
            2,
            cv2.LINE_AA,
        )
 
        # 7. Mostrar janela
        cv2.imshow("ESP32 Fire Detection", annotated)
 
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
 
    except requests.exceptions.ReadTimeout:
        print("ReadTimeout na ESP32, a tentar outra vez...")
        time.sleep(0.5)
        continue
    except Exception as e:
        print("Erro geral:", e)
        time.sleep(0.5)
        continue
 
cv2.destroyAllWindows()
client.disconnect()
