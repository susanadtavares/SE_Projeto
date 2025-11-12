#include <Arduino.h>
#include <DHT.h>

#define DHTPIN 10
#define DHTTYPE DHT22
#define MQ135_PIN A0

int ledVermelho = 11;
int ledAmarelo = 12;
int ledVerde = 13;
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

  pinMode(ledVermelho, OUTPUT);
  pinMode(ledAmarelo, OUTPUT);
  pinMode(ledVerde, OUTPUT);
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
  humidityVal = dht.readHumidity();
  tempValC = dht.readTemperature();
  heatIndexC = dht.computeHeatIndex(tempValC, humidityVal, false);
  gasValue = analogRead(MQ135_PIN);

  int delta = gasValue - baseValue;
  if (delta < 0) delta = 0;
  float co2ppm = 400 + (delta * 3.5);

  Serial.print("Temp: ");
  Serial.print(tempValC);
  Serial.print(" °C | Hum: ");
  Serial.print(humidityVal);
  Serial.print(" % | MQ135: ");
  Serial.print(gasValue);
  Serial.print(" | CO₂ estimado: ");
  Serial.println(co2ppm);

  estadoMq = (co2ppm < maxCo) ? "seguro" : "alerta";
  estadoDht = (tempValC < maxTemp) ? "seguro" : "alerta";

  if (estadoMq == "alerta" && estadoDht == "alerta")
    estado = "perigo";
  else if (estadoMq == "alerta" || estadoDht == "alerta")
    estado = "alerta";
  else
    estado = "seguro";

  if (estado == "seguro") {
    digitalWrite(ledVerde, HIGH);
    digitalWrite(ledAmarelo, LOW);
    digitalWrite(ledVermelho, LOW);
  } else if (estado == "alerta") {
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, HIGH);
    digitalWrite(ledVermelho, LOW);
  } else {
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, LOW);
    digitalWrite(ledVermelho, HIGH);
    delay(150);
    digitalWrite(ledVermelho, LOW);
  }

  delay(500);
}
