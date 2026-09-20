from backend.services.verification import verify_vehicle

def test_known_enabled_vehicle():
    ok, reason = verify_vehicle("VN-AMB-001", {"vehicles": {"VN-AMB-001": {"enabled": True}}})
    assert ok is True
    assert reason == "VERIFIED"

def test_unknown_vehicle():
    ok, reason = verify_vehicle("VN-FAKE-999", {"vehicles": {}})
    assert ok is False
    assert reason == "UNKNOWN_VEHICLE"
