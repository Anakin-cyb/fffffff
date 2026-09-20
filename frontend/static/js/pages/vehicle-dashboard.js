window.VehicleDashboardPage = (() => {
    let vehicle = null;
    let emergency = null;
    let telemetryUnsubscribe = null;
    
    const loadVehicleData = async () => {
        try {
            const user = AuthManager.getCurrentUser();
            if (!user || !user.vehicle_id) {
                Toast.error('Vehicle not assigned to user');
                return;
            }
            
            const vehicleRes = await VehicleService.getVehicle(user.vehicle_id);
            if (vehicleRes.success) {
                vehicle = vehicleRes.data;
                
                if (vehicle.current_emergency_id) {
                    const emergencyRes = await EmergencyService.getEmergency(vehicle.current_emergency_id);
                    if (emergencyRes.success) {
                        emergency = emergencyRes.data;
                    }
                }
                
                renderDashboard();
                
                telemetryUnsubscribe = TelemetryService.subscribe(user.vehicle_id, (telemetry) => {
                    vehicle = { ...vehicle, ...telemetry };
                    updateTelemetry();
                });
            }
        } catch (error) {
            Logger.error('VehicleDashboardPage', 'Load error', { error: error.message });
        }
    };
    
    const renderDashboard = () => {
        if (!vehicle) return;
        
        const content = document.getElementById('app-content');
        
        content.innerHTML = `
            <div class="page active" id="page-vehicle-dashboard">
                <div style="padding: var(--spacing-lg);">
                    <h1 class="section-title">${vehicle.id}</h1>
                    
                    <div class="grid grid-3" style="margin-bottom: var(--spacing-lg);">
                        <div class="dashboard-stat-card">
                            <div class="stat-card-label">Status</div>
                            <div class="stat-card-value">${StatusBadge.connection(vehicle.status)}</div>
                        </div>
                        
                        <div class="dashboard-stat-card">
                            <div class="stat-card-label">GPS Fix</div>
                            <div class="stat-card-value">${vehicle.gps_fix ? 'Fixed' : 'No Fix'}</div>
                        </div>
                        
                        <div class="dashboard-stat-card">
                            <div class="stat-card-label">Current Speed</div>
                            <div class="stat-card-value">${vehicle.speed ? FormatUtils.formatSpeed(vehicle.speed) : '0 km/h'}</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-2" style="margin-bottom: var(--spacing-lg);">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Current Location</h3>
                            </div>
                            <div class="card-body">
                                <div style="margin-bottom: var(--spacing-md);">
                                    <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin-bottom: var(--spacing-sm);">
                                        ${vehicle.latitude && vehicle.longitude ? FormatUtils.formatCoordinate(vehicle.latitude, vehicle.longitude) : 'N/A'}
                                    </div>
                                    <div style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">
                                        <i class="fas fa-clock"></i>
                                        Updated: ${FormatUtils.formatTimestamp(vehicle.last_update)}
                                    </div>
                                </div>
                                
                                ${vehicle.gps_accuracy ? `
                                    <div style="padding: var(--spacing-sm); background-color: var(--color-bg-tertiary); border-radius: var(--radius-md); font-size: var(--font-size-sm);">
                                        Accuracy: Â±${Math.round(vehicle.gps_accuracy)} meters
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Telemetry</h3>
                            </div>
                            <div class="card-body" id="telemetry-display">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                                    <div>
                                        <div style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Speed</div>
                                        <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-primary);">
                                            ${vehicle.speed ? FormatUtils.formatSpeed(vehicle.speed) : '0'}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Heading</div>
                                        <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold);">
                                            ${vehicle.heading ? `${Math.round(vehicle.heading)}Â°` : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${emergency ? `
                        <div class="card" style="margin-bottom: var(--spacing-lg);">
                            <div class="card-header">
                                <h3 class="card-title">Current Emergency</h3>
                            </div>
                            <div class="card-body">
                                <div style="margin-bottom: var(--spacing-md);">
                                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Emergency ID</label>
                                    <div style="font-weight: var(--font-weight-semibold); font-size: var(--font-size-lg);">
                                        ${emergency.id}
                                    </div>
                                </div>
                                
                                <div style="margin-bottom: var(--spacing-md);">
                                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Type</label>
                                    <div style="font-weight: var(--font-weight-semibold);">
                                        ${CONSTANTS.EMERGENCY_TYPES[emergency.type]?.name || emergency.type}
                                    </div>
                                </div>
                                
                                <div style="margin-bottom: var(--spacing-md);">
                                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Status</label>
                                    <div>
                                        ${StatusBadge.emergency(emergency.status)}
                                    </div>
                                </div>
                                
                                ${emergency.eta_seconds ? `
                                    <div class="eta-display">
                                        <div class="eta-time">
                                            ${FormatUtils.formatETA(emergency.eta_seconds)}
                                        </div>
                                        <div class="eta-details">
                                            <div class="eta-detail-item">
                                                <div class="eta-detail-label">Distance</div>
                                                <div class="eta-detail-value">
                                                    ${emergency.distance_remaining ? FormatUtils.formatDistance(emergency.distance_remaining) : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="alert alert-info" style="margin-bottom: var(--spacing-lg);">
                            <i class="fas fa-info-circle"></i>
                            <div>No active emergency assignment</div>
                        </div>
                    `}
                    
                    <div style="display: flex; gap: var(--spacing-md);">
                        <button class="btn btn-ghost" onclick="Router.navigateTo('settings')">
                            <i class="fas fa-cog"></i>
                            Settings
                        </button>
                        <button class="btn btn-ghost" onclick="ResQSyncApp.logout()">
                            <i class="fas fa-sign-out-alt"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
    };
    
    const updateTelemetry = () => {
        if (!vehicle) return;
        
        const telemetryDiv = document.getElementById('telemetry-display');
        if (telemetryDiv) {
            telemetryDiv.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
                    <div>
                        <div style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Speed</div>
                        <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-primary);">
                            ${vehicle.speed ? FormatUtils.formatSpeed(vehicle.speed) : '0'}
                        </div>
                    </div>
                    
                    <div>
                        <div style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Heading</div>
                        <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold);">
                            ${vehicle.heading ? `${Math.round(vehicle.heading)}Â°` : 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        }
    };
    
    return {
        init() {
            SidebarComponent.setActive('dashboard');
            HeaderComponent.updateTitle();
            loadVehicleData();
        },
        
        destroy() {
            if (telemetryUnsubscribe) {
                telemetryUnsubscribe();
            }
        },
    };
})();
