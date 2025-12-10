import requests
import cv2
import numpy as np
import time
from inference_sdk import InferenceHTTPClient
import supervision as sv

# URL da ESP32-CAM (endpoint que devolve uma imagem JPEG)
esp32_url = "http://172.20.10.3/capture"

# Cliente da Roboflow (Hosted API)
CLIENT = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key="bGnAKhsREJNZ5ZMOTVy6"  # usa a Private API Key desse workspace
)

box_annotator = sv.BoxAnnotator()
label_annotator = sv.LabelAnnotator()

while True:
    try:
        # 1. Buscar frame da ESP32 (timeout maior para evitar ReadTimeout)
        resp = requests.get(esp32_url, timeout=10)
        resp.raise_for_status()

        img_arr = np.asarray(bytearray(resp.content), dtype=np.uint8)
        image = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)

        if image is None:
            print("Falha ao decodificar frame da ESP32")
            time.sleep(1)
            continue

        # 2. Inferência na Roboflow
        result = CLIENT.infer(
            image,
            model_id="little-fire-detection-huthc/2"
        )  # Hosted API com inference-sdk [web:52]

        detections = sv.Detections.from_inference(result)  # [web:55]

        # 3. Anotar imagem
        annotated = box_annotator.annotate(scene=image, detections=detections)
        annotated = label_annotator.annotate(scene=annotated, detections=detections)

        # 4. Mostrar janela
        cv2.imshow("ESP32 + Roboflow", annotated)
        print(f"Frame OK, detections: {len(detections)}")

        # sair com 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    except requests.exceptions.ReadTimeout:
        print("ReadTimeout na ESP32, a tentar outra vez...")
        time.sleep(1)
        continue
    except Exception as e:
        print("Erro geral:", e)
        time.sleep(1)
        continue

cv2.destroyAllWindows()
