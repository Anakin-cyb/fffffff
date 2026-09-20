const AuthService = {
    async login(email, password) {
        Logger.info('AuthService', 'Login', { email });

        return await AuthManager.login(email, password);
    },

    async logout() {
        Logger.info('AuthService', 'Logout');

        await AuthManager.logout();
    },

    getCurrentUser() {
        return AuthManager.getCurrentUser();
    },

    getCurrentRole() {
        return AuthManager.getCurrentRole();
    },

    isAuthenticated() {
        return AuthManager.isAuthenticated();
    },

    async refreshToken() {
        Logger.info('AuthService', 'Refreshing token');

        const response = await ApiClient.post(
            CONSTANTS.API_ENDPOINTS.REFRESH,
            {}
        );

        if (response.success && response.data.token) {
            AuthManager.setToken(response.data.token);
            return true;
        }

        return false;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}