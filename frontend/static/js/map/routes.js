const MapRoutes = (() => {
    let routes = {};

    const createRoute = (id, coordinates, options = {}) => {
        const map = MapManager.getMap();

        if (!map || !coordinates || coordinates.length < 2) {
            return null;
        }

        removeRoute(id);

        const defaultOptions = {
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
        };

        const route = L.polyline(coordinates, {
            ...defaultOptions,
            ...options
        }).addTo(map);

        routes[id] = route;

        return route;
    };

    const addRoute = (id, coordinates, options = {}) => {
        return createRoute(id, coordinates, options);
    };

    const updateRoute = (id, coordinates, options = {}) => {
        return createRoute(id, coordinates, options);
    };

    const removeRoute = (id) => {
        if (routes[id]) {
            MapManager.removeLayer(routes[id]);
            delete routes[id];
        }
    };

    const clearRoutes = () => {
        Object.keys(routes).forEach(removeRoute);
    };

    const fitRoute = (id, options = {}) => {
        const route = routes[id];

        if (!route) return;

        const bounds = route.getBounds();

        if (bounds.isValid()) {
            MapManager.getMap().fitBounds(bounds, options);
        }
    };

    const getRoute = (id) => {
        return routes[id] || null;
    };

    const drawEmergencyRoute = (emergencyId, coordinates) => {
        return createRoute(
            `emergency-${emergencyId}`,
            coordinates,
            {
                weight: 6,
                opacity: 0.9
            }
        );
    };

    const removeEmergencyRoute = (emergencyId) => {
        removeRoute(`emergency-${emergencyId}`);
    };

    return {
        createRoute,
        addRoute,
        updateRoute,
        removeRoute,
        clearRoutes,
        fitRoute,
        getRoute,
        drawEmergencyRoute,
        removeEmergencyRoute,
        getAllRoutes() {
            return { ...routes };
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapRoutes;
}