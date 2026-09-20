/**
 * ResQSync - Sidebar Component
 */

(function () {
    "use strict";

    let sidebarElement = null;

    const navigationItems = [
        {
            route: "/dashboard",
            label: "Dashboard",
            icon: "fa-solid fa-gauge-high",
            permission: "dashboard"
        },
        {
            route: "/live-map",
            label: "Live Map",
            icon: "fa-solid fa-map-location-dot",
            permission: "live-map"
        },
        {
            route: "/emergencies",
            label: "Emergencies",
            icon: "fa-solid fa-triangle-exclamation",
            permission: "emergencies"
        },
        {
            route: "/vehicles",
            label: "Vehicles",
            icon: "fa-solid fa-truck-medical",
            permission: "vehicles"
        },
        {
            route: "/traffic-nodes",
            label: "Traffic Nodes",
            icon: "fa-solid fa-microchip",
            permission: "traffic-nodes"
        },
        {
            route: "/signal-control",
            label: "Signal Control",
            icon: "fa-solid fa-traffic-light",
            permission: "signals"
        },
        {
            route: "/event-logs",
            label: "Event Logs",
            icon: "fa-solid fa-list-check",
            permission: "logs"
        },
        {
            route: "/analytics",
            label: "Analytics",
            icon: "fa-solid fa-chart-line",
            permission: "analytics"
        },
        {
            route: "/settings",
            label: "Settings",
            icon: "fa-solid fa-gear",
            permission: "settings"
        }
    ];

    function getUserRole() {
        if (
            window.RESQ_AUTH &&
            typeof window.RESQ_AUTH.getRole ===
                "function"
        ) {
            return window.RESQ_AUTH.getRole();
        }

        return null;
    }

    function hasPermission(
        permission
    ) {
        const role =
            getUserRole();

        if (
            !role ||
            !window.RESQ_PERMISSIONS
        ) {
            return false;
        }

        if (
            typeof window.RESQ_PERMISSIONS.can ===
            "function"
        ) {
            return window.RESQ_PERMISSIONS.can(
                role,
                permission
            );
        }

        if (
            typeof window.RESQ_PERMISSIONS.hasPermission ===
            "function"
        ) {
            return window.RESQ_PERMISSIONS.hasPermission(
                role,
                permission
            );
        }

        return false;
    }

    function getCurrentRoute() {
        if (
            window.RESQ_ROUTER &&
            typeof window.RESQ_ROUTER.getCurrentRoute ===
                "function"
        ) {
            const current =
                window.RESQ_ROUTER.getCurrentRoute();

            if (
                typeof current === "string"
            ) {
                return current;
            }

            if (
                current &&
                typeof current.path === "string"
            ) {
                return current.path;
            }
        }

        return (
            window.location.hash
                .replace(/^#/, "") ||
            "/dashboard"
        );
    }

    function getVisibleItems() {
        return navigationItems.filter(
            item =>
                hasPermission(
                    item.permission
                )
        );
    }

    function ensureContainer() {
        let container =
            document.querySelector(
                "[data-app-sidebar]"
            );

        if (container) {
            return container;
        }

        container =
            document.createElement("aside");

        container.className =
            "app-sidebar";

        container.dataset.appSidebar =
            "true";

        const shell =
            document.querySelector(
                "#app"
            );

        if (shell) {
            const header =
                shell.querySelector(
                    "[data-app-header]"
                );

            if (header) {
                header.insertAdjacentElement(
                    "afterend",
                    container
                );
            } else {
                shell.insertBefore(
                    container,
                    shell.firstChild
                );
            }
        } else {
            document.body.prepend(
                container
            );
        }

        return container;
    }

    function render() {
        sidebarElement =
            ensureContainer();

        const currentRoute =
            getCurrentRoute();

        const items =
            getVisibleItems();

        sidebarElement.innerHTML = `
            <div class="sidebar-inner">

                <div class="sidebar-brand">

                    <span class="sidebar-brand-icon">
                        <i
                            class="fa-solid fa-truck-medical"
                            aria-hidden="true"
                        ></i>
                    </span>

                    <div class="sidebar-brand-text">
                        <strong>ResQSync</strong>
                        <span>
                            Emergency Coordination
                        </span>
                    </div>

                </div>

                <nav
                    class="sidebar-navigation"
                    aria-label="Main navigation"
                >
                    ${items
                        .map(
                            item =>
                                buildNavigationItem(
                                    item,
                                    currentRoute
                                )
                        )
                        .join("")}
                </nav>

                <div class="sidebar-footer">

                    <div class="sidebar-system-card">

                        <span class="status-dot success"></span>

                        <div>
                            <strong>
                                System Ready
                            </strong>

                            <span>
                                ResQSync Control Center
                            </span>
                        </div>

                    </div>

                </div>

            </div>
        `;

        bindEvents();

        return sidebarElement;
    }

    function buildNavigationItem(
        item,
        currentRoute
    ) {
        const isActive =
            currentRoute === item.route ||
            currentRoute.startsWith(
                `${item.route}/`
            );

        return `
            <a
                href="#${item.route}"
                class="sidebar-nav-item ${
                    isActive
                        ? "active"
                        : ""
                }"
                data-sidebar-route="${
                    item.route
                }"
            >
                <span class="sidebar-nav-icon">
                    <i
                        class="${item.icon}"
                        aria-hidden="true"
                    ></i>
                </span>

                <span class="sidebar-nav-label">
                    ${item.label}
                </span>
            </a>
        `;
    }

    function bindEvents() {
        if (!sidebarElement) {
            return;
        }

        const navigationLinks =
            sidebarElement.querySelectorAll(
                "[data-sidebar-route]"
            );

        navigationLinks.forEach(
            link => {
                link.addEventListener(
                    "click",
                    () => {
                        close();
                    }
                );
            }
        );
    }

    function open() {
        if (!sidebarElement) {
            return;
        }

        sidebarElement.classList.add(
            "is-open"
        );

        const shell =
            document.querySelector(
                "#app"
            );

        shell?.classList.add(
            "sidebar-open"
        );
    }

    function close() {
        if (!sidebarElement) {
            return;
        }

        sidebarElement.classList.remove(
            "is-open"
        );

        const shell =
            document.querySelector(
                "#app"
            );

        shell?.classList.remove(
            "sidebar-open"
        );
    }

    function toggle() {
        if (!sidebarElement) {
            return;
        }

        if (
            sidebarElement.classList.contains(
                "is-open"
            )
        ) {
            close();
        } else {
            open();
        }
    }

    function refresh() {
        render();
    }

    function destroy() {
        if (!sidebarElement) {
            return;
        }

        sidebarElement.remove();
        sidebarElement = null;
    }

    function initialize() {
        return render();
    }

    window.RESQ_SIDEBAR =
        Object.freeze({
            initialize,
            render,
            refresh,
            destroy,
            open,
            close,
            toggle
        });
})();