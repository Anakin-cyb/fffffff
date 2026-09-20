"""
ResQSync - shared backend helpers.

Everything here is used by app.py and the blueprints (lifecycle.py, hardware.py,
live.py). The existing routes in app.py keep working as before; these helpers just
remove the copy-paste around DB access, JSON serialisation and geo maths.
"""

import math
import os
from contextlib import contextmanager
from datetime import datetime, timezone
from decimal import Decimal

from database import get_connection

# --------------------------------------------------------------------------
# Tunables (override with environment variables if needed)
# --------------------------------------------------------------------------
GPS_STALE_SECONDS = int(os.getenv("RESQ_GPS_STALE_SECONDS", "15"))
NODE_TIMEOUT_SECONDS = int(os.getenv("RESQ_NODE_TIMEOUT_SECONDS", "30"))
CORRIDOR_RADIUS_M = float(os.getenv("RESQ_CORRIDOR_RADIUS_M", "300"))
ROUTE_DETOUR_FACTOR = float(os.getenv("RESQ_ROUTE_DETOUR_FACTOR", "1.3"))
DEFAULT_SPEED_KMH = float(os.getenv("RESQ_DEFAULT_SPEED_KMH", "40"))

EMERGENCY_STATUSES = (
    "ACTIVE",
    "ASSIGNED",
    "EN_ROUTE_TO_PATIENT",
    "AT_PATIENT",
    "PATIENT_PICKED_UP",
    "TRANSPORT_TO_HOSPITAL",
    "RESOLVED",
    "CANCELLED",
)
TERMINAL_STATUSES = ("RESOLVED", "CANCELLED")
# 'ACTIVE' rows in the original DB are "open, not yet assigned". Everything that
# is not terminal counts as an active emergency.
NON_TERMINAL_SQL = "status NOT IN ('RESOLVED', 'CANCELLED')"


# --------------------------------------------------------------------------
# DB access
# --------------------------------------------------------------------------
@contextmanager
def db(dictionary=True, commit=False):
    """
    with db(commit=True) as (conn, cur):
        cur.execute(...)

    Commits on success when commit=True, always rolls back on error and always
    closes the connection.
    """
    conn = get_connection()
    cur = conn.cursor(dictionary=dictionary)
    try:
        yield conn, cur
        if commit:
            conn.commit()
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        try:
            cur.close()
        finally:
            conn.close()


# --------------------------------------------------------------------------
# Time + value helpers
# --------------------------------------------------------------------------
def utcnow():
    """Naive UTC datetime (database.py pins the MySQL session to +00:00)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_dt(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).replace("T", " ").replace("Z", "")
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def iso(value):
    """ISO-8601 in UTC with a trailing Z so the browser converts to local time."""
    dt = to_dt(value)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ") if dt else None


def age_seconds(value, now=None):
    dt = to_dt(value)
    if dt is None:
        return None
    return ((now or utcnow()) - dt).total_seconds()


def num(value):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return value


def parse_coord(value, lo, hi, name):
    """Return float or None. Raises ValueError for garbage / out-of-range input."""
    if value is None or value == "":
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be a number")
    if not (lo <= number <= hi) or math.isnan(number):
        raise ValueError(f"{name} must be between {lo} and {hi}")
    return number


def parse_lat_lng(data):
    lat = parse_coord(data.get("latitude"), -90, 90, "latitude")
    lng = parse_coord(data.get("longitude"), -180, 180, "longitude")
    if (lat is None) != (lng is None):
        raise ValueError("latitude and longitude must be provided together")
    return lat, lng


def is_number(value):
    return value is not None and value != ""


# --------------------------------------------------------------------------
# Geo maths (no external routing service: works offline)
# --------------------------------------------------------------------------
EARTH_RADIUS_M = 6371000.0


def haversine_m(lat1, lng1, lat2, lng2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def point_segment_distance(point, a, b):
    """
    Distance in metres from `point` to the segment a-b and the fraction (0..1) of
    the way along the segment of the closest point. All arguments are (lat, lng).
    Uses a local equirectangular projection, accurate enough at city scale.
    """
    lat0 = math.radians(point[0])
    kx = math.cos(lat0) * EARTH_RADIUS_M * math.pi / 180.0
    ky = EARTH_RADIUS_M * math.pi / 180.0

    px, py = (point[1]) * kx, (point[0]) * ky
    ax, ay = a[1] * kx, a[0] * ky
    bx, by = b[1] * kx, b[0] * ky

    dx, dy = bx - ax, by - ay
    length_sq = dx * dx + dy * dy
    if length_sq == 0:
        return math.hypot(px - ax, py - ay), 0.0
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / length_sq))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy), t


def route_length_m(points):
    return sum(
        haversine_m(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1])
        for i in range(len(points) - 1)
    )


def signals_along_route(points, signals, radius_m=None):
    """
    points  : [(lat, lng), ...]  (>= 2)
    signals : iterable of dict rows with id / latitude / longitude
    Returns [(signal_row, distance_from_route_m, along_route_m)] sorted by along_route_m.
    """
    radius_m = CORRIDOR_RADIUS_M if radius_m is None else radius_m
    if len(points) < 2:
        return []

    # cumulative distance at the start of each segment
    starts = [0.0]
    for i in range(len(points) - 1):
        starts.append(
            starts[-1]
            + haversine_m(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1])
        )

    hits = []
    for sig in signals:
        lat, lng = num(sig.get("latitude")), num(sig.get("longitude"))
        if lat is None or lng is None:
            continue
        best = None
        for i in range(len(points) - 1):
            dist, t = point_segment_distance((lat, lng), points[i], points[i + 1])
            if best is None or dist < best[0]:
                seg_len = starts[i + 1] - starts[i]
                best = (dist, starts[i] + t * seg_len)
        if best and best[0] <= radius_m:
            hits.append((sig, best[0], best[1]))
    hits.sort(key=lambda h: h[2])
    return hits


# --------------------------------------------------------------------------
# Event log (uses the existing `events` table)
# --------------------------------------------------------------------------
def log_event(
    cur,
    event_type,
    title,
    description=None,
    emergency_id=None,
    latitude=None,
    longitude=None,
    severity="INFO",
    location=None,
    source="SYSTEM",
):
    cur.execute(
        """
        INSERT INTO events
        (event_type, title, description, location, latitude, longitude,
         severity, status, emergency_id, source, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE', %s, %s, %s)
        """,
        (
            event_type,
            title,
            description,
            location,
            latitude,
            longitude,
            severity,
            emergency_id,
            source,
            utcnow(),
        ),
    )


# --------------------------------------------------------------------------
# Serialisers. Raw column names are kept (backward compatible with the first
# integration) and camelCase aliases are added for the frontend services/map.
# --------------------------------------------------------------------------
def event_out(r):
    return {
        "id": r["id"],
        "event_type": r.get("event_type"),
        "title": r.get("title"),
        "description": r.get("description"),
        "location": r.get("location"),
        "latitude": num(r.get("latitude")),
        "longitude": num(r.get("longitude")),
        "severity": r.get("severity"),
        "status": r.get("status"),
        "emergency_id": r.get("emergency_id"),
        "source": r.get("source"),
        "created_at": iso(r.get("created_at")),
        # aliases
        "eventId": r["id"],
        "type": r.get("event_type"),
        "emergencyId": r.get("emergency_id"),
        "createdAt": iso(r.get("created_at")),
    }


def emergency_out(r, vehicle=None):
    lat, lng = num(r.get("latitude")), num(r.get("longitude"))
    status = r.get("status")
    return {
        "id": r["id"],
        "type": r.get("type"),
        "location": r.get("location"),
        "priority": r.get("priority"),
        "status": status,
        "latitude": lat,
        "longitude": lng,
        "assigned_vehicle_id": r.get("assigned_vehicle_id"),
        "hospital_id": r.get("hospital_id"),
        "created_at": iso(r.get("created_at")),
        "updated_at": iso(r.get("updated_at")),
        "resolved_at": iso(r.get("resolved_at")),
        # aliases used by the frontend
        "emergencyId": r["id"],
        "title": f"{r.get('type') or 'Emergency'} #{r['id']}",
        "vehicleId": r.get("assigned_vehicle_id"),
        "vehicleNumber": (vehicle or {}).get("vehicle_number"),
        "hospitalId": r.get("hospital_id"),
        "createdAt": iso(r.get("created_at")),
        "updatedAt": iso(r.get("updated_at")),
        "resolvedAt": iso(r.get("resolved_at")),
        "isActive": status not in TERMINAL_STATUSES,
        "hasCoordinates": lat is not None and lng is not None,
    }


def gps_status(r, now=None):
    if num(r.get("latitude")) is None or num(r.get("longitude")) is None:
        return "WAITING_FOR_FIX"
    age = age_seconds(r.get("last_seen"), now)
    if age is None:
        return "OFFLINE"
    if age <= GPS_STALE_SECONDS:
        return "ONLINE"
    if age <= GPS_STALE_SECONDS * 4:
        return "STALE"
    return "OFFLINE"


def vehicle_out(r, telemetry=None, now=None):
    telemetry = telemetry or {}
    return {
        "id": r["id"],
        "vehicle_number": r.get("vehicle_number"),
        "vehicle_type": r.get("vehicle_type"),
        "driver_name": r.get("driver_name"),
        "status": r.get("status"),
        "latitude": num(r.get("latitude")),
        "longitude": num(r.get("longitude")),
        "created_at": iso(r.get("created_at")),
        "last_seen": iso(r.get("last_seen")),
        "current_emergency_id": r.get("current_emergency_id"),
        # aliases
        "vehicleId": r["id"],
        "vehicleNumber": r.get("vehicle_number"),
        "name": r.get("vehicle_number"),
        "type": r.get("vehicle_type"),
        "driverName": r.get("driver_name"),
        "currentEmergencyId": r.get("current_emergency_id"),
        "lastSeen": iso(r.get("last_seen")),
        "gpsStatus": gps_status(r, now),
        "speed": num(telemetry.get("speed")),
        "fuelLevel": num(telemetry.get("fuel_level")),
        "temperature": num(telemetry.get("temperature")),
    }


def hospital_out(r):
    return {
        "id": r["id"],
        "hospital_name": r.get("hospital_name"),
        "address": r.get("address"),
        "latitude": num(r.get("latitude")),
        "longitude": num(r.get("longitude")),
        "emergency_available": bool(r.get("emergency_available")),
        "available_beds": r.get("available_beds"),
        "status": r.get("status"),
        "created_at": iso(r.get("created_at")),
        # aliases
        "hospitalId": r["id"],
        "name": r.get("hospital_name"),
        "emergencyAvailable": bool(r.get("emergency_available")),
        "availableBeds": r.get("available_beds"),
    }


def node_connection_status(r, now=None):
    age = age_seconds(r.get("last_heartbeat"), now)
    return "ONLINE" if age is not None and age <= NODE_TIMEOUT_SECONDS else "OFFLINE"


def node_out(r, now=None):
    connection = node_connection_status(r, now)
    return {
        "id": r["id"],
        "node_name": r.get("node_name"),
        "latitude": num(r.get("latitude")),
        "longitude": num(r.get("longitude")),
        "status": r.get("status"),
        "congestion_level": r.get("congestion_level"),
        "last_heartbeat": iso(r.get("last_heartbeat")),
        "created_at": iso(r.get("created_at")),
        # aliases
        "nodeId": r["id"],
        "name": r.get("node_name"),
        "congestionLevel": r.get("congestion_level"),
        "lastHeartbeat": iso(r.get("last_heartbeat")),
        "connectionStatus": connection,
        "online": connection == "ONLINE",
    }


def signal_out(r):
    override = bool(r.get("emergency_override"))
    return {
        "id": r["id"],
        "signal_name": r.get("signal_name"),
        "latitude": num(r.get("latitude")),
        "longitude": num(r.get("longitude")),
        "status": r.get("status"),
        "emergency_override": override,
        "node_id": r.get("node_id"),
        "created_at": iso(r.get("created_at")),
        "updated_at": iso(r.get("updated_at")),
        # aliases
        "signalId": r["id"],
        "name": r.get("signal_name"),
        "emergencyOverride": override,
        "signalState": r.get("status"),
        "nodeId": r.get("node_id"),
    }


def telemetry_out(r):
    return {
        "id": r["id"],
        "vehicle_id": r.get("vehicle_id"),
        "latitude": num(r.get("latitude")),
        "longitude": num(r.get("longitude")),
        "speed": num(r.get("speed")),
        "fuel_level": num(r.get("fuel_level")),
        "temperature": num(r.get("temperature")),
        "created_at": iso(r.get("created_at")),
        # aliases
        "vehicleId": r.get("vehicle_id"),
        "fuelLevel": num(r.get("fuel_level")),
        "timestamp": iso(r.get("created_at")),
    }


# --------------------------------------------------------------------------
# Lookups
# --------------------------------------------------------------------------
def find_vehicle(cur, ident):
    """Look a vehicle up by numeric id or by vehicle_number (e.g. 'DL01AB1234')."""
    if ident is None or ident == "":
        return None
    text = str(ident).strip()
    if text.isdigit():
        cur.execute("SELECT * FROM vehicles WHERE id = %s", (int(text),))
        row = cur.fetchone()
        if row:
            return row
    cur.execute("SELECT * FROM vehicles WHERE vehicle_number = %s", (text,))
    return cur.fetchone()


def find_node(cur, ident):
    if ident is None or ident == "":
        return None
    text = str(ident).strip()
    if text.isdigit():
        cur.execute("SELECT * FROM traffic_nodes WHERE id = %s", (int(text),))
        row = cur.fetchone()
        if row:
            return row
    cur.execute("SELECT * FROM traffic_nodes WHERE node_name = %s", (text,))
    return cur.fetchone()


def find_signal(cur, ident):
    if ident is None or ident == "":
        return None
    text = str(ident).strip()
    if text.isdigit():
        cur.execute("SELECT * FROM traffic_signals WHERE id = %s", (int(text),))
        row = cur.fetchone()
        if row:
            return row
    cur.execute("SELECT * FROM traffic_signals WHERE signal_name = %s", (text,))
    return cur.fetchone()


def latest_telemetry_by_vehicle(cur):
    cur.execute(
        """
        SELECT t.*
        FROM telemetry t
        JOIN (SELECT vehicle_id, MAX(id) AS max_id FROM telemetry GROUP BY vehicle_id) latest
          ON t.id = latest.max_id
        """
    )
    return {row["vehicle_id"]: row for row in cur.fetchall()}


# --------------------------------------------------------------------------
# Routing + ETA for an emergency (straight-line legs, scaled by a detour factor)
# --------------------------------------------------------------------------
def route_points(emergency, vehicle, hospital):
    """[(lat, lng), ...] the ambulance is expected to drive, based on emergency status."""
    def pt(row):
        if not row:
            return None
        lat, lng = num(row.get("latitude")), num(row.get("longitude"))
        return (lat, lng) if lat is not None and lng is not None else None

    v, e, h = pt(vehicle), pt(emergency), pt(hospital)
    if emergency.get("status") in ("PATIENT_PICKED_UP", "TRANSPORT_TO_HOSPITAL"):
        points = [v, h]
    elif emergency.get("status") == "AT_PATIENT":
        points = [e, h]
    else:
        points = [v, e, h]
    return [p for p in points if p is not None]


def route_summary(points, speed_kmh=None):
    """distance/ETA for a list of points. Returns (distance_km, eta_minutes) or (None, None)."""
    if len(points) < 2:
        return None, None
    distance_km = route_length_m(points) * ROUTE_DETOUR_FACTOR / 1000.0
    speed = speed_kmh if speed_kmh and speed_kmh >= 10 else DEFAULT_SPEED_KMH
    return round(distance_km, 2), round(distance_km / speed * 60.0, 1)


# --------------------------------------------------------------------------
# Corridors
# --------------------------------------------------------------------------
def corridor_signals(cur, corridor_id):
    cur.execute(
        """
        SELECT cs.sequence, cs.signal_id, cs.released_at,
               s.signal_name, s.latitude, s.longitude, s.status, s.emergency_override, s.node_id
        FROM corridor_signals cs
        JOIN traffic_signals s ON s.id = cs.signal_id
        WHERE cs.corridor_id = %s
        ORDER BY cs.sequence
        """,
        (corridor_id,),
    )
    return [
        {
            "sequence": r["sequence"],
            "signalId": r["signal_id"],
            "name": r["signal_name"],
            "latitude": num(r["latitude"]),
            "longitude": num(r["longitude"]),
            "status": r["status"],
            "emergencyOverride": bool(r["emergency_override"]),
            "nodeId": r["node_id"],
            "released": r["released_at"] is not None,
        }
        for r in cur.fetchall()
    ]


def corridor_out(cur, row):
    return {
        "corridorId": row["id"],
        "id": row["id"],
        "emergencyId": row["emergency_id"],
        "vehicleId": row["vehicle_id"],
        "status": row["status"],
        "startedAt": iso(row["started_at"]),
        "endedAt": iso(row.get("ended_at")),
        "signals": corridor_signals(cur, row["id"]),
    }


def activate_corridor(cur, emergency_id):
    """
    (Re)build the green corridor for an emergency: pick every signal within
    CORRIDOR_RADIUS_M of the current route, put them in emergency override (GREEN)
    and remember their previous state so it can be restored on release.

    Returns {"activated": bool, "corridorId": int|None, "signals": int, "reason": str|None}
    """
    cur.execute("SELECT * FROM emergencies WHERE id = %s", (emergency_id,))
    emergency = cur.fetchone()
    if not emergency or emergency["status"] in TERMINAL_STATUSES:
        return {"activated": False, "corridorId": None, "signals": 0, "reason": "emergency not open"}

    vehicle = None
    if emergency.get("assigned_vehicle_id"):
        cur.execute("SELECT * FROM vehicles WHERE id = %s", (emergency["assigned_vehicle_id"],))
        vehicle = cur.fetchone()
    hospital = None
    if emergency.get("hospital_id"):
        cur.execute("SELECT * FROM hospitals WHERE id = %s", (emergency["hospital_id"],))
        hospital = cur.fetchone()

    points = route_points(emergency, vehicle, hospital)
    if len(points) < 2:
        return {
            "activated": False,
            "corridorId": None,
            "signals": 0,
            "reason": "route needs vehicle and emergency/hospital coordinates",
        }

    # rebuild from scratch so the corridor always matches the current route.
    # Release FIRST so the signals are read back in their restored (non-override) state.
    release_corridor(cur, emergency_id, log=False)

    cur.execute("SELECT * FROM traffic_signals")
    hits = signals_along_route(points, cur.fetchall())
    if not hits:
        return {
            "activated": False,
            "corridorId": None,
            "signals": 0,
            "reason": f"no traffic signal within {int(CORRIDOR_RADIUS_M)} m of the route",
        }

    now = utcnow()
    cur.execute(
        """
        INSERT INTO corridors (emergency_id, vehicle_id, status, started_at)
        VALUES (%s, %s, 'ACTIVE', %s)
        """,
        (emergency_id, emergency.get("assigned_vehicle_id"), now),
    )
    corridor_id = cur.lastrowid

    for sequence, (sig, _dist, _along) in enumerate(hits, start=1):
        # if another active corridor already holds this signal keep ITS remembered state
        cur.execute(
            """
            SELECT prev_status FROM corridor_signals
            WHERE signal_id = %s AND released_at IS NULL AND corridor_id <> %s
            ORDER BY id LIMIT 1
            """,
            (sig["id"], corridor_id),
        )
        other = cur.fetchone()
        prev_status = other["prev_status"] if other else sig.get("status")

        cur.execute(
            """
            INSERT INTO corridor_signals
            (corridor_id, signal_id, sequence, prev_status, activated_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (corridor_id, sig["id"], sequence, prev_status, now),
        )
        cur.execute(
            """
            UPDATE traffic_signals
            SET emergency_override = 1, status = 'GREEN', updated_at = %s
            WHERE id = %s
            """,
            (now, sig["id"]),
        )

    log_event(
        cur,
        "CORRIDOR_ACTIVATED",
        f"Green corridor active for emergency #{emergency_id}",
        f"{len(hits)} signal(s) set to emergency override",
        emergency_id=emergency_id,
        latitude=points[0][0],
        longitude=points[0][1],
        severity="INFO",
    )
    return {"activated": True, "corridorId": corridor_id, "signals": len(hits), "reason": None}


def release_corridor(cur, emergency_id, log=True):
    """Restore every signal held by the emergency's active corridor(s). Returns released count."""
    cur.execute(
        "SELECT id FROM corridors WHERE emergency_id = %s AND status = 'ACTIVE'",
        (emergency_id,),
    )
    corridor_ids = [r["id"] for r in cur.fetchall()]
    if not corridor_ids:
        return 0

    now = utcnow()
    released = 0
    for corridor_id in corridor_ids:
        cur.execute(
            """
            SELECT id, signal_id, prev_status FROM corridor_signals
            WHERE corridor_id = %s AND released_at IS NULL
            """,
            (corridor_id,),
        )
        for item in cur.fetchall():
            cur.execute(
                "UPDATE corridor_signals SET released_at = %s WHERE id = %s", (now, item["id"])
            )
            # only restore the signal if no other active corridor still needs it
            cur.execute(
                """
                SELECT COUNT(*) AS n FROM corridor_signals
                WHERE signal_id = %s AND released_at IS NULL
                """,
                (item["signal_id"],),
            )
            if cur.fetchone()["n"] == 0:
                cur.execute(
                    """
                    UPDATE traffic_signals
                    SET emergency_override = 0, status = %s, updated_at = %s
                    WHERE id = %s
                    """,
                    (item["prev_status"] or "RED", now, item["signal_id"]),
                )
            released += 1
        cur.execute(
            "UPDATE corridors SET status = 'COMPLETED', ended_at = %s WHERE id = %s",
            (now, corridor_id),
        )

    if log:
        log_event(
            cur,
            "CORRIDOR_RELEASED",
            f"Green corridor released for emergency #{emergency_id}",
            f"{released} signal(s) restored",
            emergency_id=emergency_id,
            severity="INFO",
        )
    return released


# --------------------------------------------------------------------------
# Dashboard summary (single source of truth for /api/analytics/dashboard and
# the live snapshot)
# --------------------------------------------------------------------------
def build_summary(cur):
    now = utcnow()

    cur.execute("SELECT COUNT(*) AS n FROM emergencies")
    total_emergencies = cur.fetchone()["n"]
    cur.execute(f"SELECT COUNT(*) AS n FROM emergencies WHERE {NON_TERMINAL_SQL}")
    active_emergencies = cur.fetchone()["n"]

    cur.execute("SELECT * FROM vehicles")
    vehicles = cur.fetchall()
    available_vehicles = sum(1 for v in vehicles if v["status"] == "AVAILABLE")
    connected_vehicles = sum(
        1 for v in vehicles if age_seconds(v.get("last_seen"), now) is not None
        and age_seconds(v.get("last_seen"), now) <= GPS_STALE_SECONDS
    )
    gps_connected = sum(
        1 for v in vehicles
        if gps_status(v, now) == "ONLINE"
    )

    cur.execute("SELECT * FROM traffic_nodes")
    nodes = cur.fetchall()
    online_nodes = sum(1 for n in nodes if node_connection_status(n, now) == "ONLINE")

    cur.execute("SELECT COUNT(*) AS n FROM traffic_signals")
    total_signals = cur.fetchone()["n"]

    cur.execute("SELECT * FROM corridors WHERE status = 'ACTIVE' ORDER BY id DESC")
    active_corridor_rows = cur.fetchall()
    active_corridor = corridor_out(cur, active_corridor_rows[0]) if active_corridor_rows else None

    # A junction (traffic node) is "available" for a new corridor when it is online and
    # none of its signals is currently held by an active corridor.
    cur.execute(
        """
        SELECT DISTINCT s.node_id
        FROM corridor_signals cs
        JOIN traffic_signals s ON s.id = cs.signal_id
        WHERE cs.released_at IS NULL AND s.node_id IS NOT NULL
        """
    )
    busy_nodes = {r["node_id"] for r in cur.fetchall()}
    available_corridors = sum(
        1 for n in nodes
        if node_connection_status(n, now) == "ONLINE" and n["id"] not in busy_nodes
    )

    if nodes and online_nodes == 0:
        system_health = "DEGRADED"
    else:
        system_health = "ONLINE"

    return {
        "totalEmergencies": total_emergencies,
        "activeEmergencies": active_emergencies,
        "availableVehicles": available_vehicles,
        "totalVehicles": len(vehicles),
        "availableCorridors": available_corridors,
        "activeCorridors": len(active_corridor_rows),
        "activeCorridor": active_corridor,
        "systemHealth": system_health,
        "connectedVehicleNodes": connected_vehicles,
        "gpsConnectedVehicles": gps_connected,
        "connectedTrafficNodes": online_nodes,
        "totalTrafficNodes": len(nodes),
        "totalTrafficSignals": total_signals,
        "database": "ok",
        "serverTime": iso(now),
    }
