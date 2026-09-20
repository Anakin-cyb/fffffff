window.RESQ_CONSTANTS = Object.freeze({
    APP: Object.freeze({
        NAME: "ResQSync",
        VERSION: "1.0.0"
    }),

    ROLES: Object.freeze({
        ADMIN: "admin",
        DISPATCHER: "dispatcher",
        TRAFFIC_AUTHORITY: "traffic_authority",
        HOSPITAL: "hospital",
        CITIZEN: "citizen",
        VEHICLE_OPERATOR: "vehicle_operator"
    }),

    EMERGENCY_STATUS: Object.freeze({
        IDLE: "IDLE",
        REQUESTED: "REQUESTED",
        VERIFIED: "VERIFIED",
        ASSIGNED: "ASSIGNED",
        EN_ROUTE_TO_PATIENT: "EN_ROUTE_TO_PATIENT",
        AT_PATIENT: "AT_PATIENT",
        PATIENT_PICKED_UP: "PATIENT_PICKED_UP",
        TRANSPORT_TO_HOSPITAL: "TRANSPORT_TO_HOSPITAL",
        CORRIDOR_PREPARING: "CORRIDOR_PREPARING",
        CORRIDOR_ACTIVE: "CORRIDOR_ACTIVE",
        ARRIVED: "ARRIVED",
        RECOVERY: "RECOVERY",
        COMPLETED: "COMPLETED",
        CANCELLED: "CANCELLED",
        DENIED: "DENIED"
    }),

    PRIORITY: Object.freeze({
        LOW: "LOW",
        MEDIUM: "MEDIUM",
        HIGH: "HIGH",
        CRITICAL: "CRITICAL"
    }),

    GPS_STATUS: Object.freeze({
        ACTIVE: "GPS_ACTIVE",
        FIX_ACQUIRED: "GPS_FIX_ACQUIRED",
        WAITING_FOR_FIX: "GPS_WAITING_FOR_FIX",
        OFFLINE: "GPS_OFFLINE",
        STALE: "GPS_STALE",
        NODE_OFFLINE: "VEHICLE_NODE_OFFLINE"
    }),

    VEHICLE_STATUS: Object.freeze({
        AVAILABLE: "AVAILABLE",
        ASSIGNED: "ASSIGNED",
        EN_ROUTE: "EN_ROUTE",
        AT_PATIENT: "AT_PATIENT",
        TRANSPORTING: "TRANSPORTING",
        ARRIVED: "ARRIVED",
        OFFLINE: "OFFLINE"
    }),

    NODE_STATUS: Object.freeze({
        ONLINE: "ONLINE",
        OFFLINE: "OFFLINE",
        DEGRADED: "DEGRADED",
        UNKNOWN: "UNKNOWN"
    }),

    SIGNAL_STATE: Object.freeze({
        RED: "RED",
        YELLOW: "YELLOW",
        GREEN: "GREEN",
        EMERGENCY_GREEN: "EMERGENCY_GREEN",
        RECOVERY: "RECOVERY",
        UNKNOWN: "UNKNOWN"
    }),

    CORRIDOR_STATUS: Object.freeze({
        NONE: "NONE",
        PREPARING: "PREPARING",
        ACTIVE: "ACTIVE",
        COMPLETED: "COMPLETED",
        DEGRADED: "DEGRADED",
        FAILED: "FAILED"
    }),

    EVENTS: Object.freeze({
        EMERGENCY_REQUESTED: "EMERGENCY_REQUESTED",
        REQUEST_VERIFIED: "REQUEST_VERIFIED",
        REQUEST_DENIED: "REQUEST_DENIED",
        VEHICLE_ASSIGNED: "VEHICLE_ASSIGNED",
        VEHICLE_LOCATION_UPDATED: "VEHICLE_LOCATION_UPDATED",
        GPS_FIX_ACQUIRED: "GPS_FIX_ACQUIRED",
        GPS_FIX_LOST: "GPS_FIX_LOST",
        GPS_DATA_STALE: "GPS_DATA_STALE",
        VEHICLE_NODE_CONNECTED: "VEHICLE_NODE_CONNECTED",
        VEHICLE_NODE_DISCONNECTED: "VEHICLE_NODE_DISCONNECTED",
        PATIENT_PICKUP_CONFIRMED: "PATIENT_PICKUP_CONFIRMED",
        ROUTE_CREATED: "ROUTE_CREATED",
        CORRIDOR_PREPARING: "CORRIDOR_PREPARING",
        CORRIDOR_ACTIVATED: "CORRIDOR_ACTIVATED",
        SIGNAL_PRIORITY_GRANTED: "SIGNAL_PRIORITY_GRANTED",
        SIGNAL_PRIORITY_RESET: "SIGNAL_PRIORITY_RESET",
        TRAFFIC_NODE_CONNECTED: "TRAFFIC_NODE_CONNECTED",
        TRAFFIC_NODE_DISCONNECTED: "TRAFFIC_NODE_DISCONNECTED",
        COMMAND_SENT: "COMMAND_SENT",
        COMMAND_ACKNOWLEDGED: "COMMAND_ACKNOWLEDGED",
        HOSPITAL_NOTIFIED: "HOSPITAL_NOTIFIED",
        HOSPITAL_READY: "HOSPITAL_READY",
        VEHICLE_ARRIVED: "VEHICLE_ARRIVED",
        CORRIDOR_RECOVERED: "CORRIDOR_RECOVERED",
        EMERGENCY_COMPLETED: "EMERGENCY_COMPLETED",
        EMERGENCY_CANCELLED: "EMERGENCY_CANCELLED"
    }),

    API: Object.freeze({
        ENDPOINTS: Object.freeze({
            HEALTH: "/api/health",

            AUTH_LOGIN: "/api/auth/login",
            AUTH_LOGOUT: "/api/auth/logout",
            AUTH_ME: "/api/auth/me",

            EMERGENCIES: "/api/emergencies",
            ACTIVE_EMERGENCY: "/api/emergencies/active",

            VEHICLES: "/api/vehicles",
            VEHICLE_DETAILS: "/api/vehicles/:vehicleId",
            VEHICLE_TELEMETRY: "/api/vehicles/:vehicleId/telemetry",

            TRAFFIC_NODES: "/api/traffic-nodes",
            TRAFFIC_NODE_DETAILS: "/api/traffic-nodes/:nodeId",

            SIGNALS: "/api/signals",
            SIGNAL_COMMAND: "/api/signals/:junctionId/command",

            EVENTS: "/api/events",
            ANALYTICS: "/api/analytics",

            HOSPITALS: "/api/hospitals",

            WEBSOCKET: "/ws"
        })
    }),

    COMMANDS: Object.freeze({
        PREPARE: "PREPARE",
        EMERGENCY_PRIORITY: "EMERGENCY_PRIORITY",
        RESET_PRIORITY: "RESET_PRIORITY",
        CANCEL: "CANCEL",
        STATUS_REQUEST: "STATUS_REQUEST"
    })
});