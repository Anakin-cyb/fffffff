const CONSTANTS = {
    ROLES: {
        CONTROL_ROOM: 'CONTROL_ROOM',
        CITIZEN: 'CITIZEN',
        EMERGENCY_VEHICLE: 'EMERGENCY_VEHICLE',
    },

    EMERGENCY_TYPES: {
        CARDIAC: {
            id: 'CARDIAC',
            name: 'Cardiac Emergency',
            icon: 'fa-heart',
            color: '#ef4444',
        },
        TRAUMA: {
            id: 'TRAUMA',
            name: 'Trauma/Accident',
            icon: 'fa-user-injured',
            color: '#f59e0b',
        },
        RESPIRATORY: {
            id: 'RESPIRATORY',
            name: 'Respiratory Distress',
            icon: 'fa-lungs',
            color: '#3b82f6',
        },
        STROKE: {
            id: 'STROKE',
            name: 'Stroke',
            icon: 'fa-brain',
            color: '#8b5cf6',
        },
        FIRE: {
            id: 'FIRE',
            name: 'Fire',
            icon: 'fa-fire',
            color: '#dc2626',
        },
        HAZMAT: {
            id: 'HAZMAT',
            name: 'Hazardous Material',
            icon: 'fa-biohazard',
            color: '#059669',
        },
        OTHER: {
            id: 'OTHER',
            name: 'Other Emergency',
            icon: 'fa-exclamation-triangle',
            color: '#f59e0b',
        },
    },

    EMERGENCY_STATUSES: {
        REQUESTED: 'REQUESTED',
        ACCEPTED: 'ACCEPTED',
        ASSIGNED: 'ASSIGNED',
        EN_ROUTE: 'EN_ROUTE',
        CORRIDOR_ACTIVE: 'CORRIDOR_ACTIVE',
        ARRIVED: 'ARRIVED',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED',
    },

    VEHICLE_TYPES: {
        AMBULANCE: 'AMBULANCE',
        FIRE_TRUCK: 'FIRE_TRUCK',
        POLICE: 'POLICE',
    },

    CONNECTION_STATUS: {
        ONLINE: 'ONLINE',
        OFFLINE: 'OFFLINE',
        CONNECTING: 'CONNECTING',
        ERROR: 'ERROR',
    },

    SIGNAL_STATE: {
        RED: 'RED',
        AMBER: 'AMBER',
        GREEN: 'GREEN',
        UNKNOWN: 'UNKNOWN',
    },

    COMMAND_STATE: {
        PENDING: 'PENDING',
        SENT: 'SENT',
        ACKNOWLEDGED: 'ACKNOWLEDGED',
        FAILED: 'FAILED',
        TIMEOUT: 'TIMEOUT',
    },

    CORRIDOR_STATE: {
        PLANNED: 'PLANNED',
        ACTIVATING: 'ACTIVATING',
        ACTIVE: 'ACTIVE',
        RECOVERING: 'RECOVERING',
        COMPLETED: 'COMPLETED',
        FAILED: 'FAILED',
    },

    ROUTES: {
        LOGIN: '/login',
        PORTAL: '/portal',
        DASHBOARD: '/dashboard',
        LIVE_MAP: '/live-map',
        EMERGENCIES: '/emergencies',
        EMERGENCY_DETAILS: '/emergency/:id',
        VEHICLES: '/vehicles',
        VEHICLE_DETAILS: '/vehicle/:id',
        TRAFFIC_NODES: '/traffic-nodes',
        SIGNAL_CONTROL: '/signal-control',
        EVENT_LOGS: '/event-logs',
        ANALYTICS: '/analytics',
        SETTINGS: '/settings',
        CITIZEN_HOME: '/citizen',
        REQUEST_EMERGENCY: '/citizen/request',
        EMERGENCY_STATUS: '/citizen/status/:id',
        VEHICLE_DASHBOARD: '/vehicle',
    },

    API_ENDPOINTS: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        ME: '/auth/me',
        REFRESH: '/auth/refresh',

        EMERGENCIES: '/emergencies',
        EMERGENCY_DETAIL: '/emergencies/{id}',
        CREATE_EMERGENCY: '/emergencies',
        UPDATE_EMERGENCY: '/emergencies/{id}',
        EMERGENCY_TIMELINE: '/emergencies/{id}/timeline',

        VEHICLES: '/vehicles',
        VEHICLE_DETAIL: '/vehicles/{id}',
        VEHICLE_TELEMETRY: '/vehicles/{id}/telemetry',
        VEHICLE_LOCATION: '/vehicles/{id}/location',

        TRAFFIC_NODES: '/traffic/nodes',
        TRAFFIC_NODE_DETAIL: '/traffic/nodes/{id}',
        TRAFFIC_NODE_STATUS: '/traffic/nodes/{id}/status',

        SIGNAL_COMMANDS: '/signals/commands',
        SIGNAL_STATUS: '/signals/status/{junctionId}',
        SIGNAL_HISTORY: '/signals/history/{junctionId}',

        CORRIDORS: '/corridors',
        CORRIDOR_DETAIL: '/corridors/{id}',
        ACTIVATE_CORRIDOR: '/corridors/{id}/activate',
        DEACTIVATE_CORRIDOR: '/corridors/{id}/deactivate',

        ANALYTICS: '/analytics',
        ANALYTICS_EMERGENCIES: '/analytics/emergencies',
        ANALYTICS_RESPONSE_TIME: '/analytics/response-time',
        ANALYTICS_VEHICLE_UTILIZATION: '/analytics/vehicle-utilization',

        LOGS: '/logs',
        LOGS_EVENTS: '/logs/events',

        SYSTEM_HEALTH: '/system/health',
        SYSTEM_STATUS: '/system/status',
    },

    ERROR_TYPES: {
        NETWORK: 'NETWORK_ERROR',
        TIMEOUT: 'TIMEOUT_ERROR',
        VALIDATION: 'VALIDATION_ERROR',
        UNAUTHORIZED: 'UNAUTHORIZED',
        FORBIDDEN: 'FORBIDDEN',
        NOT_FOUND: 'NOT_FOUND',
        SERVER: 'SERVER_ERROR',
        UNKNOWN: 'UNKNOWN_ERROR',
    },

    TOAST_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
    },

    NOTIFICATION_CATEGORIES: {
        EMERGENCY: 'EMERGENCY',
        VEHICLE: 'VEHICLE',
        TRAFFIC: 'TRAFFIC',
        CORRIDOR: 'CORRIDOR',
        SYSTEM: 'SYSTEM',
    },

    MAP_ZOOM: {
        CITY: 12,
        DISTRICT: 14,
        AREA: 16,
        STREET: 18,
        BUILDING: 20,
    },

    TIME: {
        SECOND: 1000,
        MINUTE: 60 * 1000,
        HOUR: 60 * 60 * 1000,
        DAY: 24 * 60 * 60 * 1000,
    },

    POLLING_INTERVALS: {
        TELEMETRY: 5000,
        VEHICLE_STATUS: 10000,
        SYSTEM_HEALTH: 30000,
        ANALYTICS: 60000,
    },

    VALIDATION: {
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_PATTERN: /^[0-9]{10}$/,
        PASSWORD_MIN_LENGTH: 8,
        NAME_MIN_LENGTH: 2,
    },

    HTTP_METHODS: {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        PATCH: 'PATCH',
        DELETE: 'DELETE',
    },

    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE_ENTITY: 422,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503,
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}