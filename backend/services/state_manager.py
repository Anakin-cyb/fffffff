class ResQSyncState:
    def __init__(self):
        self.signal = "RED"
        self.next_signal = "GREEN"
        self.countdown = 0
        self.pending_request = None
        self.active_event = None
        self.recording = False
        self.vehicle_online = False
        self.traffic_online = False
        self.ai_status = "IDLE"
