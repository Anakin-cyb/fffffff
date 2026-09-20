const WebSocketService = (() => {
    let ws = null;
    let listeners = {};
    let reconnectAttempts = 0;
    let isConnected = false;

    const connect = () => {
        if (!CONFIG.websocket.enabled) {
            Logger.info('WebSocket', 'Disabled in config');
            return;
        }

        Logger.info('WebSocket', 'Connecting', {
            url: CONFIG.websocket.url
        });

        try {
            ws = new WebSocket(CONFIG.websocket.url);

            ws.onopen = () => {
                Logger.info('WebSocket', 'Connected');
                isConnected = true;
                reconnectAttempts = 0;

                NotificationComponent.add({
                    title: 'Connected',
                    message: 'Real-time updates enabled',
                    type: 'info'
                });
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    Logger.debug('WebSocket', 'Message', {
                        event: data.event
                    });

                    if (listeners[data.event]) {
                        listeners[data.event].forEach(callback => {
                            callback(data.data);
                        });
                    }
                } catch (error) {
                    Logger.error('WebSocket', 'Parse error', {
                        error: error.message
                    });
                }
            };

            ws.onerror = (error) => {
                Logger.error('WebSocket', 'Error', {
                    error: error.message
                });

                isConnected = false;
            };

            ws.onclose = () => {
                Logger.warn('WebSocket', 'Disconnected');
                isConnected = false;
                attemptReconnect();
            };
        } catch (error) {
            Logger.error('WebSocket', 'Connection error', {
                error: error.message
            });

            attemptReconnect();
        }
    };

    const attemptReconnect = () => {
        if (reconnectAttempts < CONFIG.websocket.reconnectAttempts) {
            reconnectAttempts++;

            Logger.info('WebSocket', 'Reconnecting', {
                attempt: reconnectAttempts
            });

            setTimeout(() => {
                connect();
            }, CONFIG.websocket.reconnectDelay);
        }
    };

    return {
        connect() {
            connect();
        },

        disconnect() {
            if (ws) {
                ws.close();
                ws = null;
                isConnected = false;
                Logger.info('WebSocket', 'Disconnected');
            }
        },

        subscribe(event, callback) {
            if (!listeners[event]) {
                listeners[event] = [];
            }

            listeners[event].push(callback);

            return () => {
                listeners[event] = listeners[event].filter(
                    cb => cb !== callback
                );
            };
        },

        send(event, data = {}) {
            if (!isConnected || !ws) {
                Logger.warn('WebSocket', 'Not connected');
                return;
            }

            try {
                ws.send(JSON.stringify({ event, data }));
                Logger.debug('WebSocket', 'Sent', { event });
            } catch (error) {
                Logger.error('WebSocket', 'Send error', {
                    error: error.message
                });
            }
        },

        isConnected() {
            return isConnected && ws && ws.readyState === WebSocket.OPEN;
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketService;
}