window.EventLogsPage = (() => {
    let allLogs = [];
    
    const loadLogs = async () => {
        try {
            AppState.update({ isLoading: true });
            
            const response = await LogsService.getEvents();
            
            if (response.success) {
                allLogs = response.data;
                renderLogs();
            }
            
            AppState.update({ isLoading: false });
        } catch (error) {
            Logger.error('EventLogsPage', 'Load error', { error: error.message });
            AppState.update({ isLoading: false });
        }
    };
    
    const renderLogs = () => {
        const content = document.getElementById('page-event-logs');
        
        content.innerHTML = `
            <div class="page active" id="page-event-logs">
                <div class="section">
                   
                    
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Event</th>
                                    <th>Entity</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allLogs.length === 0 ? `
                                    <tr>
    <td colspan="4" class="table-empty">
        <div class="table-empty-icon">
            <i class="fas fa-clipboard-list"></i>
        </div>
        <div class="table-empty-text">
            No events available
        </div>
        <div style="
            margin-top: var(--spacing-xs);
            color: var(--color-text-tertiary);
            font-size: var(--font-size-sm);
        ">
            Event logs will appear when the backend is connected.
        </div>
    </td>
</tr>
                                ` : allLogs.map(log => `
                                    <tr>
                                        <td>${FormatUtils.formatTimestamp(log.timestamp)}</td>
                                        <td><strong>${log.event}</strong></td>
                                        <td>${log.entity || '-'}</td>
                                        <td>${log.description || '-'}</td>
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
            SidebarComponent.setActive('event-logs');
            HeaderComponent.updateTitle();
            renderLogs();
            loadLogs();
        },
    };
})();
