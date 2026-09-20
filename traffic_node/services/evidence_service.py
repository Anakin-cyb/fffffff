from pathlib import Path
import json

def create_event_dir(root, event_id):
    path = Path(root) / event_id
    path.mkdir(parents=True, exist_ok=True)
    return path

def write_json(path, data):
    Path(path).write_text(json.dumps(data, indent=2), encoding="utf-8")
