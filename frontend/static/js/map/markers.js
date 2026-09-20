const MapMarkers = (() => {
    let vehicleMarkers = {};
    let emergencyMarkers = {};
    let trafficMarkers = {};

    const createIcon = (icon, className = '') => {
        return L.divIcon({
            className: `resqsync-map-marker ${className}`,
            html: `<div class="map-marker-icon"><i class="fas ${icon}"></i></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
    };

    const getVehicleIcon = (status) => {
        const icons = {
            AVAILABLE: 'fa-ambulance',
            ASSIGNED: 'fa-ambulance',
            EN_ROUTE: 'fa-truck-medical',
            ON_SCENE: 'fa-ambulance',
            OFFLINE: 'fa-ambulance',
            BUSY: 'fa-ambulance'
        };

        return createIcon(
            icons[status] || 'fa-ambulance',
            `vehicle-marker vehicle-${String(status || 'UNKNOWN').toLowerCase()}`
        );
    };

    const getEmergencyIcon = (type) => {
        const icons = {
            MEDICAL: 'fa-heartbeat',
            FIRE: 'fa-fire',
            ACCIDENT: 'fa-car-burst',
            POLICE: 'fa-shield-halved'
        };

        return createIcon(
            icons[type] || 'fa-triangle-exclamation',
            'emergency-marker'
        );
    };

    const getTrafficIcon = (status) => {
        const icons = {
            ONLINE: 'fa-traffic-light',
            OFFLINE: 'fa-traffic-light',
            WARNING: 'fa-triangle-exclamation'
        };

        return createIcon(
            icons[status] || 'fa-traffic-light',
            `traffic-marker traffic-${String(status || 'UNKNOWN').toLowerCase()}`
        );
    };

    const getCoordinates = (item) => {
        if (!item) return null;

        const latitude =
            item.latitude ??
            item.lat ??
            item.location?.latitude ??
            item.location?.lat;

        const longitude =
            item.longitude ??
            item.lng ??
            item.lon ??
            item.location?.longitude ??
            item.location?.lng;

        if (
            latitude === undefined ||
            longitude === undefined ||
            latitude === null ||
            longitude === null
        ) {
            return null;
        }

        return [Number(latitude), Number(longitude)];
    };

    const createPopup = (title, details = '') => {
        return `
            <div class="map-popup">
                <div class="map-popup-title">${title}</div>
                ${details}
            </div>
        `;
    };

    const addVehicle = (vehicle) => {
        const map = MapManager.getMap();

        if (!map) return null;

        const coordinates = getCoordinates(vehicle);

        if (!coordinates) return null;

        const id = vehicle.id || vehicle.vehicle_id;

        if (!id) return null;

        removeVehicle(id);

        const marker = L.marker(coordinates, {
            icon: getVehicleIcon(vehicle.status)
        });

        marker.bindPopup(
            createPopup(
                vehicle.name || vehicle.vehicle_number || `Vehicle ${id}`,
                `
                    <div>Status: ${vehicle.status || 'UNKNOWN'}</div>
                    ${vehicle.driver ? `<div>Driver: ${vehicle.driver}</div>` : ''}
                `
            )
        );

        marker.addTo(map);
        vehicleMarkers[id] = marker;

        return marker;
    };

    const addEmergency = (emergency) => {
        const map = MapManager.getMap();

        if (!map) return null;

        const coordinates = getCoordinates(emergency);

        if (!coordinates) return null;

        const id = emergency.id || emergency.emergency_id;

        if (!id) return null;

        removeEmergency(id);

        const marker = L.marker(coordinates, {
            icon: getEmergencyIcon(emergency.type)
        });

        marker.bindPopup(
            createPopup(
                emergency.type || 'Emergency',
                `
                    <div>ID: ${id}</div>
                    ${emergency.status ? `<div>Status: ${emergency.status}</div>` : ''}
                    ${emergency.priority ? `<div>Priority: ${emergency.priority}</div>` : ''}
                `
            )
        );

        marker.addTo(map);
        emergencyMarkers[id] = marker;

        return marker;
    };

    const addTrafficNode = (node) => {
        const map = MapManager.getMap();

        if (!map) return null;

        const coordinates = getCoordinates(node);

        if (!coordinates) return null;

        const id = node.id || node.node_id || node.junction_id;

        if (!id) return null;

        removeTrafficNode(id);

        const marker = L.marker(coordinates, {
            icon: getTrafficIcon(node.status)
        });

        marker.bindPopup(
            createPopup(
                node.name || node.junction_name || `Traffic Node ${id}`,
                `
                    <div>Status: ${node.status || 'UNKNOWN'}</div>
                    ${node.signal ? `<div>Signal: ${node.signal}</div>` : ''}
                `
            )
        );

        marker.addTo(map);
        trafficMarkers[id] = marker;

        return marker;
    };

    const updateVehicle = (vehicle) => {
        return addVehicle(vehicle);
    };

    const updateEmergency = (emergency) => {
        return addEmergency(emergency);
    };

    const updateTrafficNode = (node) => {
        return addTrafficNode(node);
    };

    const removeVehicle = (id) => {
        if (vehicleMarkers[id]) {
            MapManager.removeLayer(vehicleMarkers[id]);
            delete vehicleMarkers[id];
        }
    };

    const removeEmergency = (id) => {
        if (emergencyMarkers[id]) {
            MapManager.removeLayer(emergencyMarkers[id]);
            delete emergencyMarkers[id];
        }
    };

    const removeTrafficNode = (id) => {
        if (trafficMarkers[id]) {
            MapManager.removeLayer(trafficMarkers[id]);
            delete trafficMarkers[id];
        }
    };

    const clearVehicles = () => {
        Object.keys(vehicleMarkers).forEach(removeVehicle);
    };

    const clearEmergencies = () => {
        Object.keys(emergencyMarkers).forEach(removeEmergency);
    };

    const clearTrafficNodes = () => {
        Object.keys(trafficMarkers).forEach(removeTrafficNode);
    };

    const clearAll = () => {
        clearVehicles();
        clearEmergencies();
        clearTrafficNodes();
    };

    return {
        createIcon,
        getCoordinates,
        addVehicle,
        addEmergency,
        addTrafficNode,
        updateVehicle,
        updateEmergency,
        updateTrafficNode,
        removeVehicle,
        removeEmergency,
        removeTrafficNode,
        clearVehicles,
        clearEmergencies,
        clearTrafficNodes,
        clearAll,
        getVehicleMarkers() {
            return { ...vehicleMarkers };
        },
        getEmergencyMarkers() {
            return { ...emergencyMarkers };
        },
        getTrafficMarkers() {
            return { ...trafficMarkers };
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapMarkers;
}