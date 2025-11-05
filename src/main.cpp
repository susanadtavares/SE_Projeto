#include <Arduino.h>

int ledVermelho = 11;
int ledAmarelo = 12;
int ledVerde = 13;
String estado = "perigo";

void setup() {
  pinMode(ledVermelho, OUTPUT);
  pinMode(ledAmarelo, OUTPUT);
  pinMode(ledVerde, OUTPUT);
}

void loop() {
  if (estado == "seguro") {
    digitalWrite(ledVerde, HIGH);
    digitalWrite(ledAmarelo, LOW);
    digitalWrite(ledVermelho, LOW);
  } 
  else if (estado == "alerta") {
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, HIGH);
    digitalWrite(ledVermelho, LOW);
  } 
  else if (estado == "perigo") {
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, LOW);
    digitalWrite(ledVermelho, HIGH);
    delay(150);
    digitalWrite(ledVermelho, LOW);
    delay(150);
  }
}
