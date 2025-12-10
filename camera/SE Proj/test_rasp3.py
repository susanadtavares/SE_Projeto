import requests
import cv2
import numpy as np
import time
import supervision as sv
import base64
 
# URL da ESP32-CAM (endpoint que devolve uma imagem JPEG)
ESP32_URL = "http://172.20.10.5/capture"
 
# Dados do modelo Roboflow (Hosted API)
API_KEY = "bGnAKhsREJNZ5ZMOTVy6"
MODEL_ID = "little-fire-detection-huthc"
VERSION = "2"
 
# endpoint Hosted (REST)
ROBOFLOW_URL = f"https://detect.roboflow.com/{MODEL_ID}/{VERSION}"
 
box_annotator = sv.BoxAnnotator()
label_annotator = sv.LabelAnnotator()
 
# fator de escala (0.5 = metade da largura e altura)
SCALE = 0.5
 
prev_time = time.time()
 
 
def get_frame_from_esp32():
    resp = requests.get(ESP32_URL, timeout=5)
    resp.raise_for_status()
    img_arr = np.frombuffer(resp.content, dtype=np.uint8)
    image = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
    return image
 
 
def infer_roboflow(image_bgr):
    # Roboflow Hosted API aceita imagem base64 no body
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
 
 
while True:
    try:
        # 1. Buscar frame da ESP32
        image = get_frame_from_esp32()
 
        if image is None:
            print("Falha ao decodificar frame da ESP32")
            time.sleep(0.5)
            continue
 
        # 2. Redimensionar antes de mandar para a Roboflow
        h, w = image.shape[:2]
        new_w, new_h = int(w * SCALE), int(h * SCALE)
        image_small = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
 
        # 3. Inferência na Roboflow sobre a imagem reduzida (Hosted API)
        result = infer_roboflow(image_small)
 
        # supervision: depende da tua versão
        # se tens >=0.17 usa from_roboflow(result) direto
        detections = sv.Detections.from_inference(result)
 
        # 4. Anotar na imagem original
        annotated = box_annotator.annotate(scene=image_small, detections=detections)
        annotated = label_annotator.annotate(scene=annotated, detections=detections)
 
        # 5. Calcular FPS aproximado
        curr_time = time.time()
        fps = 1.0 / max(curr_time - prev_time, 1e-6)
        prev_time = curr_time
        cv2.putText(
            annotated,
            f"FPS: {fps:.2f}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )
 
        # 6. Mostrar janela
        cv2.imshow("ESP32 + Roboflow (Pi 3)", annotated)
        print(f"Frame OK, detections: {len(detections)}, FPS: {fps:.2f}")
 
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