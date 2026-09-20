"""
ResQSync - emergency lifecycle, vehicle, corridor and alias endpoints.

These are the routes the frontend service layer (js/services/*.js) already calls but the
first backend did not have yet:

  emergencies : /api/emergencies/<id>, /active, /<id>/assign, /<id>/status (PATCH),
                /<id>/cancel, /<id>/events, /<id>/route, /<id>/eta, /<id>/vehicle,
                /<id>/candidates
  vehicles    : /api/vehicles/<id|number>, /status (PATCH), /gps (GET/POST),
                /gps/history, /telemetry, /emergency
  traffic     : /api/traffic-nodes/<id|name>, /heartbeat (POST), /corridor
  signals     : /api/signals, /api/signals/<id>, /api/signals/corridor (+ /activate, /release)
  telemetry   : /api/telemetry/vehicles/<id>, /api/telemetry/system
"""

from flask import Blueprint, jsonify, request

from hardware import ingest_node_heartbeat, ingest_vehicle_telemetry
from helpers import (
    EMERGENCY_STATUSES,
    NON_TERMINAL_SQL,
    TERMINAL_STATUSES,
    activate_corridor,
    corridor_out,
    db,
    emergency_out,
    event_out,
    find_node,
    find_signal,
    find_vehicle,
    haversine_m,
    iso,
    latest_telemetry_by_vehicle,
    log_event,
    node_out,
    num,
    release_corridor,
    route_points,
    route_summary,
    signal_out,
    telemetry_out,
    utcnow,
    vehicle_out,
)

lifecycle_bp = Blueprint("lifecycle", __name__)


# --------------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------------
def error(message, status=400, **extra):
    return jsonify({"error": message, **extra}), status


def load_emergency(cur, emergency_id):
    cur.execute(
        """
        SELECT e.*, v.vehicle_number
        FROM emergencies e
        LEFT JOIN vehicles v ON v.id = e.assigned_vehicle_id
        WHERE e.id = %s
        """,
        (emergency_id,),
    )
    return cur.fetchone()


def emergency_payload(cur, emergency_id):
    row = load_emergency(cur, emergency_id)
    if not row:
        return None
    payload = emergency_out(row, {"vehicle_number": row.get("vehicle_number")})
    cur.execute(
        "SELECT * FROM corridors WHERE emergency_id = %s AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1",
        (emergency_id,),
    )
    corridor = cur.fetchone()
    payload["corridor"] = corridor_out(cur, corridor) if corridor else None
    return payload


def nearest_hospital(cur, lat, lng):
    cur.execute(
        """
        SELECT * FROM hospitals
        WHERE status = 'ACTIVE' AND emergency_available = 1
          AND latitude IS NOT NULL AND longitude IS NOT NULL
        """
    )
    best, best_distance = None, None
    for hospital in cur.fetchall():
        distance = haversine_m(lat, lng, num(hospital["latitude"]), num(hospital["longitude"]))
        if best is None or distance < best_distance:
            best, best_distance = hospital, distance
    return best


def free_vehicle(cur, vehicle_id):
    cur.execute(
        """
        UPDATE vehicles
        SET status = 'AVAILABLE', current_emergency_id = NULL, updated_at = %s
        WHERE id = %s
        """,
        (utcnow(), vehicle_id),
    )


# --------------------------------------------------------------------------
# emergencies
# --------------------------------------------------------------------------
@lifecycle_bp.route("/api/emergencies/active", methods=["GET"])
def get_active_emergency():
    """Most recent open emergency (or null)."""
    with db() as (conn, cur):
        cur.execute(f"SELECT id FROM emergencies WHERE {NON_TERMINAL_SQL} ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        return jsonify(emergency_payload(cur, row["id"]) if row else None)


@lifecycle_bp.route("/api/emergencies/<int:emergency_id>", methods=["GET"])
def get_emergency(emergency_id):
    with db() as (conn, cur):
        payload = emergency_payload(cur, emergency_id)
    if not payload:
        return error("Emergency not found", 404)
    return jsonify(payload)


@lifecycle_bp.route("/api/emergencies/<int:emergency_id>/candidates", methods=["GET"])
def vehicle_candidates(emergency_id):
    """Available vehicles, nearest first (for the 'assign vehicle' dialog)."""
    with db() as (conn, cur):
        emergency = load_emergency(cur, emergency_id)
        if not emergency:
            return error("Emergency not found", 404)
        cur.execute("SELECT * FROM vehicles WHERE status = 'AVAILABLE'")
        vehicles = cur.fetchall()
        latest = latest_telemetry_by_vehicle(cur)

    e_lat, e_lng = num(emergency.get("latitude")), num(emergency.get("longitude"))
    now = utcnow()
    result = []
    for v in vehicles:
        item = vehicle_out(v, latest.get(v["id"]), now)
        v_lat, v_lng = item["latitude"], item["longitude"]
        if None not in (e_lat, e_lng, v_lat, v_lng):
            item["distanceKm"] = round(haversine_m(v_lat, v_lng, e_lat, e_lng) / 1000.0, 2)
        else:
            item["distanceKm"] = None
        result.append(item)
    result.sort(key=lambda i: (i["distanceKm"] is None, i["distanceKm"] or 0))
    return jsonify(result)


@lifecycle_bp.route("/api/emergencies/<int:emergency_id>/assign", methods=["POST"])
def assign_vehicle(emergency_id):
    data = request.get_json(silent=True) or {}
    ident = data.get("vehicleId") or data.get("vehicle_id") or data.get("vehicle_number")
    if not ident:
        return error("vehicleId is required")

    with db(commit=True) as (conn, cur):
        emergency = load_emergency(cur, emergency_id)
        if not emergency:
            return error("Emergency not found", 404)
        if emergency["status"] in TERMINAL_STATUSES:
            return error(f"Emergency is already {emergency['status']}", 409)

        vehicle = find_vehicle(cur, ident)
        if not vehicle:
            return error("Vehicle not found", 404)

        previous_id = emergency.get("assigned_vehicle_id")
        if previous_id == vehicle["id"]:
            return error("This vehicle is already assigned to the emergency", 409)

        # atomic claim: only succeeds if the vehicle is still AVAILABLE
        cur.execute(
            """
            UPDATE vehicles
            SET status = 'DISPATCHED', current_emergency_id = %s, updated_at = %s
            WHERE id = %s AND status = 'AVAILABLE'
            """,
            (emergency_id, utcnow(), vehicle["id"]),
        )
        if cur.rowcount != 1:
            return error(
                f"Vehicle {vehicle['vehicle_number']} is not available (status: {vehicle['status']})",
                409,
            )

        if previous_id:
            free_vehicle(cur, previous_id)

        new_status = emergency["status"] if emergency["status"] != "ACTIVE" else "ASSIGNED"
        cur.execute(
            """
            UPDATE emergencies
            SET assigned_vehicle_id = %s, status = %s, updated_at = %s
            WHERE id = %s
            """,
            (vehicle["id"], new_status, utcnow(), emergency_id),
        )
        log_event(
            cur,
            "VEHICLE_ASSIGNED",
            f"{vehicle['vehicle_number']} assigned to emergency #{emergency_id}",
            f"Driver: {vehicle.get('driver_name') or 'n/a'}",
            emergency_id=emergency_id,
            latitude=num(emergency.get("latitude")),
            longitude=num(emergency.get("longitude")),
        )
        corridor = activate_corridor(cur, emergency_id)
        payload = emergency_payload(cur, emergency_id)

    return jsonify({"message": "Vehicle assigned", "emergency": payload, "corridor": corridor})


@lifecycle_bp.route("/api/emergencies/<int:emergency_id>/status", methods=["PATCH", "POST"])
def update_emergency_status(emergency_id):
    data = request.get_json(silent=True) or {}
    new_status = str(data.get("status") or "").strip().upper()
    if new_status not in EMERGENCY_STATUSES:
        return error(f"status must be one of: {', '.join(EMERGENCY_STATUSES)}")

    with db(commit=True) as (conn, cur):
        emergency = load_emergency(cur, emergency_id)
        if not emergency:
            return error("Emergency not found", 404)
        old_status = emergency["status"]
        if old_status in TERMINAL_STATUSES:
            return error(f"Emergency is already {old_status}", 409)
        if new_status == "ACTIVE" and old_status != "ACTIVE":
            return error("An emergency cannot go back to ACTIVE; assign a vehicle instead", 409)
        if new_status not in TERMINAL_STATUSES and new_status != "ACTIVE" and not emergency.get("assigned_vehicle_id"):
            return error("Assign a vehicle before moving the emergency forward", 409)

        now = utcnow()
        corridor = None

        if new_status in TERMINAL_STATUSES:
            release_corridor(cur, emergency_id)
            if emergency.get("assigned_vehicle_id"):
                free_vehicle(cur, emergency["assigned_vehicle_id"])
            cur.execute(
                "UPDATE emergencies SET status = %s, updated_at = %s, resolved_at = %s WHERE id = %s",
                (new_status, now, now, emergency_id),
            )
        else:
            hospital_id = emergency.get("hospital_id")
            requested_hospital = data.get("hospitalId") or data.get("hospital_id")
            if requested_hospital:
                cur.execute("SELECT id FROM hospitals WHERE id = %s", (requested_hospital,))
                if not cur.fetchone():
                    return error("Hospital not found", 404)
                hospital_id = int(requested_hospital)
            elif new_status in ("PATIENT_PICKED_UP", "TRANSPORT_TO_HOSPITAL") and not hospital_id:
                lat, lng = num(emergency.get("latitude")), num(emergency.get("longitude"))
                if lat is not None and lng is not None:
                    nearest = nearest_hospital(cur, lat, lng)
                    hospital_id = nearest["id"] if nearest else None

            cur.execute(
                "UPDATE emergencies SET status = %s, hospital_id = %s, updated_at = %s WHERE id = %s",
                (new_status, hospital_id, now, emergency_id),
            )
            # the route changes after pickup / when a hospital is chosen -> rebuild the corridor
            if new_status in ("PATIENT_PICKED_UP", "TRANSPORT_TO_HOSPITAL", "AT_PATIENT") or requested_hospital:
                corridor = activate_corridor(cur, emergency_id)

        log_event(
            cur,
            "EMERGENCY_STATUS",
            f"Emergency #{emergency_id}: {old_status} -> {new_status}",
            data.get("note"),
            emergency_id=emergency_id,
            latitude=num(emergency.get("latitude")),
            longitude=num(emergency.get("longitude")),
            severity="INFO",
        )
        payload = emergency_payload(cur, emergency_id)

    return jsonify({"message": "Status updated", "emergency": payload, "corridor": corridor})


@lifecycle_bp.route("/api/emergencies/<int:emergency_id>/cancel", methods=["POST"])
def cancel_emergency(emergency_id):
    data = request.get_json(silent=True) or {}
    with db(commit=True) as (conn, cur):
        emergency = load_emergency(cur, emergency_id)
        if not emergency:
            return error("Emergency not found", 404)
        if emergency["status"] in TERMINAL_STATUSES:
            return error(f"Emergency is already {emergency['status']}", 409)

        release_corridor(cur, emergency_id)
        if emergency.get("assigned_vehicle_id"):
            free_vehicle(cur, emergency["assigned_vehicle_id"])
        now = utcnow()
        cur.execute(
            "UPDATE emergencies SET status = 'CANCELLED', updated_at = %s, resolved_at = %s WHERE id = %s",
            (now, now, emergency_id),
        )
        log_event(
            cur,
            "EMERGENCY_CANCELLED",
            f"Emergency #{emergency_id} cancelled",
            data.get("reason") or None,
            emergency_id=emergency_id,
            severity="WARNING",
        )
        payload = emergency_payload(cur, emergency_id)
    return jsonify({"message": "Emergency cancelled", "emergency": payload})


@lifecycle_bp.route("/api/emergencies/<int:emergency_id>/events", methods=["GET"])
def emergency_events(emergency_id):
    with db() as (conn, cur):
        cur.execute(
            "SELECT * FROM events WHERE emergency_id = %s ORDER BY id DESC LIMIT 200",
            (emergency_id,),
        )
        return jsonify([event_out(e) for e in cur.fetchall()])


def _route_for(cur, emergency_id):
    emergency = load_emergency(cur, emergency_id)
    if not emergency:
        return None, None
    vehicle = hospital = telemetry = None
    if emergency.get("assigned_vehicle_id"):
        cur.execute("SELECT * FROM vehicles WHERE id = %s", (emergency["assigned_vehicle_id"],))
        vehicle = cur.fetchone()
        telemetry = latest_telemetry_by_vehicle(cur).get(emergency["assigned_vehicle_id"])
    if emergency.get("hospital_id"):
        cur.execute("SELECT * FROM hospitals WHERE id = %s", (emergency["hospital_id"],))
        hospital = cur.fetchone()
    points = route_points(emergency, vehicle, hospital)
    speed = num((telemetry or {}).get("speed"))
    distance_km, eta_minutes = route_summary(points, speed)
    destination = None
    if emergency["status"] in ("PATIENT_PICKED_UP", "TRANSPORT_TO_HOSPITAL") and hospital:
        destination = hospital.get("hospital_name")
    elif emergency["status"] == "AT_PATIENT" and hospital:
        destination = hospital.get("hospital_name")
    else:
        destination = emergency.get("location")
    return emergency, {
        "emergencyId": emergency_id,
        "coordinates": [[p[0], p[1]] for p in points],
        "distanceKm": distance_km,
        "etaMinutes": eta_minutes,
        "destination": destination,
        "estimated": True,
    }


@lifecycle_bp.route("/api/emergencies/<int:emergency_id>/route", methods=["GET"])
def emergency_route(emergency_id):
    with db() as (conn, cur):
        emergency, route = _route_for(cur, emergency_id)
    if not emergency:
        return error("Emergency not found", 404)
    return jsonify(route)


@lifecycle_bp.route("/api/emergencies/<int:emergency_id>/eta", methods=["GET"])
def emergency_eta(emergency_id):
    with db() as (conn, cur):
        emergency, route = _route_for(cur, emergency_id)
    if not emergency:
        return error("Emergency not found", 404)
    return jsonify(
        {
            "emergencyId": emergency_id,
            "distanceKm": route["distanceKm"],
            "etaMinutes": route["etaMinutes"],
            "estimated": True,
        }
    )


@lifecycle_bp.route("/api/emergencies/<int:emergency_id>/vehicle", methods=["GET"])
def emergency_vehicle(emergency_id):
    with db() as (conn, cur):
        emergency = load_emergency(cur, emergency_id)
        if not emergency:
            return error("Emergency not found", 404)
        if not emergency.get("assigned_vehicle_id"):
            return jsonify(None)
        cur.execute("SELECT * FROM vehicles WHERE id = %s", (emergency["assigned_vehicle_id"],))
        vehicle = cur.fetchone()
        latest = latest_telemetry_by_vehicle(cur)
        return jsonify(vehicle_out(vehicle, latest.get(vehicle["id"])) if vehicle else None)


# --------------------------------------------------------------------------
# vehicles
# --------------------------------------------------------------------------
@lifecycle_bp.route("/api/vehicles/<ident>", methods=["GET"])
def get_vehicle(ident):
    with db() as (conn, cur):
        vehicle = find_vehicle(cur, ident)
        if not vehicle:
            return error("Vehicle not found", 404)
        latest = latest_telemetry_by_vehicle(cur)
        return jsonify(vehicle_out(vehicle, latest.get(vehicle["id"])))


@lifecycle_bp.route("/api/vehicles/<ident>/status", methods=["GET", "PATCH"])
def vehicle_status(ident):
    if request.method == "GET":
        return get_vehicle(ident)

    data = request.get_json(silent=True) or {}
    status = str(data.get("status") or "").strip().upper()
    if status not in ("AVAILABLE", "DISPATCHED", "OFFLINE", "MAINTENANCE"):
        return error("status must be AVAILABLE, DISPATCHED, OFFLINE or MAINTENANCE")

    with db(commit=True) as (conn, cur):
        vehicle = find_vehicle(cur, ident)
        if not vehicle:
            return error("Vehicle not found", 404)
        if vehicle.get("current_emergency_id") and status != "DISPATCHED":
            return error("Vehicle is on an active emergency; resolve or cancel the emergency first", 409)
        cur.execute(
            "UPDATE vehicles SET status = %s, updated_at = %s WHERE id = %s",
            (status, utcnow(), vehicle["id"]),
        )
        cur.execute("SELECT * FROM vehicles WHERE id = %s", (vehicle["id"],))
        return jsonify(vehicle_out(cur.fetchone()))


@lifecycle_bp.route("/api/vehicles/<ident>/gps", methods=["GET"])
def vehicle_latest_gps(ident):
    with db() as (conn, cur):
        vehicle = find_vehicle(cur, ident)
        if not vehicle:
            return error("Vehicle not found", 404)
        latest = latest_telemetry_by_vehicle(cur).get(vehicle["id"])
        out = vehicle_out(vehicle, latest)
        return jsonify(
            {
                "vehicleId": out["vehicleId"],
                "latitude": out["latitude"],
                "longitude": out["longitude"],
                "speed": out["speed"],
                "gpsStatus": out["gpsStatus"],
                "lastSeen": out["lastSeen"],
            }
        )


@lifecycle_bp.route("/api/vehicles/<ident>/gps", methods=["POST"])
def vehicle_update_gps(ident):
    data = request.get_json(silent=True) or {}
    data["vehicle_id"] = ident
    result, status_code = ingest_vehicle_telemetry(data)
    return jsonify(result), status_code


@lifecycle_bp.route("/api/vehicles/<ident>/gps/history", methods=["GET"])
@lifecycle_bp.route("/api/vehicles/<ident>/telemetry", methods=["GET"])
def vehicle_history(ident):
    try:
        limit = max(1, min(int(request.args.get("limit", 100)), 2000))
    except ValueError:
        limit = 100
    with db() as (conn, cur):
        vehicle = find_vehicle(cur, ident)
        if not vehicle:
            return error("Vehicle not found", 404)
        cur.execute(
            f"SELECT * FROM telemetry WHERE vehicle_id = %s ORDER BY id DESC LIMIT {limit}",
            (vehicle["id"],),
        )
        return jsonify([telemetry_out(t) for t in cur.fetchall()])


@lifecycle_bp.route("/api/vehicles/<ident>/emergency", methods=["GET"])
def vehicle_emergency(ident):
    with db() as (conn, cur):
        vehicle = find_vehicle(cur, ident)
        if not vehicle:
            return error("Vehicle not found", 404)
        if not vehicle.get("current_emergency_id"):
            return jsonify(None)
        return jsonify(emergency_payload(cur, vehicle["current_emergency_id"]))


# --------------------------------------------------------------------------
# traffic nodes
# --------------------------------------------------------------------------
@lifecycle_bp.route("/api/traffic-nodes/corridor", methods=["GET"])
@lifecycle_bp.route("/api/signals/corridor", methods=["GET"])
def corridor_for_emergency():
    emergency_id = request.args.get("emergencyId") or request.args.get("emergency_id")
    if not emergency_id:
        return error("emergencyId is required")
    with db() as (conn, cur):
        cur.execute(
            "SELECT * FROM corridors WHERE emergency_id = %s AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1",
            (emergency_id,),
        )
        corridor = cur.fetchone()
        return jsonify(corridor_out(cur, corridor) if corridor else None)


@lifecycle_bp.route("/api/traffic-nodes/<ident>", methods=["GET"])
def get_traffic_node(ident):
    with db() as (conn, cur):
        node = find_node(cur, ident)
        if not node:
            return error("Traffic node not found", 404)
        cur.execute("SELECT * FROM traffic_signals WHERE node_id = %s", (node["id"],))
        payload = node_out(node)
        payload["signals"] = [signal_out(s) for s in cur.fetchall()]
        return jsonify(payload)


@lifecycle_bp.route("/api/traffic-nodes/<ident>/heartbeat", methods=["POST"])
def traffic_node_heartbeat(ident):
    data = request.get_json(silent=True) or {}
    data["node_id"] = ident
    result, status_code = ingest_node_heartbeat(data)
    return jsonify(result), status_code


# --------------------------------------------------------------------------
# signals (frontend signal.js uses /api/signals..., DB routes live under /api/traffic-signals)
# --------------------------------------------------------------------------
@lifecycle_bp.route("/api/signals", methods=["GET"])
def list_signals():
    node_id = request.args.get("nodeId") or request.args.get("node_id")
    with db() as (conn, cur):
        if node_id:
            cur.execute("SELECT * FROM traffic_signals WHERE node_id = %s ORDER BY id", (node_id,))
        else:
            cur.execute("SELECT * FROM traffic_signals ORDER BY id")
        return jsonify([signal_out(s) for s in cur.fetchall()])


@lifecycle_bp.route("/api/signals/<ident>", methods=["GET"])
def get_signal(ident):
    with db() as (conn, cur):
        signal = find_signal(cur, ident)
        if not signal:
            return error("Signal not found", 404)
        return jsonify(signal_out(signal))


@lifecycle_bp.route("/api/signals/corridor/activate", methods=["POST"])
def corridor_activate():
    data = request.get_json(silent=True) or {}
    emergency_id = data.get("emergencyId") or data.get("emergency_id")
    if not emergency_id:
        return error("emergencyId is required")
    with db(commit=True) as (conn, cur):
        if not load_emergency(cur, emergency_id):
            return error("Emergency not found", 404)
        return jsonify(activate_corridor(cur, int(emergency_id)))


@lifecycle_bp.route("/api/signals/corridor/release", methods=["POST"])
def corridor_release():
    data = request.get_json(silent=True) or {}
    emergency_id = data.get("emergencyId") or data.get("emergency_id")
    if not emergency_id:
        return error("emergencyId is required")
    with db(commit=True) as (conn, cur):
        if not load_emergency(cur, emergency_id):
            return error("Emergency not found", 404)
        released = release_corridor(cur, int(emergency_id))
        return jsonify({"released": released})


# --------------------------------------------------------------------------
# telemetry aliases used by js/services/telemetry.js
# --------------------------------------------------------------------------
@lifecycle_bp.route("/api/telemetry/vehicles/<ident>", methods=["GET"])
def telemetry_for_vehicle(ident):
    with db() as (conn, cur):
        vehicle = find_vehicle(cur, ident)
        if not vehicle:
            return error("Vehicle not found", 404)
        cur.execute(
            "SELECT * FROM telemetry WHERE vehicle_id = %s ORDER BY id DESC LIMIT 1", (vehicle["id"],)
        )
        row = cur.fetchone()
        return jsonify(telemetry_out(row) if row else None)


@lifecycle_bp.route("/api/telemetry/system", methods=["GET"])
def telemetry_system():
    from helpers import build_summary

    with db() as (conn, cur):
        summary = build_summary(cur)
    return jsonify(
        {
            "systemHealth": summary["systemHealth"],
            "connectedVehicleNodes": summary["connectedVehicleNodes"],
            "gpsConnectedVehicles": summary["gpsConnectedVehicles"],
            "connectedTrafficNodes": summary["connectedTrafficNodes"],
            "totalVehicles": summary["totalVehicles"],
            "totalTrafficNodes": summary["totalTrafficNodes"],
            "serverTime": iso(utcnow()),
        }
    )
