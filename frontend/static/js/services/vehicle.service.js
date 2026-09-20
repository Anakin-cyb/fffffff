const VehicleService = {
    async getVehicles(filters = {}) {
        Logger.info('VehicleService', 'Getting vehicles', { filters });

        return await ApiClient.get(CONSTANTS.API_ENDPOINTS.VEHICLES);
    },

    async getVehicle(id) {
        Logger.info('VehicleService', 'Getting vehicle', { id });

        const url = CONSTANTS.API_ENDPOINTS.VEHICLE_DETAIL.replace('{id}', id);

        return await ApiClient.get(url);
    },

    async getTelemetry(id) {
        Logger.info('VehicleService', 'Getting telemetry', { id });

        const url = CONSTANTS.API_ENDPOINTS.VEHICLE_TELEMETRY.replace('{id}', id);

        return await ApiClient.get(url);
    },

    async getLocation(id) {
        Logger.info('VehicleService', 'Getting location', { id });

        const url = CONSTANTS.API_ENDPOINTS.VEHICLE_LOCATION.replace('{id}', id);

        return await ApiClient.get(url);
    },

    async updateStatus(id, status) {
        Logger.info('VehicleService', 'Updating vehicle status', { id, status });

        const url = CONSTANTS.API_ENDPOINTS.VEHICLE_DETAIL.replace('{id}', id);

        return await ApiClient.patch(url, { status });
    },

    async assignEmergency(vehicleId, emergencyId) {
        Logger.info('VehicleService', 'Assigning emergency', {
            vehicleId,
            emergencyId
        });

        const url = CONSTANTS.API_ENDPOINTS.VEHICLE_DETAIL.replace(
            '{id}',
            vehicleId
        );

        return await ApiClient.patch(url, {
            emergency_id: emergencyId
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VehicleService;
}