/*
 * ResQSync - ambulance unit (ESP32 + NEO-6M GPS)                     *** UNTESTED TEMPLATE ***
 *
 * Sends GPS position + speed to the backend every 3 seconds:
 *     POST /api/hardware/vehicle
 *
 * Wiring (change the pins below if yours differ)
 *     NEO-6M TX -> ESP32 GPIO16 (RX2)      NEO-6M RX -> ESP32 GPIO17 (TX2)
 *     NEO-6M VCC -> 3V3 or 5V (check your module)      GND -> GND
 *
 * Arduino IDE: install the "esp32" board package and the library "TinyGPSPlus" (Mikal Hart).
 * This sketch was written against the backend's documented contract and has NOT been
 * compiled or run on real hardware - treat it as a starting point.
 *
 * Optional sensors: add fuel_level (0-100) and temperature (deg C) to the JSON below
 * once you read them (e.g. analogRead / DS18B20).
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPSPlus.h>

// ---- CONFIGURE ----------------------------------------------------------------
const char* WIFI_SSID      = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD  = "YOUR_WIFI_PASSWORD";
// IP of the PC running `python app.py` (start it with RESQ_HOST=0.0.0.0 so the ESP32 can reach it)
const char* API_BASE       = "http://192.168.1.20:5000";
const char* API_KEY        = "";              // same value as RESQ_HARDWARE_KEY, "" if not used
const char* VEHICLE_NUMBER = "DL01AB1234";    // must exist in the vehicles table
const unsigned long SEND_INTERVAL_MS = 3000;
// --------------------------------------------------------------------------------

HardwareSerial gpsSerial(2);
TinyGPSPlus gps;
unsigned long lastSend = 0;

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " connected" : " FAILED (will retry)");
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    return;
  }

  // valid JSON, built by hand to avoid extra libraries
  String body = "{\"vehicle_number\":\"" + String(VEHICLE_NUMBER) + "\"";
  if (gps.location.isValid()) {
    body += ",\"latitude\":" + String(gps.location.lat(), 7);
    body += ",\"longitude\":" + String(gps.location.lng(), 7);
  }
  if (gps.speed.isValid()) {
    body += ",\"speed\":" + String(gps.speed.kmph(), 1);
  }
  body += "}";

  HTTPClient http;
  http.begin(String(API_BASE) + "/api/hardware/vehicle");
  http.addHeader("Content-Type", "application/json");
  if (strlen(API_KEY) > 0) {
    http.addHeader("X-API-Key", API_KEY);
  }
  int code = http.POST(body);
  Serial.printf("POST vehicle -> HTTP %d  %s\n", code, body.c_str());
  if (code > 0) {
    // the response contains the current emergency assignment, e.g. "status":"ASSIGNED"
    String response = http.getString();
    response.replace(" ", "");
    response.replace("\n", "");
    if (response.indexOf("\"emergency\":null") < 0) {
      Serial.println("  -> dispatched to an emergency");   // e.g. switch on a buzzer / LED here
    }
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);   // RX2 = 16, TX2 = 17
  connectWifi();
}

void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();
    sendTelemetry();
  }
}
