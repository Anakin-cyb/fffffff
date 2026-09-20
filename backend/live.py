"""
ResQSync - live snapshot for the dashboard / live map.

GET /api/live/snapshot returns emergencies, vehicles, hospitals, traffic nodes + signals,
active corridors, recent events and the dashboard summary in ONE response, so the
frontend can poll a single endpoint every few seconds.
"""

from flask import Blueprint, jsonify

from helpers import (
    build_summary,
    corridor_out,
    db,
    emergency_out,
    event_out,
    hospital_out,
    iso,
    latest_telemetry_by_vehicle,
    node_out,
    num,
    route_points,
    route_summary,
    signal_out,
    utcnow,
    vehicle_out,
)

live_bp = Blueprint("live", __name__)


@live_bp.route("/api/live/snapshot", methods=["GET"])
def live_snapshot():
    now = utcnow()
    with db() as (conn, cur):
        summary = build_summary(cur)

        cur.execute("SELECT * FROM vehicles ORDER BY id")
        vehicle_rows = cur.fetchall()
        latest = latest_telemetry_by_vehicle(cur)
        vehicles = [vehicle_out(v, latest.get(v["id"]), now) for v in vehicle_rows]
        vehicles_by_id = {v["id"]: v for v in vehicle_rows}

        cur.execute("SELECT * FROM hospitals ORDER BY id")
        hospital_rows = cur.fetchall()
        hospitals = [hospital_out(h) for h in hospital_rows]
        hospitals_by_id = {h["id"]: h for h in hospital_rows}

        cur.execute("SELECT * FROM traffic_signals ORDER BY id")
        signals = [signal_out(s) for s in cur.fetchall()]

        cur.execute("SELECT * FROM traffic_nodes ORDER BY id")
        nodes = []
        for row in cur.fetchall():
            node = node_out(row, now)
            node_signals = [s for s in signals if s["nodeId"] == row["id"]]
            node["signals"] = node_signals
            # single state for the map marker: GREEN when any signal is held for an ambulance
            if any(s["emergencyOverride"] for s in node_signals):
                node["signalState"] = "GREEN"
            elif node_signals:
                node["signalState"] = node_signals[0]["signalState"]
            else:
                node["signalState"] = None
            nodes.append(node)

        cur.execute("SELECT * FROM emergencies ORDER BY id DESC LIMIT 50")
        emergencies = []
        for row in cur.fetchall():
            vehicle = vehicles_by_id.get(row.get("assigned_vehicle_id"))
            item = emergency_out(row, vehicle)
            item["route"] = []
            item["distanceKm"] = None
            item["etaMinutes"] = None
            if item["isActive"] and vehicle:
                hospital = hospitals_by_id.get(row.get("hospital_id"))
                points = route_points(row, vehicle, hospital)
                item["route"] = [[p[0], p[1]] for p in points]
                telemetry = latest.get(vehicle["id"]) or {}
                item["distanceKm"], item["etaMinutes"] = route_summary(points, num(telemetry.get("speed")))
            emergencies.append(item)

        cur.execute("SELECT * FROM corridors WHERE status = 'ACTIVE' ORDER BY id DESC")
        corridors = [corridor_out(cur, c) for c in cur.fetchall()]

        cur.execute("SELECT * FROM events ORDER BY id DESC LIMIT 15")
        events = [event_out(e) for e in cur.fetchall()]

    return jsonify(
        {
            "serverTime": iso(now),
            "summary": summary,
            "emergencies": emergencies,
            "vehicles": vehicles,
            "hospitals": hospitals,
            "trafficNodes": nodes,
            "signals": signals,
            "corridors": corridors,
            "events": events,
        }
    )
