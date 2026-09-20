/**
 * ResQSync - Traffic Service
 * Centralized traffic-node API operations.
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

    async function getTrafficNodes(filters = {}) {
        return api().get(
            "/api/traffic-nodes",
            filters
        );
    }

    async function getTrafficNode(nodeId) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}`
        );
    }

    async function getNodeStatus(nodeId) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}/status`
        );
    }

    async function getNodeHealth(nodeId) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}/health`
        );
    }

    async function getNodeHeartbeat(nodeId) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}/heartbeat`
        );
    }

    async function getNodeTelemetry(
        nodeId,
        query = {}
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}/telemetry`,
            query
        );
    }

    async function getNodeEvents(
        nodeId,
        query = {}
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}/events`,
            query
        );
    }

    async function getNodesForCorridor(
        emergencyId
    ) {
        if (!emergencyId) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return api().get(
            "/api/traffic-nodes/corridor",
            {
                emergencyId
            }
        );
    }

    async function reportNodeHeartbeat(
        nodeId,
        heartbeatData = {}
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().post(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}/heartbeat`,
            heartbeatData
        );
    }

    async function acknowledgeNode(
        nodeId
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().post(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}/acknowledge`
        );
    }

    async function getNodeConfiguration(
        nodeId
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().get(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}/configuration`
        );
    }

    async function updateNodeConfiguration(
        nodeId,
        configuration = {}
    ) {
        if (!nodeId) {
            throw new Error(
                "Traffic node ID is required."
            );
        }

        return api().patch(
            `/api/traffic-nodes/${encodeURIComponent(
                nodeId
            )}/configuration`,
            configuration
        );
    }

    window.RESQ_TRAFFIC_SERVICE = Object.freeze({
        getTrafficNodes,
        getTrafficNode,
        getNodeStatus,
        getNodeHealth,
        getNodeHeartbeat,
        getNodeTelemetry,
        getNodeEvents,
        getNodesForCorridor,
        reportNodeHeartbeat,
        acknowledgeNode,
        getNodeConfiguration,
        updateNodeConfiguration
    });
})();