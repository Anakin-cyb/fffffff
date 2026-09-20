(function () {
    "use strict";

    const routes = {
        login: {
            path: "login",
            title: "Login",
            container: "page-login",
            roles: ["admin", "dispatcher", "traffic_authority", "hospital", "citizen", "vehicle_operator"]
        },

        dashboard: {
            path: "dashboard",
            title: "Dashboard",
            container: "page-dashboard",
            roles: ["admin", "dispatcher", "traffic_authority"]
        },

        "live-map": {
            path: "live-map",
            title: "Live Map",
            container: "page-live-map",
            roles: ["admin", "dispatcher", "traffic_authority", "hospital"]
        },

        emergencies: {
            path: "emergencies",
            title: "Emergencies",
            container: "page-emergencies",
            roles: ["admin", "dispatcher", "traffic_authority"]
        },

        "emergency-details": {
            path: "emergency-details",
            title: "Emergency Details",
            container: "page-emergency-details",
            roles: ["admin", "dispatcher", "traffic_authority", "hospital"]
        },

        vehicles: {
            path: "vehicles",
            title: "Vehicles",
            container: "page-vehicles",
            roles: ["admin", "dispatcher", "traffic_authority"]
        },

        "vehicle-details": {
            path: "vehicle-details",
            title: "Vehicle Details",
            container: "page-vehicle-details",
            roles: ["admin", "dispatcher", "traffic_authority", "vehicle_operator"]
        },

        "traffic-nodes": {
            path: "traffic-nodes",
            title: "Traffic Nodes",
            container: "page-traffic-nodes",
            roles: ["admin", "traffic_authority"]
        },

        "signal-control": {
            path: "signal-control",
            title: "Signal Control",
            container: "page-signal-control",
            roles: ["admin", "traffic_authority"]
        },

        "event-logs": {
            path: "event-logs",
            title: "Event Logs",
            container: "page-event-logs",
            roles: ["admin", "dispatcher", "traffic_authority", "hospital"]
        },

        analytics: {
            path: "analytics",
            title: "Analytics",
            container: "page-analytics",
            roles: ["admin", "dispatcher", "traffic_authority"]
        },

        settings: {
            path: "settings",
            title: "Settings",
            container: "page-settings",
            roles: ["admin"]
        },

        "citizen-home": {
            path: "citizen-home",
            title: "Citizen Home",
            container: "page-citizen-home",
            roles: ["citizen"]
        },

        "request-emergency": {
            path: "request-emergency",
            title: "Request Emergency",
            container: "page-request-emergency",
            roles: ["citizen"]
        },

        "emergency-status": {
            path: "emergency-status",
            title: "Emergency Status",
            container: "page-emergency-status",
            roles: ["citizen"]
        },

        "vehicle-dashboard": {
            path: "vehicle-dashboard",
            title: "Vehicle Dashboard",
            container: "page-vehicle-dashboard",
            roles: ["vehicle_operator"]
        }
    };

    let currentRoute = null;

    function authRequired() {
        return window.RESQ_CONFIG?.FEATURES?.REQUIRE_AUTH !== false;
    }

    function getHashPath() {
        const hash = window.location.hash || (authRequired() ? "#/login" : "#/dashboard");
        const cleanHash = hash.replace(/^#\/?/, "");
        return cleanHash.split("?")[0] || "login";
    }

    function getCurrentRoute() {
        const path = getHashPath();

        return Object.values(routes).find(function (route) {
            return route.path === path;
        }) || routes.login;
    }

    function getCurrentUserRole() {
        if (
            window.RESQ_STATE &&
            typeof window.RESQ_STATE.get === "function"
        ) {
            const role =
                window.RESQ_STATE.get("auth.role") ||
                window.RESQ_STATE.get("auth.user.role");

            if (role) {
                return role;
            }
        }

        // no backend login yet (REQUIRE_AUTH:false): behave as a control-room admin
        return authRequired() ? null : "admin";
    }

    function canAccess(route) {
        if (!route || !Array.isArray(route.roles)) {
            return false;
        }

        // Local/demo mode intentionally has no authentication. Allow all demo
        // surfaces to be navigated so the citizen and vehicle workflows can be
        // demonstrated without pretending a login exists.
        if (!authRequired()) {
            return true;
        }

        const role = getCurrentUserRole();

        if (!role) {
            return route.path === "login";
        }

        return route.roles.includes(role);
    }

    function hideAllContainers() {
        const containers = document.querySelectorAll("[data-route-container]");

        containers.forEach(function (container) {
            container.hidden = true;
            container.setAttribute("aria-hidden", "true");
        });
    }

    function showContainer(route) {
        if (!route || !route.container) {
            return;
        }

        const container =
            document.getElementById(route.container) ||
            document.querySelector(
                `[data-route-container="/${route.path}"]`
            );

        if (!container) {
            return;
        }

        container.hidden = false;
        container.setAttribute("aria-hidden", "false");
    }

    function updateDocumentTitle(route) {
        if (!route) {
            return;
        }

        document.title = `${route.title} | ResQSync`;
    }

    function dispatchRouteChange(route) {
        window.dispatchEvent(
            new CustomEvent("resq:route-change", {
                detail: {
                    route: route.path,
                    title: route.title,
                    container: route.container
                }
            })
        );
    }

    function navigate(routeName, params) {
        const route = routes[routeName];

        if (!route) {
            console.error(`[ResQSync Router] Unknown route: ${routeName}`);
            return;
        }

        let hash = `#/${route.path}`;

        if (params && typeof params === "object") {
            const query = new URLSearchParams();

            Object.entries(params).forEach(function ([key, value]) {
                if (value !== undefined && value !== null) {
                    query.set(key, String(value));
                }
            });

            const queryString = query.toString();

            if (queryString) {
                hash += `?${queryString}`;
            }
        }

        if (window.location.hash === hash) {
            handleRouteChange();
            return;
        }

        window.location.hash = hash;
    }

    function handleRouteChange() {
        const route = getCurrentRoute();

        if (!canAccess(route)) {
            navigate("login");
            return;
        }

        currentRoute = route;

        hideAllContainers();
        showContainer(route);
        updateDocumentTitle(route);
        dispatchRouteChange(route);
    }

    function getRoute(routeName) {
        return routes[routeName] || null;
    }

    function getRoutes() {
        return Object.freeze({ ...routes });
    }

    function start() {
        window.addEventListener("hashchange", handleRouteChange);
        handleRouteChange();
    }

    window.RESQ_ROUTER = Object.freeze({
        start,
        navigate,
        getRoute,
        getRoutes,
        getCurrentRoute: function () {
            return currentRoute;
        }
    });
})();