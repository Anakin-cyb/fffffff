import sys
print("Python:", sys.version)
try:
    import flask
    print("Flask: OK")
except Exception as e:
    print("Flask: MISSING", e)
try:
    import serial
    print("PySerial: OK")
except Exception as e:
    print("PySerial: MISSING", e)
try:
    import yaml
    print("PyYAML: OK")
except Exception as e:
    print("PyYAML: MISSING", e)
