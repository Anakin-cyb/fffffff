# System Architecture

Laptop / Control Room
  - Flask backend
  - Web dashboard
  - event log

Vehicle Node
  - ESP32
  - GPS
  - emergency switch
  - LoRa
  - OLED
  - microSD black box

Traffic Node
  - Raspberry Pi
  - Raspberry Pi Camera
  - LoRa
  - relay/signal interface
  - display
  - 3 physical buttons
  - 4 status LEDs
  - gas + heat sensors
  - DFPlayer Mini + speaker
  - microSD evidence storage

Communication and authorization should be state-driven. The emergency switch must create a request, not directly force the traffic signal.
