# Serial transport abstraction.
# Exact ports are machine-specific and must be configured, never hard-coded.
class SerialManager:
    def __init__(self):
        self.vehicle = None
        self.traffic = None

    def send_vehicle(self, message: str):
        raise NotImplementedError

    def send_traffic(self, message: str):
        raise NotImplementedError
