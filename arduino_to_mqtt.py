import serial
import time
import json
import paho.mqtt.client as mqtt

# Configuração Serial (Arduino)
SERIAL_PORT = "COM5"  # MUDA ISTO! (COM3, COM4, COM5, etc.)
BAUD_RATE = 9600

# Configuração MQTT
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "sala/ambiente"

# Conectar ao Arduino
print("Conectando ao Arduino...")
arduino = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
time.sleep(2)  # Aguardar inicialização do Arduino

# Conectar ao MQTT
print("Conectando ao MQTT...")
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.connect(MQTT_BROKER, MQTT_PORT, 60)
print("Conectado ao MQTT!")

def processar_dados(linha):
    """Processa a linha recebida do Arduino"""
    try:
        # Se o Arduino já envia JSON
        if linha.startswith("{"):
            return json.loads(linha)
        
        # Se for formato "temp:23.5,hum:45.2,aqi:38"
        if ":" in linha:
            dados = {}
            partes = linha.split(",")
            for parte in partes:
                chave, valor = parte.split(":")
                dados[chave.strip()] = float(valor.strip())
            return dados
        
        return None
        
    except Exception as e:
        print(f"Erro ao processar: {linha} - {e}")
        return None

print("A aguardar dados do Arduino...\n")

# Loop principal
while True:
    try:
        if arduino.in_waiting:
            linha = arduino.readline().decode(errors="ignore").strip()
            
            if linha:
                print(f"Recebido: {linha}")
                
                dados = processar_dados(linha)
                
                if dados:
                    payload = json.dumps(dados)
                    client.publish(MQTT_TOPIC, payload)
                    print(f"Enviado para MQTT: {payload}\n")
        
        time.sleep(0.1)
        
    except KeyboardInterrupt:
        print("\nParando...")
        break
    except Exception as e:
        print(f"Erro: {e}")
        time.sleep(1)

# Limpar conexões
arduino.close()
client.disconnect()
print("Desconectado!")
