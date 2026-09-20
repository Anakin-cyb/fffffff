const NotificationComponent = (() => {
    let notifications = [];

    const addNotification = (notification) => {
        notification.id = Date.now();
        notification.read = false;
        notification.timestamp = new Date().toISOString();

        notifications.unshift(notification);

        if (notifications.length > 50) {
            notifications.pop();
        }

        Logger.debug('Notifications', 'Added', { notification });
        update();
    };

    const update = () => {
        const container = document.getElementById('notification-container');
        const badge = document.getElementById('notification-badge');

        if (!container) return;

        const unreadCount = notifications.filter(n => !n.read).length;

        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }

        container.innerHTML = `
            <div style="padding: var(--spacing-md); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0;">Notifications</h3>
                <button class="btn-ghost" onclick="NotificationComponent.markAllRead()" style="padding: 0; font-size: var(--font-size-sm);">Mark all as read</button>
            </div>
            <div style="max-height: calc(100vh - 200px); overflow-y: auto;">
                ${notifications.length === 0 ? `
                    <div style="padding: var(--spacing-lg); text-align: center; color: var(--color-text-tertiary);">
                        No notifications
                    </div>
                ` : notifications.map(n => `
                    <div style="padding: var(--spacing-md); border-bottom: 1px solid var(--color-border); cursor: pointer; ${n.read ? 'opacity: 0.6;' : 'background-color: var(--color-bg-tertiary);'}" onclick="NotificationComponent.markAsRead(${n.id})">
                        <div style="font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-xs);">${n.title}</div>
                        <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--spacing-xs);">${n.message}</div>
                        <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">${FormatUtils.formatTimestamp(n.timestamp)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    return {
        init() {
            Logger.info('Notifications', 'Initialized');
            update();
        },

        add(notification) {
            addNotification(notification);

            if (notification.type !== 'error' && notification.type !== 'warning') {
                setTimeout(() => Toast.info(notification.message), 500);
            } else {
                Toast[notification.type === 'error' ? 'error' : 'warning'](notification.message);
            }
        },

        markAsRead(id) {
            const notif = notifications.find(n => n.id === id);

            if (notif) {
                notif.read = true;
                update();
            }
        },

        markAllRead() {
            notifications.forEach(n => n.read = true);
            update();
        },

        getAll() {
            return [...notifications];
        },

        getUnreadCount() {
            return notifications.filter(n => !n.read).length;
        },

        clear() {
            notifications = [];
            update();
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationComponent;
}