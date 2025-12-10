from inference import get_model
import supervision as sv
import cv2
import numpy as np
import requests
import time

esp32_url = "http://172.20.10.3"
model = get_model(
    model_id="little-fire-detection-huthc/2",
    api_key="bGnAKhsREJNZ5ZMOTVy6"
)

while True:
    try:
        response = requests.get(esp32_url, timeout=2)
        image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        results = model.infer(image)[0]
        detections = sv.Detections.from_inference(results)

        annotated_image = sv.BoxAnnotator().annotate(scene=image, detections=detections)
        annotated_image = sv.LabelAnnotator().annotate(scene=annotated_image, detections=detections)

        # Opcional: salvar a cada frame, ou visualizar só de tempos em tempos
        cv2.imwrite("frame_annotado.jpg", annotated_image)
        # sv.plot_image(annotated_image)  # pode travar, use só para debug

        # print apenas para log
        print("Frame analisado!")

        # Tempo entre frames (FPS ~1)
        time.sleep(1)

    except Exception as e:
        print(f"Erro: {e}")
        time.sleep(2)

''' sem LOOP para teste rápido

 from inference import get_model
import supervision as sv
import cv2
import numpy as np
import requests
import time

# ------ SÓ ALTERA ESTE URL! ------
esp32_url = "http://SEU_IP_DA_ESP32/cam.jpg"
# ---------------------------------

# carrega o modelo pré-treinado Roboflow (coloque sua API key se necessário)
model = get_model(model_id="little-fire-detection-huthc/2")

while True:
    try:
        # busca a imagem atual da câmara
        response = requests.get(esp32_url, timeout=2)
        image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        # roda inferência
        results = model.infer(image)[0]
        detections = sv.Detections.from_inference(results)

        # anota imagem
        annotated_image = sv.BoxAnnotator().annotate(scene=image, detections=detections)
        annotated_image = sv.LabelAnnotator().annotate(scene=annotated_image, detections=detections)

        # exibe imagem
        cv2.imshow("Inferência em tempo real", annotated_image)

        # sai se apertar 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    except Exception as e:
        print(f"Erro: {e}")
        time.sleep(1)  # espera antes de tentar de novo

cv2.destroyAllWindows()
'''