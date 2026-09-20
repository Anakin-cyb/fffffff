/**
 * ResQSync - Live Map Layer
 *
 * Turns a /api/live/snapshot into Leaflet markers + routes and keeps them in sync on
 * every poll (add new, move existing, remove stale). Built on RESQ_MARKERS / RESQ_ROUTES.
 *
 * RESQ_MARKERS and RESQ_ROUTES keep ONE global registry, so every map that uses this
 * layer gets its own `prefix` ("dash", "live") to keep its marker ids apart.
 *
 *   const layer = RESQ_LIVE_LAYER.create(mapElement, "live");
 *   layer.sync(snapshot);           // call on every poll
 *   layer.fitAll();                 // zoom to everything
 *   layer.fitEmergency(3);          // zoom to the route of emergency #3
 */
(function () {
    "use strict";

    const COLORS = {
        emergencyRoute: "#dc2626",
        corridor: "#16a34a"
    };

    function validPoint(latitude, longitude) {
        const lat = Number(latitude);
        const lng = Number(longitude);

        return (
            latitude !== null &&
            latitude !== undefined &&
            longitude !== null &&
            longitude !== undefined &&
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            Math.abs(lat) <= 90 &&
            Math.abs(lng) <= 180
        );
    }

    function junctionIcon(node) {
        const online = node.connectionStatus === "ONLINE";
        const signal = String(node.signalState || "none").toLowerCase();

        return window.L.divIcon({
            className: "",
            html: `
                <div class="map-junction-marker ${online ? "active" : "offline"} signal-${signal}">
                    <i class="fa-solid fa-road"></i>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
        });
    }

    function create(mapElement, prefix) {
        const pfx = String(prefix || "map");
        const trackedMarkers = new Map(); // "type:id" -> { type, id, iconKey }
        const trackedRoutes = new Map(); // "type:id" -> { type, id }
        let lastPoints = [];
        let fitted = false;

        function pid(id) {
            return `${pfx}-${id}`;
        }

        function syncMarkers(desired) {
            const seen = new Set();

            desired.forEach(function (item) {
                const id = pid(item.id);
                const key = `${item.type}:${id}`;
                seen.add(key);

                try {
                    if (trackedMarkers.has(key)) {
                        const tracked = trackedMarkers.get(key);
                        const data = {
                            latitude: item.latitude,
                            longitude: item.longitude,
                            title: item.title,
                            metadata: item.metadata
                        };

                        if (item.icon && tracked.iconKey !== item.iconKey) {
                            data.icon = item.icon;
                            tracked.iconKey = item.iconKey;
                        }

                        window.RESQ_MARKERS.updateMarker(item.type, id, data);
                    } else {
                        window.RESQ_MARKERS.addMarker(mapElement, {
                            type: item.type,
                            id,
                            latitude: item.latitude,
                            longitude: item.longitude,
                            title: item.title,
                            metadata: item.metadata,
                            icon: item.icon || null
                        });

                        trackedMarkers.set(key, {
                            type: item.type,
                            id,
                            iconKey: item.iconKey
                        });
                    }
                } catch (error) {
                    if (window.RESQ_LOGGER) {
                        window.RESQ_LOGGER.warn("Marker could not be drawn.", error);
                    }
                }
            });

            Array.from(trackedMarkers.keys()).forEach(function (key) {
                if (!seen.has(key)) {
                    const tracked = trackedMarkers.get(key);
                    window.RESQ_MARKERS.removeMarker(tracked.type, tracked.id);
                    trackedMarkers.delete(key);
                }
            });
        }

        function syncRoutes(desired) {
            const seen = new Set();

            desired.forEach(function (item) {
                const id = pid(item.id);
                const key = `${item.type}:${id}`;
                seen.add(key);

                try {
                    window.RESQ_ROUTES.addRoute(mapElement, {
                        id,
                        type: item.type,
                        coordinates: item.coordinates,
                        options: item.options
                    });
                    trackedRoutes.set(key, { type: item.type, id });
                } catch (error) {
                    if (window.RESQ_LOGGER) {
                        window.RESQ_LOGGER.warn("Route could not be drawn.", error);
                    }
                }
            });

            Array.from(trackedRoutes.keys()).forEach(function (key) {
                if (!seen.has(key)) {
                    const tracked = trackedRoutes.get(key);
                    window.RESQ_ROUTES.removeRoute(tracked.type, tracked.id);
                    trackedRoutes.delete(key);
                }
            });
        }

        function sync(snapshot, options = {}) {
            if (
                !snapshot ||
                !window.RESQ_MARKERS ||
                !window.RESQ_ROUTES ||
                !window.RESQ_MAP?.getMap(mapElement)
            ) {
                return null;
            }

            const markers = [];
            const routes = [];

            (snapshot.hospitals || []).forEach(function (hospital) {
                if (validPoint(hospital.latitude, hospital.longitude)) {
                    markers.push({
                        type: "hospital",
                        id: hospital.hospitalId,
                        latitude: hospital.latitude,
                        longitude: hospital.longitude,
                        title: hospital.name,
                        metadata: {
                            beds_available: hospital.availableBeds,
                            emergency: hospital.emergencyAvailable ? "Available" : "Not available",
                            status: hospital.status
                        }
                    });
                }
            });

            (snapshot.trafficNodes || []).forEach(function (node) {
                if (validPoint(node.latitude, node.longitude)) {
                    const icon = junctionIcon(node);

                    markers.push({
                        type: "junction",
                        id: node.nodeId,
                        latitude: node.latitude,
                        longitude: node.longitude,
                        title: node.name,
                        icon,
                        iconKey: `${node.connectionStatus}|${node.signalState}`,
                        metadata: {
                            connection: node.connectionStatus,
                            signal: node.signalState || "No signal linked",
                            congestion: node.congestionLevel,
                            last_heartbeat: node.lastHeartbeat
                        }
                    });
                }
            });

            (snapshot.vehicles || []).forEach(function (vehicle) {
                if (validPoint(vehicle.latitude, vehicle.longitude)) {
                    markers.push({
                        type: "vehicle",
                        id: vehicle.vehicleId,
                        latitude: vehicle.latitude,
                        longitude: vehicle.longitude,
                        title: vehicle.vehicleNumber,
                        metadata: {
                            status: vehicle.status,
                            gps: vehicle.gpsStatus,
                            speed: vehicle.speed !== null && vehicle.speed !== undefined
                                ? `${vehicle.speed} km/h`
                                : null,
                            driver: vehicle.driverName,
                            last_seen: vehicle.lastSeen
                        }
                    });
                }
            });

            const corridorByEmergency = new Map(
                (snapshot.corridors || []).map(function (corridor) {
                    return [corridor.emergencyId, corridor];
                })
            );

            (snapshot.emergencies || []).forEach(function (emergency) {
                if (!emergency.isActive) {
                    return;
                }

                if (validPoint(emergency.latitude, emergency.longitude)) {
                    markers.push({
                        type: "emergency",
                        id: emergency.emergencyId,
                        latitude: emergency.latitude,
                        longitude: emergency.longitude,
                        title: emergency.title,
                        metadata: {
                            priority: emergency.priority,
                            status: emergency.status,
                            location: emergency.location,
                            vehicle: emergency.vehicleNumber
                        }
                    });
                }

                if (Array.isArray(emergency.route) && emergency.route.length >= 2) {
                    if (corridorByEmergency.has(emergency.emergencyId)) {
                        routes.push({
                            type: "corridor",
                            id: emergency.emergencyId,
                            coordinates: emergency.route,
                            options: {
                                color: COLORS.corridor,
                                weight: 14,
                                opacity: 0.3
                            }
                        });
                    }

                    routes.push({
                        type: "emergency",
                        id: emergency.emergencyId,
                        coordinates: emergency.route,
                        options: {
                            color: COLORS.emergencyRoute,
                            weight: 5,
                            opacity: 0.95,
                            dashArray: "10 8"
                        }
                    });
                }
            });

            syncMarkers(markers);
            syncRoutes(routes);

            lastPoints = markers.map(function (item) {
                return [Number(item.latitude), Number(item.longitude)];
            });

            if (!fitted && options.fitOnce !== false && lastPoints.length) {
                fitAll();
                fitted = true;
            }

            return {
                markers: markers.length,
                routes: routes.length
            };
        }

        function fitAll() {
            if (!lastPoints.length) {
                return false;
            }

            return window.RESQ_MAP.fitBounds(mapElement, lastPoints, {
                padding: [40, 40],
                maxZoom: 15
            });
        }

        function fitEmergency(emergencyId) {
            if (emergencyId === null || emergencyId === undefined) {
                return false;
            }

            try {
                return window.RESQ_ROUTES.fitRoute(
                    mapElement,
                    "emergency",
                    pid(emergencyId),
                    { padding: [40, 40], maxZoom: 15 }
                );
            } catch (error) {
                return false;
            }
        }

        function destroy() {
            trackedMarkers.forEach(function (tracked) {
                window.RESQ_MARKERS.removeMarker(tracked.type, tracked.id);
            });
            trackedRoutes.forEach(function (tracked) {
                window.RESQ_ROUTES.removeRoute(tracked.type, tracked.id);
            });
            trackedMarkers.clear();
            trackedRoutes.clear();
            lastPoints = [];
            fitted = false;
        }

        return Object.freeze({ sync, fitAll, fitEmergency, destroy });
    }

    window.RESQ_LIVE_LAYER = Object.freeze({ create });
})();
