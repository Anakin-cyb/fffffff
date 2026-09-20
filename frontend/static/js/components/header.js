const HeaderComponent = (() => {
    return {
        init() {
            this.updateTitle();
            Logger.info('Header', 'Initialized');
        },

        updateTitle() {
            const currentPage = Router.getCurrentPage();

            const titleMap = {
                dashboard: 'Dashboard',
                'live-map': 'Live Map',
                emergencies: 'Emergencies',
                'emergency-details': 'Emergency Details',
                vehicles: 'Vehicles',
                'vehicle-details': 'Vehicle Details',
                'traffic-nodes': 'Traffic Nodes',
                'signal-control': 'Signal Control',
                'event-logs': 'Event Logs',
                analytics: 'Analytics',
                settings: 'Settings',
                'citizen-home': 'Home',
                'request-emergency': 'Request Emergency',
                'emergency-status': 'Emergency Status',
                'vehicle-dashboard': 'Vehicle Dashboard',
                login: 'Login'
            };

            const title = titleMap[currentPage] || 'ResQSync';
            const titleEl = document.getElementById('header-title');

            if (titleEl) {
                titleEl.textContent = title;
            }
        },

        showBadge(count) {
            const badge = document.getElementById('notification-badge');

            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderComponent;
}