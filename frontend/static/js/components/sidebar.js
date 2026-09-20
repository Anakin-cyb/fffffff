const SidebarComponent = (() => {
    const menuItems = {
        CONTROL_ROOM: [
            { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard', page: 'dashboard' },
            { id: 'live-map', icon: 'fa-map', label: 'Live Map', page: 'live-map' },
            { id: 'emergencies', icon: 'fa-phone-volume', label: 'Emergencies', page: 'emergencies' },
            { id: 'vehicles', icon: 'fa-ambulance', label: 'Vehicles', page: 'vehicles' },
            { id: 'traffic-nodes', icon: 'fa-traffic-light', label: 'Traffic Nodes', page: 'traffic-nodes' },
            { id: 'signal-control', icon: 'fa-sliders-h', label: 'Signal Control', page: 'signal-control' },
            { id: 'event-logs', icon: 'fa-list', label: 'Event Logs', page: 'event-logs' },
            { id: 'analytics', icon: 'fa-chart-bar', label: 'Analytics', page: 'analytics' },
            { id: 'settings', icon: 'fa-cog', label: 'Settings', page: 'settings' }
        ],
        CITIZEN: [
            { id: 'home', icon: 'fa-home', label: 'Home', page: 'citizen-home' },
            { id: 'request', icon: 'fa-phone-volume', label: 'Request Help', page: 'request-emergency' },
            { id: 'status', icon: 'fa-info-circle', label: 'My Status', page: 'emergency-status' },
            { id: 'map', icon: 'fa-map', label: 'Map', page: 'public-map' },
            { id: 'settings', icon: 'fa-cog', label: 'Settings', page: 'settings' }
        ],
        EMERGENCY_VEHICLE: [
            { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard', page: 'vehicle-dashboard' },
            { id: 'emergency', icon: 'fa-phone-volume', label: 'Current Emergency', page: 'vehicle-emergency' },
            { id: 'settings', icon: 'fa-cog', label: 'Settings', page: 'settings' }
        ]
    };

    const renderMenu = () => {
        const role = AuthManager.getCurrentRole();
        const items = menuItems[role] || [];
        const nav = document.getElementById('sidebar-nav');

        if (!nav) return;

        nav.innerHTML = `
            
            <div>
                ${items.map(item => `
                    <button class="sidebar-item" data-page="${item.page}" onclick="Router.navigateTo('${item.page}')">
                        <i class="fas ${item.icon}"></i>
                        <span>${item.label}</span>
                    </button>
                `).join('')}
            </div>
        `;

        if (!document.getElementById('sidebar-styles')) {
            const style = document.createElement('style');
            style.id = 'sidebar-styles';
            style.textContent = `
    /* ================================
       SIDEBAR FINAL DESKTOP FIX
       ================================ */

    #app-sidebar.sidebar {
        display: flex !important;
        flex-direction: column !important;

        width: 260px !important;
        min-width: 260px !important;
        max-width: 260px !important;

        height: 100vh !important;

        margin: 0 !important;
        padding: 0 !important;

        box-sizing: border-box !important;

        position: relative !important;
        left: 0 !important;
        right: auto !important;
        transform: none !important;
    }

    #app-sidebar .sidebar-header {
        display: flex !important;
        align-items: center !important;

        width: 100% !important;
        min-width: 0 !important;

        margin: 0 !important;
        padding: 1rem 1.25rem !important;

        box-sizing: border-box !important;

        flex-shrink: 0 !important;
    }

    #app-sidebar .sidebar-logo {
        display: flex !important;
        align-items: center !important;
        gap: 0.6rem !important;

        width: auto !important;
        min-width: 0 !important;

        margin: 0 !important;
        padding: 0 !important;

        white-space: nowrap !important;

        color: var(--color-primary) !important;
        font-size: var(--font-size-lg) !important;
        font-weight: var(--font-weight-bold) !important;
    }

    #app-sidebar .sidebar-toggle-mobile {
        margin-left: auto !important;
    }

    #app-sidebar .sidebar-nav {
        display: flex !important;
        flex-direction: column !important;

        width: 100% !important;
        min-width: 0 !important;

        margin: 0 !important;
        padding: 0.75rem !important;

        box-sizing: border-box !important;

        flex: 1 1 auto !important;
    }

    #app-sidebar .sidebar-nav > div {
        display: flex !important;
        flex-direction: column !important;

        width: 100% !important;

        margin: 0 !important;
        padding: 0 !important;

        box-sizing: border-box !important;
    }

    #app-sidebar .sidebar-item {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-start !important;

        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;

        margin: 0 !important;
        padding: 0.8rem 1rem !important;

        box-sizing: border-box !important;

        gap: 0.9rem !important;

        background: transparent !important;
        border: none !important;
        border-radius: var(--radius-md) !important;

        color: var(--color-text-secondary) !important;

        font-size: var(--font-size-base) !important;
        line-height: var(--line-height-normal) !important;

        text-align: left !important;

        cursor: pointer !important;
    }

    #app-sidebar .sidebar-item:hover {
        background-color: var(--color-bg-tertiary) !important;
        color: var(--color-text-primary) !important;
    }

    #app-sidebar .sidebar-item.active {
        background-color: var(--color-primary) !important;
        color: #ffffff !important;
        font-weight: var(--font-weight-semibold) !important;
    }

    #app-sidebar .sidebar-item i {
        width: 22px !important;
        min-width: 22px !important;

        text-align: center !important;
    }

    #app-sidebar .sidebar-footer {
        width: 100% !important;
        margin: 0 !important;
        padding: 1rem !important;
        box-sizing: border-box !important;
    }
`;
            document.head.appendChild(style);
        }
    };

    return {
        init() {
            renderMenu();
            Logger.info('Sidebar', 'Initialized');
        },

        setActive(page) {
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.page === page) {
                    item.classList.add('active');
                }
            });
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarComponent;
}