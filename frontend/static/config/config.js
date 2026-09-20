/**
 * ResQSync Configuration
 * 
 * This file contains all configuration settings for the frontend application.
 * Modify these values based on your environment (development, staging, production).
 */

const CONFIG = {
    // ========================================== 
    // API Configuration
    // ========================================== 
    api: {
        baseUrl: 'http://localhost:5000/api',
        timeout: 30000,              // Request timeout in milliseconds
        retryAttempts: 3,            // Number of retry attempts
        retryDelay: 1000,            // Delay between retries in milliseconds
        mockMode: false,             // Enable mock responses (development only)
    },
    
    // ========================================== 
    // Authentication Configuration
    // ========================================== 
    auth: {
        tokenKey: 'resqsync_token',       // LocalStorage key for token
        userKey: 'resqsync_user',         // LocalStorage key for user
        roleKey: 'resqsync_role',         // LocalStorage key for role
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        redirectOnUnauth: true,           // Redirect to login on 401
    },
    
    // ========================================== 
    // WebSocket Configuration
    // ========================================== 
    websocket: {
        enabled: false,               // DISABLED - Enable when backend is ready
        url: 'ws://localhost:5000/ws',
        reconnectAttempts: 5,         // Number of reconnection attempts
        reconnectDelay: 3000,         // Initial reconnect delay in ms
        reconnectBackoff: 1.5,        // Exponential backoff multiplier
        heartbeatInterval: 30000,     // Keep-alive ping interval
        messageTimeout: 10000,        // Timeout for waiting for messages
    },
    
    // ========================================== 
    // Map Configuration
    // ========================================== 
    map: {
        enabled: true,
        defaultZoom: 15,
        defaultCenter: [28.6139, 77.2090],  // Delhi coordinates
        minZoom: 10,
        maxZoom: 20,
        tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
        updateInterval: 2000,         // Map update interval in ms
    },
    
    // ========================================== 
    // Telemetry Configuration
    // ========================================== 
    telemetry: {
        updateInterval: 5000,         // Real-time update interval
        pollingInterval: 10000,       // Fallback polling interval
        locationHistoryLimit: 100,    // Max location points to keep
        speedAlertThreshold: 120,     // km/h - Alert if vehicle exceeds
    },
    
    // ========================================== 
    // UI Configuration
    // ========================================== 
    ui: {
        toastDuration: 5000,          // Toast notification duration
        notificationDuration: 10000,  // Alert notification duration
        animationDuration: 300,       // Default animation duration
        modalBackdropClose: true,     // Allow closing modal by clicking backdrop
    },
    
    // ========================================== 
    // Development Configuration
    // ========================================== 
    development: {
        enableMockData: false,        // Enable mock data responses
        enableLogging: true,          // Enable console logging
        logLevel: 'info',             // 'debug', 'info', 'warn', 'error'
        showPerformanceMetrics: false, // Show performance timings
        enableNetworkLogging: false,
         uiPreview: true,  // Log all network requests
    },
    
    // ========================================== 
    // Feature Flags
    // ========================================== 
    features: {
        liveMap: true,                // Show live vehicle tracking
        emergencyManagement: true,    // Emergency request/tracking
        vehicleManagement: true,      // Vehicle management
        signalControl: true,          // Traffic signal control
        analytics: true,              // Analytics dashboard
        eventLogs: true,              // Event logging
        realTimeUpdates: false,       // WebSocket real-time (disabled by default)
    },
    
    // ========================================== 
    // User Roles
    // ========================================== 
    roles: {
        CONTROL_ROOM: 'CONTROL_ROOM',           // Administrator/Dispatcher
        CITIZEN: 'CITIZEN',                     // Regular user
        EMERGENCY_VEHICLE: 'EMERGENCY_VEHICLE', // Driver/Operator
    },
    
    // ========================================== 
    // Emergency Types
    // ========================================== 
    emergencyTypes: {
        CARDIAC: {
            id: 'CARDIAC',
            name: 'Cardiac Emergency',
            icon: 'fa-heart',
            color: '#ef4444',
            priority: 'HIGH',
        },
        TRAUMA: {
            id: 'TRAUMA',
            name: 'Trauma/Accident',
            icon: 'fa-user-injured',
            color: '#f97316',
            priority: 'HIGH',
        },
        RESPIRATORY: {
            id: 'RESPIRATORY',
            name: 'Respiratory Distress',
            icon: 'fa-lungs',
            color: '#3b82f6',
            priority: 'HIGH',
        },
        STROKE: {
            id: 'STROKE',
            name: 'Stroke',
            icon: 'fa-brain',
            color: '#8b5cf6',
            priority: 'HIGH',
        },
        FIRE: {
            id: 'FIRE',
            name: 'Fire',
            icon: 'fa-fire',
            color: '#dc2626',
            priority: 'CRITICAL',
        },
        HAZMAT: {
            id: 'HAZMAT',
            name: 'Hazardous Material',
            icon: 'fa-biohazard',
            color: '#059669',
            priority: 'CRITICAL',
        },
        OTHER: {
            id: 'OTHER',
            name: 'Other Emergency',
            icon: 'fa-exclamation-triangle',
            color: '#6b7280',
            priority: 'MEDIUM',
        },
    },
    
    // ========================================== 
    // Emergency Statuses
    // ========================================== 
    emergencyStatuses: {
        REQUESTED: { name: 'Requested', color: '#f59e0b', icon: 'fa-clipboard' },
        ACCEPTED: { name: 'Accepted', color: '#3b82f6', icon: 'fa-check' },
        ASSIGNED: { name: 'Assigned', color: '#8b5cf6', icon: 'fa-user' },
        EN_ROUTE: { name: 'En Route', color: '#06b6d4', icon: 'fa-location-arrow' },
        CORRIDOR_ACTIVE: { name: 'Corridor Active', color: '#10b981', icon: 'fa-traffic-light' },
        ARRIVED: { name: 'Arrived', color: '#059669', icon: 'fa-flag-checkered' },
        COMPLETED: { name: 'Completed', color: '#6b7280', icon: 'fa-check-circle' },
        CANCELLED: { name: 'Cancelled', color: '#ef4444', icon: 'fa-times-circle' },
    },
    
    // ========================================== 
    // Vehicle Types
    // ========================================== 
    vehicleTypes: {
        AMBULANCE: { id: 'AMBULANCE', name: 'Ambulance', icon: 'fa-ambulance' },
        FIRE_TRUCK: { id: 'FIRE_TRUCK', name: 'Fire Truck', icon: 'fa-fire-truck' },
        POLICE: { id: 'POLICE', name: 'Police Vehicle', icon: 'fa-car' },
    },
    
    // ========================================== 
    // Connection Statuses
    // ========================================== 
    connectionStatuses: {
        ONLINE: { name: 'Online', color: '#10b981', icon: 'fa-check-circle' },
        OFFLINE: { name: 'Offline', color: '#6b7280', icon: 'fa-times-circle' },
        CONNECTING: { name: 'Connecting', color: '#f59e0b', icon: 'fa-spinner' },
        ERROR: { name: 'Error', color: '#ef4444', icon: 'fa-exclamation-circle' },
    },
    
    // ========================================== 
    // Signal States
    // ========================================== 
    signalStates: {
        RED: { name: 'Red', color: '#ef4444', icon: 'fa-circle' },
        AMBER: { name: 'Amber', color: '#f59e0b', icon: 'fa-circle' },
        GREEN: { name: 'Green', color: '#10b981', icon: 'fa-circle' },
        UNKNOWN: { name: 'Unknown', color: '#6b7280', icon: 'fa-question-circle' },
    },
    
    // ========================================== 
    // Command States
    // ========================================== 
    commandStates: {
        PENDING: { name: 'Pending', color: '#f59e0b', status: 'waiting' },
        SENT: { name: 'Sent', color: '#3b82f6', status: 'in_progress' },
        ACKNOWLEDGED: { name: 'Acknowledged', color: '#10b981', status: 'success' },
        FAILED: { name: 'Failed', color: '#ef4444', status: 'error' },
        TIMEOUT: { name: 'Timeout', color: '#ef4444', status: 'error' },
    },
    
    // ========================================== 
    // Corridor States
    // ========================================== 
    corridorStates: {
        PLANNED: { name: 'Planned', color: '#9ca3af' },
        ACTIVATING: { name: 'Activating', color: '#f59e0b' },
        ACTIVE: { name: 'Active', color: '#10b981' },
        RECOVERING: { name: 'Recovering', color: '#3b82f6' },
        COMPLETED: { name: 'Completed', color: '#6b7280' },
        FAILED: { name: 'Failed', color: '#ef4444' },
    },
    
    // ========================================== 
    // Time Intervals
    // ========================================== 
    intervals: {
        dashboardRefresh: 5000,       // Dashboard data refresh
        telemetryUpdate: 2000,        // Telemetry update interval
        mapUpdate: 1000,              // Map marker update interval
        statusCheck: 10000,           // Connection status check
        heartbeat: 30000,             // WebSocket heartbeat
    },
    
    // ========================================== 
    // Validation Rules
    // ========================================== 
    validation: {
        minPhoneLength: 10,
        maxPhoneLength: 15,
        maxNoteLength: 500,
        maxAddressLength: 200,
        coordinatePrecision: 6,       // Decimal places for lat/long
    },
    
    // ========================================== 
    // Default Demo Data
    // ========================================== 
    demo: {
        adminEmail: 'admin@resqsync.com',
        adminPassword: 'password123',
        citizenEmail: 'citizen@resqsync.com',
        driverEmail: 'driver@resqsync.com',
        demoLocation: [28.6139, 77.2090],  // Delhi
        demoLocationRadius: 5000,     // 5km radius for demo
    },
};

// ========================================== 
// Environment-specific Configuration
// ========================================== 

if (typeof window !== 'undefined') {
    // Browser environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Development environment
        CONFIG.development.enableLogging = true;
        CONFIG.development.logLevel = 'debug';
    } else {
        // Production environment
        CONFIG.development.enableLogging = false;
        CONFIG.websocket.enabled = true;
    }
}

// ========================================== 
// Export Configuration
// ========================================== 

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}