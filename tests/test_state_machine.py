from traffic_node.services.state_machine import TrafficStateMachine

def test_request_approve_normal():
    sm = TrafficStateMachine()
    assert sm.request()
    assert sm.state == "REQUEST_PENDING"
    assert sm.approve()
    assert sm.state == "GREEN_CORRIDOR"
    assert sm.normal()
    assert sm.state == "RESTORING"
