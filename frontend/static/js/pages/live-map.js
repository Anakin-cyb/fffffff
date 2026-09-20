window.LiveMapPage = (() => {
    let map = null;

    const getContainer = () => {
        return document.getElementById('page-live-map');
    };

    const render = () => {
        const container = getContainer();

        if (!container) {
            return;
        }

        container.innerHTML = `
            

            <div class="live-map-layout">
                <section class="card live-map-card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">
                                Live Vehicle Map
                            </div>
                            <div class="card-subtitle">
                                Vehicle locations are provided by the backend.
                            </div>
                        </div>
                    </div>

                    <div
                        id="live-map"
                        class="live-map-container"
                    ></div>
                </section>

                <aside class="card live-map-status">
                    <div class="card-header">
                        <div class="card-title">
                            Live Status
                        </div>
                    </div>

                    <div class="status-grid">
                        <div class="status-grid-item">
                            <div class="status-grid-label">
                                GPS
                            </div>
                            <div class="status-grid-value">
                                Backend data required
                            </div>
                        </div>

                        <div class="status-grid-item">
                            <div class="status-grid-label">
                                Vehicles
                            </div>
                            <div class="status-grid-value">
                                Backend data required
                            </div>
                        </div>

                        <div class="status-grid-item">
                            <div class="status-grid-label">
                                Emergencies
                            </div>
                            <div class="status-grid-value">
                                Backend data required
                            </div>
                        </div>

                        <div class="status-grid-item">
                            <div class="status-grid-label">
                                Corridor
                            </div>
                            <div class="status-grid-value">
                                No active corridor data
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        `;
    };

    const initializeMap = () => {
        const mapContainer = document.getElementById('live-map');

        if (!mapContainer) {
            Logger.warn(
                'LiveMapPage',
                'Map container not found'
            );
            return;
        }

        if (
            typeof MapManager === 'undefined' ||
            typeof MapManager.initialize !== 'function'
        ) {
            Logger.error(
                'LiveMapPage',
                'MapManager is not available'
            );
            return;
        }

        map = MapManager.initialize('live-map');

        if (!map) {
            Logger.warn(
                'LiveMapPage',
                'Map initialization failed'
            );
            return;
        }

        if (
            typeof MapManager.invalidateSize === 'function'
        ) {
            setTimeout(() => {
                MapManager.invalidateSize();
            }, 100);
        }
    };

    const loadData = async () => {
        if (!map) {
            return;
        }

        try {
            Logger.info(
                'VehicleService',
                'Getting vehicles'
            );

            const vehicles =
                await VehicleService.getVehicles();

            if (
                vehicles &&
                vehicles.success
            ) {
                const data =
                    Array.isArray(vehicles.data)
                        ? vehicles.data
                        : vehicles.data?.vehicles || [];

                if (
                    typeof MapMarkers !== 'undefined' &&
                    typeof MapMarkers.addVehicle === 'function'
                ) {
                    data.forEach(vehicle => {
                        MapMarkers.addVehicle(vehicle);
                    });
                }
            }
        } catch (error) {
            Logger.error(
                'LiveMapPage',
                'Vehicle loading failed',
                {
                    error: error.message
                }
            );
        }

        try {
            Logger.info(
                'EmergencyService',
                'Getting emergencies'
            );

            const emergencies =
                await EmergencyService.getEmergencies();

            if (
                emergencies &&
                emergencies.success
            ) {
                const data =
                    Array.isArray(emergencies.data)
                        ? emergencies.data
                        : emergencies.data?.emergencies || [];

                if (
                    typeof MapMarkers !== 'undefined' &&
                    typeof MapMarkers.addEmergency === 'function'
                ) {
                    data.forEach(emergency => {
                        MapMarkers.addEmergency(
                            emergency
                        );
                    });
                }
            }
        } catch (error) {
            Logger.error(
                'LiveMapPage',
                'Emergency loading failed',
                {
                    error: error.message
                }
            );
        }
    };

    const refresh = async () => {
        if (
            typeof MapMarkers !== 'undefined' &&
            typeof MapMarkers.clearAll === 'function'
        ) {
            MapMarkers.clearAll();
        }

        await loadData();
    };

    const init = () => {
        Logger.info(
            'LiveMapPage',
            'Initialized'
        );

        render();

        initializeMap();

        loadData();
    };

    const destroy = () => {
        if (
            typeof MapMarkers !== 'undefined' &&
            typeof MapMarkers.clearAll === 'function'
        ) {
            MapMarkers.clearAll();
        }

        if (
            typeof MapManager !== 'undefined' &&
            typeof MapManager.destroy === 'function'
        ) {
            MapManager.destroy();
        }

        map = null;
    };

    return {
        init,
        refresh,
        destroy
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LiveMapPage;
}