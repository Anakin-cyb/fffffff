/**
 * ResQSync - Live Map Page
 */

(function () {
    "use strict";

    let container = null;

    function getContainer() {
        return document.querySelector(
            '[data-route-container="/live-map"]'
        );
    }

    function render() {
        container = getContainer();

        if (!container) {
            return null;
        }

        container.hidden = false;

        container.innerHTML = `
            <div class="page">

                <div class="page-header">

                    <div class="page-header-content">

                        <h1 class="page-title">
                            Live Map
                        </h1>

                        <p class="page-subtitle">
                            Monitor emergency vehicles,
                            traffic junctions and active
                            emergency corridors.
                        </p>

                    </div>

                    <div class="page-actions">

                        <div
                            class="system-status"
                            data-live-map-connection
                        >
                            <span
                                class="system-status-dot"
                            ></span>

                            <span>
                                Live Updates Ready
                            </span>
                        </div>

                        <button
                            type="button"
                            class="btn btn-outline"
                            data-live-map-refresh
                        >
                            <i
                                class="fa-solid fa-rotate"
                                aria-hidden="true"
                            ></i>

                            Refresh
                        </button>

                    </div>

                </div>

                <div class="content-split-wide">

                    <section class="card">

                        <div class="card-header">

                            <div>
                                <div class="card-title">
                                    Emergency Tracking
                                </div>

                                <div class="card-subtitle">
                                    Real-time vehicle and
                                    route monitoring
                                </div>
                            </div>

                            <span
                                class="badge badge-info"
                                data-live-map-gps-status
                            >
                                Waiting for GPS
                            </span>

                        </div>

                        <div class="map-wrapper">

                            <div
                                class="map-container"
                                data-live-map
                            ></div>

                            <div
                                class="map-controls"
                                aria-label="Map controls"
                            >

                                <div
                                    class="map-control-group"
                                >

                                    <button
                                        type="button"
                                        class="map-control-button"
                                        data-live-map-fit
                                        data-tooltip="Fit active route"
                                        aria-label="Fit active route"
                                    >
                                        <i
                                            class="fa-solid fa-expand"
                                            aria-hidden="true"
                                        ></i>
                                    </button>

                                    <button
                                        type="button"
                                        class="map-control-button"
                                        data-live-map-refresh
                                        data-tooltip="Refresh map"
                                        aria-label="Refresh map"
                                    >
                                        <i
                                            class="fa-solid fa-rotate"
                                            aria-hidden="true"
                                        ></i>
                                    </button>

                                </div>

                            </div>

                            <div
                                class="map-overlay"
                                data-live-map-overlay
                            >
                                <div class="map-overlay-title">
                                    Live GPS
                                </div>

                                <div class="map-overlay-meta">
                                    Waiting for vehicle telemetry
                                </div>
                            </div>

                        </div>

                        <div
                            class="map-legend"
                            style="margin-top: var(--space-4);"
                        >

                            <span class="map-legend-item">
                                <span
                                    class="
                                        map-legend-marker
                                        vehicle
                                    "
                                ></span>

                                Emergency Vehicle
                            </span>

                            <span class="map-legend-item">
                                <span
                                    class="
                                        map-legend-marker
                                        emergency
                                    "
                                ></span>

                                Emergency Origin
                            </span>

                            <span class="map-legend-item">
                                <span
                                    class="
                                        map-legend-marker
                                        junction
                                    "
                                ></span>

                                Junction
                            </span>

                            <span class="map-legend-item">
                                <span
                                    class="
                                        map-legend-marker
                                        hospital
                                    "
                                ></span>

                                Hospital
                            </span>

                        </div>

                    </section>

                    <aside
                        class="stack-4"
                    >

                        <div class="card">

                            <div class="card-header">

                                <div>
                                    <div class="card-title">
                                        Vehicle Tracking
                                    </div>

                                    <div class="card-subtitle">
                                        Current telemetry
                                    </div>
                                </div>

                            </div>

                            <div
                                class="vehicle-tracking-card"
                                data-live-map-vehicle
                            >
                                <div class="empty-state">
                                    <i
                                        class="
                                            fa-solid
                                            fa-truck-medical
                                        "
                                        aria-hidden="true"
                                    ></i>

                                    <span>
                                        No vehicle telemetry
                                        received
                                    </span>
                                </div>
                            </div>

                        </div>

                        <div class="card">

                            <div class="card-header">

                                <div>
                                    <div class="card-title">
                                        Route Information
                                    </div>

                                    <div class="card-subtitle">
                                        Backend-provided
                                        navigation data
                                    </div>
                                </div>

                            </div>

                            <div
                                class="route-info"
                                data-live-map-route
                            >

                                <div class="route-info-row">

                                    <span
                                        class="route-info-label"
                                    >
                                        Distance
                                    </span>

                                    <span
                                        class="route-info-value"
                                        data-live-map-distance
                                    >
                                        —
                                    </span>

                                </div>

                                <div class="route-info-row">

                                    <span
                                        class="route-info-label"
                                    >
                                        ETA
                                    </span>

                                    <span
                                        class="route-info-value"
                                        data-live-map-eta
                                    >
                                        —
                                    </span>

                                </div>

                                <div class="route-info-row">

                                    <span
                                        class="route-info-label"
                                    >
                                        Destination
                                    </span>

                                    <span
                                        class="route-info-value"
                                        data-live-map-destination
                                    >
                                        —
                                    </span>

                                </div>

                            </div>

                        </div>

                        <div class="card">

                            <div class="card-header">

                                <div>
                                    <div class="card-title">
                                        Corridor Status
                                    </div>

                                    <div class="card-subtitle">
                                        Signal coordination
                                    </div>
                                </div>

                                <span
                                    class="
                                        corridor-map-state
                                        idle
                                    "
                                    data-live-map-corridor
                                >
                                    Idle
                                </span>

                            </div>

                            <div
                                class="junction-list"
                                data-live-map-junctions
                            >
                                <div class="empty-state">
                                    <i
                                        class="fa-solid fa-road"
                                        aria-hidden="true"
                                    ></i>

                                    <span>
                                        No active corridor
                                    </span>
                                </div>
                            </div>

                        </div>

                    </aside>

                </div>

            </div>
        `;

        bindEvents();

        return container;
    }

    // ------------------------------------------------------------------
    // Live data (polling /api/live/snapshot through RESQ_LIVE_SERVICE)
    // ------------------------------------------------------------------
    let unsubscribe = null;
    let mapElement = null;
    let layer = null;
    let focusEmergencyId = null;
    let emptyVehicleHtml = "";
    let emptyJunctionHtml = "";

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function q(selector) {
        return container?.querySelector(selector) || null;
    }

    function setText(selector, value) {
        const element = q(selector);

        if (element) {
            element.textContent =
                value === undefined || value === null || value === "" ? "—" : String(value);
        }
    }

    function formatTime(value) {
        if (!value) {
            return "—";
        }

        return window.RESQ_FORMAT?.formatDateTime
            ? window.RESQ_FORMAT.formatDateTime(value)
            : value;
    }

    function bindEvents() {
        if (!container) {
            return;
        }

        container
            .querySelectorAll("[data-live-map-refresh]")
            .forEach((button) => button.addEventListener("click", refresh));

        q("[data-live-map-fit]")?.addEventListener("click", fitActiveRoute);
    }

    function initializeMap() {
        mapElement = q("[data-live-map]");

        if (!mapElement) {
            return;
        }

        try {
            if (window.RESQ_MAP && typeof window.RESQ_MAP.init === "function") {
                window.RESQ_MAP.init(mapElement);
                layer = window.RESQ_LIVE_LAYER?.create(mapElement, "live") || null;
            }
        } catch (error) {
            setText("[data-live-map-gps-status]", "Map unavailable");

            if (window.RESQ_LOGGER) {
                window.RESQ_LOGGER.warn("Live map initialization failed.", error);
            }
        }
    }

    function fitActiveRoute() {
        if (!layer) {
            return;
        }

        if (!layer.fitEmergency(focusEmergencyId)) {
            layer.fitAll();
        }
    }

    function setConnection(online) {
        const box = q("[data-live-map-connection]");

        if (!box) {
            return;
        }

        box.classList.toggle("offline", !online);

        const label = box.querySelector("span:last-child");

        if (label) {
            label.textContent = online ? "Live - updating every few seconds" : "Backend offline";
        }
    }

    const GPS_BADGES = {
        ONLINE: ["badge-success", "GPS Connected"],
        STALE: ["badge-warning", "GPS Stale"],
        OFFLINE: ["badge-danger", "GPS Offline"],
        WAITING_FOR_FIX: ["badge-warning", "Waiting for GPS"]
    };

    function setGpsBadge(status) {
        const badge = q("[data-live-map-gps-status]");

        if (!badge) {
            return;
        }

        const [css, label] = GPS_BADGES[status] || ["badge-info", "Waiting for GPS"];

        badge.className = `badge ${css}`;
        badge.textContent = label;
    }

    // the vehicle the side panels follow: the one on the newest active emergency,
    // otherwise the vehicle that reported most recently
    function pickFocus(snapshot) {
        const emergencies = (snapshot.emergencies || []).filter(
            (item) => item.isActive && item.vehicleId
        );
        const emergency = emergencies[0] || null;
        let vehicle = null;

        if (emergency) {
            vehicle = (snapshot.vehicles || []).find(
                (item) => item.vehicleId === emergency.vehicleId
            ) || null;
        } else {
            vehicle = (snapshot.vehicles || [])
                .filter((item) => item.lastSeen)
                .sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)))[0] || null;
        }

        return { emergency, vehicle };
    }

    function renderVehicle(vehicle) {
        const target = q("[data-live-map-vehicle]");

        if (!target) {
            return;
        }

        if (!vehicle) {
            target.innerHTML = emptyVehicleHtml;
            return;
        }

        const value = (v, unit = "") => (v === null || v === undefined ? "—" : `${v}${unit}`);

        target.innerHTML = `
            <dl class="manage-facts" style="padding: var(--space-4);">
                <dt>Vehicle</dt><dd>${escapeHtml(vehicle.vehicleNumber)}</dd>
                <dt>Driver</dt><dd>${escapeHtml(vehicle.driverName || "—")}</dd>
                <dt>Status</dt><dd>${escapeHtml(vehicle.status)}</dd>
                <dt>GPS</dt><dd>${escapeHtml(vehicle.gpsStatus)}</dd>
                <dt>Speed</dt><dd>${escapeHtml(value(vehicle.speed, " km/h"))}</dd>
                <dt>Fuel</dt><dd>${escapeHtml(value(vehicle.fuelLevel, " %"))}</dd>
                <dt>Temperature</dt><dd>${escapeHtml(value(vehicle.temperature, " °C"))}</dd>
                <dt>Position</dt>
                <dd>${
                    vehicle.latitude != null
                        ? escapeHtml(`${vehicle.latitude.toFixed(5)}, ${vehicle.longitude.toFixed(5)}`)
                        : "—"
                }</dd>
                <dt>Last update</dt><dd>${escapeHtml(formatTime(vehicle.lastSeen))}</dd>
            </dl>
        `;
    }

    function renderOverlay(vehicle) {
        const overlay = q("[data-live-map-overlay]");

        if (!overlay) {
            return;
        }

        overlay.innerHTML = vehicle
            ? `
                <div class="map-overlay-title">${escapeHtml(vehicle.vehicleNumber)}</div>
                <div class="map-overlay-meta">
                    ${vehicle.speed != null ? escapeHtml(`${vehicle.speed} km/h`) : "Speed n/a"}
                    &middot; ${escapeHtml(vehicle.gpsStatus)}
                </div>
            `
            : `
                <div class="map-overlay-title">Live GPS</div>
                <div class="map-overlay-meta">Waiting for vehicle telemetry</div>
            `;
    }

    function renderRoute(emergency) {
        setText(
            "[data-live-map-distance]",
            emergency?.distanceKm != null ? `${emergency.distanceKm} km (estimate)` : null
        );
        setText(
            "[data-live-map-eta]",
            emergency?.etaMinutes != null ? `${emergency.etaMinutes} min (estimate)` : null
        );

        let destination = null;

        if (emergency) {
            destination = ["PATIENT_PICKED_UP", "TRANSPORT_TO_HOSPITAL", "AT_PATIENT"].includes(emergency.status) &&
                emergency.hospitalId
                ? `Hospital #${emergency.hospitalId}`
                : emergency.location;
        }

        setText("[data-live-map-destination]", destination);
    }

    function renderCorridor(snapshot, emergency) {
        const badge = q("[data-live-map-corridor]");
        const target = q("[data-live-map-junctions]");

        if (!badge || !target) {
            return;
        }

        const corridor = emergency
            ? (snapshot.corridors || []).find((item) => item.emergencyId === emergency.emergencyId)
            : null;

        if (!corridor) {
            badge.className = "corridor-map-state idle";
            badge.textContent = "Idle";
            target.innerHTML = emptyJunctionHtml;
            return;
        }

        badge.className = "corridor-map-state active";
        badge.textContent = "Active";

        target.innerHTML = corridor.signals
            .map(
                (signal) => `
                    <div class="corridor-signal">
                        <span>${escapeHtml(signal.sequence)}. ${escapeHtml(signal.name)}</span>
                        <span class="signal-pill ${escapeHtml(String(signal.status || "").toLowerCase())}">
                            ${escapeHtml(signal.status || "—")}${signal.emergencyOverride ? " (override)" : ""}
                        </span>
                    </div>
                `
            )
            .join("");
    }

    function onLive({ snapshot, error }) {
        if (!container) {
            return;
        }

        setConnection(!error);

        if (!snapshot) {
            return;
        }

        const { emergency, vehicle } = pickFocus(snapshot);
        focusEmergencyId = emergency ? emergency.emergencyId : null;

        setGpsBadge(vehicle ? vehicle.gpsStatus : "WAITING_FOR_FIX");
        renderVehicle(vehicle);
        renderOverlay(vehicle);
        renderRoute(emergency);
        renderCorridor(snapshot, emergency);

        layer?.sync(snapshot);
    }

    async function refresh() {
        await window.RESQ_LIVE_SERVICE?.refresh();
    }

    function activate() {
        if (!unsubscribe && window.RESQ_LIVE_SERVICE) {
            unsubscribe = window.RESQ_LIVE_SERVICE.subscribe(onLive);
        }

        if (mapElement && window.RESQ_MAP?.invalidateSize) {
            // the map was created while the page was hidden on a revisit: re-measure it
            window.setTimeout(function () {
                window.RESQ_MAP.invalidateSize(mapElement);
            }, 50);
        }
    }

    function deactivate() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
    }

    async function initialize() {
        render();

        emptyVehicleHtml = q("[data-live-map-vehicle]")?.innerHTML || "";
        emptyJunctionHtml = q("[data-live-map-junctions]")?.innerHTML || "";

        initializeMap();
        activate();

        return container;
    }

    window.RESQ_LIVE_MAP_PAGE =
        Object.freeze({
            initialize,
            render,
            refresh,
            activate,
            deactivate
        });
})();
