/**
 * ResQSync - Telemetry Service
 *
 * Handles vehicle and traffic-node telemetry obtained
 * through the backend/API layer.
 *
 * Frontend never communicates directly with GPS hardware.
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
     * Get the latest normalized GPS/telemetry data
     * for a vehicle.
     */
    async function getVehicleTelemetry(
        vehicleId
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            `/api/telemetry/vehicles/${encodeURIComponent(
                vehicleId
            )}`
        );
    }

    /**
     * Get vehicle telemetry history.
     */
    async function getVehicleTelemetryHistory(
        vehicleId,
        query = {}
    ) {
        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().get(
            `/api/telemetry/vehicles/${encodeURIComponent(
                vehicleId
            )}/history`,
            query
        );
    }

    /**
     * Get latest telemetry for a traffic node.
     */
    async function getNodeTelemetry(
        nodeId
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/telemetry/nodes/${encodeURIComponent(
                nodeId
            )}`
        );
    }

    /**
     * Get traffic-node telemetry history.
     */
    async function getNodeTelemetryHistory(
        nodeId,
        query = {}
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/telemetry/nodes/${encodeURIComponent(
                nodeId
            )}/history`,
            query
        );
    }

    /**
     * Get current system telemetry summary.
     */
    async function getSystemTelemetry() {
        return api().get(
            "/api/telemetry/system"
        );
    }

    /**
     * Send a telemetry acknowledgement when
     * supported by the backend.
     */
    async function acknowledgeTelemetry(
        telemetryId
    ) {
        if (!telemetryId) {
            throw new Error(
                "Telemetry ID is required."
            );
        }

        return api().post(
            `/api/telemetry/${encodeURIComponent(
                telemetryId
            )}/acknowledge`
        );
    }

    /**
     * Normalize GPS data received from backend.
     *
     * Expected normalized fields:
     * vehicleId
     * latitude
     * longitude
     * timestamp
     * speed
     * heading
     * fix
     * satellites
     * accuracy
     */
    function normalizeGPS(data) {
        if (!data || typeof data !== "object") {
            return null;
        }

        const latitude = Number(
            data.latitude
        );

        const longitude = Number(
            data.longitude
        );

        return {
            vehicleId:
                data.vehicleId ??
                data.vehicle_id ??
                null,

            latitude:
                Number.isFinite(latitude)
                    ? latitude
                    : null,

            longitude:
                Number.isFinite(longitude)
                    ? longitude
                    : null,

            timestamp:
                data.timestamp ??
                data.time ??
                null,

            speed:
                Number.isFinite(Number(data.speed))
                    ? Number(data.speed)
                    : null,

            heading:
                Number.isFinite(Number(data.heading))
                    ? Number(data.heading)
                    : null,

            fix:
                data.fix ??
                data.gpsFix ??
                data.gps_fix ??
                null,

            satellites:
                Number.isFinite(
                    Number(data.satellites)
                )
                    ? Number(data.satellites)
                    : null,

            accuracy:
                Number.isFinite(Number(data.accuracy))
                    ? Number(data.accuracy)
                    : null
        };
    }

    /**
     * Validate whether normalized GPS
     * coordinates are usable.
     */
    function hasValidLocation(gpsData) {
        if (!gpsData) {
            return false;
        }

        const latitude =
            Number(gpsData.latitude);

        const longitude =
            Number(gpsData.longitude);

        return (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
        );
    }

    /**
     * Determine whether telemetry is stale.
     *
     * Uses the configured stale threshold when available.
     */
    function isStale(
        timestamp,
        staleAfterMs = null
    ) {
        if (!timestamp) {
            return true;
        }

        const time =
            new Date(timestamp).getTime();

        if (!Number.isFinite(time)) {
            return true;
        }

        const configuredThreshold =
            window.RESQ_CONFIG?.GPS?.STALE_AFTER_MS;

        const threshold =
            Number.isFinite(
                Number(staleAfterMs)
            )
                ? Number(staleAfterMs)
                : (
                    Number.isFinite(
                        Number(configuredThreshold)
                    )
                        ? Number(configuredThreshold)
                        : 15000
                );

        return (
            Date.now() - time > threshold
        );
    }

    /**
     * Derive the frontend GPS state from
     * normalized telemetry.
     */
    function getGPSState(gpsData) {
        if (!gpsData) {
            return "OFFLINE";
        }

        if (!hasValidLocation(gpsData)) {
            return "WAITING_FOR_FIX";
        }

        if (isStale(gpsData.timestamp)) {
            return "STALE";
        }

        if (
            gpsData.fix === false ||
            gpsData.fix === "false"
        ) {
            return "WAITING_FOR_FIX";
        }

        return "FIX_ACQUIRED";
    }

    window.RESQ_TELEMETRY_SERVICE =
        Object.freeze({
            getVehicleTelemetry,
            getVehicleTelemetryHistory,
            getNodeTelemetry,
            getNodeTelemetryHistory,
            getSystemTelemetry,
            acknowledgeTelemetry,
            normalizeGPS,
            hasValidLocation,
            isStale,
            getGPSState
        });
})();