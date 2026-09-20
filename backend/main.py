from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import uuid

app = FastAPI(title="RapidResQ Backend")


class PriorityRequest(BaseModel):
    vehicle_id: str
    signal_id: str
    emergency_type: str


requests = {}


@app.get("/")
def home():
    return {
        "message": "RapidResQ Backend is running!"
    }


@app.post("/priority-request")
def create_priority_request(data: PriorityRequest):
    request_id = str(uuid.uuid4())

    requests[request_id] = {
        "request_id": request_id,
        "vehicle_id": data.vehicle_id,
        "signal_id": data.signal_id,
        "emergency_type": data.emergency_type,
        "status": "RECEIVED"
    }

    return requests[request_id]


@app.get("/priority-request/{request_id}")
def get_priority_request(request_id: str):
    if request_id not in requests:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    return requests[request_id]


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)