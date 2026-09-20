window.EmergencyDetailsPage = (() => {
    let emergency = null;
    let timeline = [];
    
    const loadEmergency = async (emergencyId) => {
        try {
            AppState.update({ isLoading: true });
            
            const response = await EmergencyService.getEmergency(emergencyId);
            if (response.success) {
                emergency = response.data;
            } else {
                Toast.error(response.message);
                Router.navigateTo('emergencies');
                return;
            }
            
            const timelineRes = await EmergencyService.getTimeline(emergencyId);
            if (timelineRes.success) {
                timeline = timelineRes.data;
            }
            
            AppState.update({ isLoading: false });
            renderEmergencyDetails();
            
        } catch (error) {
            Logger.error('EmergencyDetailsPage', 'Load error', { error: error.message });
            Toast.error('Failed to load emergency details');
            AppState.update({ isLoading: false });
        }
    };
    
    const renderEmergencyDetails = () => {
        if (!emergency) return;
        
        const content = document.getElementById('app-content');
        
        content.innerHTML = `
            <div class="page active" id="page-emergency-details">
                <div style="margin-bottom: var(--spacing-lg); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <button class="btn btn-ghost" onclick="Router.navigateTo('emergencies')">
                            <i class="fas fa-arrow-left"></i>
                            Back
                        </button>
                        <h1 class="section-title" style="margin-bottom: 0;">${emergency.id}</h1>
                    </div>
                    <div>
                        ${StatusBadge.emergency(emergency.status)}
                    </div>
                </div>
                
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Emergency Information</h3>
                        </div>
                        <div class="card-body">
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Type</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    <i class="fas ${CONSTANTS.EMERGENCY_TYPES[emergency.type]?.icon}"></i>
                                    ${CONSTANTS.EMERGENCY_TYPES[emergency.type]?.name || emergency.type}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Location</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${FormatUtils.formatCoordinate(emergency.latitude, emergency.longitude)}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Address</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${emergency.address || 'N/A'}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: var(--spacing-lg);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Created</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${FormatUtils.formatDateTime(emergency.created_at)}
                                </div>
                            </div>
                            
                            ${emergency.notes ? `
                                <div style="margin-bottom: 0;">
                                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Notes</label>
                                    <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                        ${emergency.notes}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Assignment</h3>
                        </div>
                        <div class="card-body">
                            ${emergency.vehicle_id ? `
                                <div style="margin-bottom: var(--spacing-lg);">
                                    <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Assigned Vehicle</label>
                                    <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                        <a href="#" onclick="Router.navigateTo('vehicle-details', {id: '${emergency.vehicle_id}'})" style="color: var(--color-primary);">
                                            ${emergency.vehicle_id}
                                        </a>
                                    </div>
                                </div>
                                
                                <div class="eta-display">
                                    <div class="eta-time">
                                        ${emergency.eta_seconds ? FormatUtils.formatETA(emergency.eta_seconds) : 'Calculating...'}
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
                            ` : `
                                <div style="padding: var(--spacing-lg); text-align: center; background-color: var(--color-bg-tertiary); border-radius: var(--radius-md);">
                                    <i class="fas fa-info-circle" style="color: var(--color-text-tertiary); font-size: 24px; margin-bottom: var(--spacing-sm);"></i>
                                    <div style="color: var(--color-text-tertiary);">No vehicle assigned yet</div>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
                
                ${emergency.corridor_id ? `
                    <div class="card" style="margin-top: var(--spacing-lg);">
                        <div class="card-header">
                            <h3 class="card-title">Emergency Corridor</h3>
                        </div>
                        <div class="card-body">
                            <div style="margin-bottom: var(--spacing-md);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Corridor ID</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${emergency.corridor_id}
                                </div>
                            </div>
                            <div style="margin-bottom: var(--spacing-md);">
                                <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Status</label>
                                <div style="font-weight: var(--font-weight-semibold); margin-top: var(--spacing-xs);">
                                    ${StatusBadge.command(emergency.corridor_status)}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="card" style="margin-top: var(--spacing-lg);">
                    <div class="card-header">
                        <h3 class="card-title">Timeline</h3>
                    </div>
                    <div class="card-body">
                        ${timeline.length === 0 ? `
                            <div style="text-align: center; color: var(--color-text-tertiary); padding: var(--spacing-lg);">
                                No events yet
                            </div>
                        ` : `
                            <div class="emergency-timeline">
                                ${timeline.map((event, idx) => `
                                    <div class="timeline-event ${event.status ? 'completed' : 'active'}">
                                        <div class="timeline-event-dot"></div>
                                        <div class="timeline-event-line"></div>
                                        <div class="timeline-event-content">
                                            <div class="timeline-event-title">${event.title}</div>
                                            <div class="timeline-event-description">${event.description}</div>
                                            <div class="timeline-event-timestamp">${FormatUtils.formatTimestamp(event.timestamp)}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
                
                <div style="margin-top: var(--spacing-lg); display: flex; gap: var(--spacing-md);">
                    ${emergency.status !== 'COMPLETED' && emergency.status !== 'CANCELLED' ? `
                        <button class="btn btn-primary" onclick="EmergencyDetailsPage.completeEmergency()">
                            <i class="fas fa-check"></i>
                            Mark Complete
                        </button>
                    ` : ''}
                    ${emergency.status !== 'CANCELLED' && emergency.status !== 'COMPLETED' ? `
                        <button class="btn btn-danger" onclick="EmergencyDetailsPage.cancelEmergency()">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    };
    
    return {
        init(params = {}) {
            Logger.info('EmergencyDetailsPage', 'Initialized', { id: params.id });
            SidebarComponent.setActive('emergencies');
            HeaderComponent.updateTitle();
            
            if (params.id) {
                loadEmergency(params.id);
            }
        },
        
        async completeEmergency() {
            if (!emergency) return;
            
            const result = await EmergencyService.updateEmergency(emergency.id, {
                status: 'COMPLETED'
            });
            
            if (result.success) {
                Toast.success('Emergency marked as complete');
                loadEmergency(emergency.id);
            } else {
                Toast.error(result.message);
            }
        },
        
        async cancelEmergency() {
            if (!emergency) return;
            
            Modal.confirm(
                'Cancel Emergency',
                'Are you sure you want to cancel this emergency?',
                [
                    {
                        text: 'Yes, Cancel',
                        className: 'btn-danger',
                        onClick: async () => {
                            const result = await EmergencyService.cancelEmergency(emergency.id);
                            if (result.success) {
                                Toast.success('Emergency cancelled');
                                Router.navigateTo('emergencies');
                            } else {
                                Toast.error(result.message);
                            }
                            Modal.close();
                        }
                    },
                    { text: 'No, Keep It', className: 'btn-ghost', onClick: () => Modal.close() }
                ]
            );
        },
    };
})();
