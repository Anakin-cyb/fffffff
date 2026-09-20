window.TrafficNodesPage = (() => {
    let allNodes = [];
    
    const loadNodes = async () => {
        try {
            AppState.update({ isLoading: true });
            
            const response = await TrafficService.getNodes();
            
            if (response.success) {
                allNodes = response.data;
                renderNodes();
            } else {
                Toast.error(response.message);
            }
            
            AppState.update({ isLoading: false });
            
        } catch (error) {
            Logger.error('TrafficNodesPage', 'Load error', { error: error.message });
            Toast.error('Failed to load traffic nodes');
            AppState.update({ isLoading: false });
        }
    };
    
    const renderNodes = () => {
       const content = document.getElementById('page-traffic-nodes');
        
        content.innerHTML = `
            <div class="page active" id="page-traffic-nodes">
                <div class="section">
                    
                    
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Node ID</th>
                                    <th>Junction ID</th>
                                    <th>Status</th>
                                    <th>Signal Phase</th>
                                    <th>Priority Active</th>
                                    <th>Last Heartbeat</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allNodes.length === 0 ? `
                                    <tr>
                                        <td colspan="7" class="table-empty">
                                            <div class="table-empty-icon">
                                                <i class="fas fa-inbox"></i>
                                            </div>
                                            <div class="table-empty-text">No traffic nodes found</div>
                                        </td>
                                    </tr>
                                ` : allNodes.map(node => `
                                    <tr>
                                        <td><strong>${node.id}</strong></td>
                                        <td>${node.junction_id}</td>
                                        <td>${StatusBadge.connection(node.status)}</td>
                                        <td>${StatusBadge.signal(node.signal_phase)}</td>
                                        <td>${node.priority_active ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-secondary">No</span>'}</td>
                                        <td>${FormatUtils.formatTimestamp(node.last_heartbeat)}</td>
                                        <td>
                                            <div class="table-actions">
                                                <button class="table-action-button" onclick="Router.navigateTo('signal-control')">
                                                    <i class="fas fa-sliders-h"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    };
    
    return {
        init() {
            Logger.info('TrafficNodesPage', 'Initialized');
            SidebarComponent.setActive('traffic-nodes');
            HeaderComponent.updateTitle();
            renderNodes();
            loadNodes();
        },
    };
})();
