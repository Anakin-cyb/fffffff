from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
with open(ROOT / "config" / "app.yaml", "r", encoding="utf-8") as f:
    CONFIG = yaml.safe_load(f)
