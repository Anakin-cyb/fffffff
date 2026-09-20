const PermissionManager = (() => {
    const rolePermissions = {
        CONTROL_ROOM: {
            canViewDashboard: true,
            canViewMap: true,
            canViewEmergencies: true,
            canCreateEmergency: false,
            canAssignVehicle: true,
            canControlSignals: true,
            canActivateCorridor: true,
            canViewAnalytics: true,
            canViewLogs: true,
            canEditSettings: true,
            canManageUsers: true
        },
        CITIZEN: {
            canViewDashboard: false,
            canViewMap: true,
            canViewEmergencies: false,
            canCreateEmergency: true,
            canAssignVehicle: false,
            canControlSignals: false,
            canActivateCorridor: false,
            canViewAnalytics: false,
            canViewLogs: false,
            canEditSettings: true,
            canManageUsers: false
        },
        EMERGENCY_VEHICLE: {
            canViewDashboard: false,
            canViewMap: true,
            canViewEmergencies: false,
            canCreateEmergency: false,
            canAssignVehicle: false,
            canControlSignals: false,
            canActivateCorridor: false,
            canViewAnalytics: false,
            canViewLogs: false,
            canEditSettings: true,
            canManageUsers: false
        }
    };

    return {
        hasPermission(permission) {
            const role = AuthManager.getCurrentRole();

            if (!role) {
                return false;
            }

            const perms = rolePermissions[role];

            if (!perms) {
                Logger.warn('Permissions', 'Role not found', { role });
                return false;
            }

            return perms[permission] || false;
        },

        hasAnyPermission(permissions) {
            return permissions.some(perm => this.hasPermission(perm));
        },

        hasAllPermissions(permissions) {
            return permissions.every(perm => this.hasPermission(perm));
        },

        require(permission, errorMessage = 'Permission denied') {
            if (!this.hasPermission(permission)) {
                Toast.error(errorMessage);
                Logger.warn('Permissions', 'Permission denied', { permission });
                return false;
            }

            return true;
        },

        hideIfNoPermission(elementId, permission) {
            const element = document.getElementById(elementId);

            if (element && !this.hasPermission(permission)) {
                element.style.display = 'none';
            }
        },

        disableIfNoPermission(buttonId, permission) {
            const button = document.getElementById(buttonId);

            if (button && !this.hasPermission(permission)) {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.title = 'You do not have permission for this action';
            }
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PermissionManager;
}