# ResQSync - integrated project

Hardware -> Flask backend -> MySQL -> Dashboard / Live Map

```
ResQSync_integrated/
├── backend/               Flask API (your existing app.py, extended)
│   ├── app.py             existing routes + fixes (CORS, JSON errors, health, dashboard summary)
│   ├── helpers.py         DB helper, serialisers, geo maths, corridor logic   (new)
│   ├── lifecycle.py       emergency assign / status / cancel / route, vehicles, signals   (new)
│   ├── hardware.py        endpoints the devices call                          (new)
│   ├── live.py            /api/live/snapshot for the map                      (new)
│   ├── migrate.py         adds the new columns/tables, optional demo data     (new)
│   ├── database.py        your MySQL connection (+ UTC session time zone)
│   └── main.py            OLD FastAPI prototype (port 8000) - not used, kept for reference
├── frontend/              your frontend, now wired to the backend
├── database/resqsync.sql  your original dump, unchanged
├── hardware_examples/     simulator.py (tested), two ESP32 sketches (NOT compiled/tested)
└── tests/e2e_check.py     end-to-end check of the whole flow
```

## 1. First-time setup (Windows / any OS)

```bash
# 1. database (skip if you already imported resqsync.sql)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS resqsync"
mysql -u root -p resqsync < database/resqsync.sql

# 2. backend
cd backend
pip install -r requirements.txt          # Flask, flask-cors, mysql-connector-python
# Windows PowerShell example:
#   $env:RESQ_DB_PASSWORD="your-mysql-password"
# Linux/macOS example:
#   export RESQ_DB_PASSWORD="your-mysql-password"
python migrate.py --seed-demo            # new columns/tables + demo hospitals/junctions
python app.py                            # http://127.0.0.1:5000

# 3. frontend (second terminal)
cd frontend
python -m http.server 5500               # open http://127.0.0.1:5500
```

`migrate.py` is safe to run again. `python migrate.py --remove-demo` deletes the demo rows
(names start with `DEMO-`; hospitals are marked "demo coordinates").
Check http://127.0.0.1:5000/api/health - it must say `"database": "ok"`.

## 2. Try the whole loop without hardware

```bash
python hardware_examples/simulator.py            # fake ambulance + 4 junction units
```
1. Dashboard -> Emergencies -> **New Emergency** (give latitude/longitude, e.g. 28.6304 / 77.2177).
2. **Manage -> Assign vehicle**. The Live Map shows the vehicle moving (driven by the simulator),
   the 3 junctions on the route turn green, the corridor is listed.
3. Step it through *En route -> Arrived -> Picked up -> Transport to hospital* (the nearest
   available hospital is chosen automatically) and **Mark resolved**: the vehicle becomes
   AVAILABLE again and all signals go back to their previous state.

Automated check (backend must be running, demo data seeded):
```bash
python tests/e2e_check.py
```

## 3. Hardware contract

All endpoints take/return JSON. If you start the backend with `RESQ_HARDWARE_KEY=secret`,
every `/api/hardware/*` call (except `ping`) needs the header `X-API-Key: secret`.
To reach the backend from an ESP32 on your WiFi start it with `RESQ_HOST=0.0.0.0`
(and allow port 5000 in the firewall).

| Call | Purpose |
|---|---|
| `GET /api/hardware/ping` | connectivity check |
| `POST /api/hardware/vehicle` | ambulance unit: `vehicle_number` (or `vehicle_id`), `latitude`, `longitude`, `speed`, `fuel_level`, `temperature` (all but the id optional). Response contains the vehicle's current `emergency` (or null). |
| `POST /api/hardware/node` | junction unit heartbeat: `node_id` (id or `node_name`), optional `congestion_level` LOW/MEDIUM/HIGH, optional `signals: [{signal_name, status}]` with the LED state it shows. Response `commands` tell it what to do. |
| `GET /api/hardware/node/<node>/command` | same commands without sending a heartbeat |
| `POST /api/hardware/signal` | report one signal: `signal_name`/`signal_id`, `status` RED/YELLOW/GREEN/OFF/FLASHING |

`commands[].targetState` is `GREEN` (emergency override: hold green) or `AUTO` (normal cycle).

```bash
curl -X POST http://127.0.0.1:5000/api/hardware/vehicle -H "Content-Type: application/json" \
     -d '{"vehicle_number":"DL01AB1234","latitude":28.6139,"longitude":77.2090,"speed":42}'
curl -X POST http://127.0.0.1:5000/api/hardware/node -H "Content-Type: application/json" \
     -d '{"node_id":"DEMO-NODE-1","congestion_level":"LOW","signals":[{"signal_name":"DEMO-SIGNAL-1","status":"RED"}]}'
```
A vehicle counts as GPS-connected if it reported within 15 s, a junction as online if it sent a
heartbeat within 30 s (`RESQ_GPS_STALE_SECONDS`, `RESQ_NODE_TIMEOUT_SECONDS`).
Send heartbeats/telemetry every 2-3 s. `telemetry` grows fast - purge old rows now and then.

## 4. How the pieces behave

* **Emergency statuses:** ACTIVE -> ASSIGNED -> EN_ROUTE_TO_PATIENT -> AT_PATIENT ->
  PATIENT_PICKED_UP -> TRANSPORT_TO_HOSPITAL -> RESOLVED (or CANCELLED). "Active emergencies" =
  everything that is not RESOLVED/CANCELLED.
* **Assigning** claims the vehicle atomically (only if it is AVAILABLE; the vehicle becomes
  DISPATCHED) and builds the green corridor.
* **Green corridor:** every traffic signal within 300 m (`RESQ_CORRIDOR_RADIUS_M`) of the straight
  route vehicle -> emergency (-> hospital) gets `emergency_override = 1` and status GREEN; the previous
  state is remembered and restored on resolve/cancel. The route is rebuilt after pickup
  (vehicle -> hospital).
* **Dashboard numbers:** `availableCorridors` = online junctions not held by an active corridor
  (my definition - change it in `helpers.build_summary` if you mean something else);
  `activeCorridors` = corridors currently active; `systemHealth` = ONLINE, or DEGRADED if junctions
  are registered but none is online.
* **Live data:** the frontend polls `GET /api/live/snapshot` every 3 s (`config.js -> POLLING`),
  only while the dashboard / live map / emergencies page is open.
* **Distance/ETA are estimates** (straight line x 1.3, at the vehicle's speed or 40 km/h). There is
  no road routing service.
* Times are stored in UTC and shown in the browser's local time.

## 5. Known limits / things I deliberately did not do

* **No login.** `REQUIRE_AUTH` is `false` in `frontend/config/config.js`, so this is a trusted-network demo.
  Do not expose the control surface to an untrusted network. The hardware key is a shared secret, not user authentication.
* No WebSocket (polling instead).
* Demo hospital/junction coordinates are approximate placeholders.
* The ESP32 sketches are templates: not compiled or run on physical hardware. Real signal control needs a
  certified controller and fail-safe behaviour - this project demonstrates the data flow only.
* MySQL credentials are loaded from `RESQ_DB_*` environment variables; no password is stored in source.

## 6. Validation status

This package has been statically validated after integration: all Python files compile, all JavaScript
files pass `node --check`, the archive extracts cleanly, and the frontend is structured so every router
route has a page module. The included end-to-end test remains the authoritative integration test once a
real MySQL 8.x server is available.

This environment does **not** provide a MySQL server or internet access for installing Flask/MySQL
packages, so a real MySQL execution cannot honestly be claimed from this sandbox. Run `tests/e2e_check.py`
after starting MySQL and the Flask backend. Leaflet/Font Awesome are loaded from CDNs by the browser;
if your network blocks CDNs, the core API still works but map/icons may not render until those assets are
available.

## Troubleshooting
* `Access denied for user` -> set `RESQ_DB_USER` / `RESQ_DB_PASSWORD` (and host/name if needed).
* Dashboard says "Backend Offline" -> backend not running, or `API_BASE_URL` in `frontend/config/config.js`
  differs from where it runs. Open the frontend via `127.0.0.1:5500` or `localhost:5500`
  (other hosts: `set RESQ_CORS_ORIGINS=http://host:5500`).
* Assign says "no available vehicle" -> a vehicle is DISPATCHED/OFFLINE; resolve its emergency or
  `PATCH /api/vehicles/<id>/status {"status":"AVAILABLE"}`.
* Corridor "no traffic signal within 300 m of the route" -> the emergency/vehicle need coordinates and the
  signals in `traffic_signals` need latitude/longitude (link them to a node via `node_id`).


## Vercel deployment

See `VERCEL_DEPLOY.md`. This package includes `vercel.json`, a Vercel Python entrypoint at `api/index.py`, root-level Python dependencies, and a same-origin production frontend configuration.


## Railway + MySQL deployment

See `RAILWAY_MYSQL_DEPLOY.md` for the production setup: Vercel frontend → Railway Flask API → Railway MySQL.
