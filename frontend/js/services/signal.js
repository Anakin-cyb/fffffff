/**
 * ResQSync - Signal Service
 * Handles backend API operations for traffic signal control.
 *
 * Frontend does not directly control signal hardware.
 * Commands are sent to the backend, which coordinates
 * with the configured traffic node/controller.
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

    async function getSignals(nodeId = null) {
        const query = {};

        if (nodeId) {
            query.nodeId = nodeId;
        }

        return api().get(
            "/api/signals",
            query
        );
    }

    async function getSignal(
        signalId
    ) {
        if (!signalId) {
            throw new Error(
                "Signal ID is required."
            );
        }

        return api().get(
            `/api/signals/${encodeURIComponent(
                signalId
            )}`
        );
    }

    async function getSignalState(
        signalId
    ) {
        if (!signalId) {
            throw new Error(
                "Signal ID is required."
            );
        }

        return api().get(
            `/api/signals/${encodeURIComponent(
                signalId
            )}/state`
        );
    }

    async function requestPriority(
        signalId,
        payload = {}
    ) {
        if (!signalId) {
            throw new Error(
                "Signal ID is required."
            );
        }

        return api().post(
            `/api/signals/${encodeURIComponent(
                signalId
            )}/priority`,
            payload
        );
    }

    async function releasePriority(
        signalId,
        payload = {}
    ) {
        if (!signalId) {
            throw new Error(
                "Signal ID is required."
            );
        }

        return api().post(
            `/api/signals/${encodeURIComponent(
                signalId
            )}/release`,
            payload
        );
    }

    async function sendCommand(
        signalId,
        command,
        payload = {}
    ) {
        if (!signalId) {
            throw new Error(
                "Signal ID is required."
            );
        }

        if (!command) {
            throw new Error(
                "Signal command is required."
            );
        }

        return api().post(
            `/api/signals/${encodeURIComponent(
                signalId
            )}/command`,
            {
                command,
                ...payload
            }
        );
    }

    async function getCommandStatus(
        commandId
    ) {
        if (!commandId) {
            throw new Error(
                "Command ID is required."
            );
        }

        return api().get(
            `/api/signals/commands/${encodeURIComponent(
                commandId
            )}`
        );
    }

    async function getSignalEvents(
        signalId,
        query = {}
    ) {
        if (!signalId) {
            throw new Error(
                "Signal ID is required."
            );
        }

        return api().get(
            `/api/signals/${encodeURIComponent(
                signalId
            )}/events`,
            query
        );
    }

    async function getCorridorSignals(
        emergencyId
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().get(
            "/api/signals/corridor",
            {
                emergencyId
            }
        );
    }

    async function activateCorridor(
        emergencyId,
        payload = {}
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().post(
            "/api/signals/corridor/activate",
            {
                emergencyId,
                ...payload
            }
        );
    }

    async function releaseCorridor(
        emergencyId,
        payload = {}
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().post(
            "/api/signals/corridor/release",
            {
                emergencyId,
                ...payload
            }
        );
    }

    async function recoverToNormal(
        signalId,
        payload = {}
    ) {
        if (!signalId) {
            throw new Error(
                "Signal ID is required."
            );
        }

        return api().post(
            `/api/signals/${encodeURIComponent(
                signalId
            )}/recover`,
            payload
        );
    }

    window.RESQ_SIGNAL_SERVICE = Object.freeze({
        getSignals,
        getSignal,
        getSignalState,
        requestPriority,
        releasePriority,
        sendCommand,
        getCommandStatus,
        getSignalEvents,
        getCorridorSignals,
        activateCorridor,
        releaseCorridor,
        recoverToNormal
    });
})();