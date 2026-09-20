"""
ResQSync - database migration for the full integration.

Run ONCE after importing resqsync.sql (safe to run again, it only adds what is missing):

    python migrate.py                 # schema changes only
    python migrate.py --seed-demo     # + demo hospitals / traffic nodes / signals for map testing
    python migrate.py --remove-demo   # delete the demo rows again

Nothing is dropped and existing rows are kept.
"""

import sys

from database import get_connection

# table -> [(column, definition)]
NEW_COLUMNS = {
    "emergencies": [
        ("latitude", "DECIMAL(10,7) NULL"),
        ("longitude", "DECIMAL(10,7) NULL"),
        ("assigned_vehicle_id", "INT NULL"),
        ("hospital_id", "INT NULL"),
        ("updated_at", "TIMESTAMP NULL"),
        ("resolved_at", "TIMESTAMP NULL"),
    ],
    "vehicles": [
        ("last_seen", "TIMESTAMP NULL"),
        ("current_emergency_id", "INT NULL"),
        ("updated_at", "TIMESTAMP NULL"),
    ],
    "traffic_nodes": [
        ("last_heartbeat", "TIMESTAMP NULL"),
    ],
    "traffic_signals": [
        ("node_id", "INT NULL"),
        ("updated_at", "TIMESTAMP NULL"),
    ],
    "events": [
        ("emergency_id", "INT NULL"),
        ("source", "VARCHAR(50) NULL"),
    ],
}

NEW_TABLES = {
    "corridors": """
        CREATE TABLE IF NOT EXISTS corridors (
          id INT NOT NULL AUTO_INCREMENT,
          emergency_id INT NOT NULL,
          vehicle_id INT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
          started_at TIMESTAMP NULL,
          ended_at TIMESTAMP NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    """,
    "corridor_signals": """
        CREATE TABLE IF NOT EXISTS corridor_signals (
          id INT NOT NULL AUTO_INCREMENT,
          corridor_id INT NOT NULL,
          signal_id INT NOT NULL,
          sequence INT NOT NULL DEFAULT 0,
          prev_status VARCHAR(30) NULL,
          activated_at TIMESTAMP NULL,
          released_at TIMESTAMP NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    """,
}

# (index name, table, columns)  - hardware posts telemetry every few seconds, so index it
INDEXES = [
    ("idx_telemetry_vehicle", "telemetry", "vehicle_id, id"),
    ("idx_corridors_emergency", "corridors", "emergency_id, status"),
    ("idx_corridor_signals_signal", "corridor_signals", "signal_id, released_at"),
    ("idx_events_emergency", "events", "emergency_id"),
    ("idx_emergencies_status", "emergencies", "status"),
]


def column_exists(cur, table, column):
    cur.execute(f"SHOW COLUMNS FROM {table} LIKE '{column}'")
    return cur.fetchone() is not None


def migrate():
    conn = get_connection()
    cur = conn.cursor()

    for table, columns in NEW_COLUMNS.items():
        for column, definition in columns:
            if column_exists(cur, table, column):
                print(f"  ok      {table}.{column} (already there)")
            else:
                cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
                print(f"  added   {table}.{column}")

    for name, ddl in NEW_TABLES.items():
        cur.execute(ddl)
        print(f"  ok      table {name}")

    for name, table, columns in INDEXES:
        try:
            cur.execute(f"CREATE INDEX {name} ON {table} ({columns})")
            print(f"  added   index {name}")
        except Exception as error:  # duplicate index -> already migrated
            message = str(error).lower()
            if "duplicate key name" in message or "already exists" in message:
                print(f"  ok      index {name} (already there)")
            else:
                raise

    # backfill so existing rows behave sensibly with the new columns
    cur.execute(
        """
        UPDATE vehicles
        SET last_seen = (SELECT MAX(t.created_at) FROM telemetry t WHERE t.vehicle_id = vehicles.id)
        WHERE last_seen IS NULL
        """
    )
    cur.execute("UPDATE emergencies SET updated_at = created_at WHERE updated_at IS NULL")
    conn.commit()
    cur.close()
    conn.close()
    print("Migration finished.")


# ---------------------------------------------------------------------------
# Demo data (clearly labelled DEMO, coordinates are approximate - edit freely)
# ---------------------------------------------------------------------------
DEMO_HOSPITALS = [
    ("AIIMS New Delhi (demo)", "Ansari Nagar, New Delhi - demo coordinates", 28.5672, 77.2100, 25),
    ("Safdarjung Hospital (demo)", "Ansari Nagar West, New Delhi - demo coordinates", 28.5677, 77.2072, 12),
    ("RML Hospital (demo)", "Baba Kharak Singh Marg, New Delhi - demo coordinates", 28.6258, 77.2007, 8),
]

# vehicle 1 in the sample data sits at 28.6139, 77.2090; the demo emergency is placed
# north-east of it and the demo signals lie along / away from that straight route.
DEMO_EMERGENCY_POINT = (28.6304, 77.2177)
DEMO_NODES = [
    # name, lat, lng
    ("DEMO-NODE-1", 28.6180, 77.2114),
    ("DEMO-NODE-2", 28.6222, 77.2134),
    ("DEMO-NODE-3", 28.6265, 77.2156),
    ("DEMO-NODE-FAR", 28.5800, 77.3000),  # deliberately NOT on the route
]


def seed_demo():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM hospitals WHERE address LIKE '%demo coordinates%'")
    if cur.fetchone()[0] == 0:
        for name, address, lat, lng, beds in DEMO_HOSPITALS:
            cur.execute(
                """
                INSERT INTO hospitals
                (hospital_name, address, latitude, longitude, emergency_available, available_beds, status)
                VALUES (%s, %s, %s, %s, 1, %s, 'ACTIVE')
                """,
                (name, address, lat, lng, beds),
            )
        print(f"  seeded  {len(DEMO_HOSPITALS)} hospitals")
    else:
        print("  ok      demo hospitals already present")

    cur.execute("SELECT COUNT(*) FROM traffic_nodes WHERE node_name LIKE 'DEMO-NODE-%'")
    if cur.fetchone()[0] == 0:
        for index, (name, lat, lng) in enumerate(DEMO_NODES, start=1):
            cur.execute(
                """
                INSERT INTO traffic_nodes (node_name, latitude, longitude, status, congestion_level)
                VALUES (%s, %s, %s, 'ACTIVE', 'LOW')
                """,
                (name, lat, lng),
            )
            node_id = cur.lastrowid
            signal_name = "DEMO-SIGNAL-FAR" if name.endswith("FAR") else f"DEMO-SIGNAL-{index}"
            cur.execute(
                """
                INSERT INTO traffic_signals
                (signal_name, latitude, longitude, status, emergency_override, node_id)
                VALUES (%s, %s, %s, 'RED', 0, %s)
                """,
                (signal_name, lat, lng, node_id),
            )
        print(f"  seeded  {len(DEMO_NODES)} traffic nodes + signals")
    else:
        print("  ok      demo traffic nodes already present")

    # give the sample emergency (#1, location text 'Delhi') coordinates so it shows on the map
    cur.execute(
        "UPDATE emergencies SET latitude = %s, longitude = %s WHERE id = 1 AND latitude IS NULL",
        DEMO_EMERGENCY_POINT,
    )
    conn.commit()
    cur.close()
    conn.close()
    print("Demo data ready. Remove it later with: python migrate.py --remove-demo")


def remove_demo():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM corridor_signals WHERE signal_id IN (SELECT id FROM traffic_signals WHERE signal_name LIKE 'DEMO-SIGNAL-%')")
    cur.execute("DELETE FROM traffic_signals WHERE signal_name LIKE 'DEMO-SIGNAL-%'")
    cur.execute("DELETE FROM traffic_nodes WHERE node_name LIKE 'DEMO-NODE-%'")
    cur.execute("DELETE FROM hospitals WHERE address LIKE '%demo coordinates%'")
    conn.commit()
    cur.close()
    conn.close()
    print("Demo rows removed.")


if __name__ == "__main__":
    print("Migrating resqsync database...")
    migrate()
    if "--seed-demo" in sys.argv:
        print("Seeding demo data...")
        seed_demo()
    if "--remove-demo" in sys.argv:
        remove_demo()
