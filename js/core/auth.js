/**
 * ResQSync Authentication
 * Handles login, logout, session persistence and role checks.
 */

(function () {
    "use strict";

    const SESSION_KEY = "resqsync_session";

    function getConfig() {
        return window.RESQ_CONFIG || {
            API_BASE_URL: "http://127.0.0.1:5000"
        };
    }

    function getStoredSession() {
        try {
            const raw =
                sessionStorage.getItem(
                    SESSION_KEY
                );

            if (!raw) {
                return null;
            }

            return JSON.parse(raw);
        } catch (error) {
            console.error(
                "ResQSync auth: failed to read session.",
                error
            );

            sessionStorage.removeItem(
                SESSION_KEY
            );

            return null;
        }
    }

    function saveSession(session) {
        sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify(session)
        );
    }

    function clearSession() {
        sessionStorage.removeItem(
            SESSION_KEY
        );
    }

    function getUser() {
        const session =
            getStoredSession();

        return session
            ? session.user
            : null;
    }

    function getSession() {
        return getStoredSession();
    }

    function isAuthenticated() {
        return Boolean(getUser());
    }

    function hasRole(requiredRole) {
        const user = getUser();

        if (!user || !requiredRole) {
            return false;
        }

        return user.role === requiredRole;
    }

    function hasAnyRole(roles) {
        const user = getUser();

        if (
            !user ||
            !Array.isArray(roles)
        ) {
            return false;
        }

        return roles.includes(
            user.role
        );
    }

    function setAuthenticatedUser(
        user,
        metadata = {}
    ) {
        if (
            !user ||
            typeof user !== "object"
        ) {
            throw new Error(
                "Invalid authenticated user."
            );
        }

        const session = {
            user: {
                id:
                    user.id ??
                    null,

                name:
                    user.name ??
                    "",

                email:
                    user.email ??
                    "",

                role:
                    user.role ??
                    null,

                vehicleId:
                    user.vehicleId ??
                    null,

                hospitalId:
                    user.hospitalId ??
                    null
            },

            authenticatedAt:
                metadata.authenticatedAt ||
                new Date().toISOString()
        };

        saveSession(session);

        if (
            window.RESQ_STATE &&
            typeof window.RESQ_STATE.set ===
                "function"
        ) {
            window.RESQ_STATE.set(
                "auth",
                {
                    isAuthenticated: true,
                    user: session.user
                }
            );
        }

        return session;
    }

    async function login(
        credentials
    ) {
        if (
            !credentials ||
            typeof credentials !==
                "object"
        ) {
            throw new Error(
                "Login credentials are required."
            );
        }

        const identifier =
            String(
                credentials.identifier ||
                ""
            ).trim();

        const password =
            String(
                credentials.password ||
                ""
            );

        if (
            !identifier ||
            !password
        ) {
            throw new Error(
                "Identifier and password are required."
            );
        }

        const config =
            getConfig();

        const response =
            await fetch(
                `${config.API_BASE_URL}/api/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        identifier,
                        password
                    })
                }
            );

        let data = null;

        try {
            data =
                await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            const message =
                data?.message ||
                "Login failed. Please check your credentials.";

            throw new Error(message);
        }

        if (
            !data ||
            !data.user
        ) {
            throw new Error(
                "Login response is missing user information."
            );
        }

        const session =
            setAuthenticatedUser(
                data.user,
                {
                    authenticatedAt:
                        data.authenticatedAt
                }
            );

        return {
            success: true,
            user: session.user,
            data
        };
    }

    async function logout() {
        const config =
            getConfig();

        try {
            await fetch(
                `${config.API_BASE_URL}/api/auth/logout`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );
        } catch (error) {
            console.warn(
                "ResQSync auth: logout API unavailable.",
                error
            );
        }

        clearSession();

        if (
            window.RESQ_STATE &&
            typeof window.RESQ_STATE.set ===
                "function"
        ) {
            window.RESQ_STATE.set(
                "auth",
                {
                    isAuthenticated: false,
                    user: null
                }
            );
        }

        if (
            window.RESQ_ROUTER &&
            typeof window.RESQ_ROUTER.navigate ===
                "function"
        ) {
            window.RESQ_ROUTER.navigate(
                "/login"
            );
        }
    }

    async function restoreSession() {
        const storedSession =
            getStoredSession();

        if (
            !storedSession ||
            !storedSession.user
        ) {
            if (
                window.RESQ_STATE &&
                typeof window.RESQ_STATE.set ===
                    "function"
            ) {
                window.RESQ_STATE.set(
                    "auth",
                    {
                        isAuthenticated: false,
                        user: null
                    }
                );
            }

            return null;
        }

        if (
            window.RESQ_STATE &&
            typeof window.RESQ_STATE.set ===
                "function"
        ) {
            window.RESQ_STATE.set(
                "auth",
                {
                    isAuthenticated: true,
                    user: storedSession.user
                }
            );
        }

        return storedSession;
    }

    function getRole() {
        const user = getUser();

        return user
            ? user.role
            : null;
    }

    function requireAuthentication() {
        if (isAuthenticated()) {
            return true;
        }

        if (
            window.RESQ_ROUTER &&
            typeof window.RESQ_ROUTER.navigate ===
                "function"
        ) {
            window.RESQ_ROUTER.navigate(
                "/login"
            );
        }

        return false;
    }

    window.RESQ_AUTH =
        Object.freeze({
            login,
            logout,
            restoreSession,
            getSession,
            getUser,
            getRole,
            isAuthenticated,
            hasRole,
            hasAnyRole,
            setAuthenticatedUser,
            requireAuthentication
        });
})();