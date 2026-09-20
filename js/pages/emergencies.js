/**
 * ResQSync - Emergencies Page
 */

(function () {
    "use strict";

    let container = null;
    let emergencies = [];

    function getContainer() {
        return document.querySelector(
            '[data-route-container="/emergencies"]'
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

    function formatStatus(status) {
        if (
            window.RESQ_STATUS_BADGE &&
            typeof window.RESQ_STATUS_BADGE.formatStatus ===
                "function"
        ) {
            return window.RESQ_STATUS_BADGE.formatStatus(
                status
            );
        }

        return status || "Unknown";
    }

    function getPriorityClass(priority) {
        const value =
            String(priority || "")
                .toLowerCase();

        if (value === "critical") {
            return "critical";
        }

        if (value === "high") {
            return "high";
        }

        if (value === "medium") {
            return "medium";
        }

        return "low";
    }

    function getPriorityLabel(priority) {
        if (!priority) {
            return "Unknown";
        }

        return String(priority)
            .toLowerCase()
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );
    }

    function formatDateTime(value) {
        if (
            window.RESQ_FORMAT &&
            typeof window.RESQ_FORMAT.formatDateTime ===
                "function"
        ) {
            return window.RESQ_FORMAT.formatDateTime(
                value
            );
        }

        return value || "—";
    }

    function getLocationText(emergency) {
        if (
            emergency?.location
        ) {
            return emergency.location;
        }

        if (
            emergency?.latitude !== undefined &&
            emergency?.longitude !== undefined
        ) {
            return `${emergency.latitude}, ${emergency.longitude}`;
        }

        return "Location unavailable";
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
                            Emergencies
                        </h1>

                        <p class="page-subtitle">
                            View, monitor and manage
                            emergency requests.
                        </p>

                    </div>

                    <div class="page-actions">

                        <button
                            type="button"
                            class="btn btn-primary"
                            data-emergency-new
                        >
                            <i
                                class="fa-solid fa-plus"
                                aria-hidden="true"
                            ></i>

                            New Emergency
                        </button>

                        <button
                            type="button"
                            class="btn btn-outline"
                            data-emergency-refresh
                        >
                            <i
                                class="fa-solid fa-rotate"
                                aria-hidden="true"
                            ></i>

                            Refresh
                        </button>

                    </div>

                </div>

                <section class="card">

                    <div class="card-header">

                        <div>
                            <div class="card-title">
                                Emergency Requests
                            </div>

                            <div class="card-subtitle">
                                Backend-provided emergency
                                records
                            </div>
                        </div>

                        <span
                            class="badge badge-info"
                            data-emergency-count
                        >
                            0 Records
                        </span>

                    </div>

                    <div class="emergency-toolbar">

                        <div class="search-field">

                            <i
                                class="
                                    search-field-icon
                                    fa-solid
                                    fa-magnifying-glass
                                "
                                aria-hidden="true"
                            ></i>

                            <input
                                type="search"
                                class="form-input"
                                placeholder="Search emergency ID, vehicle or location..."
                                data-emergency-search
                                autocomplete="off"
                            >

                        </div>

                        <select
                            class="form-select"
                            data-emergency-status-filter
                            aria-label="Filter by status"
                        >
                            <option value="">
                                All Statuses
                            </option>

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="ASSIGNED">
                                Assigned
                            </option>

                            <option value="EN_ROUTE_TO_PATIENT">
                                En Route
                            </option>

                            <option value="AT_PATIENT">
                                At Patient
                            </option>

                            <option value="PATIENT_PICKED_UP">
                                Patient Picked Up
                            </option>

                            <option value="TRANSPORT_TO_HOSPITAL">
                                Transport to Hospital
                            </option>

                            <option value="RESOLVED">
                                Resolved
                            </option>

                            <option value="CANCELLED">
                                Cancelled
                            </option>
                        </select>

                        <select
                            class="form-select"
                            data-emergency-priority-filter
                            aria-label="Filter by priority"
                        >
                            <option value="">
                                All Priorities
                            </option>

                            <option value="LOW">
                                Low
                            </option>

                            <option value="MEDIUM">
                                Medium
                            </option>

                            <option value="HIGH">
                                High
                            </option>

                            <option value="CRITICAL">
                                Critical
                            </option>
                        </select>

                    </div>

                    <div
                        class="table-wrapper"
                        data-emergency-table
                    ></div>

                </section>

            </div>
        `;

        bindEvents();
        renderTable();

        return container;
    }

    // ------------------------------------------------------------------
    // Live list + create / assign / status flow (frontend -> backend -> MySQL)
    // ------------------------------------------------------------------
    let unsubscribe = null;
    let lastSignature = "";

    const TYPES = ["AMBULANCE", "FIRE", "POLICE", "OTHER"];
    const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

    const NEXT_STEP = {
        ASSIGNED: { status: "EN_ROUTE_TO_PATIENT", label: "En route to patient" },
        EN_ROUTE_TO_PATIENT: { status: "AT_PATIENT", label: "Arrived at patient" },
        AT_PATIENT: { status: "PATIENT_PICKED_UP", label: "Patient picked up" },
        PATIENT_PICKED_UP: { status: "TRANSPORT_TO_HOSPITAL", label: "Transport to hospital" }
    };

    function emergencyService() {
        return window.RESQ_EMERGENCY_SERVICE;
    }

    function toast(kind, message) {
        if (window.RESQ_TOAST && typeof window.RESQ_TOAST[kind] === "function") {
            window.RESQ_TOAST[kind](message);
        }
    }

    function statusHtml(status) {
        if (window.RESQ_STATUS_BADGE?.create) {
            return window.RESQ_STATUS_BADGE.create(status).outerHTML;
        }

        return escapeHtml(formatStatus(status));
    }

    function priorityHtml(priority) {
        const css = getPriorityClass(priority);

        return `
            <span class="emergency-priority ${css}">
                <span class="priority-dot"></span>
                ${escapeHtml(getPriorityLabel(priority))}
            </span>
        `;
    }

    function bindEvents() {
        if (!container) {
            return;
        }

        container
            .querySelector("[data-emergency-refresh]")
            ?.addEventListener("click", refresh);

        container
            .querySelector("[data-emergency-new]")
            ?.addEventListener("click", openCreateDialog);

        container
            .querySelector("[data-emergency-search]")
            ?.addEventListener("input", renderTable);

        container
            .querySelector("[data-emergency-status-filter]")
            ?.addEventListener("change", renderTable);

        container
            .querySelector("[data-emergency-priority-filter]")
            ?.addEventListener("change", renderTable);

        container
            .querySelector("[data-emergency-table]")
            ?.addEventListener("click", function (event) {
                const button = event.target.closest("[data-manage-emergency]");

                if (button) {
                    openManageDialog(Number(button.getAttribute("data-manage-emergency")));
                }
            });
    }

    function getFilteredEmergencies() {
        const search = String(
            container?.querySelector("[data-emergency-search]")?.value || ""
        ).trim().toLowerCase();

        const status = String(
            container?.querySelector("[data-emergency-status-filter]")?.value || ""
        ).trim().toUpperCase();

        const priority = String(
            container?.querySelector("[data-emergency-priority-filter]")?.value || ""
        ).trim().toUpperCase();

        return emergencies.filter(function (emergency) {
            const haystack = [
                emergency.emergencyId,
                emergency.type,
                emergency.vehicleNumber,
                getLocationText(emergency)
            ].join(" ").toLowerCase();

            return (
                (!search || haystack.includes(search)) &&
                (!status || String(emergency.status || "").toUpperCase() === status) &&
                (!priority || String(emergency.priority || "").toUpperCase() === priority)
            );
        });
    }

    function renderTable() {
        const tableContainer = container?.querySelector("[data-emergency-table]");

        if (!tableContainer) {
            return;
        }

        const filtered = getFilteredEmergencies();
        const countElement = container.querySelector("[data-emergency-count]");

        if (countElement) {
            countElement.textContent =
                `${filtered.length} ${filtered.length === 1 ? "Record" : "Records"}`;
        }

        const columns = [
            {
                label: "Emergency ID",
                value: (emergency) => `#${emergency.emergencyId}`,
                className: "table-id"
            },
            {
                label: "Type",
                value: (emergency) => emergency.type || "—"
            },
            {
                label: "Priority",
                value: (emergency) => priorityHtml(emergency.priority),
                render: (value) => value
            },
            {
                label: "Status",
                value: (emergency) => emergency.status,
                render: (value) => statusHtml(value)
            },
            {
                label: "Vehicle",
                value: (emergency) => emergency.vehicleNumber || "—"
            },
            {
                label: "Location",
                value: (emergency) => getLocationText(emergency)
            },
            {
                label: "Requested",
                value: (emergency) => formatDateTime(emergency.createdAt)
            },
            {
                label: "Action",
                value: (emergency) => `
                    <button
                        type="button"
                        class="btn btn-sm btn-outline"
                        data-manage-emergency="${escapeHtml(emergency.emergencyId)}"
                    >
                        ${emergency.isActive ? "Manage" : "View"}
                    </button>
                `,
                render: (value) => value
            }
        ];

        if (window.RESQ_TABLES && typeof window.RESQ_TABLES.render === "function") {
            window.RESQ_TABLES.render(tableContainer, columns, filtered, {
                emptyMessage: "No emergency requests found."
            });
        }
    }

    async function loadData() {
        if (!emergencyService()) {
            return;
        }

        try {
            const response = await emergencyService().getEmergencies();
            const data = response?.data;

            if (Array.isArray(data)) {
                emergencies = data;
            } else if (Array.isArray(data?.emergencies)) {
                emergencies = data.emergencies;
            } else {
                emergencies = [];
            }
        } catch (error) {
            emergencies = [];

            if (window.RESQ_LOGGER) {
                window.RESQ_LOGGER.warn("Emergency data unavailable.", error);
            }
        }

        renderTable();
    }

    // reload the list only when something changed on the server
    function onLive({ snapshot }) {
        if (!snapshot) {
            return;
        }

        const signature = (snapshot.emergencies || [])
            .map((item) => `${item.emergencyId}:${item.status}:${item.vehicleId}:${item.updatedAt}`)
            .join("|");

        if (signature !== lastSignature) {
            lastSignature = signature;
            loadData();
        }
    }

    async function refresh() {
        await loadData();
        window.RESQ_LIVE_SERVICE?.refresh();
    }

    // ---------------------------- create dialog ----------------------------
    function openCreateDialog() {
        if (!window.RESQ_MODAL) {
            return;
        }

        const options = (list, selected) =>
            list
                .map(
                    (item) =>
                        `<option value="${item}" ${item === selected ? "selected" : ""}>${
                            item.charAt(0) + item.slice(1).toLowerCase()
                        }</option>`
                )
                .join("");

        const modalId = window.RESQ_MODAL.open({
            title: "New Emergency",
            size: "md",
            content: `
                <form data-emergency-form novalidate>
                    <div class="emergency-form-grid">
                        <div class="form-group">
                            <label class="form-label" for="em-type">Type</label>
                            <select class="form-select" id="em-type" name="type">
                                ${options(TYPES, "AMBULANCE")}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="em-priority">Priority</label>
                            <select class="form-select" id="em-priority" name="priority">
                                ${options(PRIORITIES, "HIGH")}
                            </select>
                        </div>
                        <div class="form-group is-wide">
                            <label class="form-label" for="em-location">
                                Location <span class="form-required">*</span>
                            </label>
                            <input
                                class="form-input"
                                id="em-location"
                                name="location"
                                type="text"
                                maxlength="255"
                                placeholder="Address or landmark"
                                required
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="em-lat">Latitude</label>
                            <input class="form-input" id="em-lat" name="latitude" type="text" inputmode="decimal" placeholder="28.6139">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="em-lng">Longitude</label>
                            <input class="form-input" id="em-lng" name="longitude" type="text" inputmode="decimal" placeholder="77.2090">
                        </div>
                        <div class="form-help is-wide">
                            Coordinates are needed to show the emergency on the map and to build a
                            green corridor. Leave both empty for a text-only report.
                        </div>
                    </div>
                    <div class="emergency-form-error" data-emergency-form-error hidden></div>
                    <div class="form-actions" style="margin-top: var(--space-5);">
                        <button type="button" class="btn btn-outline" data-form-cancel>Cancel</button>
                        <button type="submit" class="btn btn-primary" data-form-submit>Create Emergency</button>
                    </div>
                </form>
            `,
            onOpen(modal) {
                const form = modal.querySelector("[data-emergency-form]");
                const errorBox = modal.querySelector("[data-emergency-form-error]");
                const submit = modal.querySelector("[data-form-submit]");

                modal.querySelector("[data-form-cancel]")
                    ?.addEventListener("click", () => window.RESQ_MODAL.close(modalId));

                form?.addEventListener("submit", async function (event) {
                    event.preventDefault();

                    const data = new FormData(form);
                    const payload = {
                        type: data.get("type"),
                        priority: data.get("priority"),
                        location: String(data.get("location") || "").trim()
                    };

                    const lat = String(data.get("latitude") || "").trim();
                    const lng = String(data.get("longitude") || "").trim();
                    const problems = [];

                    if (!payload.location) {
                        problems.push("Location is required.");
                    }

                    if (lat || lng) {
                        const latNumber = Number(lat);
                        const lngNumber = Number(lng);

                        if (!lat || !lng) {
                            problems.push("Enter both latitude and longitude, or neither.");
                        } else if (!Number.isFinite(latNumber) || Math.abs(latNumber) > 90) {
                            problems.push("Latitude must be a number between -90 and 90.");
                        } else if (!Number.isFinite(lngNumber) || Math.abs(lngNumber) > 180) {
                            problems.push("Longitude must be a number between -180 and 180.");
                        } else {
                            payload.latitude = latNumber;
                            payload.longitude = lngNumber;
                        }
                    }

                    if (problems.length) {
                        errorBox.textContent = problems.join(" ");
                        errorBox.hidden = false;
                        return;
                    }

                    errorBox.hidden = true;
                    submit.disabled = true;

                    try {
                        const response = await emergencyService().createEmergency(payload);
                        toast("success", `Emergency #${response.data?.id ?? ""} created.`);
                        window.RESQ_MODAL.close(modalId);
                        await refresh();
                    } catch (error) {
                        errorBox.textContent = error.message || "Could not create the emergency.";
                        errorBox.hidden = false;
                        submit.disabled = false;
                    }
                });

                form?.querySelector("input[name=location]")?.focus();
            }
        });
    }

    // ---------------------------- manage dialog ----------------------------
    function openManageDialog(emergencyId) {
        if (!window.RESQ_MODAL || !emergencyId) {
            return;
        }

        window.RESQ_MODAL.open({
            title: `Emergency #${emergencyId}`,
            size: "lg",
            content: `<div data-manage-body class="text-muted">Loading...</div>`,
            onOpen(modal) {
                renderManageBody(modal, emergencyId);
            }
        });
    }

    async function renderManageBody(modal, emergencyId) {
        const body = modal.querySelector("[data-manage-body]");

        if (!body) {
            return;
        }

        let emergency;
        let events = [];

        try {
            emergency = (await emergencyService().getEmergency(emergencyId)).data;
            events = (await emergencyService().getEmergencyEvents(emergencyId)).data || [];
        } catch (error) {
            body.innerHTML = `<div class="emergency-form-error">${escapeHtml(error.message)}</div>`;
            return;
        }

        const isActive = emergency.isActive;
        let candidatesHtml = "";
        let hospitalsHtml = "";

        if (isActive && emergency.status === "ACTIVE") {
            try {
                const candidates = (await window.RESQ_API.get(
                    `/api/emergencies/${emergencyId}/candidates`
                )).data || [];

                candidatesHtml = candidates.length
                    ? `
                        <div class="manage-actions">
                            <select class="form-select" data-assign-vehicle style="max-width: 320px;">
                                ${candidates
                                    .map(
                                        (vehicle) => `
                                            <option value="${escapeHtml(vehicle.vehicleId)}">
                                                ${escapeHtml(vehicle.vehicleNumber)}
                                                ${vehicle.distanceKm != null ? ` - ${escapeHtml(vehicle.distanceKm)} km away` : ""}
                                                ${vehicle.driverName ? ` (${escapeHtml(vehicle.driverName)})` : ""}
                                            </option>`
                                    )
                                    .join("")}
                            </select>
                            <button type="button" class="btn btn-primary" data-action-assign>
                                Assign vehicle
                            </button>
                        </div>
                    `
                    : `<div class="text-muted">No available vehicle right now.</div>`;
            } catch (error) {
                candidatesHtml = `<div class="text-muted">${escapeHtml(error.message)}</div>`;
            }
        }

        const next = NEXT_STEP[emergency.status];

        if (next && next.status === "TRANSPORT_TO_HOSPITAL") {
            try {
                const hospitals = (await window.RESQ_API.get("/api/hospitals")).data || [];

                hospitalsHtml = `
                    <select class="form-select" data-hospital-select style="max-width: 280px;">
                        <option value="">Nearest available hospital (auto)</option>
                        ${hospitals
                            .filter((h) => h.emergencyAvailable)
                            .map(
                                (h) => `<option value="${escapeHtml(h.hospitalId)}">${escapeHtml(h.name)} (${escapeHtml(h.availableBeds)} beds)</option>`
                            )
                            .join("")}
                    </select>
                `;
            } catch (error) {
                hospitalsHtml = "";
            }
        }

        const corridor = emergency.corridor;

        body.innerHTML = `
            <div class="manage-section">
                <dl class="manage-facts">
                    <dt>Status</dt><dd>${statusHtml(emergency.status)}</dd>
                    <dt>Priority</dt><dd>${priorityHtml(emergency.priority)}</dd>
                    <dt>Type</dt><dd>${escapeHtml(emergency.type)}</dd>
                    <dt>Location</dt><dd>${escapeHtml(getLocationText(emergency))}</dd>
                    <dt>Vehicle</dt><dd>${escapeHtml(emergency.vehicleNumber || "Not assigned")}</dd>
                    <dt>Hospital</dt><dd>${escapeHtml(emergency.hospitalId ? `#${emergency.hospitalId}` : "Not chosen")}</dd>
                    <dt>Green corridor</dt>
                    <dd>${corridor ? `${corridor.signals.length} signal(s) held` : "None"}</dd>
                    <dt>Reported</dt><dd>${escapeHtml(formatDateTime(emergency.createdAt))}</dd>
                </dl>
            </div>

            ${isActive ? `
                <div class="manage-section" data-assign-section ${candidatesHtml ? "" : "hidden"}>
                    <h4>Dispatch</h4>
                    ${candidatesHtml}
                </div>

                <div class="manage-section">
                    <h4>Progress</h4>
                    <div class="manage-actions">
                        ${hospitalsHtml}
                        ${next ? `<button type="button" class="btn btn-primary" data-action-status="${next.status}">${escapeHtml(next.label)}</button>` : ""}
                        ${emergency.status !== "ACTIVE" ? `<button type="button" class="btn btn-success" data-action-status="RESOLVED">Mark resolved</button>` : ""}
                        <button type="button" class="btn btn-danger" data-action-cancel>Cancel emergency</button>
                    </div>
                </div>
            ` : ""}

            <div class="manage-section">
                <h4>Event log</h4>
                <ul class="manage-timeline">
                    ${events.length
                        ? events.map((event) => `
                            <li>
                                <strong>${escapeHtml(event.title || event.type)}</strong>
                                <time>${escapeHtml(formatDateTime(event.createdAt))}</time>
                            </li>`).join("")
                        : `<li class="text-muted">No events yet.</li>`}
                </ul>
            </div>
            <div class="emergency-form-error" data-manage-error hidden></div>
        `;

        const errorBox = body.querySelector("[data-manage-error]");

        async function run(action, successMessage) {
            errorBox.hidden = true;
            body.querySelectorAll("button").forEach((button) => (button.disabled = true));

            try {
                await action();
                toast("success", successMessage);
                await loadData();
                window.RESQ_LIVE_SERVICE?.refresh();
                await renderManageBody(modal, emergencyId);
            } catch (error) {
                errorBox.textContent = error.message || "Action failed.";
                errorBox.hidden = false;
                body.querySelectorAll("button").forEach((button) => (button.disabled = false));
            }
        }

        body.querySelector("[data-action-assign]")?.addEventListener("click", function () {
            const vehicleId = body.querySelector("[data-assign-vehicle]")?.value;

            run(
                () => emergencyService().assignVehicle(emergencyId, Number(vehicleId)),
                "Vehicle assigned."
            );
        });

        body.querySelectorAll("[data-action-status]").forEach(function (button) {
            button.addEventListener("click", function () {
                const status = button.getAttribute("data-action-status");
                const hospitalId = body.querySelector("[data-hospital-select]")?.value;
                const metadata = hospitalId && status === "TRANSPORT_TO_HOSPITAL"
                    ? { hospitalId: Number(hospitalId) }
                    : {};

                run(
                    () => emergencyService().updateStatus(emergencyId, status, metadata),
                    `Status: ${formatStatus(status)}.`
                );
            });
        });

        body.querySelector("[data-action-cancel]")?.addEventListener("click", function () {
            if (!window.confirm("Cancel this emergency? The vehicle will be freed and the corridor released.")) {
                return;
            }

            run(
                () => emergencyService().cancelEmergency(emergencyId, "Cancelled from control room"),
                "Emergency cancelled."
            );
        });
    }

    // ---------------------------- lifecycle ----------------------------
    function activate() {
        if (!unsubscribe && window.RESQ_LIVE_SERVICE) {
            unsubscribe = window.RESQ_LIVE_SERVICE.subscribe(onLive);
        }

        return loadData();
    }

    function deactivate() {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
    }

    async function initialize() {
        render();
        await activate();
        return container;
    }

    window.RESQ_EMERGENCIES_PAGE =
        Object.freeze({
            initialize,
            render,
            refresh,
            activate,
            deactivate
        });
})();
