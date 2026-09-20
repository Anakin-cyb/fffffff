/**
 * ResQSync - Map Routes
 * Handles route, corridor and route-progress layers.
 */

(function () {
    "use strict";

    const routeStore = new Map();

    function ensureLeaflet() {
        if (
            typeof window.L === "undefined"
        ) {
            throw new Error(
                "Leaflet is not loaded."
            );
        }
    }

    function getMap(container) {
        if (
            !window.RESQ_MAP ||
            typeof window.RESQ_MAP.getMap !==
                "function"
        ) {
            throw new Error(
                "ResQSync map module is not available."
            );
        }

        const map =
            window.RESQ_MAP.getMap(container);

        if (!map) {
            throw new Error(
                "Map instance was not found."
            );
        }

        return map;
    }

    function routeKey(
        type,
        id
    ) {
        return `${type}:${String(id)}`;
    }

    function normalizePoint(point) {
        if (
            Array.isArray(point) &&
            point.length >= 2
        ) {
            const first = Number(point[0]);
            const second = Number(point[1]);

            if (
                Number.isFinite(first) &&
                Number.isFinite(second)
            ) {
                return [
                    first,
                    second
                ];
            }
        }

        if (
            point &&
            typeof point === "object"
        ) {
            const latitude = Number(
                point.latitude ??
                point.lat
            );

            const longitude = Number(
                point.longitude ??
                point.lng ??
                point.lon
            );

            if (
                Number.isFinite(latitude) &&
                Number.isFinite(longitude)
            ) {
                return [
                    latitude,
                    longitude
                ];
            }
        }

        return null;
    }

    function normalizeCoordinates(
        coordinates
    ) {
        if (!Array.isArray(coordinates)) {
            return [];
        }

        return coordinates
            .map(normalizePoint)
            .filter(Boolean)
            .filter(
                ([latitude, longitude]) =>
                    latitude >= -90 &&
                    latitude <= 90 &&
                    longitude >= -180 &&
                    longitude <= 180
            );
    }

    function normalizeGeoJSONCoordinates(
        coordinates
    ) {
        if (!Array.isArray(coordinates)) {
            return [];
        }

        return coordinates
            .map((point) => {
                if (
                    !Array.isArray(point) ||
                    point.length < 2
                ) {
                    return null;
                }

                const longitude =
                    Number(point[0]);

                const latitude =
                    Number(point[1]);

                if (
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude)
                ) {
                    return null;
                }

                if (
                    latitude < -90 ||
                    latitude > 90 ||
                    longitude < -180 ||
                    longitude > 180
                ) {
                    return null;
                }

                return [
                    latitude,
                    longitude
                ];
            })
            .filter(Boolean);
    }

    function extractCoordinates(
        routeData
    ) {
        if (!routeData) {
            return [];
        }

        if (
            Array.isArray(routeData)
        ) {
            return normalizeCoordinates(
                routeData
            );
        }

        if (
            routeData.type ===
                "Feature" &&
            routeData.geometry
        ) {
            return extractCoordinates(
                routeData.geometry
            );
        }

        if (
            routeData.type ===
                "LineString" &&
            Array.isArray(
                routeData.coordinates
            )
        ) {
            return normalizeGeoJSONCoordinates(
                routeData.coordinates
            );
        }

        if (
            Array.isArray(
                routeData.coordinates
            )
        ) {
            return normalizeCoordinates(
                routeData.coordinates
            );
        }

        if (
            Array.isArray(
                routeData.path
            )
        ) {
            return normalizeCoordinates(
                routeData.path
            );
        }

        if (
            Array.isArray(
                routeData.points
            )
        ) {
            return normalizeCoordinates(
                routeData.points
            );
        }

        if (
            Array.isArray(
                routeData.geometry
            )
        ) {
            return normalizeCoordinates(
                routeData.geometry
            );
        }

        return [];
    }

    function getStoredRoute(
        type,
        id
    ) {
        return routeStore.get(
            routeKey(type, id)
        ) || null;
    }

    function storeRoute(
        type,
        id,
        layer
    ) {
        routeStore.set(
            routeKey(type, id),
            {
                type,
                id,
                layer
            }
        );
    }

    function buildRouteOptions(
        type,
        options = {}
    ) {
        const defaults = {
            primary: {
                color:
                    "var(--color-primary)",
                weight: 5,
                opacity: 0.9
            },

            emergency: {
                color:
                    "var(--color-danger)",
                weight: 6,
                opacity: 0.95
            },

            corridor: {
                color:
                    "var(--color-success)",
                weight: 8,
                opacity: 0.35
            },

            progress: {
                color:
                    "var(--color-primary)",
                weight: 6,
                opacity: 1
            }
        };

        const fallback = {
            color: "#2563eb",
            weight: 5,
            opacity: 0.9
        };

        const preset =
            defaults[type] || fallback;

        return {
            ...preset,
            ...options
        };
    }

    function addRoute(
        container,
        {
            id,
            coordinates,
            type = "primary",
            options = {},
            fit = false,
            fitOptions = {}
        } = {}
    ) {
        ensureLeaflet();

        const map =
            getMap(container);

        if (!id) {
            throw new Error(
                "Route ID is required."
            );
        }

        const points =
            extractCoordinates(
                coordinates
            );

        if (points.length < 2) {
            throw new Error(
                "At least two valid route coordinates are required."
            );
        }

        const existing =
            getStoredRoute(
                type,
                id
            );

        if (existing) {
            existing.layer.setLatLngs(
                points
            );

            if (fit) {
                map.fitBounds(
                    existing.layer.getBounds(),
                    fitOptions
                );
            }

            return existing.layer;
        }

        const polyline =
            L.polyline(
                points,
                buildRouteOptions(
                    type,
                    options
                )
            );

        polyline.addTo(map);

        storeRoute(
            type,
            id,
            polyline
        );

        if (fit) {
            map.fitBounds(
                polyline.getBounds(),
                fitOptions
            );
        }

        return polyline;
    }

    function updateRoute(
        type,
        id,
        coordinates,
        options = {}
    ) {
        const stored =
            getStoredRoute(
                type,
                id
            );

        if (!stored) {
            return null;
        }

        const points =
            extractCoordinates(
                coordinates
            );

        if (points.length < 2) {
            return null;
        }

        stored.layer.setLatLngs(
            points
        );

        if (
            options &&
            typeof options === "object"
        ) {
            stored.layer.setStyle(
                options
            );
        }

        return stored.layer;
    }

    function addPrimaryRoute(
        container,
        id,
        routeData,
        options = {}
    ) {
        return addRoute(
            container,
            {
                id,
                coordinates: routeData,
                type: "primary",
                options
            }
        );
    }

    function addEmergencyRoute(
        container,
        id,
        routeData,
        options = {}
    ) {
        return addRoute(
            container,
            {
                id,
                coordinates: routeData,
                type: "emergency",
                options
            }
        );
    }

    function addCorridorRoute(
        container,
        id,
        routeData,
        options = {}
    ) {
        return addRoute(
            container,
            {
                id,
                coordinates: routeData,
                type: "corridor",
                options
            }
        );
    }

    function addProgressRoute(
        container,
        id,
        routeData,
        options = {}
    ) {
        return addRoute(
            container,
            {
                id,
                coordinates: routeData,
                type: "progress",
                options
            }
        );
    }

    function removeRoute(
        type,
        id
    ) {
        const key =
            routeKey(type, id);

        const stored =
            routeStore.get(key);

        if (!stored) {
            return false;
        }

        try {
            stored.layer.remove();
        } catch (error) {
            console.warn(
                "[ResQSync] Failed to remove route layer.",
                error
            );
        }

        routeStore.delete(key);

        return true;
    }

    function removeRoutesByType(
        type
    ) {
        const entries =
            Array.from(
                routeStore.entries()
            );

        entries.forEach(
            ([key, stored]) => {
                if (
                    stored.type !== type
                ) {
                    return;
                }

                try {
                    stored.layer.remove();
                } catch (error) {
                    console.warn(
                        "[ResQSync] Route cleanup warning.",
                        error
                    );
                }

                routeStore.delete(key);
            }
        );
    }

    function clearAllRoutes() {
        routeStore.forEach(
            ({ layer }) => {
                try {
                    layer.remove();
                } catch (error) {
                    console.warn(
                        "[ResQSync] Route cleanup warning.",
                        error
                    );
                }
            }
        );

        routeStore.clear();
    }

    function getRoute(
        type,
        id
    ) {
        const stored =
            getStoredRoute(
                type,
                id
            );

        return stored
            ? stored.layer
            : null;
    }

    function getAllRoutes() {
        return Array.from(
            routeStore.values()
        );
    }

    function fitRoute(
        container,
        type,
        id,
        options = {}
    ) {
        const map =
            getMap(container);

        const route =
            getRoute(
                type,
                id
            );

        if (!route) {
            return false;
        }

        map.fitBounds(
            route.getBounds(),
            options
        );

        return true;
    }

    function getRouteBounds(
        type,
        id
    ) {
        const route =
            getRoute(
                type,
                id
            );

        if (!route) {
            return null;
        }

        return route.getBounds();
    }

    window.RESQ_ROUTES =
        Object.freeze({
            addRoute,
            updateRoute,
            addPrimaryRoute,
            addEmergencyRoute,
            addCorridorRoute,
            addProgressRoute,
            removeRoute,
            removeRoutesByType,
            clearAllRoutes,
            getRoute,
            getAllRoutes,
            fitRoute,
            getRouteBounds,
            extractCoordinates
        });
})();