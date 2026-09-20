import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from database import get_connection
from helpers import (
    NON_TERMINAL_SQL,
    build_summary,
    db,
    emergency_out,
    event_out,
    hospital_out,
    iso,
    latest_telemetry_by_vehicle,
    log_event,
    node_out,
    parse_lat_lng,
    signal_out,
    telemetry_out,
    utcnow,
    vehicle_out,
)
from hardware import hardware_bp
from lifecycle import lifecycle_bp
from live import live_bp

app = Flask(__name__)

# Frontend origins allowed to call the API (browsers only - hardware is not affected by CORS).
# Add more with RESQ_CORS_ORIGINS="http://192.168.1.10:5500,http://other-host:5500"
# Production Vercel origins are included as safe defaults so the frontend can
# reach Railway even when RESQ_CORS_ORIGINS has not been added to Railway yet.
# Railway can still extend/override this list with RESQ_CORS_ORIGINS.
_cors_origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://fridaynightfunkin-lemon.vercel.app",
    "https://fridaynightfunkin-9gis16b0k-resq9.vercel.app",
]
_cors_origins += [o.strip() for o in os.getenv("RESQ_CORS_ORIGINS", "").split(",") if o.strip()]
# Remove duplicates while preserving order.
_cors_origins = list(dict.fromkeys(_cors_origins))
CORS(app, origins=_cors_origins, supports_credentials=True)

app.register_blueprint(lifecycle_bp)
app.register_blueprint(hardware_bp)
app.register_blueprint(live_bp)


@app.errorhandler(Exception)
def handle_error(error):
    """Always answer /api requests with JSON (the frontend expects JSON errors)."""
    if isinstance(error, HTTPException):
        return jsonify({"error": error.description, "status": error.code}), error.code
    app.logger.exception("Unhandled error")
    return jsonify({"error": "Internal server error", "detail": str(error)}), 500


@app.route("/")
def home():
    return {"message": "ResQSync Backend is running!"}


@app.route("/api/emergencies", methods=["GET"])
def get_emergencies():
    # optional filters: ?status=ACTIVE  ?active=true  ?limit=50
    status = (request.args.get("status") or "").strip().upper()
    only_active = (request.args.get("active") or "").lower() in ("1", "true", "yes")
    try:
        limit = max(1, min(int(request.args.get("limit", 500)), 1000))
    except ValueError:
        limit = 500

    where, params = [], []
    if status:
        where.append("e.status = %s")
        params.append(status)
    if only_active:
        where.append("e.status NOT IN ('RESOLVED', 'CANCELLED')")
    clause = ("WHERE " + " AND ".join(where)) if where else ""

    with db() as (conn, cursor):
        cursor.execute(
            f"""
            SELECT e.*, v.vehicle_number
            FROM emergencies e
            LEFT JOIN vehicles v ON v.id = e.assigned_vehicle_id
            {clause}
            ORDER BY e.id DESC
            LIMIT {limit}
            """,
            tuple(params),
        )
        rows = cursor.fetchall()

    return jsonify([emergency_out(r, {"vehicle_number": r.get("vehicle_number")}) for r in rows])


@app.route("/api/emergencies", methods=["POST"])
def create_emergency():
    data = request.get_json(silent=True) or {}

    emergency_type = (data.get("type") or "").strip()
    location = (data.get("location") or "").strip()
    priority = str(data.get("priority", "HIGH")).upper()
    status = "ACTIVE"  # new emergencies always start open; use PATCH .../status to move them on

    if not emergency_type or not location:
        return jsonify({
            "error": "type and location are required"
        }), 400

    if priority not in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
        return jsonify({"error": "priority must be LOW, MEDIUM, HIGH or CRITICAL"}), 400

    try:
        latitude, longitude = parse_lat_lng(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    with db(commit=True) as (connection, cursor):
        cursor.execute(
            """
            INSERT INTO emergencies
            (type, location, priority, status, latitude, longitude, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (emergency_type, location, priority, status, latitude, longitude, utcnow(), utcnow()),
        )
        emergency_id = cursor.lastrowid

        log_event(
            cursor,
            "EMERGENCY_CREATED",
            f"{emergency_type} emergency #{emergency_id} reported",
            f"Location: {location}. Priority: {priority}",
            emergency_id=emergency_id,
            latitude=latitude,
            longitude=longitude,
            severity=priority,
            location=location,
        )

    return jsonify({
        "message": "Emergency created successfully",
        "id": emergency_id,
        "emergencyId": emergency_id
    }), 201

@app.route("/api/vehicles", methods=["GET"])
def get_vehicles():
    status = (request.args.get("status") or "").strip().upper()

    with db() as (connection, cursor):
        if status:
            cursor.execute("SELECT * FROM vehicles WHERE status = %s ORDER BY id DESC", (status,))
        else:
            cursor.execute("SELECT * FROM vehicles ORDER BY id DESC")
        vehicles = cursor.fetchall()
        latest = latest_telemetry_by_vehicle(cursor)

    now = utcnow()
    return jsonify([vehicle_out(v, latest.get(v["id"]), now) for v in vehicles])


@app.route("/api/vehicles", methods=["POST"])
def create_vehicle():
    data = request.get_json(silent=True) or {}

    vehicle_number = data.get("vehicle_number")
    vehicle_type = data.get("vehicle_type")
    driver_name = data.get("driver_name")
    status = data.get("status", "AVAILABLE")
    try:
        latitude, longitude = parse_lat_lng(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not vehicle_number or not vehicle_type:
        return jsonify({
            "error": "vehicle_number and vehicle_type are required"
        }), 400

    connection = get_connection()
    cursor = connection.cursor()

    query = """
        INSERT INTO vehicles
        (vehicle_number, vehicle_type, driver_name, status, latitude, longitude)
        VALUES (%s, %s, %s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (
            vehicle_number,
            vehicle_type,
            driver_name,
            status,
            latitude,
            longitude
        )
    )

    connection.commit()

    vehicle_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Vehicle created successfully",
        "id": vehicle_id
    }), 201

# =========================
# TELEMETRY / GPS
# =========================

@app.route("/api/telemetry", methods=["GET"])
def get_telemetry():
    # hardware posts every few seconds, so never return the whole table:
    # ?vehicle_id=1  ?limit=200 (default 200, max 2000)
    try:
        limit = max(1, min(int(request.args.get("limit", 200)), 2000))
    except ValueError:
        limit = 200
    vehicle_id = request.args.get("vehicle_id")

    with db() as (connection, cursor):
        if vehicle_id:
            cursor.execute(
                f"SELECT * FROM telemetry WHERE vehicle_id = %s ORDER BY id DESC LIMIT {limit}",
                (vehicle_id,),
            )
        else:
            cursor.execute(f"SELECT * FROM telemetry ORDER BY id DESC LIMIT {limit}")
        telemetry = cursor.fetchall()

    return jsonify([telemetry_out(t) for t in telemetry])


@app.route("/api/telemetry", methods=["POST"])
def create_telemetry():
    # Same behaviour as the hardware endpoint, kept for backward compatibility.
    from hardware import ingest_vehicle_telemetry

    data = request.get_json(silent=True) or {}
    if not data.get("vehicle_id"):
        return jsonify({
            "error": "vehicle_id is required"
        }), 400

    result, status_code = ingest_vehicle_telemetry(data)
    if status_code >= 400:
        return jsonify(result), status_code

    return jsonify({
        "message": "Telemetry created successfully",
        "id": result["telemetryId"]
    }), 201

# =========================
# TRAFFIC NODES
# =========================

@app.route("/api/traffic-nodes", methods=["GET"])
def get_traffic_nodes():
    with db() as (connection, cursor):
        cursor.execute("SELECT * FROM traffic_nodes ORDER BY id DESC")
        nodes = cursor.fetchall()

    now = utcnow()
    return jsonify([node_out(n, now) for n in nodes])


@app.route("/api/traffic-nodes", methods=["POST"])
def create_traffic_node():
    data = request.get_json(silent=True) or {}

    node_name = data.get("node_name")
    try:
        latitude, longitude = parse_lat_lng(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    status = data.get("status", "ACTIVE")
    congestion_level = data.get("congestion_level", "LOW")

    if not node_name:
        return jsonify({
            "error": "node_name is required"
        }), 400

    connection = get_connection()
    cursor = connection.cursor()

    query = """
        INSERT INTO traffic_nodes
        (node_name, latitude, longitude, status, congestion_level)
        VALUES (%s, %s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (
            node_name,
            latitude,
            longitude,
            status,
            congestion_level
        )
    )

    connection.commit()

    node_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Traffic node created successfully",
        "id": node_id
    }), 201

# =========================
# TRAFFIC SIGNALS
# =========================

@app.route("/api/traffic-signals", methods=["GET"])
def get_traffic_signals():
    with db() as (connection, cursor):
        cursor.execute("SELECT * FROM traffic_signals ORDER BY id DESC")
        signals = cursor.fetchall()

    return jsonify([signal_out(s) for s in signals])


@app.route("/api/traffic-signals", methods=["POST"])
def create_traffic_signal():
    data = request.get_json(silent=True) or {}

    signal_name = data.get("signal_name")
    try:
        latitude, longitude = parse_lat_lng(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    status = data.get("status", "RED")
    emergency_override = data.get("emergency_override", False)
    node_id = data.get("node_id")

    if not signal_name:
        return jsonify({
            "error": "signal_name is required"
        }), 400

    connection = get_connection()
    cursor = connection.cursor()

    query = """
        INSERT INTO traffic_signals
        (signal_name, latitude, longitude, status, emergency_override, node_id)
        VALUES (%s, %s, %s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (
            signal_name,
            latitude,
            longitude,
            status,
            emergency_override,
            node_id
        )
    )

    connection.commit()

    signal_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Traffic signal created successfully",
        "id": signal_id
    }), 201

# =========================
# HOSPITALS
# =========================

@app.route("/api/hospitals", methods=["GET"])
def get_hospitals():
    with db() as (connection, cursor):
        cursor.execute("SELECT * FROM hospitals ORDER BY id DESC")
        hospitals = cursor.fetchall()

    return jsonify([hospital_out(h) for h in hospitals])


@app.route("/api/hospitals", methods=["POST"])
def create_hospital():
    data = request.get_json(silent=True) or {}

    hospital_name = data.get("hospital_name")
    address = data.get("address")
    try:
        latitude, longitude = parse_lat_lng(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    emergency_available = data.get("emergency_available", True)
    available_beds = data.get("available_beds", 0)
    status = data.get("status", "ACTIVE")

    if not hospital_name:
        return jsonify({
            "error": "hospital_name is required"
        }), 400

    connection = get_connection()
    cursor = connection.cursor()

    query = """
        INSERT INTO hospitals
        (hospital_name, address, latitude, longitude,
         emergency_available, available_beds, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (
            hospital_name,
            address,
            latitude,
            longitude,
            emergency_available,
            available_beds,
            status
        )
    )

    connection.commit()

    hospital_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Hospital created successfully",
        "id": hospital_id
    }), 201

# =========================
# EVENTS
# =========================

@app.route("/api/events", methods=["GET"])
def get_events():
    # ?limit=20  ?emergency_id=3
    try:
        limit = max(1, min(int(request.args.get("limit", 200)), 1000))
    except ValueError:
        limit = 200
    emergency_id = request.args.get("emergency_id")

    with db() as (connection, cursor):
        if emergency_id:
            cursor.execute(
                f"SELECT * FROM events WHERE emergency_id = %s ORDER BY id DESC LIMIT {limit}",
                (emergency_id,),
            )
        else:
            cursor.execute(f"SELECT * FROM events ORDER BY id DESC LIMIT {limit}")
        events = cursor.fetchall()

    return jsonify([event_out(e) for e in events])


@app.route("/api/events", methods=["POST"])
def create_event():
    data = request.get_json(silent=True) or {}

    event_type = data.get("event_type")
    title = data.get("title")
    description = data.get("description")
    location = data.get("location")
    try:
        latitude, longitude = parse_lat_lng(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    severity = data.get("severity", "MEDIUM")
    status = data.get("status", "ACTIVE")

    if not event_type:
        return jsonify({
            "error": "event_type is required"
        }), 400

    connection = get_connection()
    cursor = connection.cursor()

    query = """
        INSERT INTO events
        (event_type, title, description, location,
         latitude, longitude, severity, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    cursor.execute(
        query,
        (
            event_type,
            title,
            description,
            location,
            latitude,
            longitude,
            severity,
            status
        )
    )

    connection.commit()

    event_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return jsonify({
        "message": "Event created successfully",
        "id": event_id
    }), 201

# =========================
# ANALYTICS
# =========================

@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS total FROM emergencies")
    total_emergencies = cursor.fetchone()["total"]

    cursor.execute(f"""
        SELECT COUNT(*) AS active
        FROM emergencies
        WHERE {NON_TERMINAL_SQL}
    """)
    active_emergencies = cursor.fetchone()["active"]

    cursor.execute("SELECT COUNT(*) AS total FROM vehicles")
    total_vehicles = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT COUNT(*) AS available
        FROM vehicles
        WHERE status = 'AVAILABLE'
    """)
    available_vehicles = cursor.fetchone()["available"]

    cursor.execute("SELECT COUNT(*) AS total FROM hospitals")
    total_hospitals = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT COUNT(*) AS active
        FROM events
        WHERE status = 'ACTIVE'
    """)
    active_events = cursor.fetchone()["active"]

    cursor.execute("SELECT COUNT(*) AS total FROM traffic_nodes")
    total_traffic_nodes = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM traffic_signals")
    total_traffic_signals = cursor.fetchone()["total"]

    cursor.close()
    connection.close()

    return jsonify({
        "emergencies": {
            "total": total_emergencies,
            "active": active_emergencies
        },
        "vehicles": {
            "total": total_vehicles,
            "available": available_vehicles
        },
        "hospitals": {
            "total": total_hospitals
        },
        "events": {
            "active": active_events
        },
        "traffic": {
            "nodes": total_traffic_nodes,
            "signals": total_traffic_signals
        }
    })

@app.route("/api/analytics/dashboard", methods=["GET"])
def dashboard_summary():
    with db() as (connection, cursor):
        return jsonify(build_summary(cursor))


@app.route("/api/health", methods=["GET"])
def health_check():
    database = "ok"
    try:
        with db() as (connection, cursor):
            cursor.execute("SELECT 1 AS ok")
            cursor.fetchone()
    except Exception as error:  # DB down / wrong credentials
        database = f"error: {error}"

    healthy = database == "ok"
    return jsonify({
        "status": "ok" if healthy else "degraded",
        "message": "ResQSync Backend is healthy" if healthy else "ResQSync Backend cannot reach the database",
        "database": database,
        "serverTime": iso(utcnow())
    }), (200 if healthy else 503)


if __name__ == "__main__":
    # RESQ_HOST=0.0.0.0 lets ESP32 / other devices on the same WiFi reach the backend.
    app.run(
        host=os.getenv("RESQ_HOST", "127.0.0.1"),
        port=int(os.getenv("RESQ_PORT", "5000")),
        debug=True,
    )

