window.EmergencyStatusPage = (() => {
    let emergency = null;
    let refreshInterval = null;
    
    const loadEmergency = async (emergencyId) => {
        try {
            const response = await EmergencyService.getEmergency(emergencyId);
            
            if (response.success) {
                emergency = response.data;
                renderStatus();
            } else {
                Toast.error(response.message);
                Router.navigateTo('citizen-home');
            }
        } catch (error) {
            Logger.error('EmergencyStatusPage', 'Load error', { error: error.message });
        }
    };
    
    const renderStatus = () => {
        if (!emergency) return;
        
        const content = document.getElementById('app-content');
        
        content.innerHTML = `
            <div class="page active" id="page-emergency-status">
                <div style="max-width: 600px; margin: 0 auto; padding: var(--spacing-lg);">
                    <button class="btn btn-ghost" onclick="Router.navigateTo('citizen-home')">
                        <i class="fas fa-arrow-left"></i>
                        Back
                    </button>
                    
                    <div style="text-align: center; margin-bottom: var(--spacing-2xl);">
                        <h1 class="section-title">Emergency Status</h1>
                        <div style="font-size: 32px; margin-bottom: var(--spacing-md);">
                            ${StatusBadge.emergency(emergency.status)}
                        </div>
                    </div>
                    
                    <div class="card" style="margin-bottom: var(--spacing-lg);">
                        <div class="card-header">
                            <h3 class="card-title">Request Information</h3>
                        </div>
                        <div class="card-body">
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Request ID</label>
                                <div style="font-weight: var(--font-weight-semibold); font-size: var(--font-size-lg);">${emergency.id}</div>
                            </div>
                            
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Emergency Type</label>
                                <div style="font-weight: var(--font-weight-semibold);">
                                    ${CONSTANTS.EMERGENCY_TYPES[emergency.type]?.name || emergency.type}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Submitted</label>
                                <div style="font-weight: var(--font-weight-semibold);">
                                    ${FormatUtils.formatDateTime(emergency.created_at)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${emergency.vehicle_id ? `
                        <div class="card" style="margin-bottom: var(--spacing-lg);">
                            <div class="card-header">
                                <h3 class="card-title">Vehicle Assigned</h3>
                            </div>
                            <div class="card-body">
                                <div style="margin-bottom: var(--spacing-lg);">
                                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Vehicle ID</label>
                                    <div style="font-weight: var(--font-weight-semibold); font-size: var(--font-size-lg);">
                                        ${emergency.vehicle_id}
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
                                            <div class="eta-detail-item">
                                                <div class="eta-detail-label">Speed</div>
                                                <div class="eta-detail-value">
                                                    ${emergency.vehicle_speed ? FormatUtils.formatSpeed(emergency.vehicle_speed) : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <div>
                                <strong>Waiting for Vehicle Assignment</strong>
                                <p>A vehicle will be assigned to your emergency request shortly.</p>
                            </div>
                        </div>
                    `}
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Status Timeline</h3>
                        </div>
                        <div class="card-body">
                            <div class="emergency-timeline">
                                <div class="timeline-event completed">
                                    <div class="timeline-event-dot"></div>
                                    <div class="timeline-event-line"></div>
                                    <div class="timeline-event-content">
                                        <div class="timeline-event-title">Request Received</div>
                                        <div class="timeline-event-timestamp">${FormatUtils.formatTimestamp(emergency.created_at)}</div>
                                    </div>
                                </div>
                                
                                ${emergency.vehicle_id ? `
                                    <div class="timeline-event completed">
                                        <div class="timeline-event-dot"></div>
                                        <div class="timeline-event-line"></div>
                                        <div class="timeline-event-content">
                                            <div class="timeline-event-title">Vehicle Assigned</div>
                                            <div class="timeline-event-description">${emergency.vehicle_id}</div>
                                        </div>
                                    </div>
                                ` : `
                                    <div class="timeline-event active">
                                        <div class="timeline-event-dot"></div>
                                        <div class="timeline-event-line"></div>
                                        <div class="timeline-event-content">
                                            <div class="timeline-event-title">Assigning Vehicle</div>
                                            <div class="timeline-event-description">Searching for nearest available vehicle</div>
                                        </div>
                                    </div>
                                `}
                                
                                ${['EN_ROUTE', 'CORRIDOR_ACTIVE', 'ARRIVED', 'COMPLETED'].includes(emergency.status) ? `
                                    <div class="timeline-event ${emergency.status !== 'EN_ROUTE' && emergency.status !== 'CORRIDOR_ACTIVE' ? 'completed' : 'active'}">
                                        <div class="timeline-event-dot"></div>
                                        <div class="timeline-event-line"></div>
                                        <div class="timeline-event-content">
                                            <div class="timeline-event-title">Vehicle En Route</div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${['ARRIVED', 'COMPLETED'].includes(emergency.status) ? `
                                    <div class="timeline-event completed">
                                        <div class="timeline-event-dot"></div>
                                        <div class="timeline-event-content">
                                            <div class="timeline-event-title">Vehicle Arrived</div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: var(--spacing-lg); text-align: center; padding: var(--spacing-lg); color: var(--color-text-tertiary);">
                        <small>This page updates every 10 seconds</small>
                    </div>
                </div>
            </div>
        `;
    };
    
    return {
        init(params = {}) {
            if (params.id) {
                loadEmergency(params.id);
                
                if (refreshInterval) clearInterval(refreshInterval);
                refreshInterval = setInterval(() => {
                    loadEmergency(params.id);
                }, 10000);
            }
        },
        
        destroy() {
            if (refreshInterval) clearInterval(refreshInterval);
        },
    };
})();
