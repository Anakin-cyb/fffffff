const AppState = (() => {
    let state = {
        user: null,
        role: null,
        emergencies: [],
        vehicles: [],
        trafficNodes: [],
        selectedEmergency: null,
        selectedVehicle: null,
        selectedCorridor: null,
        notifications: [],
        systemHealth: {},
        mapCenter: CONFIG.map.defaultCenter,
        mapZoom: CONFIG.map.defaultZoom,
        isLoading: false,
        error: null
    };

    const subscribers = {};

    return {
        getState() {
            return JSON.parse(JSON.stringify(state));
        },

        get(path) {
            const keys = path.split('.');
            let value = state;

            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return undefined;
                }
            }

            return value;
        },

        set(path, value) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            let target = state;

            for (const key of keys) {
                if (!(key in target)) {
                    target[key] = {};
                }

                target = target[key];
            }

            const oldValue = target[lastKey];
            target[lastKey] = value;

            Logger.debug('State', 'Updated', {
                path,
                oldValue,
                newValue: value
            });

            this.notify(path, value);
        },

        update(updates) {
            Object.keys(updates).forEach(key => {
                this.set(key, updates[key]);
            });
        },

        subscribe(path, callback) {
            if (!subscribers[path]) {
                subscribers[path] = [];
            }

            subscribers[path].push(callback);

            return () => {
                subscribers[path] = subscribers[path].filter(
                    cb => cb !== callback
                );
            };
        },

        notify(path, value) {
            if (subscribers[path]) {
                subscribers[path].forEach(callback => {
                    try {
                        callback(value);
                    } catch (error) {
                        Logger.error('State', 'Subscriber error', {
                            path,
                            error: error.message
                        });
                    }
                });
            }
        },

        clear() {
            state = {
                user: null,
                role: null,
                emergencies: [],
                vehicles: [],
                trafficNodes: [],
                selectedEmergency: null,
                selectedVehicle: null,
                selectedCorridor: null,
                notifications: [],
                systemHealth: {},
                mapCenter: CONFIG.map.defaultCenter,
                mapZoom: CONFIG.map.defaultZoom,
                isLoading: false,
                error: null
            };

            Logger.info('State', 'Cleared');
        },

        log() {
            console.table(state);
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
}