window.EmergenciesPage = (() => {
    let allEmergencies = [];
    let filteredEmergencies = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    
    const loadEmergencies = async () => {
        try {
            AppState.update({ isLoading: true });
            
            const response = await EmergencyService.getEmergencies();
            
            if (response.success) {
                allEmergencies = response.data;
                applyFilters();
            } else {
                Toast.error(response.message);
            }
            
            AppState.update({ isLoading: false });
            
        } catch (error) {
            Logger.error('EmergenciesPage', 'Load error', { error: error.message });
            Toast.error('Failed to load emergencies');
            AppState.update({ isLoading: false });
        }
    };
    
    const applyFilters = () => {
        const statusFilter = document.getElementById('status-filter')?.value;
        const typeFilter = document.getElementById('type-filter')?.value;
        const searchQuery = document.getElementById('search-input')?.value.toLowerCase();
        
        filteredEmergencies = allEmergencies.filter(emergency => {
            const matchStatus = !statusFilter || emergency.status === statusFilter;
            const matchType = !typeFilter || emergency.type === typeFilter;
            const matchSearch = !searchQuery || 
                emergency.id.toLowerCase().includes(searchQuery);
            
            return matchStatus && matchType && matchSearch;
        });
        
        currentPage = 1;
        renderEmergencies();
    };
    
    const renderEmergencies = () => {
        const content = document.getElementById('page-emergencies');
        
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedEmergencies = filteredEmergencies.slice(start, end);
        const totalPages = Math.ceil(filteredEmergencies.length / itemsPerPage);
        
        content.innerHTML = `
            <div class="page active" id="page-emergencies">
                <div class="section">
                    
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 2fr 1fr; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                        <div class="form-group">
                            <label>Status</label>
                            <select id="status-filter" onchange="EmergenciesPage.applyFilters()">
                                <option value="">All Statuses</option>
                                ${Object.values(CONSTANTS.EMERGENCY_STATUSES).map(status => `
                                    <option value="${status}">${FormatUtils.formatStatus(status)}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Type</label>
                            <select id="type-filter" onchange="EmergenciesPage.applyFilters()">
                                <option value="">All Types</option>
                                ${Object.keys(CONSTANTS.EMERGENCY_TYPES).map(type => `
                                    <option value="${type}">${CONSTANTS.EMERGENCY_TYPES[type].name}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Search</label>
                            <input 
                                type="text" 
                                id="search-input" 
                                placeholder="Search by ID..." 
                                onkeyup="EmergenciesPage.applyFilters()"
                            >
                        </div>
                        
                        <button class="btn btn-primary" onclick="Router.navigateTo('request-emergency')" style="align-self: flex-end;">
                            <i class="fas fa-plus"></i>
                            New Emergency
                        </button>
                    </div>
                    
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Location</th>
                                    <th>Vehicle</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${paginatedEmergencies.length === 0 ? `
                                    <tr>
                                        <td colspan="7" class="table-empty">
                                            <div class="table-empty-icon">
                                                <i class="fas fa-inbox"></i>
                                            </div>
                                            <div class="table-empty-text">No emergencies found</div>
                                        </td>
                                    </tr>
                                ` : paginatedEmergencies.map(emergency => `
                                    <tr onclick="Router.navigateTo('emergency-details', {id: '${emergency.id}'})">
                                        <td><strong>${emergency.id}</strong></td>
                                        <td>
                                            <i class="fas ${CONSTANTS.EMERGENCY_TYPES[emergency.type]?.icon || 'fa-exclamation'}"></i>
                                            ${CONSTANTS.EMERGENCY_TYPES[emergency.type]?.name || emergency.type}
                                        </td>
                                        <td>${StatusBadge.emergency(emergency.status)}</td>
                                        <td>${emergency.location || 'N/A'}</td>
                                        <td>${emergency.vehicle_id || '-'}</td>
                                        <td>${FormatUtils.formatTimestamp(emergency.created_at)}</td>
                                        <td>
                                            <div class="table-actions">
                                                <button class="table-action-button" onclick="Router.navigateTo('emergency-details', {id: '${emergency.id}'})">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                ${emergency.status === 'REQUESTED' ? `
                                                    <button class="table-action-button" onclick="EmergenciesPage.assignVehicle('${emergency.id}')">
                                                        <i class="fas fa-user-check"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    ${totalPages > 1 ? `
                        <div class="pagination">
                            <button class="pagination-item ${currentPage === 1 ? 'disabled' : ''}" onclick="EmergenciesPage.goToPage(${Math.max(1, currentPage - 1)})" ${currentPage === 1 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            ${Array.from({length: totalPages}, (_, i) => `
                                <button class="pagination-item ${currentPage === i + 1 ? 'active' : ''}" onclick="EmergenciesPage.goToPage(${i + 1})">
                                    ${i + 1}
                                </button>
                            `).join('')}
                            <button class="pagination-item ${currentPage === totalPages ? 'disabled' : ''}" onclick="EmergenciesPage.goToPage(${Math.min(totalPages, currentPage + 1)})" ${currentPage === totalPages ? 'disabled' : ''}>
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    };
    
    return {
        init() {
            Logger.info('EmergenciesPage', 'Initialized');
            SidebarComponent.setActive('emergencies');
            HeaderComponent.updateTitle();
            renderEmergencies();
            loadEmergencies();
        },
        
        applyFilters() {
            applyFilters();
        },
        
        goToPage(page) {
            currentPage = page;
            renderEmergencies();
        },
        
        async assignVehicle(emergencyId) {
            const vehicles = AppState.get('vehicles') || [];
            const availableVehicles = vehicles.filter(v => !v.current_emergency_id);
            
            if (availableVehicles.length === 0) {
                Toast.warning('No available vehicles');
                return;
            }
            
            let selectedVehicleId = null;
            
            Modal.confirm(
                'Assign Vehicle',
                `
                    <div class="form-group">
                        <label>Select Vehicle</label>
                        <select id="vehicle-select" onchange="this.dataset.selected = this.value">
                            <option value="">-- Select Vehicle --</option>
                            ${availableVehicles.map(v => `
                                <option value="${v.id}">${v.id} - ${v.type}</option>
                            `).join('')}
                        </select>
                    </div>
                `,
                [
                    {
                        text: 'Assign',
                        onClick: async () => {
                            selectedVehicleId = document.getElementById('vehicle-select').value;
                            if (!selectedVehicleId) {
                                Toast.warning('Please select a vehicle');
                                return;
                            }
                            
                            const result = await VehicleService.assignEmergency(selectedVehicleId, emergencyId);
                            if (result.success) {
                                Toast.success('Vehicle assigned successfully');
                                loadEmergencies();
                            } else {
                                Toast.error(result.message);
                            }
                        }
                    },
                    { text: 'Cancel', className: 'btn-ghost', onClick: () => Modal.close() }
                ]
            );
        },
    };
})();
