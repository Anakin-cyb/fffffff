window.VehicleDetailsPage = (() => {
    let vehicle = null;
    let telemetryUnsubscribe = null;
    
    const loadVehicle = async (vehicleId) => {
        try {
            AppState.update({ isLoading: true });
            
            const response = await VehicleService.getVehicle(vehicleId);
            
            if (response.success) {
                vehicle = response.data;
                renderVehicleDetails();
                
                telemetryUnsubscribe = TelemetryService.subscribe(vehicleId, (telemetry) => {
                    vehicle = { ...vehicle, ...telemetry };
                    updateVehicleInfo();
                });
            } else {
                Toast.error(response.message);
                Router.navigateTo('vehicles');
            }
            
            AppState.update({ isLoading: false });
            
        } catch (error) {
            Logger.error('VehicleDetailsPage', 'Load error', { error: error.message });
            Toast.error('Failed to load vehicle');
            AppState.update({ isLoading: false });
        }
    };
    
    const renderVehicleDetails = () => {
        if (!vehicle) return;
        
        const content = document.getElementById('app-content');
        
        content.innerHTML = `
            <div class="page active" id="page-vehicle-details">
                <div style="margin-bottom: var(--spacing-lg); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <button class="btn btn-ghost" onclick="Router.navigateTo('vehicles')">
                            <i class="fas fa-arrow-left"></i>
                            Back
                        </button>
                        <h1 class="section-title" style="margin-bottom: 0;">${vehicle.id}</h1>
                    </div>
                    <div>
                        ${StatusBadge.connection(vehicle.status)}
                    </div>
                </div>
                
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Vehicle Information</h3>
                        </div>
                        <div class="card-body" id="vehicle-info">
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Type</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${vehicle.type}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Node ID</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${vehicle.node_id || 'N/A'}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">GPS Status</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${vehicle.gps_fix ? 'Fixed' : 'No Fix'}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 0;">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Last Update</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${FormatUtils.formatTimestamp(vehicle.last_update)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Live Telemetry</h3>
                        </div>
                        <div class="card-body" id="vehicle-telemetry">
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Location</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${vehicle.latitude && vehicle.longitude ? 
                                        FormatUtils.formatCoordinate(vehicle.latitude, vehicle.longitude) : 
                                        'N/A'
                                    }
                                </div>
                            </div>
                            
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Speed</label>
                                <div style="font-weight: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-primary);">
                                    ${vehicle.speed ? FormatUtils.formatSpeed(vehicle.speed) : 'N/A'}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Heading</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${vehicle.heading ? `${Math.round(vehicle.heading)}Â°` : 'N/A'}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 0;">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">GPS Accuracy</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${vehicle.gps_accuracy ? `${Math.round(vehicle.gps_accuracy)} m` : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${vehicle.current_emergency_id ? `
                    <div class="card" style="margin-top: var(--spacing-lg);">
                        <div class="card-header">
                            <h3 class="card-title">Current Emergency</h3>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: var(--font-weight-semibold); margin-bottom: var(--spacing-sm);">
                                        ${vehicle.current_emergency_id}
                                    </div>
                                    <div style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">
                                        Status: ${vehicle.emergency_status}
                                    </div>
                                </div>
                                <button class="btn btn-sm btn-primary" onclick="Router.navigateTo('emergency-details', {id: '${vehicle.current_emergency_id}'})">
                                    <i class="fas fa-arrow-right"></i>
                                    View
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${vehicle.current_emergency_id && vehicle.eta_seconds ? `
                    <div class="card" style="margin-top: var(--spacing-lg);">
                        <div class="card-header">
                            <h3 class="card-title">ETA Information</h3>
                        </div>
                        <div class="card-body">
                            <div class="eta-display">
                                <div class="eta-time">
                                    ${FormatUtils.formatETA(vehicle.eta_seconds)}
                                </div>
                                <div class="eta-details">
                                    <div class="eta-detail-item">
                                        <div class="eta-detail-label">Distance Remaining</div>
                                        <div class="eta-detail-value">
                                            ${vehicle.distance_remaining ? FormatUtils.formatDistance(vehicle.distance_remaining) : 'N/A'}
                                        </div>
                                    </div>
                                    <div class="eta-detail-item">
                                        <div class="eta-detail-label">Current Speed</div>
                                        <div class="eta-detail-value">
                                            ${vehicle.speed ? FormatUtils.formatSpeed(vehicle.speed) : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    };
    
    const updateVehicleInfo = () => {
        if (!vehicle) return;
        
        const infoDiv = document.getElementById('vehicle-info');
        if (infoDiv) {
            infoDiv.innerHTML = `
                <div style="margin-bottom: var(--spacing-lg);">
                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Type</label>
                    <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                        ${vehicle.type}
                    </div>
                </div>
                
                <div style="margin-bottom: var(--spacing-lg);">
                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Node ID</label>
                    <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                        ${vehicle.node_id || 'N/A'}
                    </div>
                </div>
                
                <div style="margin-bottom: var(--spacing-lg);">
                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">GPS Status</label>
                    <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                        ${vehicle.gps_fix ? 'Fixed' : 'No Fix'}
                    </div>
                </div>
                
                <div style="margin-bottom: 0;">
                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Last Update</label>
                    <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                        ${FormatUtils.formatTimestamp(vehicle.last_update)}
                    </div>
                </div>
            `;
        }
        
        const telemetryDiv = document.getElementById('vehicle-telemetry');
        if (telemetryDiv) {
            telemetryDiv.innerHTML = `
                <div style="margin-bottom: var(--spacing-lg);">
                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Location</label>
                    <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                        ${vehicle.latitude && vehicle.longitude ? 
                            FormatUtils.formatCoordinate(vehicle.latitude, vehicle.longitude) : 
                            'N/A'
                        }
                    </div>
                </div>
                
                <div style="margin-bottom: var(--spacing-lg);">
                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Speed</label>
                    <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-primary);">
                        ${vehicle.speed ? FormatUtils.formatSpeed(vehicle.speed) : 'N/A'}
                    </div>
                </div>
                
                <div style="margin-bottom: var(--spacing-lg);">
                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Heading</label>
                    <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                        ${vehicle.heading ? `${Math.round(vehicle.heading)}Â°` : 'N/A'}
                    </div>
                </div>
                
                <div style="margin-bottom: 0;">
                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">GPS Accuracy</label>
                    <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                        ${vehicle.gps_accuracy ? `${Math.round(vehicle.gps_accuracy)} m` : 'N/A'}
                    </div>
                </div>
            `;
        }
    };
    
    return {
        init(params = {}) {
            Logger.info('VehicleDetailsPage', 'Initialized', { id: params.id });
            SidebarComponent.setActive('vehicles');
            HeaderComponent.updateTitle();
            
            if (params.id) {
                loadVehicle(params.id);
            }
        },
        
        destroy() {
            if (telemetryUnsubscribe) {
                telemetryUnsubscribe();
            }
        },
    };
})();
