class TrafficStateMachine:
    STATES = {"NORMAL", "REQUEST_PENDING", "APPROVED", "GREEN_CORRIDOR", "RESTORING", "FAULT"}

    def __init__(self):
        self.state = "NORMAL"

    def request(self):
        if self.state == "NORMAL":
            self.state = "REQUEST_PENDING"
            return True
        return False

    def approve(self):
        if self.state == "REQUEST_PENDING":
            self.state = "GREEN_CORRIDOR"
            return True
        return False

    def normal(self):
        if self.state in {"GREEN_CORRIDOR", "APPROVED", "REQUEST_PENDING"}:
            self.state = "RESTORING"
            return True
        return False
