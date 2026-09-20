"""
ResQSync - hardware -> backend -> MySQL endpoints.

Devices (ESP32 / Arduino / Raspberry Pi / any HTTP client) talk to these routes:

  GET  /api/hardware/ping                       connectivity check
  POST /api/hardware/vehicle                    GPS + sensors of an ambulance unit
  POST /api/hardware/node                       heartbeat / congestion of a junction unit
                                                (optionally with the signal states it drives)
  POST /api/hardware/signal                     actual state of a single signal (LED)
  GET  /api/hardware/node/<id|name>/command     what the junction unit must do right now
                                                (emergency override -> GREEN, otherwise AUTO)

Authentication: set the environment variable RESQ_HARDWARE_KEY before starting the backend
and every device must send the header  X-API-Key: <that value>.
If RESQ_HARDWARE_KEY is not set the endpoints are open (fine for a local demo only).
"""

import hmac
import os
from functools import wraps

from flask import Blueprint, jsonify, request

from helpers import (
    NODE_TIMEOUT_SECONDS,
    age_seconds,
    db,
    find_node,
    find_signal,
    find_vehicle,
    iso,
    log_event,
    num,
    parse_coord,
    utcnow,
)

hardware_bp = Blueprint("hardware", __name__)

SIGNAL_STATES = ("RED", "YELLOW", "GREEN", "OFF", "FLASHING")
CONGESTION_LEVELS = ("LOW", "MEDIUM", "HIGH")


def require_hardware_key(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        expected = os.getenv("RESQ_HARDWARE_KEY", "")
        if expected:
            given = request.headers.get("X-API-Key", "")
            if not hmac.compare_digest(given, expected):
                return jsonify({"error": "invalid or missing X-API-Key"}), 401
        return view(*args, **kwargs)

    return wrapper


def _float(data, key, lo, hi):
    """Optional numeric field with range check. Returns float|None, raises ValueError."""
    return parse_coord(data.get(key), lo, hi, key)


# --------------------------------------------------------------------------
# vehicle telemetry
# --------------------------------------------------------------------------
def ingest_vehicle_telemetry(data):
    """
    Store one telemetry sample and refresh the vehicle's live position / last_seen.
    Accepts vehicle_id (numeric id) or vehicle_number ("DL01AB1234") in `vehicle_id`,
    `vehicleId` or `vehicle_number`.
    Returns (payload_dict, http_status).
    """
    ident = data.get("vehicle_id") or data.get("vehicleId") or data.get("vehicle_number")
    if not ident:
        return {"error": "vehicle_id (or vehicle_number) is required"}, 400

    try:
        latitude = _float(data, "latitude", -90, 90)
        longitude = _float(data, "longitude", -180, 180)
        if (latitude is None) != (longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        speed = _float(data, "speed", 0, 400)
        fuel_level = _float(data, "fuel_level", 0, 100)
        temperature = _float(data, "temperature", -60, 250)
    except ValueError as error:
        return {"error": str(error)}, 400

    now = utcnow()
    with db(commit=True) as (conn, cur):
        vehicle = find_vehicle(cur, ident)
        if not vehicle:
            return {"error": f"vehicle '{ident}' not found"}, 404

        cur.execute(
            """
            INSERT INTO telemetry
            (vehicle_id, latitude, longitude, speed, fuel_level, temperature, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (vehicle["id"], latitude, longitude, speed, fuel_level, temperature, now),
        )
        telemetry_id = cur.lastrowid

        if latitude is not None:
            cur.execute(
                "UPDATE vehicles SET latitude = %s, longitude = %s, last_seen = %s, updated_at = %s WHERE id = %s",
                (latitude, longitude, now, now, vehicle["id"]),
            )
        else:  # no GPS fix yet, but the unit is alive
            cur.execute(
                "UPDATE vehicles SET last_seen = %s, updated_at = %s WHERE id = %s",
                (now, now, vehicle["id"]),
            )

        emergency = None
        if vehicle.get("current_emergency_id"):
            cur.execute(
                "SELECT id, type, location, status, latitude, longitude, hospital_id FROM emergencies WHERE id = %s",
                (vehicle["current_emergency_id"],),
            )
            row = cur.fetchone()
            if row:
                emergency = {
                    "emergencyId": row["id"],
                    "type": row["type"],
                    "location": row["location"],
                    "status": row["status"],
                    "latitude": num(row["latitude"]),
                    "longitude": num(row["longitude"]),
                    "hospitalId": row["hospital_id"],
                }

    return {
        "ok": True,
        "telemetryId": telemetry_id,
        "vehicleId": vehicle["id"],
        "vehicleNumber": vehicle["vehicle_number"],
        "emergency": emergency,
        "serverTime": iso(now),
    }, 200


@hardware_bp.route("/api/hardware/ping", methods=["GET"])
def hardware_ping():
    return jsonify(
        {
            "ok": True,
            "serverTime": iso(utcnow()),
            "keyRequired": bool(os.getenv("RESQ_HARDWARE_KEY")),
        }
    )


@hardware_bp.route("/api/hardware/vehicle", methods=["POST"])
@require_hardware_key
def hardware_vehicle():
    result, status = ingest_vehicle_telemetry(request.get_json(silent=True) or {})
    return jsonify(result), status


# --------------------------------------------------------------------------
# traffic node (junction unit)
# --------------------------------------------------------------------------
def node_commands(cur, node_id):
    cur.execute("SELECT * FROM traffic_signals WHERE node_id = %s ORDER BY id", (node_id,))
    commands = []
    for signal in cur.fetchall():
        override = bool(signal.get("emergency_override"))
        commands.append(
            {
                "signalId": signal["id"],
                "name": signal["signal_name"],
                "emergencyOverride": override,
                # GREEN = hold green for the ambulance, AUTO = run the normal cycle
                "targetState": "GREEN" if override else "AUTO",
            }
        )
    return commands


def ingest_node_heartbeat(data):
    ident = data.get("node_id") or data.get("nodeId") or data.get("node_name")
    if not ident:
        return {"error": "node_id (or node_name) is required"}, 400

    try:
        latitude = _float(data, "latitude", -90, 90)
        longitude = _float(data, "longitude", -180, 180)
        if (latitude is None) != (longitude is None):
            raise ValueError("latitude and longitude must be provided together")
    except ValueError as error:
        return {"error": str(error)}, 400

    congestion = data.get("congestion_level") or data.get("congestionLevel")
    if congestion is not None:
        congestion = str(congestion).upper()
        if congestion not in CONGESTION_LEVELS:
            return {"error": "congestion_level must be LOW, MEDIUM or HIGH"}, 400

    reported_signals = data.get("signals") or []
    if not isinstance(reported_signals, list):
        return {"error": "signals must be a list"}, 400
    for item in reported_signals:
        state = str(item.get("status", "")).upper() if isinstance(item, dict) else ""
        if state not in SIGNAL_STATES:
            return {"error": f"each signal needs a status in {', '.join(SIGNAL_STATES)}"}, 400

    now = utcnow()
    with db(commit=True) as (conn, cur):
        node = find_node(cur, ident)
        if not node:
            return {"error": f"traffic node '{ident}' not found"}, 404

        previous_age = age_seconds(node.get("last_heartbeat"), now)
        was_offline = previous_age is None or previous_age > NODE_TIMEOUT_SECONDS

        updates = ["last_heartbeat = %s"]
        params = [now]
        if congestion:
            updates.append("congestion_level = %s")
            params.append(congestion)
        if data.get("status"):
            updates.append("status = %s")
            params.append(str(data["status"]).upper()[:30])
        if latitude is not None:
            updates.append("latitude = %s, longitude = %s")
            params.extend([latitude, longitude])
        params.append(node["id"])
        cur.execute(f"UPDATE traffic_nodes SET {', '.join(updates)} WHERE id = %s", tuple(params))

        for item in reported_signals:
            signal = find_signal(cur, item.get("signal_id") or item.get("signalId") or item.get("signal_name"))
            if signal and signal.get("node_id") == node["id"]:
                cur.execute(
                    "UPDATE traffic_signals SET status = %s, updated_at = %s WHERE id = %s",
                    (str(item["status"]).upper(), now, signal["id"]),
                )

        if was_offline:
            log_event(
                cur,
                "NODE_ONLINE",
                f"Traffic node {node['node_name']} is online",
                latitude=num(node.get("latitude")),
                longitude=num(node.get("longitude")),
                source="HARDWARE",
            )

        commands = node_commands(cur, node["id"])

    return {
        "ok": True,
        "nodeId": node["id"],
        "nodeName": node["node_name"],
        "commands": commands,
        "serverTime": iso(now),
    }, 200


@hardware_bp.route("/api/hardware/node", methods=["POST"])
@require_hardware_key
def hardware_node():
    result, status = ingest_node_heartbeat(request.get_json(silent=True) or {})
    return jsonify(result), status


@hardware_bp.route("/api/hardware/node/<ident>/command", methods=["GET"])
@require_hardware_key
def hardware_node_command(ident):
    with db() as (conn, cur):
        node = find_node(cur, ident)
        if not node:
            return jsonify({"error": f"traffic node '{ident}' not found"}), 404
        return jsonify(
            {
                "nodeId": node["id"],
                "commands": node_commands(cur, node["id"]),
                "serverTime": iso(utcnow()),
            }
        )


# --------------------------------------------------------------------------
# single signal state (LED report)
# --------------------------------------------------------------------------
@hardware_bp.route("/api/hardware/signal", methods=["POST"])
@require_hardware_key
def hardware_signal():
    data = request.get_json(silent=True) or {}
    ident = data.get("signal_id") or data.get("signalId") or data.get("signal_name")
    state = str(data.get("status", "")).upper()
    if not ident:
        return jsonify({"error": "signal_id (or signal_name) is required"}), 400
    if state not in SIGNAL_STATES:
        return jsonify({"error": f"status must be one of {', '.join(SIGNAL_STATES)}"}), 400

    with db(commit=True) as (conn, cur):
        signal = find_signal(cur, ident)
        if not signal:
            return jsonify({"error": f"signal '{ident}' not found"}), 404
        cur.execute(
            "UPDATE traffic_signals SET status = %s, updated_at = %s WHERE id = %s",
            (state, utcnow(), signal["id"]),
        )
        override = bool(signal.get("emergency_override"))

    return jsonify(
        {
            "ok": True,
            "signalId": signal["id"],
            "status": state,
            "emergencyOverride": override,
            "targetState": "GREEN" if override else "AUTO",
        }
    )
