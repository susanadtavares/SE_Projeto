import time
import json
import random
import paho.mqtt.client as mqtt

# Configuração MQTT
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "sala/ambiente"

print("🔌 Simulando Arduino (MOCK)...")
time.sleep(1)

# Conectar ao MQTT
print("📡 Conectando ao MQTT...")
client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
print("✅ Conectado ao MQTT!")

def gerar_dados_sensores():
    """
    Simula leituras dos sensores DHT11/22 e MQ-135
    """
    # Temperatura: 18°C a 30°C (variação realista)
    temp = round(random.uniform(18.0, 30.0), 2)
    
    # Humidade: 30% a 70%
    hum = round(random.uniform(30.0, 70.0), 2)
    
    # Qualidade do ar (AQI): 20 a 150
    # Valores baixos = ar limpo, valores altos = poluído
    aqi = random.randint(20, 150)
    
    return {
        "temp": temp,
        "hum": hum,
        "aqi": aqi
    }

def simular_cenario_incendio():
    """
    Simula um cenário de incêndio detectado
    """
    return {
        "temp": round(random.uniform(45.0, 80.0), 2),  # Temperatura alta!
        "hum": round(random.uniform(10.0, 25.0), 2),   # Humidade baixa
        "aqi": random.randint(200, 500)                # AQI muito alto (fumo)
    }

print("🎯 A enviar dados simulados...\n")
print("💡 Pressiona Ctrl+C para parar")
print("🔥 A cada 20 leituras, simula um possível incêndio!\n")

contador = 0

# Loop principal
try:
    while True:
        # A cada 20 leituras, simula um cenário de incêndio
        if contador % 20 == 0 and contador > 0:
            print("🔥 ⚠️  SIMULANDO POSSÍVEL INCÊNDIO! ⚠️")
            dados = simular_cenario_incendio()
        else:
            dados = gerar_dados_sensores()
        
        # Publicar no MQTT
        payload = json.dumps(dados)
        client.publish(MQTT_TOPIC, payload)
        
        # Mostrar o que foi enviado
        print(f"📤 [{contador+1}] Enviado: {payload}")
        
        contador += 1
        time.sleep(2)  # Enviar dados a cada 2 segundos
        
except KeyboardInterrupt:
    print("\n\n🛑 Parando simulação...")
    client.disconnect()
    print("👋 Desconectado!")
