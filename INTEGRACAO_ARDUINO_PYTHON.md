# 🔄 Integração Arduino → Python → MQTT

## Arquitetura:

```
Arduino Uno/Nano → USB Serial → Python → MQTT → Backend → Dashboard
     (sensores)                                    (Node.js)   (React)
```

---

## 📋 Passo a passo:

### 1️⃣ Instalar biblioteca Python MQTT

```bash
pip install paho-mqtt pyserial
```

### 2️⃣ Carregar código no Arduino

1. Abrir `arduino_serial.ino` no Arduino IDE
2. Instalar biblioteca DHT:
   - Sketch → Include Library → Manage Libraries
   - Procurar "DHT sensor library" by Adafruit
   - Instalar também "Adafruit Unified Sensor"
3. Conectar o Arduino via USB
4. Fazer upload do código

### 3️⃣ Descobrir a porta COM/Serial

**Windows:**
```cmd
mode
```
Procura algo como `COM3`, `COM4`, `COM5`, etc.

**Linux/Mac:**
```bash
ls /dev/tty*
```
Procura algo como `/dev/ttyACM0` ou `/dev/ttyUSB0`

### 4️⃣ Configurar o script Python

Editar `arduino_to_mqtt.py` e ajustar:

```python
SERIAL_PORT = "COM3"  # Muda para a tua porta!
```

### 5️⃣ Executar tudo

**Terminal 1 - Mosquitto (se não estiver a correr):**
```bash
docker-compose up mosquitto
```

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd projetoSE
npm run dev
```

**Terminal 4 - Bridge Python:**
```bash
python arduino_to_mqtt.py
```

---

## 🧪 Testar a comunicação

### 1. Testar Arduino isoladamente:

Abrir Serial Monitor no Arduino IDE (Tools → Serial Monitor, 9600 baud).
Deves ver algo como:
```json
{"temp":23.5,"hum":45.2,"aqi":38}
{"temp":23.6,"hum":45.1,"aqi":39}
```

### 2. Testar Python recebendo dados:

```bash
python arduino_to_mqtt.py
```

Deves ver:
```
🔌 Conectando ao Arduino...
📡 Conectando ao MQTT...
✅ Conectado ao MQTT!
🎯 A aguardar dados do Arduino...

📥 Recebido: {"temp":23.5,"hum":45.2,"aqi":38}
📤 Enviado para MQTT: {"temp":23.5,"hum":45.2,"aqi":38}
```

### 3. Ver no Dashboard:

Abrir `http://localhost:5173` no browser e ver os gráficos a atualizar!

---

## 🔌 Ligações do Circuito (Arduino Uno)

### DHT11/DHT22:
```
DHT          Arduino Uno
─────────────────────────
VCC       →  5V
GND       →  GND  
DATA      →  Pino Digital 2
```

### MQ-135:
```
MQ-135       Arduino Uno
─────────────────────────
VCC       →  5V
GND       →  GND
AOUT      →  A0 (Pino Analógico 0)
```

---

## ⚠️ Troubleshooting

**Erro "Permission denied" (Linux/Mac):**
```bash
sudo chmod 666 /dev/ttyACM0
# ou adicionar o teu user ao grupo dialout:
sudo usermod -a -G dialout $USER
# (faz logout e login novamente)
```

**Python não encontra a porta:**
- Verificar que o Arduino está conectado
- Confirmar a porta correta no Device Manager (Windows) ou `ls /dev/tty*`
- Fechar o Serial Monitor do Arduino IDE (só um programa pode usar a porta de cada vez)

**Dados não aparecem no Dashboard:**
- Verificar que o Mosquitto está a correr
- Verificar que o backend está a correr
- Verificar que o Python diz "Enviado para MQTT"
- Confirmar que o tópico é `sala/ambiente` em todos os lados

**DHT retorna 0.0 ou NaN:**
- Verificar ligações (especialmente o pino DATA)
- Aguardar 2 segundos entre leituras
- Trocar `DHT11` por `DHT22` no código se for esse o teu sensor

---

## 💡 Vantagens desta arquitetura:

✅ Arduino Uno funciona (não precisa WiFi)  
✅ Python faz a ponte Serial → MQTT  
✅ Código modular e fácil de debug  
✅ Pode adicionar processamento/filtros no Python  
✅ Reutiliza toda a infraestrutura MQTT/Backend/Frontend existente  
