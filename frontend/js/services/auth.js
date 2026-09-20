/**
 * ResQSync - Authentication Service
 * Handles backend authentication API operations.
 */

(function () {
    "use strict";

    function api() {
        if (!window.RESQ_API) {
            throw new Error(
                "ResQSync API service is not available."
            );
        }

        return window.RESQ_API;
    }

    async function login(identifier, password) {
        if (!identifier || !password) {
            throw new Error(
                "Identifier and password are required."
            );
        }

        return api().post(
            "/api/auth/login",
            {
                identifier: String(identifier).trim(),
                password: String(password)
            }
        );
    }

    async function logout() {
        return api().post(
            "/api/auth/logout"
        );
    }

    async function getCurrentUser() {
        return api().get(
            "/api/auth/me"
        );
    }

    async function refreshSession() {
        return api().post(
            "/api/auth/refresh"
        );
    }

    async function changePassword(
        currentPassword,
        newPassword
    ) {
        if (
            !currentPassword ||
            !newPassword
        ) {
            throw new Error(
                "Current and new passwords are required."
            );
        }

        return api().post(
            "/api/auth/change-password",
            {
                currentPassword,
                newPassword
            }
        );
    }

    window.RESQ_AUTH_SERVICE = Object.freeze({
        login,
        logout,
        getCurrentUser,
        refreshSession,
        changePassword
    });
})();