/**
 * ResQSync - Notifications Component
 */

(function () {
    "use strict";

    let container = null;
    let notifications = [];

    function getLimit() {
        const configuredLimit =
            Number(
                window.RESQ_CONFIG?.UI
                    ?.NOTIFICATION_LIMIT
            );

        return Number.isFinite(configuredLimit) &&
            configuredLimit > 0
            ? configuredLimit
            : 20;
    }

    function ensureContainer() {
        if (
            container &&
            document.body.contains(container)
        ) {
            return container;
        }

        container =
            document.createElement("div");

        container.id =
            "notification-container";

        container.className =
            "notification-container";

        container.setAttribute(
            "aria-live",
            "polite"
        );

        document.body.appendChild(
            container
        );

        return container;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatType(type) {
        if (!type) {
            return "Notification";
        }

        return String(type)
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );
    }

    function getIcon(type) {
        const normalized =
            String(type || "")
                .toLowerCase();

        if (
            normalized.includes("emergency")
        ) {
            return "fa-solid fa-triangle-exclamation";
        }

        if (
            normalized.includes("gps") ||
            normalized.includes("location")
        ) {
            return "fa-solid fa-location-dot";
        }

        if (
            normalized.includes("vehicle")
        ) {
            return "fa-solid fa-truck-medical";
        }

        if (
            normalized.includes("signal") ||
            normalized.includes("corridor")
        ) {
            return "fa-solid fa-road";
        }

        if (
            normalized.includes("node") ||
            normalized.includes("traffic")
        ) {
            return "fa-solid fa-microchip";
        }

        if (
            normalized.includes("error") ||
            normalized.includes("offline")
        ) {
            return "fa-solid fa-circle-xmark";
        }

        return "fa-solid fa-bell";
    }

    function getTone(type) {
        const normalized =
            String(type || "")
                .toLowerCase();

        if (
            normalized.includes("error") ||
            normalized.includes("offline") ||
            normalized.includes("critical")
        ) {
            return "danger";
        }

        if (
            normalized.includes("warning") ||
            normalized.includes("stale")
        ) {
            return "warning";
        }

        if (
            normalized.includes("success") ||
            normalized.includes("completed") ||
            normalized.includes("connected")
        ) {
            return "success";
        }

        return "info";
    }

    function getTimeLabel(timestamp) {
        if (
            window.RESQ_FORMAT &&
            typeof window.RESQ_FORMAT.formatTime ===
                "function"
        ) {
            return window.RESQ_FORMAT.formatTime(
                timestamp
            );
        }

        return timestamp || "—";
    }

    function normalizeNotification(
        notification = {}
    ) {
        return {
            id:
                notification.id ||
                notification.notificationId ||
                `notification-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            type:
                notification.type ||
                notification.event ||
                "info",

            title:
                notification.title ||
                "Notification",

            message:
                notification.message ||
                notification.description ||
                "",

            timestamp:
                notification.timestamp ||
                notification.time ||
                new Date().toISOString(),

            read:
                Boolean(notification.read),

            source:
                notification.source ||
                notification.user ||
                notification.system ||
                null
        };
    }

    function render() {
        const target =
            ensureContainer();

        if (notifications.length === 0) {
            target.innerHTML = `
                <div class="notifications-empty">
                    <i class="fa-solid fa-bell-slash"></i>
                    <span>No notifications</span>
                </div>
            `;

            return;
        }

        target.innerHTML =
            notifications
                .map(
                    notification =>
                        buildNotificationHtml(
                            notification
                        )
                )
                .join("");

        bindEvents();
    }

    function buildNotificationHtml(
        notification
    ) {
        const type =
            notification.type;

        const tone =
            getTone(type);

        return `
            <article
                class="
                    notification-item
                    notification-${tone}
                    ${
                        notification.read
                            ? "is-read"
                            : "is-unread"
                    }
                "
                data-notification-id="${escapeHtml(
                    notification.id
                )}"
            >

                <div class="notification-icon">
                    <i
                        class="${getIcon(type)}"
                        aria-hidden="true"
                    ></i>
                </div>

                <div class="notification-content">

                    <div class="notification-header">

                        <div class="notification-title">
                            ${escapeHtml(
                                notification.title
                            )}
                        </div>

                        ${
                            !notification.read
                                ? `
                                    <span
                                        class="notification-unread-dot"
                                        aria-label="Unread"
                                    ></span>
                                `
                                : ""
                        }

                    </div>

                    ${
                        notification.message
                            ? `
                                <div class="notification-message">
                                    ${escapeHtml(
                                        notification.message
                                    )}
                                </div>
                            `
                            : ""
                    }

                    <div class="notification-meta">

                        <span>
                            ${escapeHtml(
                                formatType(type)
                            )}
                        </span>

                        <span>
                            ${escapeHtml(
                                getTimeLabel(
                                    notification.timestamp
                                )
                            )}
                        </span>

                    </div>
                </div>

                <button
                    type="button"
                    class="notification-dismiss"
                    data-notification-dismiss
                    aria-label="Dismiss notification"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </article>
        `;
    }

    function bindEvents() {
        if (!container) {
            return;
        }

        const dismissButtons =
            container.querySelectorAll(
                "[data-notification-dismiss]"
            );

        dismissButtons.forEach(
            button => {
                button.addEventListener(
                    "click",
                    event => {
                        const item =
                            event.currentTarget
                                .closest(
                                    "[data-notification-id]"
                                );

                        const id =
                            item?.dataset
                                .notificationId;

                        if (id) {
                            remove(id);
                        }
                    }
                );
            }
        );
    }

    function add(notification) {
        const normalized =
            normalizeNotification(
                notification
            );

        notifications.unshift(
            normalized
        );

        const limit =
            getLimit();

        if (
            notifications.length >
            limit
        ) {
            notifications =
                notifications.slice(
                    0,
                    limit
                );
        }

        render();

        return normalized.id;
    }

    function addMany(items = []) {
        if (!Array.isArray(items)) {
            return;
        }

        items.forEach(item => {
            add(item);
        });
    }

    function remove(id) {
        const previousLength =
            notifications.length;

        notifications =
            notifications.filter(
                notification =>
                    notification.id !== id
            );

        if (
            notifications.length !==
            previousLength
        ) {
            render();
            return true;
        }

        return false;
    }

    function markAsRead(id) {
        const notification =
            notifications.find(
                item =>
                    item.id === id
            );

        if (!notification) {
            return false;
        }

        notification.read = true;

        render();

        return true;
    }

    function markAllAsRead() {
        notifications.forEach(
            notification => {
                notification.read = true;
            }
        );

        render();
    }

    function clearAll() {
        notifications = [];
        render();
    }

    function getAll() {
        return [
            ...notifications
        ];
    }

    function getUnreadCount() {
        return notifications.filter(
            notification =>
                !notification.read
        ).length;
    }

    function getUnread() {
        return notifications.filter(
            notification =>
                !notification.read
        );
    }

    function hasUnread() {
        return getUnreadCount() > 0;
    }

    function initialize(initialItems = []) {
        ensureContainer();

        if (
            Array.isArray(initialItems)
        ) {
            notifications =
                initialItems
                    .map(
                        normalizeNotification
                    )
                    .slice(
                        0,
                        getLimit()
                    );
        }

        render();
    }

    window.RESQ_NOTIFICATIONS =
        Object.freeze({
            initialize,
            add,
            addMany,
            remove,
            markAsRead,
            markAllAsRead,
            clearAll,
            getAll,
            getUnread,
            getUnreadCount,
            hasUnread,
            render
        });
})();