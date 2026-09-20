const TelemetryService = (() => {
    let listeners = {};
    let pollingIntervals = {};

    return {
        subscribe(vehicleId, callback) {
            if (!listeners[vehicleId]) {
                listeners[vehicleId] = [];
            }

            listeners[vehicleId].push(callback);

            if (!pollingIntervals[vehicleId]) {
                this.startPolling(vehicleId);
            }

            return () => {
                listeners[vehicleId] = listeners[vehicleId].filter(
                    cb => cb !== callback
                );
            };
        },

        startPolling(vehicleId) {
            Logger.info('Telemetry', 'Starting poll', { vehicleId });

            const poll = async () => {
                const response = await VehicleService.getTelemetry(vehicleId);

                if (response.success && listeners[vehicleId]) {
                    listeners[vehicleId].forEach(callback => {
                        callback(response.data);
                    });
                }
            };

            poll();

            pollingIntervals[vehicleId] = setInterval(
                poll,
                CONFIG.telemetry.pollingInterval
            );
        },

        stopPolling(vehicleId) {
            if (pollingIntervals[vehicleId]) {
                clearInterval(pollingIntervals[vehicleId]);
                delete pollingIntervals[vehicleId];
                Logger.info('Telemetry', 'Stopped poll', { vehicleId });
            }
        },

        async getTelemetry(vehicleId) {
            return await VehicleService.getTelemetry(vehicleId);
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelemetryService;
}