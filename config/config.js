window.RESQ_CONFIG = Object.freeze({
    APP_NAME: "ResQSync",

    API_BASE_URL: "",

    // The Flask backend has no WebSocket endpoint; live data comes from polling
    // GET /api/live/snapshot (see js/services/live.js).
    WEBSOCKET_URL: "",

    ENVIRONMENT: "production",

    FEATURES: Object.freeze({
        USE_MOCK_DATA: false,
        ENABLE_WEBSOCKET: false,
        ENABLE_LIVE_GPS: true,
        ENABLE_ANALYTICS: true,

        // The backend has no /api/auth/* routes yet, so the app runs without a login.
        // Set to true once real authentication exists.
        REQUIRE_AUTH: false
    }),

    POLLING: Object.freeze({
        INTERVAL_MS: 3000
    }),

    MAP: Object.freeze({
        DEFAULT_CENTER: [28.6139, 77.2090],
        DEFAULT_ZOOM: 12
    }),

    GPS: Object.freeze({
        STALE_AFTER_MS: 15000,
        UPDATE_INTERVAL_MS: 3000
    }),

    UI: Object.freeze({
        TOAST_DURATION_MS: 3500,
        NOTIFICATION_LIMIT: 20,
        EVENT_LOG_LIMIT: 100
    })
});
