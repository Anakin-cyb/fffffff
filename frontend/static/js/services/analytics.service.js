const AnalyticsService = {
    async getAnalytics() {
        Logger.info('AnalyticsService', 'Getting analytics');

        return await ApiClient.get(CONSTANTS.API_ENDPOINTS.ANALYTICS);
    },

    async getEmergencyStats() {
        return await ApiClient.get(
            CONSTANTS.API_ENDPOINTS.ANALYTICS_EMERGENCIES
        );
    },

    async getResponseTimeStats() {
        return await ApiClient.get(
            CONSTANTS.API_ENDPOINTS.ANALYTICS_RESPONSE_TIME
        );
    },

    async getVehicleUtilization() {
        return await ApiClient.get(
            CONSTANTS.API_ENDPOINTS.ANALYTICS_VEHICLE_UTILIZATION
        );
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsService;
}