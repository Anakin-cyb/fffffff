/**
 * ResQSync Authentication Manager
 *
 * Handles login, logout, session restore and role checks.
 * Location: js/core/auth.js
 */

const AuthManager = (() => {
    let currentUser = null;
    let currentRole = null;
    let authToken = null;

    const loadFromStorage = () => {
        try {
            currentUser = StorageUtil.get(CONFIG.auth.userKey);
            currentRole = StorageUtil.get(CONFIG.auth.roleKey);

            const storedToken = StorageUtil.get(CONFIG.auth.tokenKey, false);
            // If the token was saved as JSON, it may come back wrapped in quotes - strip them
            authToken =
                typeof storedToken === 'string'
                    ? storedToken.replace(/^"|"$/g, '')
                    : storedToken;

            Logger.debug('Auth', 'Loaded from storage', {
                user: currentUser?.id,
                role: currentRole,
            });
        } catch (error) {
            Logger.error('Auth', 'Failed to load from storage', {
                error: error.message,
            });
        }
    };

    const saveToStorage = () => {
        try {
            if (currentUser) {
                StorageUtil.set(CONFIG.auth.userKey, currentUser);
            }

            if (currentRole) {
                StorageUtil.set(CONFIG.auth.roleKey, currentRole);
            }

            if (authToken) {
                StorageUtil.set(CONFIG.auth.tokenKey, authToken);
            }

            Logger.debug('Auth', 'Saved to storage');
        } catch (error) {
            Logger.error('Auth', 'Failed to save to storage', {
                error: error.message,
            });
        }
    };

    const clearStorage = () => {
        try {
            StorageUtil.remove(CONFIG.auth.userKey);
            StorageUtil.remove(CONFIG.auth.roleKey);
            StorageUtil.remove(CONFIG.auth.tokenKey);

            Logger.debug('Auth', 'Cleared from storage');
        } catch (error) {
            Logger.error('Auth', 'Failed to clear storage', {
                error: error.message,
            });
        }
    };

    const clearState = () => {
        currentUser = null;
        currentRole = null;
        authToken = null;
    };

    /**
     * If the token is a JWT, check its "exp" claim.
     * Non-JWT tokens (e.g. mock tokens) are treated as not expired.
     */
    const isTokenExpired = (token) => {
        try {
            const parts = String(token).split('.');
            if (parts.length !== 3) return false;

            const payload = JSON.parse(
                atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            );

            return !!payload.exp && Date.now() >= payload.exp * 1000;
        } catch (error) {
            return false;
        }
    };

    return {
        /**
         * Load any saved session from storage
         */
        init() {
            loadFromStorage();
            if (
    CONFIG.development.uiPreview === true &&
    !currentUser
) {
    currentUser = {
        id: 'ui-preview',
        email: 'preview@resqsync.local',
        role: CONFIG.roles.CONTROL_ROOM
    };

    currentRole = CONFIG.roles.CONTROL_ROOM;
    authToken = null;

    Logger.info('Auth', 'UI preview mode enabled');
    return;
}
            Logger.info('Auth', 'Initialized');
        },

        /**
         * Restore and validate the saved session.
         * Returns true if a valid session exists, false otherwise.
         */
        checkSession() {
            loadFromStorage();
            if (
    CONFIG.development.uiPreview === true
) {
    currentUser = {
        id: 'ui-preview',
        email: 'preview@resqsync.local',
        role: CONFIG.roles.CONTROL_ROOM
    };

    currentRole = CONFIG.roles.CONTROL_ROOM;

    Logger.info('Auth', 'UI preview mode active');

    return true;
}

            if (!currentUser || !authToken) {
                Logger.debug('Auth', 'No saved session');
                clearState();
                return false;
            }

            if (isTokenExpired(authToken)) {
                Logger.warn('Auth', 'Session expired');
                clearState();
                clearStorage();
                return false;
            }

            if (!currentRole && currentUser.role) {
                currentRole = currentUser.role;
            }

            Logger.info('Auth', 'Session restored', {
                user: currentUser.id,
                role: currentRole,
            });

            return true;
        },

        async login(email, password) {
            Logger.info('Auth', 'Login attempt', { email });

            try {
                const response = await ApiClient.post(
                    CONSTANTS.API_ENDPOINTS.LOGIN,
                    {
                        email,
                        password,
                    }
                );

                if (response.success) {
                    currentUser = response.data.user;
                    currentRole = response.data.user.role;
                    authToken = response.data.token;

                    saveToStorage();

                    Logger.info('Auth', 'Login successful', {
                        user: currentUser.id,
                        role: currentRole,
                    });

                    return {
                        success: true,
                        user: currentUser,
                        token: authToken,
                        role: currentRole,
                    };
                } else {
                    Logger.warn('Auth', 'Login failed', {
                        error: response.message,
                    });

                    return {
                        success: false,
                        error: response.message,
                    };
                }
            } catch (error) {
                Logger.error('Auth', 'Login error', {
                    error: error.message,
                });

                return {
                    success: false,
                    error: 'Login failed. Please try again.',
                };
            }
        },

        async logout() {
            Logger.info('Auth', 'Logout');

            try {
                await ApiClient.post(
                    CONSTANTS.API_ENDPOINTS.LOGOUT,
                    {}
                );
            } catch (error) {
                Logger.error('Auth', 'Logout error', {
                    error: error.message,
                });
            } finally {
                clearState();
                clearStorage();
            }
        },

        getCurrentUser() {
            return currentUser;
        },

        getCurrentRole() {
            return currentRole;
        },

        getToken() {
            return authToken;
        },

        setToken(token) {
            authToken = token;
            saveToStorage();
        },

        isAuthenticated() {
            return !!authToken && !!currentUser;
        },

        hasRole(role) {
            return currentRole === role;
        },

        hasAnyRole(roles) {
            return roles.includes(currentRole);
        },

        async getUserInfo() {
            Logger.info('Auth', 'Fetching user info');

            try {
                const response = await ApiClient.get(
                    CONSTANTS.API_ENDPOINTS.ME
                );

                if (response.success) {
                    currentUser = response.data;
                    saveToStorage();

                    Logger.debug('Auth', 'User info fetched', {
                        user: currentUser.id,
                    });

                    return {
                        success: true,
                        user: currentUser,
                    };
                } else {
                    Logger.warn('Auth', 'Failed to fetch user info');

                    return {
                        success: false,
                        error: response.message,
                    };
                }
            } catch (error) {
                Logger.error('Auth', 'Error fetching user info', {
                    error: error.message,
                });

                return {
                    success: false,
                    error: 'Failed to fetch user information.',
                };
            }
        },
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}