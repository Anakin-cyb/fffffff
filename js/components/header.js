/**
 * ResQSync - Header Component
 */

(function () {
    "use strict";

    let headerElement = null;

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatRole(role) {
        if (
            window.RESQ_FORMAT &&
            typeof window.RESQ_FORMAT.formatRole ===
                "function"
        ) {
            return window.RESQ_FORMAT.formatRole(role);
        }

        if (!role) {
            return "User";
        }

        return String(role)
            .replace(/_/g, " ")
            .replace(/\b\w/g, character =>
                character.toUpperCase()
            );
    }

    function getUser() {
        if (
            window.RESQ_AUTH &&
            typeof window.RESQ_AUTH.getUser ===
                "function"
        ) {
            return window.RESQ_AUTH.getUser();
        }

        return null;
    }

    function getCurrentRouteTitle() {
        if (
            window.RESQ_ROUTER &&
            typeof window.RESQ_ROUTER.getCurrentRoute ===
                "function"
        ) {
            const route =
                window.RESQ_ROUTER.getCurrentRoute();

            if (
                route &&
                typeof route === "object" &&
                route.title
            ) {
                return route.title;
            }
        }

        const path =
            window.location.hash
                .replace(/^#/, "")
                .replace(/^\//, "");

        if (!path) {
            return "Dashboard";
        }

        return path
            .replace(/-/g, " ")
            .replace(/\b\w/g, character =>
                character.toUpperCase()
            );
    }

    function getInitials(user) {
        if (!user) {
            return "U";
        }

        const name =
            String(user.name || "").trim();

        if (!name) {
            return "U";
        }

        const parts =
            name
                .split(/\s+/)
                .filter(Boolean);

        if (parts.length === 1) {
            return parts[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }

    function ensureContainer() {
        let container =
            document.querySelector(
                "[data-app-header]"
            );

        if (container) {
            return container;
        }

        container =
            document.createElement("header");

        container.className =
            "app-header";

        container.dataset.appHeader =
            "true";

        const shell =
            document.querySelector(
                "#app"
            );

        if (shell) {
            shell.insertBefore(
                container,
                shell.firstChild
            );
        } else {
            document.body.prepend(
                container
            );
        }

        return container;
    }

    function render() {
        headerElement =
            ensureContainer();

        const user =
            getUser();

        const userName =
            user?.name || "Guest";

        const userRole =
            formatRole(user?.role);

        const initials =
            getInitials(user);

        const pageTitle =
            getCurrentRouteTitle();

        headerElement.innerHTML = `
            <div class="header-inner">

                <div class="header-left">

                    <button
                        type="button"
                        class="header-menu-button btn btn-icon btn-outline"
                        data-header-menu
                        aria-label="Open navigation"
                        title="Open navigation"
                    >
                        <i
                            class="fa-solid fa-bars"
                            aria-hidden="true"
                        ></i>
                    </button>

                    <a
                        href="#/dashboard"
                        class="header-brand"
                        aria-label="ResQSync Dashboard"
                    >
                        <span class="header-brand-icon">
                            <i
                                class="fa-solid fa-truck-medical"
                                aria-hidden="true"
                            ></i>
                        </span>

                        <span class="header-brand-text">
                            ResQSync
                        </span>
                    </a>

                    <div class="header-page-title">
                        ${escapeHtml(pageTitle)}
                    </div>

                </div>

                <div class="header-right">

                    <div
                        class="header-system-status system-status"
                        data-header-system-status
                    >
                        <span
                            class="system-status-dot"
                        ></span>

                        <span
                            data-header-system-status-text
                        >
                            System Online
                        </span>
                    </div>

                    <button
                        type="button"
                        class="header-icon-button btn btn-icon btn-outline"
                        data-header-notifications
                        aria-label="Notifications"
                        title="Notifications"
                    >
                        <i
                            class="fa-solid fa-bell"
                            aria-hidden="true"
                        ></i>

                        <span
                            class="header-notification-count"
                            data-header-notification-count
                            hidden
                        >
                            0
                        </span>
                    </button>

                    <div class="header-user dropdown">

                        <button
                            type="button"
                            class="header-user-button"
                            data-header-user
                            aria-expanded="false"
                        >
                            <span class="avatar">
                                ${escapeHtml(initials)}
                            </span>

                            <span class="header-user-info">
                                <span class="header-user-name">
                                    ${escapeHtml(userName)}
                                </span>

                                <span class="header-user-role">
                                    ${escapeHtml(userRole)}
                                </span>
                            </span>

                            <i
                                class="fa-solid fa-chevron-down"
                                aria-hidden="true"
                            ></i>
                        </button>

                        <div
                            class="dropdown-menu header-user-menu"
                            data-header-user-menu
                            hidden
                        >
                            <div
                                class="header-user-menu-info"
                            >
                                <strong>
                                    ${escapeHtml(userName)}
                                </strong>

                                <span>
                                    ${escapeHtml(userRole)}
                                </span>
                            </div>

                            <div class="divider"></div>

                            <a
                                href="#/settings"
                                class="dropdown-item"
                                data-header-settings
                            >
                                <i
                                    class="fa-solid fa-gear"
                                    aria-hidden="true"
                                ></i>

                                Settings
                            </a>

                            <button
                                type="button"
                                class="dropdown-item"
                                data-header-logout
                            >
                                <i
                                    class="fa-solid fa-right-from-bracket"
                                    aria-hidden="true"
                                ></i>

                                Logout
                            </button>
                        </div>

                    </div>

                </div>

            </div>
        `;

        bindEvents();

        return headerElement;
    }

    function bindEvents() {
        if (!headerElement) {
            return;
        }

        const menuButton =
            headerElement.querySelector(
                "[data-header-menu]"
            );

        menuButton?.addEventListener(
            "click",
            () => {
                if (
                    window.RESQ_SIDEBAR &&
                    typeof window.RESQ_SIDEBAR.toggle ===
                        "function"
                ) {
                    window.RESQ_SIDEBAR.toggle();
                }
            }
        );

        const notificationsButton =
            headerElement.querySelector(
                "[data-header-notifications]"
            );

        notificationsButton?.addEventListener(
            "click",
            () => {
                if (
                    window.RESQ_NOTIFICATIONS &&
                    typeof window.RESQ_NOTIFICATIONS.render ===
                        "function"
                ) {
                    window.RESQ_NOTIFICATIONS.render();
                }

                const container =
                    document.querySelector(
                        "[data-notification-panel]"
                    );

                if (container) {
                    container.hidden =
                        !container.hidden;
                }
            }
        );

        const userButton =
            headerElement.querySelector(
                "[data-header-user]"
            );

        const userMenu =
            headerElement.querySelector(
                "[data-header-user-menu]"
            );

        userButton?.addEventListener(
            "click",
            () => {
                if (!userMenu) {
                    return;
                }

                const isHidden =
                    userMenu.hidden;

                userMenu.hidden =
                    !isHidden;

                userButton.setAttribute(
                    "aria-expanded",
                    String(isHidden)
                );
            }
        );

        document.addEventListener(
            "click",
            handleOutsideClick
        );

        const logoutButton =
            headerElement.querySelector(
                "[data-header-logout]"
            );

        logoutButton?.addEventListener(
            "click",
            async () => {
                if (
                    window.RESQ_AUTH &&
                    typeof window.RESQ_AUTH.logout ===
                        "function"
                ) {
                    await window.RESQ_AUTH.logout();
                }
            }
        );
    }

    function handleOutsideClick(event) {
        if (!headerElement) {
            return;
        }

        const userArea =
            headerElement.querySelector(
                ".header-user"
            );

        const userMenu =
            headerElement.querySelector(
                "[data-header-user-menu]"
            );

        const userButton =
            headerElement.querySelector(
                "[data-header-user]"
            );

        if (
            userArea &&
            userMenu &&
            !userArea.contains(event.target)
        ) {
            userMenu.hidden = true;

            userButton?.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }

    function updateSystemStatus(
        status = "online",
        message = "System Online"
    ) {
        if (!headerElement) {
            return;
        }

        const statusContainer =
            headerElement.querySelector(
                "[data-header-system-status]"
            );

        const statusText =
            headerElement.querySelector(
                "[data-header-system-status-text]"
            );

        if (!statusContainer) {
            return;
        }

        statusContainer.classList.remove(
            "warning",
            "offline"
        );

        if (status === "warning") {
            statusContainer.classList.add(
                "warning"
            );
        }

        if (
            status === "offline" ||
            status === "danger"
        ) {
            statusContainer.classList.add(
                "offline"
            );
        }

        if (statusText) {
            statusText.textContent =
                message;
        }
    }

    function updateNotificationCount(
        count
    ) {
        if (!headerElement) {
            return;
        }

        const notificationCount =
            headerElement.querySelector(
                "[data-header-notification-count]"
            );

        if (!notificationCount) {
            return;
        }

        const value =
            Number(count);

        const safeCount =
            Number.isFinite(value) &&
            value > 0
                ? Math.floor(value)
                : 0;

        notificationCount.textContent =
            safeCount > 99
                ? "99+"
                : String(safeCount);

        notificationCount.hidden =
            safeCount === 0;
    }

    function updatePageTitle(title) {
        if (!headerElement) {
            return;
        }

        const titleElement =
            headerElement.querySelector(
                ".header-page-title"
            );

        if (titleElement) {
            titleElement.textContent =
                title || "ResQSync";
        }
    }

    function refreshUser() {
        render();
    }

    function destroy() {
        if (!headerElement) {
            return;
        }

        headerElement.remove();

        headerElement = null;
    }

    function initialize() {
        return render();
    }

    window.RESQ_HEADER =
        Object.freeze({
            initialize,
            render,
            destroy,
            refreshUser,
            updateSystemStatus,
            updateNotificationCount,
            updatePageTitle
        });
})();