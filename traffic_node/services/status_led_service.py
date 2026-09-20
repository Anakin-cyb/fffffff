class StatusLEDService:
    def request(self, on): raise NotImplementedError
    def approved(self, on): raise NotImplementedError
    def recording(self, on): raise NotImplementedError
    def fault(self, on): raise NotImplementedError
