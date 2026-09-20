/**
 * ResQSync - WebSocket Service
 * Modular real-time communication layer.
 */

(function () {
    "use strict";

    let socket = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    let manuallyClosed = false;

    const listeners = new Map();

    function getConfig() {
        return window.RESQ_CONFIG || {
            WEBSOCKET_URL: "ws://127.0.0.1:5000/ws",
            FEATURES: {
                ENABLE_WEBSOCKET: true
            }
        };
    }

    function getWebSocketUrl() {
        return String(
            getConfig().WEBSOCKET_URL || ""
        ).trim();
    }

    function isEnabled() {
        return Boolean(
            getConfig().FEATURES?.ENABLE_WEBSOCKET !== false
        );
    }

    function getState() {
        if (!socket) {
            return "CLOSED";
        }

        switch (socket.readyState) {
            case WebSocket.CONNECTING:
                return "CONNECTING";

            case WebSocket.OPEN:
                return "OPEN";

            case WebSocket.CLOSING:
                return "CLOSING";

            case WebSocket.CLOSED:
                return "CLOSED";

            default:
                return "UNKNOWN";
        }
    }

    function emit(eventName, payload = null) {
        const eventListeners =
            listeners.get(eventName);

        if (!eventListeners) {
            return;
        }

        eventListeners.forEach((callback) => {
            try {
                callback(payload);
            } catch (error) {
                console.error(
                    "[ResQSync] WebSocket listener error.",
                    error
                );
            }
        });
    }

    function on(eventName, callback) {
        if (
            !eventName ||
            typeof callback !== "function"
        ) {
            return () => {};
        }

        if (!listeners.has(eventName)) {
            listeners.set(
                eventName,
                new Set()
            );
        }

        listeners
            .get(eventName)
            .add(callback);

        return () => {
            off(eventName, callback);
        };
    }

    function off(eventName, callback) {
        const eventListeners =
            listeners.get(eventName);

        if (!eventListeners) {
            return;
        }

        eventListeners.delete(callback);

        if (eventListeners.size === 0) {
            listeners.delete(eventName);
        }
    }

    function parseMessage(rawData) {
        if (typeof rawData !== "string") {
            return rawData;
        }

        try {
            return JSON.parse(rawData);
        } catch (error) {
            return rawData;
        }
    }

    function getEventType(message) {
        if (
            message &&
            typeof message === "object"
        ) {
            return (
                message.event ||
                message.type ||
                message.topic ||
                null
            );
        }

        return null;
    }

    function scheduleReconnect() {
        if (
            manuallyClosed ||
            !isEnabled()
        ) {
            return;
        }

        if (reconnectTimer) {
            return;
        }

        reconnectAttempts += 1;

        const baseDelay = 1000;
        const maxDelay = 15000;

        const delay = Math.min(
            baseDelay *
                Math.pow(
                    2,
                    Math.min(
                        reconnectAttempts - 1,
                        4
                    )
                ),
            maxDelay
        );

        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
        }, delay);
    }

    function clearReconnectTimer() {
        if (!reconnectTimer) {
            return;
        }

        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    function connect() {
        if (!isEnabled()) {
            emit("disabled", {
                reason:
                    "WebSocket is disabled by configuration."
            });

            return false;
        }

        if (
            typeof WebSocket === "undefined"
        ) {
            emit("error", {
                message:
                    "WebSocket is not supported by this browser."
            });

            return false;
        }

        const url = getWebSocketUrl();

        if (!url) {
            emit("error", {
                message:
                    "WebSocket URL is not configured."
            });

            return false;
        }

        if (
            socket &&
            (
                socket.readyState ===
                    WebSocket.OPEN ||
                socket.readyState ===
                    WebSocket.CONNECTING
            )
        ) {
            return true;
        }

        manuallyClosed = false;
        clearReconnectTimer();

        emit("connecting", {
            url
        });

        try {
            socket = new WebSocket(url);
        } catch (error) {
            emit("error", {
                message:
                    "Failed to create WebSocket connection.",
                error
            });

            scheduleReconnect();
            return false;
        }

        socket.addEventListener(
            "open",
            handleOpen
        );

        socket.addEventListener(
            "message",
            handleMessage
        );

        socket.addEventListener(
            "error",
            handleError
        );

        socket.addEventListener(
            "close",
            handleClose
        );

        return true;
    }

    function handleOpen(event) {
        reconnectAttempts = 0;

        emit("open", {
            event
        });

        emit("connection", {
            connected: true,
            state: "OPEN"
        });

        if (window.RESQ_LOGGER) {
            window.RESQ_LOGGER.info(
                "WebSocket connected."
            );
        }
    }

    function handleMessage(event) {
        const data =
            parseMessage(event.data);

        emit("message", data);

        const eventType =
            getEventType(data);

        if (eventType) {
            emit(
                `message:${eventType}`,
                data
            );
        }

        processRealtimeMessage(data);
    }

    function handleError(event) {
        emit("error", {
            event,
            message:
                "WebSocket connection error."
        });

        if (window.RESQ_LOGGER) {
            window.RESQ_LOGGER.warn(
                "WebSocket connection error.",
                event
            );
        }
    }

    function handleClose(event) {
        emit("close", {
            event,
            code: event.code,
            reason: event.reason
        });

        emit("connection", {
            connected: false,
            state: "CLOSED"
        });

        if (window.RESQ_LOGGER) {
            window.RESQ_LOGGER.warn(
                "WebSocket disconnected.",
                {
                    code: event.code,
                    reason: event.reason
                }
            );
        }

        if (!manuallyClosed) {
            scheduleReconnect();
        }
    }

    function processRealtimeMessage(data) {
        if (
            !data ||
            typeof data !== "object"
        ) {
            return;
        }

        const eventType =
            getEventType(data);

        switch (eventType) {
            case "vehicle_gps":
            case "vehicle_location":
            case "gps_update":
                emit(
                    "vehicle:gps",
                    data
                );
                break;

            case "vehicle_status":
            case "vehicle_connection":
                emit(
                    "vehicle:status",
                    data
                );
                break;

            case "emergency_status":
            case "emergency_update":
                emit(
                    "emergency:update",
                    data
                );
                break;

            case "signal_update":
            case "signal_status":
                emit(
                    "signal:update",
                    data
                );
                break;

            case "telemetry":
            case "vehicle_telemetry":
            case "node_telemetry":
                emit(
                    "telemetry:update",
                    data
                );
                break;

            case "traffic_node_status":
            case "node_status":
            case "node_connection":
                emit(
                    "traffic-node:status",
                    data
                );
                break;

            case "notification":
                emit(
                    "notification",
                    data
                );
                break;

            default:
                emit(
                    "realtime:update",
                    data
                );
                break;
        }
    }

    function send(message) {
        if (
            !socket ||
            socket.readyState !==
                WebSocket.OPEN
        ) {
            throw new Error(
                "WebSocket is not connected."
            );
        }

        const payload =
            typeof message === "string"
                ? message
                : JSON.stringify(message);

        socket.send(payload);
    }

    function subscribe(
        channel
    ) {
        if (!channel) {
            throw new Error(
                "WebSocket channel is required."
            );
        }

        send({
            action: "subscribe",
            channel
        });
    }

    function unsubscribe(
        channel
    ) {
        if (!channel) {
            throw new Error(
                "WebSocket channel is required."
            );
        }

        send({
            action: "unsubscribe",
            channel
        });
    }

    function disconnect() {
        manuallyClosed = true;

        clearReconnectTimer();

        if (!socket) {
            emit("connection", {
                connected: false,
                state: "CLOSED"
            });

            return;
        }

        try {
            socket.close(
                1000,
                "Client disconnected."
            );
        } catch (error) {
            console.warn(
                "[ResQSync] WebSocket close failed.",
                error
            );
        }

        socket = null;

        emit("connection", {
            connected: false,
            state: "CLOSED"
        });
    }

    function reconnect() {
        disconnect();

        manuallyClosed = false;
        reconnectAttempts = 0;

        return connect();
    }

    function isConnected() {
        return Boolean(
            socket &&
            socket.readyState ===
                WebSocket.OPEN
        );
    }

    function getSocket() {
        return socket;
    }

    window.RESQ_WEBSOCKET_SERVICE =
        Object.freeze({
            connect,
            disconnect,
            reconnect,
            send,
            subscribe,
            unsubscribe,
            on,
            off,
            isConnected,
            getState,
            getSocket
        });
})();