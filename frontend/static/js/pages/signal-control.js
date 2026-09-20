window.SignalControlPage = (() => {
    let allNodes = [];
    
    const loadNodes = async () => {
        try {
            AppState.update({ isLoading: true });
            
            const response = await TrafficService.getNodes();
            
            if (response.success) {
                allNodes = response.data;
                renderSignalControl();
            } else {
                Toast.error(response.message);
            }
            
            AppState.update({ isLoading: false });
            
        } catch (error) {
            Logger.error('SignalControlPage', 'Load error', { error: error.message });
            Toast.error('Failed to load traffic nodes');
            AppState.update({ isLoading: false });
        }
    };
    
    const renderSignalControl = () => {
       const content = document.getElementById('page-signal-control');
        
        content.innerHTML = `
            <div class="page active" id="page-signal-control">
                <div class="section">
                    
                    
                    <div class="grid grid-2">
                       ${
    allNodes.length === 0
        ? `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">
                    <i class="fas fa-traffic-light"></i>
                </div>

                <div class="empty-state-title">
                    No traffic nodes available
                </div>

                <div class="empty-state-description">
                    Signal control data will appear when the backend is connected.
                </div>
            </div>
        `
        : allNodes.map(node => `
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">${node.id}</h3>
                                    <div>${StatusBadge.connection(node.status)}</div>
                                </div>
                                <div class="card-body">
                                    <div style="margin-bottom: var(--spacing-md);">
                                        <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Junction</label>
                                        <div style="font-weight: var(--font-weight-semibold);">${node.junction_id}</div>
                                    </div>
                                    
                                    <div style="margin-bottom: var(--spacing-md);">
                                        <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Current Phase</label>
                                        <div style="font-weight: var(--font-weight-semibold);">
                                            ${StatusBadge.signal(node.signal_phase)}
                                        </div>
                                    </div>
                                    
                                    <div style="margin-bottom: var(--spacing-md);">
                                        <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Priority Active</label>
                                        <div style="font-weight: var(--font-weight-semibold);">
                                            ${node.priority_active ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-secondary">No</span>'}
                                        </div>
                                    </div>
                                    
                                    <div style="margin-bottom: 0;">
                                        <label style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">Last Command</label>
                                        <div style="font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm);">
                                            ${node.last_command || 'None'}
                                        </div>
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-sm btn-primary" onclick="SignalControlPage.setPriority('${node.id}')">
                                        <i class="fas fa-traffic-light"></i>
                                        Set Priority
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="SignalControlPage.resetSignal('${node.id}')">
                                        <i class="fas fa-redo"></i>
                                        Reset
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    };
    
    return {
        init() {
            Logger.info('SignalControlPage', 'Initialized');
            SidebarComponent.setActive('signal-control');
            HeaderComponent.updateTitle();
            renderSignalControl();
            loadNodes();
        },
        
        async setPriority(junctionId) {
            if (!PermissionManager.require('canControlSignals', 'You cannot control signals')) {
                return;
            }
            
            Modal.confirm(
                'Set Emergency Priority',
                `<p>Enable emergency priority for junction <strong>${junctionId}</strong>?</p>`,
                [
                    {
                        text: 'Enable',
                        className: 'btn-success',
                        onClick: async () => {
                            const result = await SignalService.setPriority(junctionId, 'EMERGENCY');
                            if (result.success) {
                                Toast.success('Emergency priority enabled');
                                loadNodes();
                            } else {
                                Toast.error(result.message);
                            }
                            Modal.close();
                        }
                    },
                    { text: 'Cancel', className: 'btn-ghost', onClick: () => Modal.close() }
                ]
            );
        },
        
        async resetSignal(junctionId) {
            if (!PermissionManager.require('canControlSignals')) {
                return;
            }
            
            Modal.confirm(
                'Reset Signal',
                `<p>Reset signal at junction <strong>${junctionId}</strong> to normal operation?</p>`,
                [
                    {
                        text: 'Reset',
                        className: 'btn-warning',
                        onClick: async () => {
                            const result = await SignalService.resetSignal(junctionId);
                            if (result.success) {
                                Toast.success('Signal reset');
                                loadNodes();
                            } else {
                                Toast.error(result.message);
                            }
                            Modal.close();
                        }
                    },
                    { text: 'Cancel', className: 'btn-ghost', onClick: () => Modal.close() }
                ]
            );
        },
    };
})();
