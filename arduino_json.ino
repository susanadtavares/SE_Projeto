// ========================
//     BIBLIOTECAS
// ========================
#include <DHT.h>
#include <MQUnifiedsensor.h>

// ========================
//     DHT22
// ========================
#define DHTPIN 2
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ========================
//     MQ-2 (MQUnifiedsensor)
// ========================
#define BOARD "Arduino UNO"
#define MQ_PIN A0
#define VOLT_RES 5.0
#define ADC_RES_BITS 10
#define RATIO_CLEAN_AIR 9.83

MQUnifiedsensor MQ2(BOARD, VOLT_RES, ADC_RES_BITS, MQ_PIN, "MQ-2");

float r0 = 0;

// ========================
//     SETUP
// ========================
void setup() {
  Serial.begin(9600);
  Serial.println("===== INICIAR SENSORES =====");

  // ---- DHT22 ----
  Serial.println("Inicializando DHT22...");
  dht.begin();

  // ---- MQ-2 ----
  Serial.println("MQ-2: inicializacao");
  MQ2.setRegressionMethod(1);  // método linear
  MQ2.setA(36974);             // CO curve
  MQ2.setB(-3.109);
  MQ2.init();

  // Aquecimento
  Serial.print("A aquecer MQ-2 (30 s)...");
  for (int i = 0; i < 30; i++) {
    MQ2.update();
    delay(1000);
  }
  Serial.println(" ok");

  // Calibração
  Serial.print("A calibrar R0...");
  int n = 10;
  for (int i = 0; i < n; i++) {
    MQ2.update();
    r0 += MQ2.calibrate(RATIO_CLEAN_AIR);
    delay(200);
  }
  r0 /= n;
  MQ2.setR0(r0);

  Serial.print(" R0 = ");
  Serial.println(r0, 2);

  if (isinf(r0) || r0 <= 0) {
    Serial.println("ERRO: R0 invalido. Verifica ligacoes do MQ-2.");
    while (1);
  }

  Serial.println("Sensores prontos!");
  Serial.println("============================");
}

// ========================
//     LOOP
// ========================
void loop() {

  // ---- Ler DHT22 ----
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("ERRO: Falha ao ler DHT22!");
  }

  // ---- Ler MQ-2 ----
  MQ2.update();
  float co_ppm = MQ2.readSensor();

  // ---- ENVIAR JSON para Python/MQTT ----
  Serial.print("{\"temp\":");
  Serial.print(isnan(t) ? 0.0 : t, 2);
  Serial.print(",\"hum\":");
  Serial.print(isnan(h) ? 0.0 : h, 2);
  Serial.print(",\"aqi\":");
  Serial.print((isnan(co_ppm) || isinf(co_ppm)) ? 0 : (int)co_ppm);
  Serial.println("}");

  delay(2000);
}
