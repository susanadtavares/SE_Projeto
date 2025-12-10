import serial
import time
import json
import re
import paho.mqtt.client as mqtt

# Configuração Serial (Arduino)
SERIAL_PORT = "COM7"  # Tenta COM3, se falhar tenta COM4 ou COM7
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

while True:
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        print("Conectado ao MQTT!")
        break
    except ConnectionRefusedError:
        print("ERRO: Não foi possível conectar ao Mosquitto (localhost:1883).")
        print("      Verifique se o Docker está a correr: 'docker-compose up -d'")
        print("      Tentando novamente em 5 segundos...")
        time.sleep(5)
    except Exception as e:
        print(f"Erro MQTT: {e}")
        time.sleep(5)

def processar_dados(linha):
    """Processa a linha recebida do Arduino"""
    try:
        # 1. Tenta JSON direto
        if linha.startswith("{"):
            return json.loads(linha)

        # 2. Tenta formato de texto do Arduino:
        # "Temp: 23.50 °C | Hum: 45.00 % | MQ135: 300 | CO₂ estimado: 420.50"
        if "Temp:" in linha and "Hum:" in linha:
            # Usar regex para extrair os números
            temp_match = re.search(r"Temp:\s*([\d.]+)", linha)
            hum_match = re.search(r"Hum:\s*([\d.]+)", linha)
            # Procura por 'estimado:' para ser mais seguro com caracteres especiais
            aqi_match = re.search(r"estimado:\s*([\d.]+)", linha)

            if temp_match and hum_match and aqi_match:
                return {
                    "temp": float(temp_match.group(1)),
                    "hum": float(hum_match.group(1)),
                    "aqi": float(aqi_match.group(1))
                }
        
        # 3. Fallback para formato simples "chave:valor,chave:valor"
        if ":" in linha and "," in linha:
            dados = {}
            partes = linha.split(",")
            for parte in partes:
                if ":" in parte:
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
