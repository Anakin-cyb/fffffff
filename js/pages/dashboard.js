/**
 * ResQSync - Main Dashboard Page
 */

(function () {
    "use strict";

    let container = null;

    function getContainer() {
        return document.querySelector(
            '[data-route-container="/dashboard"]'
        );
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function render() {
        container = getContainer();

        if (!container) {
            return null;
        }

        container.hidden = false;

        container.innerHTML = `
            <div class="page dashboard">

                <div class="dashboard-header">

                    <div class="dashboard-header-content">
                        <h1 class="dashboard-title">
                            Control Room Dashboard
                        </h1>

                        <p class="dashboard-subtitle">
                            Monitor emergencies, vehicles,
                            GPS connectivity and traffic
                            coordination in real time.
                        </p>
                    </div>

                    <div class="dashboard-header-actions">

                        <div
                            class="system-status"
                            data-dashboard-system-status
                        >
                            <span class="system-status-dot"></span>

                            <span
                                data-dashboard-system-status-text
                            >
                                System Online
                            </span>
                        </div>

                        <button
                            type="button"
                            class="btn btn-outline"
                            data-dashboard-refresh
                        >
                            <i
                                class="fa-solid fa-rotate"
                                aria-hidden="true"
                            ></i>

                            Refresh
                        </button>

                    </div>

                </div>

                <section
                    class="dashboard-stats"
                    aria-label="Emergency system summary"
                >

                    <div class="dashboard-stat">
                        <div class="stat-card">

                            <div class="stat-content">

                                <div class="stat-label">
                                    Total Emergencies
                                </div>

                                <div
                                    class="stat-value"
                                    data-stat-total-emergencies
                                >
                                    —
                                </div>

                            </div>

                            <div class="dashboard-stat-icon">
                                <i
                                    class="fa-solid fa-triangle-exclamation"
                                    aria-hidden="true"
                                ></i>
                            </div>

                        </div>
                    </div>

                    <div class="dashboard-stat">
                        <div class="stat-card">

                            <div class="stat-content">

                                <div class="stat-label">
                                    Active Emergencies
                                </div>

                                <div
                                    class="stat-value"
                                    data-stat-active-emergencies
                                >
                                    —
                                </div>

                            </div>

                            <div class="dashboard-stat-icon danger">
                                <i
                                    class="fa-solid fa-truck-medical"
                                    aria-hidden="true"
                                ></i>
                            </div>

                        </div>
                    </div>

                    <div class="dashboard-stat">
                        <div class="stat-card">

                            <div class="stat-content">

                                <div class="stat-label">
                                    Available Vehicles
                                </div>

                                <div
                                    class="stat-value"
                                    data-stat-available-vehicles
                                >
                                    —
                                </div>

                            </div>

                            <div class="dashboard-stat-icon success">
                                <i
                                    class="fa-solid fa-truck-medical"
                                    aria-hidden="true"
                                ></i>
                            </div>

                        </div>
                    </div>

                    <div class="dashboard-stat">
                        <div class="stat-card">

                            <div class="stat-content">

                                <div class="stat-label">
                                    Active Corridors
                                </div>

                                <div
                                    class="stat-value"
                                    data-stat-active-corridors
                                >
                                    —
                                </div>

                            </div>

                            <div class="dashboard-stat-icon warning">
                                <i
                                    class="fa-solid fa-road"
                                    aria-hidden="true"
                                ></i>
                            </div>

                        </div>
                    </div>

                </section>

                <section class="dashboard-grid">

                    <div class="dashboard-column">

                        <div
                            class="
                                monitor-panel
                                dashboard-map-panel
                            "
                        >

                            <div class="monitor-panel-header">

                                <div>
                                    <div class="monitor-panel-title">
                                        Live Emergency Map
                                    </div>

                                    <div class="card-subtitle">
                                        Vehicle and corridor
                                        monitoring
                                    </div>
                                </div>

                                <span
                                    class="badge badge-info"
                                    data-dashboard-map-status
                                >
                                    Map Ready
                                </span>

                            </div>

                            <div
                                class="
                                    monitor-panel-content
                                    dashboard-map
                                "
                                data-dashboard-map
                            ></div>

                        </div>

                        <div class="card">

                            <div class="card-header">

                                <div>
                                    <div class="card-title">
                                        Recent Emergencies
                                    </div>

                                    <div class="card-subtitle">
                                        Latest requests received
                                        by the system
                                    </div>
                                </div>

                                <a
                                    href="#/emergencies"
                                    class="btn btn-sm btn-outline"
                                >
                                    View All
                                </a>

                            </div>

                            <div
                                class="table-wrapper"
                                data-dashboard-emergency-table
                            ></div>

                        </div>

                    </div>

                    <div class="dashboard-column">

                        <div class="card">

                            <div class="card-header">

                                <div>
                                    <div class="card-title">
                                        System Health
                                    </div>

                                    <div class="card-subtitle">
                                        Current connectivity
                                        overview
                                    </div>
                                </div>

                            </div>

                            <div class="node-health">

                                <div class="node-health-item">

                                    <div class="node-health-label">
                                        Vehicle Nodes
                                    </div>

                                    <div
                                        class="node-health-value"
                                        data-health-vehicle-nodes
                                    >
                                        —
                                    </div>

                                </div>

                                <div class="node-health-item">

                                    <div class="node-health-label">
                                        Traffic Nodes
                                    </div>

                                    <div
                                        class="node-health-value"
                                        data-health-traffic-nodes
                                    >
                                        —
                                    </div>

                                </div>

                                <div class="node-health-item">

                                    <div class="node-health-label">
                                        GPS Connected
                                    </div>

                                    <div
                                        class="node-health-value"
                                        data-health-gps
                                    >
                                        —
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div class="card">

                            <div class="card-header">

                                <div>
                                    <div class="card-title">
                                        Active Corridor
                                    </div>

                                    <div class="card-subtitle">
                                        Emergency route
                                        coordination
                                    </div>
                                </div>

                                <span
                                    class="corridor-map-state idle"
                                    data-dashboard-corridor-status
                                >
                                    Idle
                                </span>

                            </div>

                            <div
                                class="active-emergency"
                                data-dashboard-active-emergency
                            >
                                <div class="empty-state">
                                    <i
                                        class="fa-solid fa-road"
                                        aria-hidden="true"
                                    ></i>

                                    <span>
                                        No active emergency
                                        corridor
                                    </span>
                                </div>
                            </div>

                        </div>

                        <div class="card">

                            <div class="card-header">

                                <div>
                                    <div class="card-title">
                                        Recent Events
                                    </div>

                                    <div class="card-subtitle">
                                        Latest system activity
                                    </div>
                                </div>

                                <a
                                    href="#/event-logs"
                                    class="btn btn-sm btn-outline"
                                >
                                    Event Logs
                                </a>

                            </div>

                            <div
                                class="recent-events"
                                data-dashboard-events
                            >
                                <div class="empty-state">
                                    <i
                                        class="fa-solid fa-clock-rotate-left"
                                        aria-hidden="true"
                                    ></i>

                                    <span>
                                        No recent events
                                    </span>
                                </div>
                            </div>

                        </div>

                    </div>

                </section>

            </div>
        `;

        bindEvents();

        return container;
    }

    function bindEvents() {
        if (!container) {
            return;
        }

        const refreshButton =
            container.querySelector(
                "[data-dashboard-refresh]"
            );

        refreshButton?.addEventListener(
            "click",
            refresh
        );
    }

    // ------------------------------------------------------------------
    // Live data (polling /api/live/snapshot through RESQ_LIVE_SERVICE)
    // ------------------------------------------------------------------
    let unsubscribe = null;
    let mapElement = null;
    let layer = null;
    let emptyCorridorHtml = "";
    let emptyEventsHtml = "";

    function setText(selector, value) {
        const element = container?.querySelector(selector);

        if (!element) {
            return;
        }

        if (value === undefined || value === null || value === "") {
            element.textContent = "—";
            return;
        }

        element.textContent = String(value);
    }

    function ratio(connected, total) {
        if (connected === undefined || connected === null) {
            return null;
        }

        if (total === undefined || total === null) {
            return connected;
        }

        return `${connected} / ${total}`;
    }

    function applyHealth(state, detail) {
        const box = container?.querySelector("[data-dashboard-system-status]");
        const text = container?.querySelector("[data-dashboard-system-status-text]");

        if (!box || !text) {
            return;
        }

        const normalized = String(state || "OFFLINE").toUpperCase();

        box.classList.toggle("offline", normalized === "OFFLINE");
        box.classList.toggle("warning", normalized === "DEGRADED");

        if (normalized === "ONLINE") {
            text.textContent = "System Online";
        } else if (normalized === "DEGRADED") {
            text.textContent = detail || "System Degraded";
        } else {
            text.textContent = detail || "Backend Offline";
        }
    }

    function applySummary(data) {
        if (!data || typeof data !== "object") {
            return;
        }

        setText("[data-stat-total-emergencies]", data.totalEmergencies);
        setText("[data-stat-active-emergencies]", data.activeEmergencies);
        setText("[data-stat-available-vehicles]", data.availableVehicles);
        setText("[data-stat-active-corridors]", data.activeCorridors);

        setText(
            "[data-health-vehicle-nodes]",
            ratio(data.connectedVehicleNodes, data.totalVehicles)
        );
        setText(
            "[data-health-traffic-nodes]",
            ratio(data.connectedTrafficNodes, data.totalTrafficNodes)
        );
        setText(
            "[data-health-gps]",
            ratio(data.gpsConnectedVehicles, data.totalVehicles)
        );

        applyHealth(
            data.systemHealth,
            data.systemHealth === "DEGRADED"
                ? "Degraded - no traffic node online"
                : null
        );
    }

    function priorityHtml(priority) {
        const value = String(priority || "").toLowerCase();
        const css = ["critical", "high", "medium"].includes(value) ? value : "low";
        const label = value
            ? value.replace(/\b\w/g, (character) => character.toUpperCase())
            : "Unknown";

        return `
            <span class="emergency-priority ${css}">
                <span class="priority-dot"></span>
                ${escapeHtml(label)}
            </span>
        `;
    }

    function statusHtml(status) {
        if (window.RESQ_STATUS_BADGE?.create) {
            return window.RESQ_STATUS_BADGE.create(status).outerHTML;
        }

        return escapeHtml(status);
    }

    function renderRecentEmergencies(snapshot) {
        const tableContainer = container?.querySelector(
            "[data-dashboard-emergency-table]"
        );

        if (!tableContainer || !window.RESQ_TABLES?.render) {
            return;
        }

        const rows = (snapshot.emergencies || []).slice(0, 5);

        window.RESQ_TABLES.render(
            tableContainer,
            [
                {
                    label: "ID",
                    value: (row) => `#${row.emergencyId}`,
                    className: "table-id"
                },
                {
                    label: "Location",
                    value: (row) => row.location || "Location unavailable"
                },
                {
                    label: "Priority",
                    value: (row) => priorityHtml(row.priority),
                    render: (value) => value
                },
                {
                    label: "Status",
                    value: (row) => row.status,
                    render: (value) => statusHtml(value)
                },
                {
                    label: "Vehicle",
                    value: (row) => row.vehicleNumber || "—"
                }
            ],
            rows,
            { emptyMessage: "No emergency requests yet." }
        );
    }

    function renderEvents(snapshot) {
        const target = container?.querySelector("[data-dashboard-events]");

        if (!target) {
            return;
        }

        const events = (snapshot.events || []).slice(0, 6);

        if (!events.length) {
            target.innerHTML = emptyEventsHtml;
            return;
        }

        target.innerHTML = events
            .map((event) => {
                const time = window.RESQ_FORMAT?.formatDateTime
                    ? window.RESQ_FORMAT.formatDateTime(event.createdAt)
                    : event.createdAt;

                return `
                    <div class="live-event">
                        <span class="live-event-title">${escapeHtml(event.title || event.type)}</span>
                        <span class="live-event-meta">
                            ${escapeHtml(String(event.type || "").replace(/_/g, " "))}
                            &middot; ${escapeHtml(time || "")}
                        </span>
                    </div>
                `;
            })
            .join("");
    }

    function renderCorridor(snapshot) {
        const target = container?.querySelector("[data-dashboard-active-emergency]");
        const badge = container?.querySelector("[data-dashboard-corridor-status]");

        if (!target || !badge) {
            return;
        }

        const corridor = snapshot.summary?.activeCorridor;

        if (!corridor) {
            badge.className = "corridor-map-state idle";
            badge.textContent = "Idle";
            target.innerHTML = emptyCorridorHtml;
            return;
        }

        const emergency = (snapshot.emergencies || []).find(
            (item) => item.emergencyId === corridor.emergencyId
        );

        badge.className = "corridor-map-state active";
        badge.textContent = "Active";

        const signals = (corridor.signals || [])
            .map(
                (signal) => `
                    <div class="corridor-signal">
                        <span>${escapeHtml(signal.sequence)}. ${escapeHtml(signal.name)}</span>
                        <span class="signal-pill ${escapeHtml(String(signal.status || "").toLowerCase())}">
                            ${escapeHtml(signal.status || "—")}
                        </span>
                    </div>
                `
            )
            .join("");

        const eta = emergency?.etaMinutes != null
            ? `${emergency.etaMinutes} min (${emergency.distanceKm} km)`
            : "—";

        target.innerHTML = `
            <dl class="manage-facts" style="padding: var(--space-4);">
                <dt>Emergency</dt>
                <dd>${escapeHtml(emergency?.title || `#${corridor.emergencyId}`)}</dd>
                <dt>Location</dt>
                <dd>${escapeHtml(emergency?.location || "—")}</dd>
                <dt>Vehicle</dt>
                <dd>${escapeHtml(emergency?.vehicleNumber || "—")}</dd>
                <dt>Status</dt>
                <dd>${escapeHtml(emergency?.status || "—")}</dd>
                <dt>ETA (estimate)</dt>
                <dd>${escapeHtml(eta)}</dd>
                <dt>Signals held</dt>
                <dd>${escapeHtml(signals ? corridor.signals.length : 0)}</dd>
            </dl>
            ${signals}
        `;
    }

    function setMapStatus(text, tone) {
        const badge = container?.querySelector("[data-dashboard-map-status]");

        if (badge) {
            badge.textContent = text;
            badge.className = `badge badge-${tone}`;
        }
    }

    function onLive({ snapshot, error }) {
        if (!container) {
            return;
        }

        if (error) {
            applyHealth("OFFLINE");
            setMapStatus("Offline", "danger");

            if (window.RESQ_LOGGER) {
                window.RESQ_LOGGER.warn("Dashboard data unavailable.", error);
            }

            if (!snapshot) {
                return;
            }
        }

        if (!snapshot) {
            return;
        }

        applySummary(snapshot.summary);
        renderRecentEmergencies(snapshot);
        renderEvents(snapshot);
        renderCorridor(snapshot);

        const drawn = layer?.sync(snapshot);

        if (!error) {
            setMapStatus(
                drawn ? `Live - ${drawn.markers} items` : "Live",
                "success"
            );
        }
    }

    function initializeMap() {
        if (!container) {
            return;
        }

        mapElement = container.querySelector("[data-dashboard-map]");

        if (!mapElement) {
            return;
        }

        try {
            if (window.RESQ_MAP && typeof window.RESQ_MAP.init === "function") {
                window.RESQ_MAP.init(mapElement);
                layer = window.RESQ_LIVE_LAYER?.create(mapElement, "dash") || null;
            }
        } catch (error) {
            setMapStatus("Map unavailable", "warning");

            if (window.RESQ_LOGGER) {
                window.RESQ_LOGGER.warn("Dashboard map could not initialize.", error);
            }
        }
    }

    async function refresh() {
        await window.RESQ_LIVE_SERVICE?.refresh();
    }

    function activate() {
        if (!unsubscribe && window.RESQ_LIVE_SERVICE) {
            unsubscribe = window.RESQ_LIVE_SERVICE.subscribe(onLive);
        }

        if (mapElement && window.RESQ_MAP?.invalidateSize) {
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

        emptyCorridorHtml =
            container?.querySelector("[data-dashboard-active-emergency]")?.innerHTML || "";
        emptyEventsHtml =
            container?.querySelector("[data-dashboard-events]")?.innerHTML || "";

        initializeMap();
        activate();

        return container;
    }

    window.RESQ_DASHBOARD_PAGE =
        Object.freeze({
            initialize,
            render,
            refresh,
            activate,
            deactivate
        });
})();
