/**
 * ResQSync - Emergency Service
 * Centralized emergency-related API operations.
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

    async function getEmergencies(filters = {}) {
        return api().get(
            "/api/emergencies",
            filters
        );
    }

    async function getEmergency(emergencyId) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().get(
            `/api/emergencies/${encodeURIComponent(
                emergencyId
            )}`
        );
    }

    async function createEmergency(payload = {}) {
        if (
            !payload ||
            typeof payload !== "object"
        ) {
            throw new Error(
                "Emergency request data is required."
            );
        }

        return api().post(
            "/api/emergencies",
            payload
        );
    }

    async function verifyEmergency(
        emergencyId,
        payload = {}
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().post(
            `/api/emergencies/${encodeURIComponent(
                emergencyId
            )}/verify`,
            payload
        );
    }

    async function assignVehicle(
        emergencyId,
        vehicleId
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        if (!vehicleId) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return api().post(
            `/api/emergencies/${encodeURIComponent(
                emergencyId
            )}/assign`,
            {
                vehicleId
            }
        );
    }

    async function updateStatus(
        emergencyId,
        status,
        metadata = {}
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        if (!status) {
            throw new Error(
                "Emergency status is required."
            );
        }

        return api().patch(
            `/api/emergencies/${encodeURIComponent(
                emergencyId
            )}/status`,
            {
                status,
                ...metadata
            }
        );
    }

    async function markAtPatient(
        emergencyId
    ) {
        return updateStatus(
            emergencyId,
            "AT_PATIENT"
        );
    }

    async function markPatientPickedUp(
        emergencyId
    ) {
        return updateStatus(
            emergencyId,
            "PATIENT_PICKED_UP"
        );
    }

    async function markTransportToHospital(
        emergencyId,
        hospitalId = null
    ) {
        return updateStatus(
            emergencyId,
            "TRANSPORT_TO_HOSPITAL",
            hospitalId
                ? { hospitalId }
                : {}
        );
    }

    async function cancelEmergency(
        emergencyId,
        reason = ""
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().post(
            `/api/emergencies/${encodeURIComponent(
                emergencyId
            )}/cancel`,
            {
                reason: String(reason).trim()
            }
        );
    }

    async function getActiveEmergency() {
        return api().get(
            "/api/emergencies/active"
        );
    }

    async function getEmergencyEvents(
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
            )}/events`
        );
    }

    async function getEmergencyRoute(
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
            )}/route`
        );
    }

    async function getEmergencyETA(
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
            )}/eta`
        );
    }

    window.RESQ_EMERGENCY_SERVICE = Object.freeze({
        getEmergencies,
        getEmergency,
        createEmergency,
        verifyEmergency,
        assignVehicle,
        updateStatus,
        markAtPatient,
        markPatientPickedUp,
        markTransportToHospital,
        cancelEmergency,
        getActiveEmergency,
        getEmergencyEvents,
        getEmergencyRoute,
        getEmergencyETA
    });
})();