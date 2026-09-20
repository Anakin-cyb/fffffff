from flask import Blueprint, jsonify

api = Blueprint("api", __name__, url_prefix="/api")

@api.get("/status")
def status():
    return jsonify({
        "vehicle_node": "UNKNOWN",
        "traffic_node": "UNKNOWN",
        "signal": "UNKNOWN",
        "recording": False
    })

@api.post("/emergency/request")
def emergency_request():
    # TODO: implement request parsing, verification and state transition.
    return jsonify({"status": "TODO"}), 501
