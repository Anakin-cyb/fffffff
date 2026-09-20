

window.DashboardPage = (() => {
    let refreshInterval = null;
    
    const loadData = async () => {
        try {
            AppState.update({ isLoading: true });
            
            
            const emergenciesRes = await EmergencyService.getEmergencies({
                status: ['REQUESTED', 'ASSIGNED', 'EN_ROUTE', 'CORRIDOR_ACTIVE']
            });
            
            if (emergenciesRes.success) {
                AppState.set('emergencies', emergenciesRes.data);
            }
            
            
            const vehiclesRes = await VehicleService.getVehicles();
            if (vehiclesRes.success) {
                AppState.set('vehicles', vehiclesRes.data);
            }
            
            
            const trafficRes = await TrafficService.getNodes();
            if (trafficRes.success) {
                AppState.set('trafficNodes', trafficRes.data);
            }
            
            AppState.update({ isLoading: false });
            renderDashboard();
            
        } catch (error) {
            Logger.error('Dashboard', 'Load error', { error: error.message });
            AppState.update({ isLoading: false, error: error.message });
        }
    };
    
    const renderDashboard = () => {
        const emergencies = AppState.get('emergencies') || [];
        const vehicles = AppState.get('vehicles') || [];
        const trafficNodes = AppState.get('trafficNodes') || [];
        
        const content = document.getElementById('page-dashboard');
        
        content.innerHTML = `
            <div class="page active" id="page-dashboard">
                <!-- Top Statistics -->
                <div class="dashboard-grid">
                    <div class="dashboard-stat-card">
                        <div class="stat-card-label">Active Emergencies</div>
                        <div class="stat-card-value">${emergencies.filter(e => ['ASSIGNED', 'EN_ROUTE', 'CORRIDOR_ACTIVE'].includes(e.status)).length}</div>
                        <div class="stat-card-change neutral">
                            <i class="fas fa-phone-volume"></i>
                            Total: ${emergencies.length}
                        </div>
                    </div>
                    
                    <div class="dashboard-stat-card">
                        <div class="stat-card-label">Active Vehicles</div>
                        <div class="stat-card-value">${vehicles.filter(v => v.status === 'ONLINE').length}</div>
                        <div class="stat-card-change neutral">
                            <i class="fas fa-ambulance"></i>
                            Total: ${vehicles.length}
                        </div>
                    </div>
                    
                    <div class="dashboard-stat-card">
                        <div class="stat-card-label">Traffic Nodes Online</div>
                        <div class="stat-card-value">${trafficNodes.filter(n => n.status === 'ONLINE').length}</div>
                        <div class="stat-card-change neutral">
                            <i class="fas fa-traffic-light"></i>
                            Total: ${trafficNodes.length}
                        </div>
                    </div>
                    
                    <div class="dashboard-stat-card">
                        <div class="stat-card-label">Avg Response Time</div>
                        <div class="stat-card-value">8.2 min</div>
                        <div class="stat-card-change positive">
                            <i class="fas fa-arrow-down"></i>
                            ↓ 12% from last week
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="dashboard-main">
                    <!-- Left: Map -->
                    <div class="dashboard-map" id="dashboard-map"></div>
                    
                    <!-- Right: Active Emergencies List -->
                    <div class="dashboard-list">
                        <div class="dashboard-list-header">
                            <i class="fas fa-phone-volume"></i>
                            Active Emergencies
                        </div>
                        <div class="dashboard-list-content">
                            ${emergencies.length === 0 ? `
                                <div style="padding: var(--spacing-lg); text-align: center; color: var(--color-text-tertiary);">
                                    <i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: var(--spacing-md);"></i>
                                    <div>No active emergencies</div>
                                </div>
                            ` : emergencies.map(emergency => `
                                <div class="dashboard-list-item" onclick="Router.navigateTo('emergency-details', {id: '${emergency.id}'})">
                                    <div>
                                        <div class="dashboard-list-item-title">${emergency.id}</div>
                                        <div class="dashboard-list-item-subtitle">${CONSTANTS.EMERGENCY_TYPES[emergency.type]?.name || emergency.type}</div>
                                    </div>
                                    <div class="dashboard-list-item-badge">
                                        ${StatusBadge.emergency(emergency.status)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Bottom: Status Grid and Recent Events -->
                <div class="dashboard-main">
                    <!-- System Health -->
                    <div class="widget">
                        <div class="widget-header">
                            <h3 class="widget-title">System Health</h3>
                        </div>
                        <div class="widget-body">
                            <div class="status-grid">
                                <div class="status-grid-item">
                                    <div class="status-grid-label">Backend</div>
                                    <div class="status-grid-value">
                                        ${StatusBadge.connection('ONLINE')}
                                    </div>
                                </div>
                                <div class="status-grid-item">
                                    <div class="status-grid-label">Database</div>
                                    <div class="status-grid-value">
                                        ${StatusBadge.connection('ONLINE')}
                                    </div>
                                </div>
                                <div class="status-grid-item">
                                    <div class="status-grid-label">GPS Network</div>
                                    <div class="status-grid-value">
                                        ${StatusBadge.connection('ONLINE')}
                                    </div>
                                </div>
                                <div class="status-grid-item">
                                    <div class="status-grid-label">Traffic Comms</div>
                                    <div class="status-grid-value">
                                        ${StatusBadge.connection('ONLINE')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Events -->
                    <div class="widget">
                        <div class="widget-header">
                            <h3 class="widget-title">Recent Events</h3>
                        </div>
                        <div class="widget-body">
                            <div class="recent-events">
                                <div class="event-item">
                                    <div class="event-icon" style="background-color: rgba(239, 68, 68, 0.1);">
                                        <i class="fas fa-phone-volume" style="color: var(--color-danger);"></i>
                                    </div>
                                    <div class="event-content">
                                        <div class="event-title">Emergency Request Created</div>
                                        <div class="event-description">Cardiac emergency at City Center</div>
                                        <div class="event-timestamp">2 minutes ago</div>
                                    </div>
                                    <div class="event-status success"><i class="fas fa-check"></i></div>
                                </div>
                                
                                <div class="event-item">
                                    <div class="event-icon" style="background-color: rgba(59, 130, 246, 0.1);">
                                        <i class="fas fa-ambulance" style="color: var(--color-primary);"></i>
                                    </div>
                                    <div class="event-content">
                                        <div class="event-title">Vehicle Assigned</div>
                                        <div class="event-description">AMB-001 assigned to emergency</div>
                                        <div class="event-timestamp">1 minute ago</div>
                                    </div>
                                    <div class="event-status success"><i class="fas fa-check"></i></div>
                                </div>
                                
                                <div class="event-item">
                                    <div class="event-icon" style="background-color: rgba(16, 185, 129, 0.1);">
                                        <i class="fas fa-traffic-light" style="color: var(--color-success);"></i>
                                    </div>
                                    <div class="event-content">
                                        <div class="event-title">Corridor Activated</div>
                                        <div class="event-description">Emergency corridor activated for J-01, J-02, J-03</div>
                                        <div class="event-timestamp">Just now</div>
                                    </div>
                                    <div class="event-status success"><i class="fas fa-check"></i></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        
        setTimeout(() => {
            DashboardMap.init();
        }, 100);
    };
    
    return {
        init() {
            Logger.info('DashboardPage', 'Initialized');
            SidebarComponent.setActive('dashboard');
            HeaderComponent.updateTitle();
            
            loadData();
            
            
            if (refreshInterval) clearInterval(refreshInterval);
            refreshInterval = setInterval(loadData, 30000);
        },
        
        destroy() {
            if (refreshInterval) clearInterval(refreshInterval);
        },
    };
})();
