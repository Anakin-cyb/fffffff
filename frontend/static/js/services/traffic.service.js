const TrafficService = {
    async getNodes(filters = {}) {
        Logger.info('TrafficService', 'Getting traffic nodes');

        return await ApiClient.get(CONSTANTS.API_ENDPOINTS.TRAFFIC_NODES);
    },

    async getNode(id) {
        const url = CONSTANTS.API_ENDPOINTS.TRAFFIC_NODE_DETAIL.replace('{id}', id);

        return await ApiClient.get(url);
    },

    async getStatus(id) {
        const url = CONSTANTS.API_ENDPOINTS.TRAFFIC_NODE_STATUS.replace('{id}', id);

        return await ApiClient.get(url);
    },

    async updateStatus(id, status) {
        const url = CONSTANTS.API_ENDPOINTS.TRAFFIC_NODE_DETAIL.replace('{id}', id);

        return await ApiClient.patch(url, status);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrafficService;
}