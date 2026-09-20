/**
 * ResQSync - Status Badge Component
 */

(function () {
    "use strict";

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeStatus(status) {
        return String(status || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");
    }

    function formatStatus(status) {
        if (!status) {
            return "Unknown";
        }

        return String(status)
            .replace(/_/g, " ")
            .replace(/-/g, " ")
            .trim()
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );
    }

    function getTone(status) {
        const normalized =
            normalizeStatus(status);

        const toneMap = {
            ACTIVE: "success",
            ONLINE: "success",
            CONNECTED: "success",
            COMPLETED: "success",
            RESOLVED: "success",
            DISPATCHED: "info",
            MAINTENANCE: "warning",
            VERIFIED: "success",
            FIX_ACQUIRED: "success",
            CORRIDOR_ACTIVE: "success",
            ARRIVED: "success",

            WARNING: "warning",
            WAITING_FOR_FIX: "warning",
            STALE: "warning",
            RECOVERY: "warning",
            AT_PATIENT: "warning",
            CORRIDOR_PREPARING: "warning",

            OFFLINE: "danger",
            NODE_OFFLINE: "danger",
            DISCONNECTED: "danger",
            CANCELLED: "danger",
            DENIED: "danger",
            CRITICAL: "danger",

            REQUESTED: "info",
            ASSIGNED: "info",
            EN_ROUTE_TO_PATIENT: "info",
            PATIENT_PICKED_UP: "info",
            TRANSPORT_TO_HOSPITAL: "info",
            IDLE: "default"
        };

        return toneMap[normalized] || "default";
    }

    function getIcon(status) {
        const normalized =
            normalizeStatus(status);

        const iconMap = {
            ACTIVE:
                "fa-solid fa-circle-check",

            ONLINE:
                "fa-solid fa-circle-check",

            CONNECTED:
                "fa-solid fa-link",

            COMPLETED:
                "fa-solid fa-check",

            VERIFIED:
                "fa-solid fa-shield-check",

            FIX_ACQUIRED:
                "fa-solid fa-location-dot",

            CORRIDOR_ACTIVE:
                "fa-solid fa-road",

            ARRIVED:
                "fa-solid fa-flag-checkered",

            WARNING:
                "fa-solid fa-triangle-exclamation",

            WAITING_FOR_FIX:
                "fa-solid fa-satellite-dish",

            STALE:
                "fa-solid fa-clock",

            RECOVERY:
                "fa-solid fa-rotate-left",

            AT_PATIENT:
                "fa-solid fa-user",

            CORRIDOR_PREPARING:
                "fa-solid fa-route",

            OFFLINE:
                "fa-solid fa-circle-xmark",

            NODE_OFFLINE:
                "fa-solid fa-microchip",

            DISCONNECTED:
                "fa-solid fa-link-slash",

            CANCELLED:
                "fa-solid fa-ban",

            DENIED:
                "fa-solid fa-shield-halved",

            CRITICAL:
                "fa-solid fa-triangle-exclamation",

            REQUESTED:
                "fa-solid fa-inbox",

            ASSIGNED:
                "fa-solid fa-truck-medical",

            EN_ROUTE_TO_PATIENT:
                "fa-solid fa-route",

            PATIENT_PICKED_UP:
                "fa-solid fa-person-circle-check",

            TRANSPORT_TO_HOSPITAL:
                "fa-solid fa-hospital",

            RESOLVED:
                "fa-solid fa-circle-check",
            IDLE:
                "fa-solid fa-circle-pause"
        };

        return (
            iconMap[normalized] ||
            "fa-solid fa-circle"
        );
    }

    function create(
        status,
        options = {}
    ) {
        const {
            label = null,
            showIcon = true,
            className = "",
            title = null
        } = options;

        const normalized =
            normalizeStatus(status);

        const tone =
            getTone(normalized);

        const displayLabel =
            label ||
            formatStatus(normalized);

        const badge =
            document.createElement("span");

        badge.className =
            `badge badge-${tone} ${className}`
                .trim();

        badge.dataset.status =
            normalized;

        if (title) {
            badge.title = String(title);
        }

        badge.innerHTML = `
            ${
                showIcon
                    ? `
                        <i
                            class="${getIcon(
                                normalized
                            )}"
                            aria-hidden="true"
                        ></i>
                    `
                    : ""
            }
            <span>
                ${escapeHtml(displayLabel)}
            </span>
        `;

        return badge;
    }

    function render(
        container,
        status,
        options = {}
    ) {
        if (
            typeof container === "string"
        ) {
            container =
                document.querySelector(
                    container
                );
        }

        if (
            !container ||
            !(container instanceof HTMLElement)
        ) {
            return null;
        }

        const badge =
            create(
                status,
                options
            );

        container.replaceChildren(
            badge
        );

        return badge;
    }

    function update(
        badge,
        status,
        options = {}
    ) {
        if (
            !badge ||
            !(badge instanceof HTMLElement)
        ) {
            return null;
        }

        const newBadge =
            create(
                status,
                options
            );

        badge.replaceWith(
            newBadge
        );

        return newBadge;
    }

    function getStatusInfo(status) {
        const normalized =
            normalizeStatus(status);

        return {
            value: normalized,
            label: formatStatus(normalized),
            tone: getTone(normalized),
            icon: getIcon(normalized)
        };
    }

    window.RESQ_STATUS_BADGE =
        Object.freeze({
            create,
            render,
            update,
            normalizeStatus,
            formatStatus,
            getTone,
            getIcon,
            getStatusInfo
        });
})();