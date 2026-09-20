def verify_vehicle(vehicle_id, registry):
    vehicle = registry.get("vehicles", {}).get(vehicle_id)
    if not vehicle:
        return False, "UNKNOWN_VEHICLE"
    if not vehicle.get("enabled", False):
        return False, "VEHICLE_DISABLED"
    return True, "VERIFIED"
