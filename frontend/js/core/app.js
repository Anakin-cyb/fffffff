/**
 * ResQSync - Application Bootstrap
 *
 * Pages are initialised lazily the first time their route is shown, and told to
 * activate / deactivate afterwards so live polling only runs for the visible page.
 */

(function () {
    "use strict";

    // route path -> page module (each exposes initialize(), and optionally activate()/deactivate())
    const PAGES = {
        login: () => window.RESQ_LOGIN_PAGE,
        dashboard: () => window.RESQ_DASHBOARD_PAGE,
        "live-map": () => window.RESQ_LIVE_MAP_PAGE,
        emergencies: () => window.RESQ_EMERGENCIES_PAGE,
        "emergency-details": () => window.RESQ_EMERGENCY_DETAILS_PAGE,
        vehicles: () => window.RESQ_VEHICLES_PAGE,
        "vehicle-details": () => window.RESQ_VEHICLE_DETAILS_PAGE,
        "traffic-nodes": () => window.RESQ_TRAFFIC_NODES_PAGE,
        "signal-control": () => window.RESQ_SIGNAL_CONTROL_PAGE,
        "event-logs": () => window.RESQ_EVENT_LOGS_PAGE,
        analytics: () => window.RESQ_ANALYTICS_PAGE,
        settings: () => window.RESQ_SETTINGS_PAGE,
        "citizen-home": () => window.RESQ_CITIZEN_HOME_PAGE,
        "request-emergency": () => window.RESQ_REQUEST_EMERGENCY_PAGE,
        "emergency-status": () => window.RESQ_EMERGENCY_STATUS_PAGE,
        "vehicle-dashboard": () => window.RESQ_VEHICLE_DASHBOARD_PAGE
    };

    const initialized = new Set();
    let activePath = null;

    function updateNavigation(path) {
        document.querySelectorAll("[data-nav-link]").forEach(function (link) {
            const isCurrent = link.getAttribute("data-nav-link") === path;
            link.classList.toggle("is-active", isCurrent);

            if (isCurrent) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        const nav = document.querySelector("[data-app-nav]");

        if (nav) {
            nav.hidden = path === "login";
        }
    }

    async function showPage(path) {
        if (activePath && activePath !== path) {
            const previous = PAGES[activePath]?.();

            if (previous && typeof previous.deactivate === "function") {
                try {
                    previous.deactivate();
                } catch (error) {
                    console.warn("[ResQSync] Page deactivate failed.", error);
                }
            }
        }

        activePath = path;
        updateNavigation(path);

        const page = PAGES[path]?.();

        if (!page) {
            return;
        }

        try {
            if (!initialized.has(path)) {
                initialized.add(path);

                if (typeof page.initialize === "function") {
                    await page.initialize();
                }
            } else if (typeof page.activate === "function") {
                await page.activate();
            }
        } catch (error) {
            console.error(`[ResQSync] Page "${path}" failed to load.`, error);
        }
    }

    async function initializeApplication() {
        console.log("[ResQSync] Starting application...");

        try {
            if (
                window.RESQ_STATE &&
                typeof window.RESQ_STATE.initialize ===
                    "function"
            ) {
                window.RESQ_STATE.initialize({});
            }

            if (
                window.RESQ_AUTH &&
                typeof window.RESQ_AUTH.restoreSession ===
                    "function"
            ) {
                await window.RESQ_AUTH.restoreSession();
            }

            window.addEventListener("resq:route-change", function (event) {
                showPage(event.detail?.route);
            });

            if (
                window.RESQ_ROUTER &&
                typeof window.RESQ_ROUTER.start ===
                    "function"
            ) {
                window.RESQ_ROUTER.start();
            }

            console.log(
                "[ResQSync] Application initialized."
            );
        } catch (error) {
            console.error(
                "[ResQSync] Application initialization failed.",
                error
            );

            showInitializationError(error);
        }
    }

    function showInitializationError(error) {
        const message =
            error?.message ||
            "An unexpected initialization error occurred.";

        const container =
            document.querySelector(
                "[data-app-error]"
            );

        if (container) {
            container.hidden = false;
            container.textContent =
                `ResQSync could not start: ${message}`;
        }
    }

    function startWhenReady() {
        if (
            document.readyState ===
            "loading"
        ) {
            document.addEventListener(
                "DOMContentLoaded",
                initializeApplication,
                {
                    once: true
                }
            );

            return;
        }

        initializeApplication();
    }

    window.RESQ_APP =
        Object.freeze({
            initialize:
                initializeApplication
        });

    startWhenReady();
})();
