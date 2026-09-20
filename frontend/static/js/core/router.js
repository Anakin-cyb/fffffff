/**
 * Router Module
 * 
 * Handles client-side routing using hash-based navigation.
 * Supports role-based access control and page initialization.
 * 
 * Usage:
 *   Router.navigateTo('dashboard')
 *   Router.navigateTo('emergency-details', { id: 'EMG-001' })
 */

const Router = (() => {
    let currentPage = null;
    let pageHistory = [];
    const MAX_HISTORY = 50;

    /**
     * Convert kebab-case to camelCase
     * 'emergency-request' → 'emergencyRequest'
     */
    const camelCase = (str) => {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    };

    /**
     * Convert camelCase to kebab-case
     * 'emergencyRequest' → 'emergency-request'
     */
    const kebabCase = (str) => {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    };

    /**
     * Get page class name from page identifier
     * 'emergency-request' → 'EmergencyRequestPage'
     */
    const getPageClassName = (pageName) => {
        const camel = camelCase(pageName);
        return camel.charAt(0).toUpperCase() + camel.slice(1) + 'Page';
    };

    /**
     * Get page element ID from page identifier
     * 'emergency-request' → 'page-emergency-request'
     */
    const getPageElementId = (pageName) => {
        return `page-${pageName}`;
    };

    /**
     * Parse hash to get page name and params
     * '#emergency-details/EMG-001' → { page: 'emergency-details', id: 'EMG-001' }
     */
    const parseHash = () => {
        const hash = window.location.hash.slice(1) || 'login';
        const [pageName, ...paramParts] = hash.split('/');
        
        return {
            page: pageName,
            params: {
                id: paramParts[0] || null,
                ...Object.fromEntries(new URLSearchParams(window.location.search)),
            },
        };
    };

    /**
     * Check if user has permission to access page
     */
    const hasPermission = (pageName, userRole) => {
        // Public pages anyone can access
        const publicPages = ['login'];
        if (publicPages.includes(pageName)) return true;

        // Require authentication
        if (!userRole) return false;

        // Role-based access
        const roleAccess = {
            CONTROL_ROOM: [
                'login', 'dashboard', 'live-map', 'emergencies',
                'emergency-details', 'vehicles', 'vehicle-details',
                'traffic-nodes', 'signal-control', 'event-logs',
                'analytics', 'settings',
            ],
            CITIZEN: [
                'login', 'citizen-home', 'request-emergency',
                'emergency-status', 'public-map', 'settings',
            ],
            EMERGENCY_VEHICLE: [
                'login', 'vehicle-dashboard', 'settings',
            ],
        };

        return roleAccess[userRole]?.includes(pageName) ?? false;
    };

    /**
     * Render a page
     */
    const renderPage = (pageName, params = {}) => {
        // Normalize page name to kebab-case
        const normalizedPageName = kebabCase(pageName);

        Logger.info('Router', 'Rendering page', { 
            page: normalizedPageName, 
            params: params 
        });

        try {
            // Check authentication
            const user = AuthManager.getCurrentUser();
            const userRole = user?.role;

            // Check permissions
            if (!hasPermission(normalizedPageName, userRole)) {
                Logger.warn('Router', 'Access denied', { 
                    page: normalizedPageName, 
                    role: userRole 
                });

                // Redirect based on role
                if (!user) {
                    Router.navigateTo('login');
                } else if (userRole === CONFIG.roles.CONTROL_ROOM) {
                    Router.navigateTo('dashboard');
                } else if (userRole === CONFIG.roles.CITIZEN) {
                    Router.navigateTo('citizen-home');
                } else if (userRole === CONFIG.roles.EMERGENCY_VEHICLE) {
                    Router.navigateTo('vehicle-dashboard');
                }
                return;
            }

            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });

            // Show target page
            const pageElement = document.getElementById(getPageElementId(normalizedPageName));
            if (!pageElement) {
                throw new Error(`Page element not found: ${getPageElementId(normalizedPageName)}`);
            }

            pageElement.classList.add('active');
            currentPage = normalizedPageName;

            // Add to history
            pageHistory.push({
                page: normalizedPageName,
                timestamp: Date.now(),
            });

            if (pageHistory.length > MAX_HISTORY) {
                pageHistory.shift();
            }

            // Initialize page if class exists
            const pageClassName = getPageClassName(normalizedPageName);
            const pageClass = window[pageClassName];

            if (pageClass && typeof pageClass.init === 'function') {
                Logger.debug('Router', 'Initializing page class', { class: pageClassName });
                
                // Call destroy on previous page if it exists
                if (currentPage && currentPage !== normalizedPageName) {
                    const prevPageClass = window[getPageClassName(currentPage)];
                    if (prevPageClass && typeof prevPageClass.destroy === 'function') {
                        prevPageClass.destroy();
                    }
                }

                // Initialize new page
                pageClass.init(params);
            } else {
                Logger.debug('Router', 'Page class not found or has no init method', { 
                    class: pageClassName 
                });
            }

            // Update sidebar active state
            if (typeof SidebarComponent !== 'undefined' && SidebarComponent.setActive) {
                SidebarComponent.setActive(normalizedPageName);
            }

            // Update header
            if (typeof HeaderComponent !== 'undefined' && HeaderComponent.updateTitle) {
                HeaderComponent.updateTitle();
            }

            // Scroll to top
            window.scrollTo(0, 0);

        } catch (error) {
            Logger.error('Router', 'Error rendering page', { 
                page: normalizedPageName, 
                error: error.message 
            });

            // Show error page
            document.getElementById('app-root').innerHTML = `
                <div class="error-state" style="
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--color-bg-primary);
                ">
                    <div style="text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 20px; color: var(--color-danger);">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h1 style="font-size: var(--font-size-2xl); margin-bottom: 10px;">Page Error</h1>
                        <p style="color: var(--color-text-secondary); margin-bottom: 20px;">
                            ${error.message}
                        </p>
                        <button class="btn btn-primary" onclick="Router.navigateTo('dashboard')">
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            `;
        }
    };

    /**
     * Handle hash changes
     */
    const handleHashChange = () => {
        const { page, params } = parseHash();
        renderPage(page, params);
    };

    return {
        /**
         * Initialize router
         * Called once when app starts
         */
        init() {
            Logger.info('Router', 'Initialized');

            // Handle hash changes
            window.addEventListener('hashchange', handleHashChange);

            // Determine initial page
            const user = AuthManager.getCurrentUser();
            let initialPage = 'login';

            if (user) {
                const role = user.role;

                if (role === CONFIG.roles.CONTROL_ROOM) {
                    initialPage = 'dashboard';
                } else if (role === CONFIG.roles.CITIZEN) {
                    initialPage = 'citizen-home';
                } else if (role === CONFIG.roles.EMERGENCY_VEHICLE) {
                    initialPage = 'vehicle-dashboard';
                }
            }

            // Set initial hash if not present
            if (!window.location.hash || window.location.hash === '#') {
                window.history.replaceState(
                    { page: initialPage },
                    '',
                    `#${initialPage}`
                );
            }

            // Render initial page
            handleHashChange();
        },

        /**
         * Navigate to a page
         * @param {string} pageName - Page name (e.g., 'emergency-details')
         * @param {object} params - Optional parameters (e.g., { id: 'EMG-001' })
         */
        navigateTo(pageName, params = {}) {
            const normalizedPageName = kebabCase(pageName);

            Logger.debug('Router', 'Navigate to', { 
                page: normalizedPageName, 
                params 
            });

            // Build hash
            let hash = `#${normalizedPageName}`;
            if (params.id) {
                hash += `/${params.id}`;
            }

            // Update history and location
            window.history.pushState(
                { 
                    page: normalizedPageName,
                    params: params,
                },
                '',
                hash
            );

            // Render page
            renderPage(normalizedPageName, params);
        },

        /**
         * Navigate back
         */
        back() {
            window.history.back();
        },

        /**
         * Get current page name
         */
        getCurrentPage() {
            return currentPage;
        },

        /**
         * Get page history
         */
        getHistory() {
            return [...pageHistory];
        },

        /**
         * Check if user can access page
         */
        canAccess(pageName, userRole) {
            return hasPermission(pageName, userRole);
        },

        /**
         * Redirect to login
         */
        redirectToLogin() {
            this.navigateTo('login');
        },

        /**
         * Reload current page
         */
        reload() {
            const { page, params } = parseHash();
            renderPage(page, params);
        },

        /**
         * Handle popstate event (back button)
         */
        handlePopState() {
            handleHashChange();
        },
    };
})();

/**
 * Handle browser back/forward buttons
 */
window.addEventListener('popstate', () => {
    Router.handlePopState();
});

/**
 * Handle hash changes
 */
window.addEventListener('hashchange', () => {
    Router.handlePopState();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Router;
}