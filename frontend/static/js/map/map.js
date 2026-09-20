const DashboardMap = (() => {
    let map = null;
    let markers = {};
    let routes = {};
    
    const initMap = () => {
        const mapContainer = document.getElementById('dashboard-map');
        
        if (!mapContainer || map) return;
        
        Logger.info('Map', 'Initializing');
        
        map = L.map('dashboard-map').setView(
            CONFIG.map.defaultCenter,
            CONFIG.map.defaultZoom
        );
        
        L.tileLayer(CONFIG.map.tileLayer, {
            attribution: CONFIG.map.attribution,
            maxZoom: CONFIG.map.maxZoom,
            minZoom: CONFIG.map.minZoom,
        }).addTo(map);
        
        addMapControls();
        
        renderMarkers();
    };
    
    const addMapControls = () => {
        const controlDiv = L.control({ position: 'topright' });
        
        controlDiv.onAdd = function() {
            const container = L.DomUtil.create('div', 'map-controls');
            
            const zoomInBtn = L.DomUtil.create('button', 'map-control-button', container);
            zoomInBtn.innerHTML = '<i class="fas fa-plus"></i>';
            zoomInBtn.title = 'Zoom In';
            zoomInBtn.onclick = () => map.zoomIn();
            
            const zoomOutBtn = L.DomUtil.create('button', 'map-control-button', container);
            zoomOutBtn.innerHTML = '<i class="fas fa-minus"></i>';
            zoomOutBtn.title = 'Zoom Out';
            zoomOutBtn.onclick = () => map.zoomOut();
            
            const recenterBtn = L.DomUtil.create('button', 'map-control-button', container);
            recenterBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
            recenterBtn.title = 'Center Map';
            recenterBtn.onclick = () => map.setView(CONFIG.map.defaultCenter, CONFIG.map.defaultZoom);
            
            return container;
        };
        
        controlDiv.addTo(map);
    };
    
    const renderMarkers = () => {
        const emergencies = AppState.get('emergencies') || [];
        const vehicles = AppState.get('vehicles') || [];
        const trafficNodes = AppState.get('trafficNodes') || [];
        
        vehicles.forEach(vehicle => {
            if (!vehicle.latitude || !vehicle.longitude) return;
            
            const markerId = `vehicle-${vehicle.id}`;
            
            if (markers[markerId]) {
                map.removeLayer(markers[markerId]);
            }
            
            const marker = L.marker(
                [vehicle.latitude, vehicle.longitude],
                {
                    icon: L.icon({
                        iconUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%223b82f6%22%3E%3Cpath d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z%22/%3E%3C/svg%3E',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                    })
                }
            ).bindPopup(`
                <div class="map-popup">
                    <div class="map-popup-title">${vehicle.id}</div>
                    <div class="map-popup-info">
                        <span class="map-popup-label">Type:</span>
                        <span class="map-popup-value">${vehicle.type}</span>
                    </div>
                    <div class="map-popup-info">
                        <span class="map-popup-label">Speed:</span>
                        <span class="map-popup-value">${FormatUtils.formatSpeed(vehicle.speed)}</span>
                    </div>
                    <div class="map-popup-info">
                        <span class="map-popup-label">Status:</span>
                        <span class="map-popup-value">${vehicle.status}</span>
                    </div>
                </div>
            `);
            
            marker.addTo(map);
            markers[markerId] = marker;
        });
        
        trafficNodes.forEach(node => {
            if (!node.latitude || !node.longitude) return;
            
            const markerId = `junction-${node.id}`;
            
            if (markers[markerId]) {
                map.removeLayer(markers[markerId]);
            }
            
            const color = node.status === 'ONLINE' ? '#10b981' : '#6b7280';
            
            const marker = L.marker(
                [node.latitude, node.longitude],
                {
                    icon: L.icon({
                        iconUrl: `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22${color.replace('#', '%23')}%22%3E%3Cpath d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z%22/%3E%3C/svg%3E`,
                        iconSize: [28, 28],
                        iconAnchor: [14, 14],
                    })
                }
            ).bindPopup(`
                <div class="map-popup">
                    <div class="map-popup-title">${node.id}</div>
                    <div class="map-popup-info">
                        <span class="map-popup-label">Status:</span>
                        <span class="map-popup-value">${node.status}</span>
                    </div>
                </div>
            `);
            
            marker.addTo(map);
            markers[markerId] = marker;
        });
    };
    
    return {
        init() {
            if (!map) {
                initMap();
            }
            renderMarkers();
            
            AppState.subscribe('vehicles', () => {
                if (map) renderMarkers();
            });
        },
        
        getMap() {
            return map;
        },
        
        setCenter(lat, lng, zoom = 17) {
            if (map) {
                map.setView([lat, lng], zoom);
            }
        },
        
        addMarker(id, lat, lng, options = {}) {
            if (!map) return;
            
            const marker = L.marker([lat, lng], options).addTo(map);
            markers[id] = marker;
            return marker;
        },
        
        removeMarker(id) {
            if (markers[id]) {
                map.removeLayer(markers[id]);
                delete markers[id];
            }
        },
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardMap;
}
window.MapManager = (() => {
    let map = null;
    let containerId = null;

    const initialize = (id) => {
        containerId = id;

        const container = document.getElementById(id);

        if (!container) {
            Logger.warn('MapManager', `Container not found: ${id}`);
            return null;
        }

        if (map) {
            map.remove();
            map = null;
        }

        Logger.info('MapManager', `Initializing ${id}`);

        map = L.map(id).setView(
            CONFIG.map.defaultCenter,
            CONFIG.map.defaultZoom
        );

        L.tileLayer(CONFIG.map.tileLayer, {
            attribution: CONFIG.map.attribution,
            maxZoom: CONFIG.map.maxZoom,
            minZoom: CONFIG.map.minZoom
        }).addTo(map);

        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 100);

        return map;
    };

    const invalidateSize = () => {
        if (map) {
            map.invalidateSize();
        }
    };

    const getMap = () => {
        return map;
    };

    const destroy = () => {
        if (map) {
            map.remove();
            map = null;
        }

        containerId = null;
    };

    return {
        initialize,
        invalidateSize,
        getMap,
        destroy
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports.MapManager = MapManager;
}