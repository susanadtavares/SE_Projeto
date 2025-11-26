// ============================================
// VERSÃO SERIAL (sem WiFi) - Para usar com Python
// ============================================
// Este código é para Arduino Uno/Nano conectado via USB ao PC
// O Python vai ler os dados da porta serial e enviar para MQTT

#include <DHT.h>

// Configuração DHT11/DHT22
#define DHTPIN 2          // Pino digital onde está ligado o DHT
#define DHTTYPE DHT11     // Muda para DHT22 se for esse o teu sensor
DHT dht(DHTPIN, DHTTYPE);

// Configuração MQ-135
#define MQ135_PIN A0      // Pino analógico do MQ-135

void setup() {
  Serial.begin(9600);
  
  // Inicializar DHT
  dht.begin();
  
  // Configurar pino MQ-135
  pinMode(MQ135_PIN, INPUT);
  
  Serial.println("Sistema iniciado!");
  delay(2000); // Aguardar 2 segundos para o sensor estabilizar
}

void loop() {
  // Ler sensores
  float temperatura = lerTemperatura();
  float humidade = lerHumidade();
  int qualidadeAr = lerQualidadeAr();
  
  // Enviar dados no formato JSON para o Python
  Serial.print("{\"temp\":");
  Serial.print(temperatura, 2);
  Serial.print(",\"hum\":");
  Serial.print(humidade, 2);
  Serial.print(",\"aqi\":");
  Serial.print(qualidadeAr);
  Serial.println("}");
  
  // Aguardar 2 segundos antes da próxima leitura
  delay(2000);
}

// Função para ler temperatura do DHT
float lerTemperatura() {
  float temp = dht.readTemperature();
  
  if (isnan(temp)) {
    Serial.println("Erro ao ler temperatura!");
    return 0.0;
  }
  
  return temp;
}

// Função para ler humidade do DHT
float lerHumidade() {
  float hum = dht.readHumidity();
  
  if (isnan(hum)) {
    Serial.println("Erro ao ler humidade!");
    return 0.0;
  }
  
  return hum;
}

// Função para ler qualidade do ar (MQ-135)
int lerQualidadeAr() {
  // Ler valor analógico do MQ-135 (0-1023)
  int leitura = analogRead(MQ135_PIN);
  
  // Mapear para escala AQI simplificada (0-500)
  int aqi = map(leitura, 0, 1023, 0, 500);
  
  // Limitar valores
  aqi = constrain(aqi, 0, 500);
  
  return aqi;
}
