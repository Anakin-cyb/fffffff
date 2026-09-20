/**
 * ResQSync Main Application
 *
 * Core application initialization and management
 * Location: js/core/app.js
 */

const ResQSyncApp = (() => {
    /**
     * Show/hide an element by id (does nothing if the element doesn't exist)
     */
    const setDisplay = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.style.display = value;
    };

    /**
     * Initialize a UI component without letting its failure crash the whole app
     */
    const safeInit = (name, component) => {
        try {
            if (component && typeof component.init === 'function') {
                component.init();
            }
        } catch (error) {
            Logger.error('App', `${name} init failed`, {
                error: error.message,
                stack: error.stack,
            });
        }
    };

    return {
        /**
         * Initialize the application
         */
        initialize() {
            Logger.info('App', 'Initializing ResQSync');

            try {
                // 1. Initialize authentication and restore any saved session
                AuthManager.init();
                const hasSession = AuthManager.checkSession();

                // 2. Get the current user (null if not logged in)
                const user = hasSession ? AuthManager.getCurrentUser() : null;
                Logger.info('App', 'Authentication check', {
                    user: user ? user.email : 'none',
                });

                // 3. Initialize UI components
                Logger.info('App', 'Initializing UI');

                if (user) {
                    // Logged in - show sidebar and header
                    setDisplay('app-sidebar', 'flex');
                    setDisplay('app-header', 'flex');

                    safeInit(
                        'Sidebar',
                        typeof SidebarComponent !== 'undefined' ? SidebarComponent : null
                    );
                    safeInit(
                        'Header',
                        typeof HeaderComponent !== 'undefined' ? HeaderComponent : null
                    );
                } else {
                    // Not logged in - hide sidebar and header
                    setDisplay('app-sidebar', 'none');
                    setDisplay('app-header', 'none');
                }

                // 4. Initialize router (decides which page to show)
                Logger.info('Router', 'Initialized');
                Router.init();

                // 5. Initialize WebSocket if enabled (failure must not break the app)
                if (CONFIG?.websocket?.enabled && user) {
                    try {
                        Logger.info('WebSocket', 'Initializing');
                        if (
                            typeof WebSocketService !== 'undefined' &&
                            typeof WebSocketService.connect === 'function'
                        ) {
                            WebSocketService.connect();
                        }
                    } catch (wsError) {
                        Logger.error('App', 'WebSocket init failed', {
                            error: wsError.message,
                        });
                    }
                }

                // 6. Initialization complete
                Logger.info('App', 'Initialization complete');
            } catch (error) {
                Logger.error('App', 'Initialization error', {
                    error: error.message,
                    stack: error.stack,
                });
                throw error;
            }
        },

        /**
         * Logout and redirect to login
         */
        async logout() {
            try {
                Logger.info('App', 'Logging out');

                // Clear authentication (async - wait for it to finish)
                await AuthManager.logout();

                // Disconnect WebSocket
                if (
                    typeof WebSocketService !== 'undefined' &&
                    typeof WebSocketService.disconnect === 'function'
                ) {
                    WebSocketService.disconnect();
                }

                // Hide app chrome
                setDisplay('app-sidebar', 'none');
                setDisplay('app-header', 'none');

                // Redirect to login
                if (typeof Router.redirectToLogin === 'function') {
                    Router.redirectToLogin();
                } else {
                    window.location.reload();
                }

                // Show toast
                if (typeof Toast !== 'undefined') {
                    Toast.success('Logged out successfully');
                }
            } catch (error) {
                Logger.error('App', 'Logout error', { error: error.message });
                if (typeof Toast !== 'undefined') {
                    Toast.error('Logout failed');
                }
            }
        },

        /**
         * Get current application state
         */
        getState() {
            if (typeof AppState !== 'undefined' && typeof AppState.getAll === 'function') {
                return AppState.getAll();
            }
            return {};
        },
    };
})();