const LogsService = {
    async getLogs(filters = {}) {
        Logger.info('LogsService', 'Getting logs', { filters });

        return await ApiClient.get(CONSTANTS.API_ENDPOINTS.LOGS);
    },

    async getEvents(filters = {}) {
        return await ApiClient.get(CONSTANTS.API_ENDPOINTS.LOGS_EVENTS);
    },

    async createLog(data) {
        Logger.info('LogsService', 'Creating log');

        return await ApiClient.post(CONSTANTS.API_ENDPOINTS.LOGS, data);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogsService;
}