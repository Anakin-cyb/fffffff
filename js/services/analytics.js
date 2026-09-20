/**
 * ResQSync - Analytics Service
 * Centralized analytics and reporting API operations.
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

    /**
     * Get the main dashboard summary.
     */
    async function getDashboardSummary(
        query = {}
    ) {
        return api().get(
            "/api/analytics/dashboard",
            query
        );
    }

    /**
     * Get emergency-related analytics.
     */
    async function getEmergencyAnalytics(
        query = {}
    ) {
        return api().get(
            "/api/analytics/emergencies",
            query
        );
    }

    /**
     * Get emergency response-time analytics.
     */
    async function getResponseTimeAnalytics(
        query = {}
    ) {
        return api().get(
            "/api/analytics/response-times",
            query
        );
    }

    /**
     * Get green-corridor analytics.
     */
    async function getCorridorAnalytics(
        query = {}
    ) {
        return api().get(
            "/api/analytics/corridors",
            query
        );
    }

    /**
     * Get vehicle utilization and operational analytics.
     */
    async function getVehicleAnalytics(
        query = {}
    ) {
        return api().get(
            "/api/analytics/vehicles",
            query
        );
    }

    /**
     * Get traffic-node health analytics.
     */
    async function getTrafficNodeAnalytics(
        query = {}
    ) {
        return api().get(
            "/api/analytics/traffic-nodes",
            query
        );
    }

    /**
     * Get signal-priority analytics.
     */
    async function getSignalAnalytics(
        query = {}
    ) {
        return api().get(
            "/api/analytics/signals",
            query
        );
    }

    /**
     * Get analytics for a specific emergency.
     */
    async function getEmergencyReport(
        emergencyId
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().get(
            `/api/analytics/emergencies/${encodeURIComponent(
                emergencyId
            )}`
        );
    }

    /**
     * Get analytics for a specific vehicle.
     */
    async function getVehicleReport(
        vehicleId,
        query = {}
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            `/api/analytics/vehicles/${encodeURIComponent(
                vehicleId
            )}`,
            query
        );
    }

    /**
     * Get analytics for a specific traffic node.
     */
    async function getTrafficNodeReport(
        nodeId,
        query = {}
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/analytics/traffic-nodes/${encodeURIComponent(
                nodeId
            )}`,
            query
        );
    }

    /**
     * Get time-series analytics data.
     */
    async function getTimeSeries(
        metric,
        query = {}
    ) {
        if (!metric) {
            throw new Error(
                "Analytics metric is required."
            );
        }

        return api().get(
            "/api/analytics/time-series",
            {
                metric,
                ...query
            }
        );
    }

    /**
     * Get a combined analytics report.
     */
    async function getReport(
        query = {}
    ) {
        return api().get(
            "/api/analytics/report",
            query
        );
    }

    window.RESQ_ANALYTICS_SERVICE =
        Object.freeze({
            getDashboardSummary,
            getEmergencyAnalytics,
            getResponseTimeAnalytics,
            getCorridorAnalytics,
            getVehicleAnalytics,
            getTrafficNodeAnalytics,
            getSignalAnalytics,
            getEmergencyReport,
            getVehicleReport,
            getTrafficNodeReport,
            getTimeSeries,
            getReport
        });
})();