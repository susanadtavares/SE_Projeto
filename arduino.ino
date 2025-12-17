#include <DHT.h>
#include <DHT_U.h>
#include <Arduino.h>

//O DHT11 liga-se com o pino VCC aos 5V, o GND ao GND e o pino de dados a um pino digital
//O DHT22 liga-se da mesma forma: VCC aos 5V, GND ao GND e dados a um pino digital. Também necessita de um resistor pull-up
#define DHTPIN 10
#define DHTTYPE DHT11
#define MQ135_PIN A4


String estado = "seguro";
String estadoDht = "seguro";
String estadoMq = "seguro";

DHT dht(DHTPIN, DHTTYPE);

float humidityVal;
float tempValC;
float heatIndexC;
int gasValue;
int baseValue = 0;

float maxTemp = 23;
float maxCo = 600;

void setup() {
  Serial.begin(9600);
  dht.begin();
  delay(1500); // tempo para o DHT22 estabilizar

  pinMode(MQ135_PIN, INPUT);

  Serial.println("Calibrar MQ135 (aguardar 5 segundos com ar limpo)...");

  long soma = 0;
  for (int i = 0; i < 50; i++) {
    int leitura = analogRead(MQ135_PIN);
    soma += leitura;
    Serial.print("Leitura calibracao: ");
    Serial.println(leitura);
    delay(100);
  }

  baseValue = soma / 50;

  Serial.print("Calibração concluída. Valor base: ");
  Serial.println(baseValue);
  delay(1000);
}

void loop() {

  // ======== LEITURA DO DHT22 COM VERIFICAÇÃO ========
  humidityVal = dht.readHumidity();
  tempValC = dht.readTemperature();

  if (isnan(humidityVal) || isnan(tempValC)) { // Leitura não está a servir para alerta por questões de variação de ambiente
    Serial.println("Falha ao ler DHT22! Ignorando leitura...");
    delay(2000);
    return;
  }

  heatIndexC = dht.computeHeatIndex(tempValC, humidityVal, false);

  // ======== MQ135 / CO2 ========
  gasValue = analogRead(MQ135_PIN); // Lê o valor analógico do sensor (0-1023, dependendo da tensão no pino).
  int delta = gasValue - baseValue;  // Calcula a diferença entre a leitura atual e o valor base calibrado.
  if (delta < 0) delta = 0; // Garante que delta não seja negativo (evita valores inválidos).

  float co2ppm = 400 + (delta * 3.5); // Estima a concentração de CO₂ em ppm

  // ======== SERIAL DEBUG ========
  Serial.print("Temp: ");
  Serial.print(tempValC);
  Serial.print(" °C | Hum: ");
  Serial.print(humidityVal);
  Serial.print(" % | MQ135: ");
  Serial.print(gasValue);
  Serial.print(" | CO₂ estimado: ");
  Serial.println(co2ppm);

  // ======== ESTADOS ========
  estadoMq = (co2ppm < maxCo) ? "seguro" : "alerta";
  estadoDht = (tempValC < maxTemp) ? "seguro" : "alerta";

  if (estadoMq == "alerta" && estadoDht == "alerta")
    estado = "perigo";
  else if (estadoMq == "alerta" || estadoDht == "alerta")
    estado = "alerta";
  else
    estado = "seguro";

  delay(2000); 
}
