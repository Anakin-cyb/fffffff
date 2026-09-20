/**
 * ResQSync - Vehicle Service
 * Centralized vehicle, GPS and telemetry API operations.
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

    async function getVehicles(filters = {}) {
        return api().get(
            "/api/vehicles",
            filters
        );
    }

    async function getVehicle(vehicleId) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            `/api/vehicles/${encodeURIComponent(
                vehicleId
            )}`
        );
    }

    async function getVehicleStatus(vehicleId) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            `/api/vehicles/${encodeURIComponent(
                vehicleId
            )}/status`
        );
    }

    async function updateVehicleStatus(
        vehicleId,
        status
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        if (!status) {
            throw new Error(
                "Vehicle status is required."
            );
        }

        return api().patch(
            `/api/vehicles/${encodeURIComponent(
                vehicleId
            )}/status`,
            {
                status
            }
        );
    }

    async function getTelemetry(
        vehicleId,
        query = {}
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            `/api/vehicles/${encodeURIComponent(
                vehicleId
            )}/telemetry`,
            query
        );
    }

    async function getLatestGPS(vehicleId) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            `/api/vehicles/${encodeURIComponent(
                vehicleId
            )}/gps`
        );
    }

    async function getLocationHistory(
        vehicleId,
        query = {}
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            `/api/vehicles/${encodeURIComponent(
                vehicleId
            )}/gps/history`,
            query
        );
    }

    async function updateLocation(
        vehicleId,
        gpsData
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        if (
            !gpsData ||
            typeof gpsData !== "object"
        ) {
            throw new Error(
                "GPS data is required."
            );
        }

        return api().post(
            `/api/vehicles/${encodeURIComponent(
                vehicleId
            )}/gps`,
            gpsData
        );
    }

    async function getActiveEmergency(
        vehicleId
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            `/api/vehicles/${encodeURIComponent(
                vehicleId
            )}/emergency`
        );
    }

    async function getAssignedVehicle(
        emergencyId
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().get(
            `/api/emergencies/${encodeURIComponent(
                emergencyId
            )}/vehicle`
        );
    }

    async function getVehicleRoute(
        vehicleId,
        emergencyId = null
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        const query = {};

        if (emergencyId) {
            query.emergencyId = emergencyId;
        }

        return api().get(
            `/api/vehicles/${encodeURIComponent(
                vehicleId
            )}/route`,
            query
        );
    }

    window.RESQ_VEHICLE_SERVICE = Object.freeze({
        getVehicles,
        getVehicle,
        getVehicleStatus,
        updateVehicleStatus,
        getTelemetry,
        getLatestGPS,
        getLocationHistory,
        updateLocation,
        getActiveEmergency,
        getAssignedVehicle,
        getVehicleRoute
    });
})();