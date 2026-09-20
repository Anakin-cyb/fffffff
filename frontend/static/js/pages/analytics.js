window.AnalyticsPage = (() => {
    let analytics = null;
    
    const loadAnalytics = async () => {
        try {
            AppState.update({ isLoading: true });
            
            const response = await AnalyticsService.getAnalytics();
            
            if (response.success) {
                analytics = response.data;
                renderAnalytics();
            }
            
            AppState.update({ isLoading: false });
        } catch (error) {
            Logger.error('AnalyticsPage', 'Load error', { error: error.message });
            AppState.update({ isLoading: false });
        }
    };
    
    const renderAnalytics = () => {
       const content = document.getElementById('page-analytics');
        
        content.innerHTML = `
            <div class="page active" id="page-analytics">
                <div class="section">
                    
                    
                    <div class="grid grid-2">
                        <div class="card">
    <div class="card-header">
        <h3 class="card-title">Response Time Trend</h3>
    </div>
    <div class="card-body">
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="empty-state-title">No analytics data available</div>
            <div class="empty-state-description">
                Analytics will appear when the backend provides real data.
            </div>
        </div>
    </div>
</div>
                        
                        <div class="card">
    <div class="card-header">
        <h3 class="card-title">Emergency Types</h3>
    </div>
    <div class="card-body">
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="fas fa-chart-pie"></i>
            </div>
            <div class="empty-state-title">No emergency data available</div>
            <div class="empty-state-description">
                Emergency type analytics will appear when real data is available.
            </div>
        </div>
    </div>
</div>
                    </div>
                </div>
            </div>
        `;
        
        
    };
    
    const initCharts = () => {
        const ctx1 = document.getElementById('response-time-chart');
        if (ctx1) {
            new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Response Time (minutes)',
                        data: [8.2, 7.5, 9.1, 8.4, 7.2, 8.9, 7.8],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: 'var(--color-text-primary)',
                            }
                        }
                    },
                    scales: {
                        y: {
                            grid: {
                                color: 'var(--color-border)',
                            },
                            ticks: {
                                color: 'var(--color-text-secondary)',
                            }
                        },
                        x: {
                            grid: {
                                color: 'var(--color-border)',
                            },
                            ticks: {
                                color: 'var(--color-text-secondary)',
                            }
                        }
                    }
                }
            });
        }
        
        const ctx2 = document.getElementById('emergency-types-chart');
        if (ctx2) {
            new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Cardiac', 'Trauma', 'Respiratory', 'Stroke', 'Fire', 'Other'],
                    datasets: [{
                        data: [35, 25, 20, 12, 5, 3],
                        backgroundColor: [
                            '#ef4444',
                            '#f59e0b',
                            '#3b82f6',
                            '#8b5cf6',
                            '#dc2626',
                            '#64748b',
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: 'var(--color-text-primary)',
                            }
                        }
                    }
                }
            });
        }
    };
    
    return {
        init() {
            SidebarComponent.setActive('analytics');
            HeaderComponent.updateTitle();
            renderAnalytics();
            loadAnalytics();
        },
    };
})();
