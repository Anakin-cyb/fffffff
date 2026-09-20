(function () {
    "use strict";

    const ROLE_PERMISSIONS = Object.freeze({
        admin: [
            "dashboard.view",
            "live-map.view",
            "emergencies.view",
            "emergencies.manage",
            "vehicles.view",
            "vehicles.manage",
            "traffic-nodes.view",
            "signals.view",
            "signals.control",
            "logs.view",
            "analytics.view",
            "settings.view",
            "settings.manage"
        ],

        dispatcher: [
            "dashboard.view",
            "live-map.view",
            "emergencies.view",
            "emergencies.manage",
            "vehicles.view",
            "traffic-nodes.view",
            "logs.view",
            "analytics.view"
        ],

        traffic_authority: [
            "dashboard.view",
            "live-map.view",
            "emergencies.view",
            "vehicles.view",
            "traffic-nodes.view",
            "signals.view",
            "signals.control",
            "logs.view",
            "analytics.view"
        ],

        hospital: [
            "live-map.view",
            "emergency-details.view",
            "logs.view"
        ],

        citizen: [
            "citizen-home.view",
            "request-emergency.create",
            "emergency-status.view"
        ],

        vehicle_operator: [
            "vehicle-details.view",
            "vehicle-dashboard.view",
            "emergency-status.view"
        ]
    });

    const DEFAULT_PERMISSION = Object.freeze({
        VIEW: "view",
        MANAGE: "manage",
        CREATE: "create",
        CONTROL: "control"
    });

    function getCurrentRole() {
        if (
            window.RESQ_STATE &&
            typeof window.RESQ_STATE.get === "function"
        ) {
            return window.RESQ_STATE.get("auth.role");
        }

        return null;
    }

    function hasPermission(permission, role) {
        const currentRole = role || getCurrentRole();

        if (!currentRole || !permission) {
            return false;
        }

        const permissions = ROLE_PERMISSIONS[currentRole];

        if (!Array.isArray(permissions)) {
            return false;
        }

        return permissions.includes(permission);
    }

    function hasAnyPermission(permissions, role) {
        if (!Array.isArray(permissions)) {
            return false;
        }

        return permissions.some(function (permission) {
            return hasPermission(permission, role);
        });
    }

    function hasAllPermissions(permissions, role) {
        if (!Array.isArray(permissions)) {
            return false;
        }

        return permissions.every(function (permission) {
            return hasPermission(permission, role);
        });
    }

    function getPermissions(role) {
        const currentRole = role || getCurrentRole();

        if (!currentRole || !ROLE_PERMISSIONS[currentRole]) {
            return [];
        }

        return [...ROLE_PERMISSIONS[currentRole]];
    }

    function getRoleLabel(role) {
        const labels = {
            admin: "Administrator",
            dispatcher: "Dispatcher",
            traffic_authority: "Traffic Authority",
            hospital: "Hospital",
            citizen: "Citizen",
            vehicle_operator: "Vehicle Operator"
        };

        return labels[role] || "Unknown Role";
    }

    function isProtectedPermission(permission) {
        return typeof permission === "string" && permission.length > 0;
    }

    function requirePermission(permission) {
        if (!isProtectedPermission(permission)) {
            return false;
        }

        return hasPermission(permission);
    }

    function filterByPermission(items, permission, role) {
        if (!Array.isArray(items)) {
            return [];
        }

        if (!permission) {
            return [];
        }

        return hasPermission(permission, role) ? [...items] : [];
    }

    window.RESQ_PERMISSIONS = Object.freeze({
        DEFAULT_PERMISSION,
        getCurrentRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        getPermissions,
        getRoleLabel,
        isProtectedPermission,
        requirePermission,
        filterByPermission
    });
})();