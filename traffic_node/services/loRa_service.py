class LoRaService:
    def send(self, packet: str):
        raise NotImplementedError

    def receive(self):
        raise NotImplementedError
