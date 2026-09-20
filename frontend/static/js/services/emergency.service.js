const EmergencyService = {
    async getEmergencies(filters = {}) {
        Logger.info('EmergencyService', 'Getting emergencies', { filters });

        return await ApiClient.get(
            CONSTANTS.API_ENDPOINTS.EMERGENCIES,
            { params: filters }
        );
    },

    async getEmergency(id) {
        Logger.info('EmergencyService', 'Getting emergency', { id });

        const url = CONSTANTS.API_ENDPOINTS.EMERGENCY_DETAIL.replace('{id}', id);

        return await ApiClient.get(url);
    },

    async createEmergency(data) {
        Logger.info('EmergencyService', 'Creating emergency', { type: data.type });

        return await ApiClient.post(
            CONSTANTS.API_ENDPOINTS.CREATE_EMERGENCY,
            data
        );
    },

    async updateEmergency(id, data) {
        Logger.info('EmergencyService', 'Updating emergency', { id });

        const url = CONSTANTS.API_ENDPOINTS.UPDATE_EMERGENCY.replace('{id}', id);

        return await ApiClient.patch(url, data);
    },

    async getTimeline(id) {
        Logger.info('EmergencyService', 'Getting timeline', { id });

        const url = CONSTANTS.API_ENDPOINTS.EMERGENCY_TIMELINE.replace('{id}', id);

        return await ApiClient.get(url);
    },

    async cancelEmergency(id) {
        Logger.info('EmergencyService', 'Cancelling emergency', { id });

        return await this.updateEmergency(id, {
            status: 'CANCELLED'
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyService;
}