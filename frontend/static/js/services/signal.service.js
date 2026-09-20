const SignalService = {
    async sendCommand(junctionId, command) {
        Logger.info('SignalService', 'Sending command', {
            junctionId,
            command
        });

        return await ApiClient.post(CONSTANTS.API_ENDPOINTS.SIGNAL_COMMANDS, {
            junction_id: junctionId,
            ...command
        });
    },

    async getStatus(junctionId) {
        const url = CONSTANTS.API_ENDPOINTS.SIGNAL_STATUS.replace(
            '{junctionId}',
            junctionId
        );

        return await ApiClient.get(url);
    },

    async getHistory(junctionId) {
        const url = CONSTANTS.API_ENDPOINTS.SIGNAL_HISTORY.replace(
            '{junctionId}',
            junctionId
        );

        return await ApiClient.get(url);
    },

    async setPriority(junctionId, priority) {
        return await this.sendCommand(junctionId, {
            type: 'PRIORITY',
            priority
        });
    },

    async resetSignal(junctionId) {
        return await this.sendCommand(junctionId, {
            type: 'RESET'
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SignalService;
}