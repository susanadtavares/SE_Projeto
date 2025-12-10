const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const mqtt = require('mqtt');

// CONFIGURAÇÃO
const MQTT_URL = 'mqtt://localhost:1883';
const MQTT_TOPIC = 'sala/ambiente';
const BAUD_RATE = 9600;

// Tenta pegar a porta serial dos argumentos (ex: node index.js COM3)
const portPath = process.argv[2];

if (!portPath) {
  console.log('Por favor, especifique a porta serial.');
  console.log('Exemplo: node index.js COM3 (Windows) ou node index.js /dev/ttyUSB0 (Linux/Mac)');
  
  // Listar portas disponíveis para ajudar
  SerialPort.list().then(ports => {
    console.log('\nPortas disponíveis:');
    ports.forEach(p => console.log(` - ${p.path} (${p.manufacturer || 'desconhecido'})`));
    process.exit(1);
  });
} else {
  startBridge(portPath);
}

function startBridge(portName) {
  console.log(`[BRIDGE] A ligar à porta serial: ${portName}`);
  console.log(`[BRIDGE] A ligar ao MQTT: ${MQTT_URL}`);

  // 1. Conexão Serial
  const port = new SerialPort({ path: portName, baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  // 2. Conexão MQTT
  const client = mqtt.connect(MQTT_URL);

  client.on('connect', () => {
    console.log('[MQTT] Conectado!');
  });

  client.on('error', (err) => {
    console.error('[MQTT] Erro:', err);
  });

  // 3. Ler dados da Serial
  parser.on('data', (line) => {
    // Tenta encontrar JSON na linha (ignora logs de debug que não sejam JSON)
    try {
      const trimmed = line.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const data = JSON.parse(trimmed);
        
        // Log para ver o que está a passar
        console.log('[SERIAL -> MQTT]', data);

        // Publicar no MQTT
        if (client.connected) {
          client.publish(MQTT_TOPIC, JSON.stringify(data));
        }
      } else {
        // Apenas log de debug do Arduino (não é JSON)
        console.log('[ARDUINO LOG]', trimmed);
      }
    } catch (err) {
      console.error('[ERRO PARSE]', err.message, line);
    }
  });

  port.on('error', (err) => {
    console.error('[SERIAL ERROR]', err.message);
  });
}
