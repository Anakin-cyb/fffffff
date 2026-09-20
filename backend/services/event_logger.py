from pathlib import Path
import csv
from datetime import datetime, timezone

FIELDS = [
    "timestamp", "event_id", "event_type", "node_id", "vehicle_id",
    "action", "status", "signal_before", "signal_after",
    "latitude", "longitude", "details"
]

def append_event(csv_path, **values):
    path = Path(csv_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    new_file = not path.exists()
    row = {field: values.get(field, "") for field in FIELDS}
    row["timestamp"] = row["timestamp"] or datetime.now(timezone.utc).isoformat()
    with path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        if new_file:
            writer.writeheader()
        writer.writerow(row)
