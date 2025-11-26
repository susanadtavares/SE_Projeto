from serial import Serial
import time
import json
import paho.mqtt.client as mqtt

# Configuração Serial (Arduino)
SERIAL_PORT = "/dev/ttyACM0"  # No Windows será algo como "COM3", "COM4", etc.
BAUD_RATE = 9600

# Configuração MQTT
MQTT_BROKER = "localhost"  # Endereço do Mosquitto
MQTT_PORT = 1883
MQTT_TOPIC = "sala/ambiente"

# Conectar ao Arduino
print("🔌 Conectando ao Arduino...")
arduino = Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
time.sleep(2)  # Aguardar inicialização do Arduino

# Conectar ao MQTT
print("📡 Conectando ao MQTT...")
client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
print("✅ Conectado ao MQTT!")

def processar_dados(linha):
    """
    Processa a linha recebida do Arduino e extrai os valores.
    Adapta esta função conforme o formato que o teu Arduino envia!
    
    Exemplos de formato esperado:
    - "temp:23.5,hum:45.2,aqi:38"
    - "23.5,45.2,38"
    - Já em JSON: {"temp":23.5,"hum":45.2,"aqi":38}
    """
    try:
        # Se o Arduino já envia JSON, só faz parse
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
        
        # Se for formato simples "23.5,45.2,38" (temp, hum, aqi)
        if "," in linha:
            valores = linha.split(",")
            if len(valores) >= 3:
                return {
                    "temp": float(valores[0].strip()),
                    "hum": float(valores[1].strip()),
                    "aqi": int(valores[2].strip())
                }
        
        return None
        
    except Exception as e:
        print(f"❌ Erro ao processar: {linha} - {e}")
        return None

print("🎯 A aguardar dados do Arduino...\n")

# Loop principal
while True:
    try:
        if arduino.in_waiting:
            # Ler linha do Arduino
            linha = arduino.readline().decode(errors="ignore").strip()
            
            if linha:
                print(f"📥 Recebido: {linha}")
                
                # Processar dados
                dados = processar_dados(linha)
                
                if dados:
                    # Publicar no MQTT
                    payload = json.dumps(dados)
                    client.publish(MQTT_TOPIC, payload)
                    print(f"📤 Enviado para MQTT: {payload}\n")
                else:
                    print(f"⚠️  Formato não reconhecido, ignorando...\n")
        
        time.sleep(0.1)
        
    except KeyboardInterrupt:
        print("\n🛑 Parando...")
        break
    except Exception as e:
        print(f"❌ Erro: {e}")
        time.sleep(1)

# Limpar conexões
arduino.close()
client.disconnect()
print("👋 Desconectado!")
