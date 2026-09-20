/**
 * ResQSync - Logs Service
 * Centralized event-log and audit-log API operations.
 */

(function () {
    "use strict";

    function api() {
        if (!window.RESQ_API) {
            throw new Error(
                "ResQSync API service is not available."
            );
        }

        return window.RESQ_API;
    }

    async function getLogs(filters = {}) {
        return api().get(
            "/api/logs",
            filters
        );
    }

    async function getLog(logId) {
        if (!logId) {
            throw new Error(
                "Log ID is required."
            );
        }

        return api().get(
            `/api/logs/${encodeURIComponent(
                logId
            )}`
        );
    }

    async function getLogsByEmergency(
        emergencyId,
        filters = {}
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().get(
            "/api/logs",
            {
                emergencyId,
                ...filters
            }
        );
    }

    async function getLogsByVehicle(
        vehicleId,
        filters = {}
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            "/api/logs",
            {
                vehicleId,
                ...filters
            }
        );
    }

    async function getLogsByNode(
        nodeId,
        filters = {}
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            "/api/logs",
            {
                nodeId,
                ...filters
            }
        );
    }

    async function getLogsBySignal(
        signalId,
        filters = {}
    ) {
        if (!signalId) {
            throw new Error(
                "Signal ID is required."
            );
        }

        return api().get(
            "/api/logs",
            {
                signalId,
                ...filters
            }
        );
    }

    async function getAuditLogs(
        filters = {}
    ) {
        return api().get(
            "/api/logs/audit",
            filters
        );
    }

    async function getSystemEvents(
        filters = {}
    ) {
        return api().get(
            "/api/logs/system",
            filters
        );
    }

    async function getEmergencyEvents(
        emergencyId,
        filters = {}
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().get(
            `/api/emergencies/${encodeURIComponent(
                emergencyId
            )}/events`,
            filters
        );
    }

    async function getRecentLogs(
        limit = 50
    ) {
        return api().get(
            "/api/logs/recent",
            {
                limit
            }
        );
    }

    async function exportLogs(
        filters = {}
    ) {
        return api().get(
            "/api/logs/export",
            filters
        );
    }

    window.RESQ_LOGS_SERVICE = Object.freeze({
        getLogs,
        getLog,
        getLogsByEmergency,
        getLogsByVehicle,
        getLogsByNode,
        getLogsBySignal,
        getAuditLogs,
        getSystemEvents,
        getEmergencyEvents,
        getRecentLogs,
        exportLogs
    });
})();