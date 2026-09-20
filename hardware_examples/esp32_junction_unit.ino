/*
 * ResQSync - junction unit (ESP32 + 3 LEDs = one traffic signal)      *** UNTESTED TEMPLATE ***
 *
 * Every 2 seconds it
 *   1. POSTs a heartbeat + the LED state it currently shows:  POST /api/hardware/node
 *   2. reads the "commands" in the response:
 *        targetState "GREEN" -> emergency override: hold GREEN for the ambulance
 *        targetState "AUTO"  -> run the normal RED / GREEN / YELLOW cycle
 *
 * Wiring (220 ohm resistor in series with each LED): RED -> GPIO25, YELLOW -> GPIO26, GREEN -> GPIO27
 *
 * The node and signal names must already exist in the database
 * (python migrate.py --seed-demo creates DEMO-NODE-1 / DEMO-SIGNAL-1 ...).
 *
 * NOT compiled or run on real hardware. It is a demo of the backend contract, NOT a traffic
 * controller: a real junction needs a certified controller with safe transitions
 * (yellow / all-red) and fail-safe behaviour when the network is lost.
 */
#include <WiFi.h>
#include <HTTPClient.h>

// ---- CONFIGURE ----------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_BASE      = "http://192.168.1.20:5000";
const char* API_KEY       = "";                 // RESQ_HARDWARE_KEY, "" if not used
const char* NODE_NAME     = "DEMO-NODE-1";      // traffic_nodes.node_name
const char* SIGNAL_NAME   = "DEMO-SIGNAL-1";    // traffic_signals.signal_name (linked to that node)
const char* CONGESTION    = "LOW";              // LOW / MEDIUM / HIGH (feed from a sensor if you have one)
const int PIN_RED = 25, PIN_YELLOW = 26, PIN_GREEN = 27;
const unsigned long HEARTBEAT_MS = 2000;
// normal cycle durations
const unsigned long RED_MS = 8000, GREEN_MS = 8000, YELLOW_MS = 2000;
// --------------------------------------------------------------------------------

enum Light { RED, GREEN, YELLOW };
Light light = RED;
unsigned long lightSince = 0;
bool holdGreen = false;
unsigned long lastBeat = 0;

const char* lightName(Light l) {
  return l == RED ? "RED" : (l == GREEN ? "GREEN" : "YELLOW");
}

void showLight(Light l) {
  light = l;
  lightSince = millis();
  digitalWrite(PIN_RED, l == RED);
  digitalWrite(PIN_YELLOW, l == YELLOW);
  digitalWrite(PIN_GREEN, l == GREEN);
}

void runCycle() {
  if (holdGreen) {                       // emergency override
    if (light != GREEN) showLight(GREEN);
    return;
  }
  unsigned long elapsed = millis() - lightSince;
  if (light == RED && elapsed >= RED_MS) showLight(GREEN);
  else if (light == GREEN && elapsed >= GREEN_MS) showLight(YELLOW);
  else if (light == YELLOW && elapsed >= YELLOW_MS) showLight(RED);
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(300);
    runCycle();                          // keep the lights running while connecting
  }
}

void heartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    return;
  }
  String body = "{\"node_id\":\"" + String(NODE_NAME) + "\",\"congestion_level\":\"" + String(CONGESTION) +
                "\",\"signals\":[{\"signal_name\":\"" + String(SIGNAL_NAME) + "\",\"status\":\"" +
                String(lightName(light)) + "\"}]}";

  HTTPClient http;
  http.begin(String(API_BASE) + "/api/hardware/node");
  http.addHeader("Content-Type", "application/json");
  if (strlen(API_KEY) > 0) http.addHeader("X-API-Key", API_KEY);
  int code = http.POST(body);
  Serial.printf("POST node -> HTTP %d\n", code);

  if (code == 200) {
    String response = http.getString();
    response.replace(" ", "");           // Flask pretty-prints JSON in debug mode
    response.replace("\n", "");
    holdGreen = response.indexOf("\"targetState\":\"GREEN\"") >= 0;
    Serial.println(holdGreen ? "  override: hold GREEN" : "  normal cycle");
  }
  // if the backend cannot be reached we simply keep the normal cycle (fail-safe for a demo)
  else if (code <= 0) {
    holdGreen = false;
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_YELLOW, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  showLight(RED);
  connectWifi();
}

void loop() {
  runCycle();
  if (millis() - lastBeat >= HEARTBEAT_MS) {
    lastBeat = millis();
    heartbeat();
  }
}
