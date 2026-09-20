"""
ResQSync - hardware simulator (no ESP32 needed).

Acts like the real devices would, using only the documented hardware endpoints:

  * one ambulance unit   -> POST /api/hardware/vehicle every tick (GPS + sensors);
                            when the backend has dispatched it, it drives towards the
                            emergency / hospital (straight line, like the backend's route)
  * N junction units     -> POST /api/hardware/node every tick with the LED state they
                            currently show; they obey the backend's targetState
                            (GREEN = hold green for the ambulance, AUTO = normal cycle)

Usage (backend must be running, demo data seeded with `python migrate.py --seed-demo`):

    python simulator.py
    python simulator.py --api http://127.0.0.1:5000 --vehicle DL01AB1234 --interval 2
    python simulator.py --key mysecret            # if the backend runs with RESQ_HARDWARE_KEY
    python simulator.py --ticks 30                # stop after 30 ticks (default: run until Ctrl+C)

Then create an emergency in the dashboard and assign this vehicle: the marker starts
moving on the Live Map and the junction LEDs on the route switch to GREEN.
"""
import argparse
import json
import math
import time
import urllib.error
import urllib.request

# junction name -> signal name (matches `python migrate.py --seed-demo`)
DEFAULT_NODES = {
    "DEMO-NODE-1": "DEMO-SIGNAL-1",
    "DEMO-NODE-2": "DEMO-SIGNAL-2",
    "DEMO-NODE-3": "DEMO-SIGNAL-3",
    "DEMO-NODE-FAR": "DEMO-SIGNAL-FAR",
}
CYCLE = ["RED"] * 4 + ["GREEN"] * 4 + ["YELLOW"] * 1  # normal light cycle in ticks


def call(api, key, method, path, body=None):
    headers = {"Content-Type": "application/json"}
    if key:
        headers["X-API-Key"] = key
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(api + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            return response.status, json.loads(response.read().decode() or "null")
    except urllib.error.HTTPError as error:
        try:
            return error.code, json.loads(error.read().decode())
        except ValueError:
            return error.code, None
    except (urllib.error.URLError, OSError) as error:
        return 0, {"error": str(error)}


def metres_between(a, b):
    lat = math.radians((a[0] + b[0]) / 2)
    dy = (b[0] - a[0]) * 111320.0
    dx = (b[1] - a[1]) * 111320.0 * math.cos(lat)
    return math.hypot(dx, dy)


def step_towards(position, target, metres):
    distance = metres_between(position, target)
    if distance <= metres or distance == 0:
        return target, distance
    fraction = metres / distance
    return (
        position[0] + (target[0] - position[0]) * fraction,
        position[1] + (target[1] - position[1]) * fraction,
    ), metres


def main():
    parser = argparse.ArgumentParser(description="ResQSync hardware simulator")
    parser.add_argument("--api", default="http://127.0.0.1:5000")
    parser.add_argument("--key", default="", help="X-API-Key (RESQ_HARDWARE_KEY)")
    parser.add_argument("--vehicle", default="DL01AB1234", help="vehicle_number to simulate")
    parser.add_argument("--interval", type=float, default=2.0, help="seconds per tick")
    parser.add_argument("--speed-kmh", type=float, default=50.0, help="simulated driving speed (max 300)")
    parser.add_argument("--time-scale", type=float, default=1.0,
                        help="fast-forward: drive this many times farther per tick (speed shown stays realistic)")
    parser.add_argument("--nodes", default=",".join(DEFAULT_NODES), help="comma separated node names")
    parser.add_argument("--ticks", type=int, default=0, help="stop after N ticks (0 = forever)")
    args = parser.parse_args()

    api = args.api.rstrip("/")
    nodes = [n.strip() for n in args.nodes.split(",") if n.strip()]

    status, vehicle = call(api, args.key, "GET", f"/api/vehicles/{args.vehicle}")
    if status != 200:
        print(f"Vehicle {args.vehicle} not found ({status}). Check --vehicle / the backend.")
        return 1
    position = (vehicle["latitude"] or 28.6139, vehicle["longitude"] or 77.2090)
    speed_kmh = min(max(args.speed_kmh, 1.0), 300.0)  # the backend rejects speed > 400 km/h
    metres_per_tick = speed_kmh / 3.6 * args.interval * max(args.time_scale, 0.1)

    print(f"Simulating {args.vehicle} + {len(nodes)} junction(s) against {api}  (Ctrl+C to stop)\n")
    tick = 0
    try:
        while True:
            tick += 1
            speed = 0.0
            note = "idle (no emergency assigned)"

            # ---- ambulance unit -------------------------------------------------
            status, emergency = call(api, args.key, "GET", f"/api/vehicles/{args.vehicle}/emergency")
            if status == 200 and emergency:
                _, route = call(api, args.key, "GET", f"/api/emergencies/{emergency['emergencyId']}/route")
                coordinates = (route or {}).get("coordinates") or []
                if len(coordinates) >= 2 and emergency["status"] not in ("AT_PATIENT",):
                    destination = tuple(coordinates[-1] if emergency["status"] in (
                        "PATIENT_PICKED_UP", "TRANSPORT_TO_HOSPITAL") else coordinates[1])
                    position, moved = step_towards(position, destination, metres_per_tick)
                    speed = speed_kmh if moved > 0 else 0.0
                    note = f"{emergency['status']} -> driving to {destination[0]:.4f},{destination[1]:.4f}"
                else:
                    note = f"{emergency['status']} (waiting)"

            status, result = call(api, args.key, "POST", "/api/hardware/vehicle", {
                "vehicle_number": args.vehicle,
                "latitude": round(position[0], 7),
                "longitude": round(position[1], 7),
                "speed": round(speed, 1),
                "fuel_level": 78.5,
                "temperature": 32.0,
            })
            print(f"[{tick:03d}] VEHICLE {args.vehicle}: {position[0]:.5f},{position[1]:.5f}  "
                  f"{speed:4.0f} km/h  {note}  (HTTP {status})")
            if status != 200:
                print(f"      !! backend answered {status}: {result}")

            # ---- junction units ---------------------------------------------------
            leds = []
            for name in nodes:
                signal = DEFAULT_NODES.get(name, name.replace("NODE", "SIGNAL"))
                # 1) what does the backend want this junction to do?
                _, command = call(api, args.key, "GET", f"/api/hardware/node/{name}/command")
                hold_green = any(c.get("targetState") == "GREEN" for c in (command or {}).get("commands", []))
                # 2) drive the "LED"
                led = "GREEN" if hold_green else CYCLE[(tick + hash(name) % len(CYCLE)) % len(CYCLE)]
                # 3) report heartbeat + LED state
                status, _ = call(api, args.key, "POST", "/api/hardware/node", {
                    "node_id": name,
                    "congestion_level": "LOW",
                    "signals": [{"signal_name": signal, "status": led}],
                })
                leds.append(f"{name.replace('DEMO-NODE-', 'N')}={led}{'*' if hold_green else ''}")
            print(f"      JUNCTIONS  {'  '.join(leds)}   (* = emergency override)")

            if args.ticks and tick >= args.ticks:
                break
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nstopped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
