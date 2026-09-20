"""
ResQSync - end-to-end check of Hardware -> Backend -> MySQL -> API (what the frontend reads).

Prerequisites
  1. backend running:            cd backend && python app.py
  2. schema + demo data present: python migrate.py --seed-demo
  3. (optional) if you started the backend with RESQ_HARDWARE_KEY, set the same
     variable here:  set RESQ_HARDWARE_KEY=...   (Windows)   /   export RESQ_HARDWARE_KEY=...

Run:   python tests/e2e_check.py            (uses http://127.0.0.1:5000)
       RESQ_API=http://192.168.1.20:5000 python tests/e2e_check.py

The test creates and then resolves/cancels its own emergencies. It leaves a few events in
the events table and moves the sample vehicle around, then puts it back.
"""
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.getenv("RESQ_API", "http://127.0.0.1:5000").rstrip("/")
KEY = os.getenv("RESQ_HARDWARE_KEY", "")
VEHICLE = os.getenv("RESQ_TEST_VEHICLE", "DL01AB1234")

passed = failed = 0


def call(method, path, body=None, hardware=False):
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if hardware and KEY:
        headers["X-API-Key"] = KEY
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, json.loads(response.read().decode() or "null")
    except urllib.error.HTTPError as error:
        raw = error.read().decode()
        try:
            return error.code, json.loads(raw)
        except ValueError:
            return error.code, {"raw": raw}


def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}   {detail}")


def section(title):
    print(f"\n== {title}")


def main():
    section("0. backend reachable + demo data present")
    try:
        status, health = call("GET", "/api/health")
    except Exception as error:  # noqa: BLE001
        print(f"Cannot reach {BASE}: {error}\nStart the backend first (python app.py).")
        return 2
    check("health endpoint ok + database ok", status == 200 and health.get("database") == "ok", health)

    _, signals = call("GET", "/api/traffic-signals")
    names = {s["signal_name"] for s in signals}
    if not {"DEMO-SIGNAL-1", "DEMO-SIGNAL-2", "DEMO-SIGNAL-3", "DEMO-SIGNAL-FAR"} <= names:
        print("Demo data missing. Run:  python migrate.py --seed-demo")
        return 2
    _, nodes = call("GET", "/api/traffic-nodes")
    demo_nodes = {n["node_name"]: n["id"] for n in nodes if n["node_name"].startswith("DEMO-NODE-")}
    _, hospitals = call("GET", "/api/hospitals")
    check("demo hospitals present", any("demo coordinates" in (h["address"] or "") for h in hospitals))
    status, vehicle = call("GET", f"/api/vehicles/{VEHICLE}")
    check(f"test vehicle {VEHICLE} exists and is AVAILABLE", status == 200 and vehicle["status"] == "AVAILABLE", vehicle)
    if status != 200:
        return 2
    home = (vehicle["latitude"], vehicle["longitude"])

    section("1. hardware -> backend: junction heartbeats")
    status, ping = call("GET", "/api/hardware/ping")
    check("hardware ping", status == 200 and ping["ok"])
    for name, node_id in demo_nodes.items():
        status, res = call("POST", "/api/hardware/node", {"node_id": name, "congestion_level": "LOW"}, hardware=True)
        check(f"heartbeat {name}", status == 200 and res["ok"], res)
    status, res = call("POST", "/api/hardware/node", {"node_id": "NOPE"}, hardware=True)
    check("heartbeat for unknown node -> 404", status == 404, res)
    status, res = call("POST", "/api/hardware/node", {"node_id": "DEMO-NODE-1", "congestion_level": "SUPER"}, hardware=True)
    check("invalid congestion level -> 400", status == 400, res)

    section("2. hardware -> backend: vehicle GPS + sensors")
    status, res = call("POST", "/api/hardware/vehicle",
                       {"vehicle_number": VEHICLE, "latitude": home[0], "longitude": home[1],
                        "speed": 0, "fuel_level": 80, "temperature": 31}, hardware=True)
    check("vehicle telemetry accepted", status == 200 and res["ok"], res)
    status, res = call("POST", "/api/hardware/vehicle", {"vehicle_number": VEHICLE, "latitude": 95, "longitude": 0}, hardware=True)
    check("latitude out of range -> 400", status == 400, res)
    status, res = call("POST", "/api/hardware/vehicle", {"vehicle_number": "NOPE-000", "latitude": 1, "longitude": 1}, hardware=True)
    check("unknown vehicle -> 404", status == 404, res)

    section("3. dashboard summary reflects hardware")
    _, summary = call("GET", "/api/analytics/dashboard")
    base_total = summary["totalEmergencies"]
    check("connected traffic nodes == 4 (all demo nodes beat just now)", summary["connectedTrafficNodes"] == 4, summary)
    check("gps connected vehicles >= 1", summary["gpsConnectedVehicles"] >= 1, summary)
    check("system health ONLINE", summary["systemHealth"] == "ONLINE", summary)
    check("availableCorridors == 4 before any corridor", summary["availableCorridors"] == 4, summary)
    check("no active corridor yet", summary["activeCorridors"] == 0 and summary["activeCorridor"] is None, summary)

    section("4. emergency create (frontend -> backend -> DB)")
    status, res = call("POST", "/api/emergencies", {"type": "AMBULANCE", "location": "E2E test junction"})
    check("missing coordinates is allowed (text location only)", status == 201, res)
    text_only_id = res.get("id")
    status, res = call("POST", "/api/emergencies", {"type": "AMBULANCE"})
    check("missing location -> 400", status == 400, res)
    status, res = call("POST", "/api/emergencies", {"type": "AMBULANCE", "location": "x", "latitude": "abc", "longitude": 1})
    check("bad latitude -> 400", status == 400, res)
    status, res = call("POST", "/api/emergencies",
                       {"type": "AMBULANCE", "location": "E2E north-east", "priority": "CRITICAL",
                        "latitude": 28.6304, "longitude": 77.2177})
    check("emergency created", status == 201 and res["id"], res)
    eid = res["id"]
    _, summary = call("GET", "/api/analytics/dashboard")
    check("totalEmergencies incremented by 2", summary["totalEmergencies"] == base_total + 2, summary)
    status, em = call("GET", f"/api/emergencies/{eid}")
    check("emergency readable, status ACTIVE, has coordinates", status == 200 and em["status"] == "ACTIVE" and em["hasCoordinates"], em)
    status, res = call("POST", f"/api/emergencies/{text_only_id}/cancel", {"reason": "e2e cleanup"})
    check("cancel the text-only emergency", status == 200 and res["emergency"]["status"] == "CANCELLED", res)

    section("5. vehicle assignment + green corridor")
    status, cands = call("GET", f"/api/emergencies/{eid}/candidates")
    check("candidates list nearest available vehicle first", status == 200 and cands and cands[0]["vehicleNumber"] == VEHICLE and cands[0]["distanceKm"] is not None, cands)
    status, res = call("POST", f"/api/emergencies/{eid}/assign", {"vehicleId": vehicle["vehicleId"]})
    check("assign vehicle", status == 200 and res["emergency"]["status"] == "ASSIGNED", res)
    corridor = res.get("corridor") or {}
    check("corridor activated with the 3 on-route signals (not the FAR one)", corridor.get("activated") and corridor.get("signals") == 3, corridor)
    status, res = call("POST", f"/api/emergencies/{eid}/assign", {"vehicleId": vehicle["vehicleId"]})
    check("assigning the same vehicle again -> 409", status == 409, res)
    _, other = call("POST", "/api/emergencies", {"type": "AMBULANCE", "location": "E2E second", "latitude": 28.61, "longitude": 77.21})
    status, res = call("POST", f"/api/emergencies/{other['id']}/assign", {"vehicleId": vehicle["vehicleId"]})
    check("busy vehicle cannot be assigned to another emergency -> 409", status == 409, res)
    call("POST", f"/api/emergencies/{other['id']}/cancel", {"reason": "e2e cleanup"})

    section("6. backend -> hardware: node commands (LED / signal control)")
    status, res = call("GET", "/api/hardware/node/DEMO-NODE-2/command", hardware=True)
    cmd = (res.get("commands") or [{}])[0]
    check("DEMO-NODE-2 told to hold GREEN", status == 200 and cmd.get("targetState") == "GREEN" and cmd.get("emergencyOverride"), res)
    status, res = call("GET", "/api/hardware/node/DEMO-NODE-FAR/command", hardware=True)
    cmd = (res.get("commands") or [{}])[0]
    check("DEMO-NODE-FAR keeps normal cycle (AUTO)", cmd.get("targetState") == "AUTO", res)
    status, res = call("POST", "/api/hardware/signal", {"signal_name": "DEMO-SIGNAL-2", "status": "GREEN"}, hardware=True)
    check("hardware reports signal state", status == 200 and res["emergencyOverride"], res)
    status, res = call("POST", "/api/hardware/signal", {"signal_name": "DEMO-SIGNAL-2", "status": "PURPLE"}, hardware=True)
    check("invalid signal state -> 400", status == 400, res)
    _, summary = call("GET", "/api/analytics/dashboard")
    check("activeCorridors == 1 and activeCorridor details present", summary["activeCorridors"] == 1 and summary["activeCorridor"]["emergencyId"] == eid, summary)
    check("availableCorridors == 1 (only the FAR junction is free)", summary["availableCorridors"] == 1, summary)

    section("7. live location -> snapshot (what the map polls)")
    mid = (28.6222, 77.2134)
    status, res = call("POST", "/api/hardware/vehicle",
                       {"vehicle_number": VEHICLE, "latitude": mid[0], "longitude": mid[1], "speed": 42}, hardware=True)
    check("moving vehicle telemetry", status == 200 and res["emergency"]["emergencyId"] == eid, res)
    status, snap = call("GET", "/api/live/snapshot")
    check("snapshot ok", status == 200)
    sv = next(v for v in snap["vehicles"] if v["vehicleNumber"] == VEHICLE)
    check("snapshot vehicle at new position, ONLINE, DISPATCHED", abs(sv["latitude"] - mid[0]) < 1e-6 and sv["gpsStatus"] == "ONLINE" and sv["status"] == "DISPATCHED", sv)
    se = next(e for e in snap["emergencies"] if e["emergencyId"] == eid)
    check("snapshot emergency has route, distance and ETA", len(se["route"]) >= 2 and se["distanceKm"] is not None and se["etaMinutes"] is not None, se)
    check("snapshot has corridor with 3 signals", any(c["emergencyId"] == eid and len(c["signals"]) == 3 for c in snap["corridors"]), snap["corridors"])
    check("snapshot has hospitals + traffic nodes", len(snap["hospitals"]) >= 3 and len(snap["trafficNodes"]) >= 4)

    section("8. status flow + hospital choice")
    for st in ("EN_ROUTE_TO_PATIENT", "AT_PATIENT"):
        status, res = call("PATCH", f"/api/emergencies/{eid}/status", {"status": st})
        check(f"status -> {st}", status == 200 and res["emergency"]["status"] == st, res)
    status, res = call("PATCH", f"/api/emergencies/{eid}/status", {"status": "PATIENT_PICKED_UP"})
    check("status -> PATIENT_PICKED_UP picks nearest hospital", status == 200 and res["emergency"]["hospitalId"], res)
    hospital_id = res["emergency"]["hospitalId"]
    status, res = call("PATCH", f"/api/emergencies/{eid}/status", {"status": "TRANSPORT_TO_HOSPITAL"})
    check("status -> TRANSPORT_TO_HOSPITAL", status == 200 and res["emergency"]["hospitalId"] == hospital_id, res)
    status, res = call("PATCH", f"/api/emergencies/{eid}/status", {"status": "FLYING"})
    check("unknown status -> 400", status == 400, res)
    status, route = call("GET", f"/api/emergencies/{eid}/route")
    check("route endpoint returns vehicle -> hospital", status == 200 and len(route["coordinates"]) == 2, route)

    section("9. resolve releases everything")
    status, res = call("PATCH", f"/api/emergencies/{eid}/status", {"status": "RESOLVED"})
    check("resolve", status == 200 and res["emergency"]["status"] == "RESOLVED" and res["emergency"]["resolvedAt"], res)
    _, v = call("GET", f"/api/vehicles/{VEHICLE}")
    check("vehicle back to AVAILABLE", v["status"] == "AVAILABLE" and v["currentEmergencyId"] is None, v)
    _, sigs = call("GET", "/api/signals")
    demo = [s for s in sigs if s["name"].startswith("DEMO-SIGNAL-")]
    check("all demo signals released (override off, RED restored)", all(not s["emergencyOverride"] and s["signalState"] == "RED" for s in demo), demo)
    status, res = call("PATCH", f"/api/emergencies/{eid}/status", {"status": "AT_PATIENT"})
    check("resolved emergency cannot be reopened -> 409", status == 409, res)
    _, summary = call("GET", "/api/analytics/dashboard")
    check("no active corridor after resolve", summary["activeCorridors"] == 0 and summary["availableCorridors"] == 4, summary)
    _, events = call("GET", f"/api/emergencies/{eid}/events")
    types = {e["event_type"] for e in events}
    check("event log has the whole story", {"EMERGENCY_CREATED", "VEHICLE_ASSIGNED", "CORRIDOR_ACTIVATED", "EMERGENCY_STATUS", "CORRIDOR_RELEASED"} <= types, sorted(types))

    section("10. hardware key (only meaningful when RESQ_HARDWARE_KEY is set)")
    if KEY:
        request = urllib.request.Request(BASE + "/api/hardware/vehicle", data=b"{}", headers={"X-API-Key": "wrong", "Content-Type": "application/json"}, method="POST")
        try:
            urllib.request.urlopen(request, timeout=10)
            check("wrong key rejected", False, "request was accepted")
        except urllib.error.HTTPError as error:
            check("wrong key rejected (401)", error.code == 401, error.code)
    else:
        print("  skip  (RESQ_HARDWARE_KEY not set - hardware endpoints are open)")

    # put the sample vehicle back where it was
    call("POST", "/api/hardware/vehicle", {"vehicle_number": VEHICLE, "latitude": home[0], "longitude": home[1], "speed": 0}, hardware=True)

    print(f"\nResult: {passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
