(function () {
    "use strict";

    const initialState = {
        app: {
            initialized: false,
            loading: false,
            error: null
        },

        auth: {
            isAuthenticated: false,
            user: null,
            role: null
        },

        ui: {
            currentPage: "login",
            sidebarOpen: true,
            activeModal: null,
            notifications: [],
            toasts: []
        },

        system: {
            backend: "UNKNOWN",
            websocket: "UNKNOWN",
            gpsService: "UNKNOWN",
            totalVehicles: 0,
            connectedVehicleNodes: 0,
            totalTrafficNodes: 0,
            connectedTrafficNodes: 0,
            lastUpdated: null
        },

        emergencies: {
            items: [],
            activeId: null,
            loading: false,
            error: null
        },

        activeEmergency: {
            id: null,
            tripId: null,
            vehicleId: null,
            type: null,
            priority: null,
            status: null,

            origin: null,
            destination: null,

            route: [],
            distance: null,
            eta: null,

            patientStatus: null,

            currentVehicleLocation: null,

            corridor: {
                status: null,
                junctions: []
            },

            timeline: [],
            events: []
        },

        vehicles: {
            items: [],
            selectedId: null,
            loading: false,
            error: null
        },

        selectedVehicle: {
            id: null,
            status: null,
            location: null,
            telemetry: null,
            gps: {
                status: null,
                latitude: null,
                longitude: null,
                speed: null,
                heading: null,
                timestamp: null,
                fix: null,
                satellites: null,
                accuracy: null
            },

            currentEmergencyId: null,
            route: [],
            distance: null,
            eta: null,
            connectionStatus: null,
            lastUpdated: null
        },

        traffic: {
            nodes: [],
            selectedNodeId: null,
            loading: false,
            error: null
        },

        selectedTrafficNode: {
            id: null,
            junctionId: null,
            name: null,
            location: null,
            signalState: null,
            connectionStatus: null,
            trafficCondition: null,
            emergencyPriority: false,
            lastUpdated: null
        },

        map: {
            center: null,
            zoom: null,

            vehicleMarkers: [],
            trafficMarkers: [],
            hospitalMarkers: [],

            emergencyOrigin: null,
            emergencyDestination: null,

            activeRoute: [],
            activeCorridor: []
        },

        analytics: {
            summary: null,
            charts: {},
            loading: false,
            error: null
        },

        logs: {
            items: [],
            filters: {
                search: "",
                eventType: "",
                vehicleId: "",
                junctionId: "",
                startDate: "",
                endDate: ""
            },

            loading: false,
            error: null
        },

        hospitals: {
            items: [],
            selectedId: null
        }
    };

    let state = deepClone(initialState);
    const listeners = new Set();

    function deepClone(value) {
        if (value === undefined) {
            return undefined;
        }

        return JSON.parse(JSON.stringify(value));
    }

    function getState() {
        return deepClone(state);
    }

    function get(path) {
        if (!path) {
            return getState();
        }

        const keys = path.split(".");
        let value = state;

        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }

            value = value[key];
        }

        return deepClone(value);
    }

    function set(path, value) {
        if (!path || typeof path !== "string") {
            throw new Error("State path must be a non-empty string.");
        }

        const keys = path.split(".");
        let target = state;

        for (let i = 0; i < keys.length - 1; i += 1) {
            const key = keys[i];

            if (
                typeof target[key] !== "object" ||
                target[key] === null ||
                Array.isArray(target[key])
            ) {
                target[key] = {};
            }

            target = target[key];
        }

        target[keys[keys.length - 1]] = deepClone(value);

        notify({
            type: "SET",
            path,
            value: deepClone(value),
            state: getState()
        });
    }

    function update(path, updater) {
        if (typeof updater !== "function") {
            throw new Error("State updater must be a function.");
        }

        const currentValue = get(path);
        const updatedValue = updater(currentValue);

        set(path, updatedValue);
    }

    function reset() {
        state = deepClone(initialState);

        notify({
            type: "RESET",
            state: getState()
        });
    }

    function subscribe(listener) {
        if (typeof listener !== "function") {
            throw new Error("State listener must be a function.");
        }

        listeners.add(listener);

        return function unsubscribe() {
            listeners.delete(listener);
        };
    }

    function notify(change) {
        listeners.forEach(function (listener) {
            try {
                listener(change);
            } catch (error) {
                console.error("[ResQSync State] Listener error:", error);
            }
        });
    }

    function initialize(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Initial state data must be an object.");
        }

        state = mergeDeep(state, data);

        set("app.initialized", true);
    }

    function mergeDeep(target, source) {
        if (!isPlainObject(target) || !isPlainObject(source)) {
            return deepClone(source);
        }

        const output = deepClone(target);

        Object.keys(source).forEach(function (key) {
            const sourceValue = source[key];

            if (isPlainObject(sourceValue) && isPlainObject(output[key])) {
                output[key] = mergeDeep(output[key], sourceValue);
            } else {
                output[key] = deepClone(sourceValue);
            }
        });

        return output;
    }

    function isPlainObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }

    window.RESQ_STATE = Object.freeze({
        getState,
        get,
        set,
        update,
        reset,
        subscribe,
        initialize
    });
})();