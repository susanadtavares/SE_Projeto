import paho.mqtt.client as mqtt
import json
import time
import random

# Configuração
BROKER = "localhost"
PORT = 1883
TOPIC = "sala/ambiente"

client = mqtt.Client()

try:
    client.connect(BROKER, PORT, 60)
    print(f"Conectado ao broker {BROKER}:{PORT}")
except Exception as e:
    print(f"Erro ao conectar: {e}")
    print("Verifique se o Docker está a correr e a porta 1883 está exposta.")
    exit(1)

print("A simular deteção de fogo...")
print("A enviar 15 leituras com 'fire': 1 para ativar o alerta (mínimo 10 necessárias)...")

for i in range(1, 16):
    payload = {
        "temp": round(random.uniform(20.0, 25.0), 2),
        "hum": round(random.uniform(30.0, 40.0), 2),
        "aqi": random.randint(50, 100),
        "fire": 1,  # Simula fogo detetado
        "ts": int(time.time() * 1000)
    }
    
    client.publish(TOPIC, json.dumps(payload))
    print(f"[{i}/15] Enviado: {payload}")
    time.sleep(1) # 1 segundo entre envios

print("\nSimulação concluída.")
print("Verifique o Dashboard (deve mostrar 'PERIGO') e o seu email.")
client.disconnect()
