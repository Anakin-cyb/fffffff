window.VehiclesPage = (() => {
    let allVehicles = [];
    
    const loadVehicles = async () => {
        try {
            AppState.update({ isLoading: true });
            
            const response = await VehicleService.getVehicles();
            
            if (response.success) {
                allVehicles = response.data;
                renderVehicles();
            } else {
                Toast.error(response.message);
            }
            
            AppState.update({ isLoading: false });
            
        } catch (error) {
            Logger.error('VehiclesPage', 'Load error', { error: error.message });
            Toast.error('Failed to load vehicles');
            AppState.update({ isLoading: false });
        }
    };
    
    const renderVehicles = () => {
        const content = document.getElementById('page-vehicles');
        
        content.innerHTML = `
            <div class="page active" id="page-vehicles">
                <div class="section">
                    
                    
                    <div class="grid grid-2">
    ${
        allVehicles.length === 0
            ? `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">
                        <i class="fas fa-ambulance"></i>
                    </div>

                    <div class="empty-state-title">
                        No vehicles available
                    </div>

                    <div class="empty-state-description">
                        Vehicle data will appear here when the backend is connected.
                    </div>
                </div>
            `
            : allVehicles.map(vehicle => `
                <div class="emergency-card">
                    <div class="emergency-card-header">
                        <div class="emergency-card-id">
                            ${vehicle.id}
                        </div>

                        <div>
                            ${StatusBadge.connection(vehicle.status)}
                        </div>
                    </div>

                    <div class="emergency-card-type">
                        <i class="fas fa-ambulance"></i>
                        ${vehicle.type}
                    </div>

                    <div class="emergency-card-info">

                        <div class="emergency-card-info-item">
                            <div class="emergency-card-info-label">
                                Location
                            </div>

                            <div class="emergency-card-info-value">
                                ${
                                    vehicle.latitude &&
                                    vehicle.longitude
                                        ? FormatUtils.formatCoordinate(
                                            vehicle.latitude,
                                            vehicle.longitude
                                        )
                                        : 'N/A'
                                }
                            </div>
                        </div>

                        <div class="emergency-card-info-item">
                            <div class="emergency-card-info-label">
                                Speed
                            </div>

                            <div class="emergency-card-info-value">
                                ${
                                    vehicle.speed
                                        ? FormatUtils.formatSpeed(
                                            vehicle.speed
                                        )
                                        : 'N/A'
                                }
                            </div>
                        </div>

                        <div class="emergency-card-info-item">
                            <div class="emergency-card-info-label">
                                Current Emergency
                            </div>

                            <div class="emergency-card-info-value">
                                ${vehicle.current_emergency_id || '-'}
                            </div>
                        </div>

                        <div class="emergency-card-info-item">
                            <div class="emergency-card-info-label">
                                Last Update
                            </div>

                            <div class="emergency-card-info-value">
                                ${FormatUtils.formatTimestamp(
                                    vehicle.last_update
                                )}
                            </div>
                        </div>

                    </div>

                    <div class="emergency-card-footer">
                        <button
                            class="btn btn-sm btn-primary"
                            onclick="Router.navigateTo(
                                'vehicle-details',
                                {id: '${vehicle.id}'}
                            )"
                        >
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                    </div>
                </div>
            `).join('')
    }
</div>
                </div>
            </div>
        `;
    };
    
    return {
        init() {
            Logger.info('VehiclesPage', 'Initialized');
            SidebarComponent.setActive('vehicles');
            HeaderComponent.updateTitle();
            renderVehicles();
            loadVehicles();
        },
    };
})();
