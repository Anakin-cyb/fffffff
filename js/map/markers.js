/**
 * ResQSync - Map Markers
 * Creates and manages map markers for vehicles,
 * emergencies, hospitals and traffic nodes.
 */

(function () {
    "use strict";

    const markerStore = new Map();

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

    function markerKey(
        type,
        id
    ) {
        return `${type}:${String(id)}`;
    }

    function getIcon(
        type
    ) {
        const icons = {
            vehicle: {
                className:
                    "map-vehicle-marker",
                icon:
                    "fa-solid fa-truck-medical"
            },

            emergency: {
                className:
                    "map-emergency-marker",
                icon:
                    "fa-solid fa-triangle-exclamation"
            },

            hospital: {
                className:
                    "map-hospital-marker",
                icon:
                    "fa-solid fa-hospital"
            },

            junction: {
                className:
                    "map-junction-marker",
                icon:
                    "fa-solid fa-road"
            },

            node: {
                className:
                    "map-junction-marker",
                icon:
                    "fa-solid fa-microchip"
            }
        };

        const definition =
            icons[type] || icons.junction;

        return L.divIcon({
            className: "",
            html: `
                <div class="${definition.className}">
                    <i class="${definition.icon}"></i>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
        });
    }

    function hasValidCoordinates(
        latitude,
        longitude
    ) {
        const lat = Number(latitude);
        const lng = Number(longitude);

        return (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
        );
    }

    function buildPopup(
        title,
        metadata = {}
    ) {
        const rows = Object.entries(
            metadata
        )
            .filter(
                ([, value]) =>
                    value !== null &&
                    value !== undefined &&
                    value !== ""
            )
            .map(
                ([label, value]) => `
                    <div class="map-popup-meta">
                        <strong>
                            ${escapeHtml(
                                formatLabel(label)
                            )}:
                        </strong>
                        ${escapeHtml(
                            String(value)
                        )}
                    </div>
                `
            )
            .join("");

        return `
            <div class="map-popup">
                <div class="map-popup-title">
                    ${escapeHtml(
                        title || "Location"
                    )}
                </div>
                ${rows}
            </div>
        `;
    }

    function formatLabel(
        value
    ) {
        return String(value)
            .replace(/_/g, " ")
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );
    }

    function escapeHtml(
        value
    ) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function storeMarker(
        type,
        id,
        marker
    ) {
        const key =
            markerKey(type, id);

        markerStore.set(
            key,
            {
                type,
                id,
                marker
            }
        );

        return key;
    }

    function getStoredMarker(
        type,
        id
    ) {
        const item =
            markerStore.get(
                markerKey(type, id)
            );

        return item
            ? item.marker
            : null;
    }

    function addMarker(
        container,
        {
            type,
            id,
            latitude,
            longitude,
            title = "",
            metadata = {},
            icon = null,
            options = {}
        }
    ) {
        ensureLeaflet();

        const map =
            getMap(container);

        if (!type || !id) {
            throw new Error(
                "Marker type and ID are required."
            );
        }

        if (
            !hasValidCoordinates(
                latitude,
                longitude
            )
        ) {
            throw new Error(
                "Valid latitude and longitude are required."
            );
        }

        const existing =
            getStoredMarker(
                type,
                id
            );

        if (existing) {
            existing.setLatLng([
                Number(latitude),
                Number(longitude)
            ]);

            if (
                title ||
                Object.keys(metadata).length
            ) {
                existing.bindPopup(
                    buildPopup(
                        title,
                        metadata
                    )
                );
            }

            return existing;
        }

        const marker =
            L.marker(
                [
                    Number(latitude),
                    Number(longitude)
                ],
                {
                    icon:
                        icon ||
                        getIcon(type),
                    ...options
                }
            );

        marker.addTo(map);

        if (
            title ||
            Object.keys(metadata).length
        ) {
            marker.bindPopup(
                buildPopup(
                    title,
                    metadata
                )
            );
        }

        storeMarker(
            type,
            id,
            marker
        );

        return marker;
    }

    function updateMarker(
        type,
        id,
        data = {}
    ) {
        const marker =
            getStoredMarker(
                type,
                id
            );

        if (!marker) {
            return null;
        }

        const latitude =
            Number(data.latitude);

        const longitude =
            Number(data.longitude);

        if (
            hasValidCoordinates(
                latitude,
                longitude
            )
        ) {
            marker.setLatLng([
                latitude,
                longitude
            ]);
        }

        if (
            data.title ||
            data.metadata
        ) {
            marker.bindPopup(
                buildPopup(
                    data.title ||
                        "",
                    data.metadata ||
                        {}
                )
            );
        }

        if (data.icon) {
            marker.setIcon(
                data.icon
            );
        }

        return marker;
    }

    function removeMarker(
        type,
        id
    ) {
        const key =
            markerKey(type, id);

        const item =
            markerStore.get(key);

        if (!item) {
            return false;
        }

        try {
            item.marker.remove();
        } catch (error) {
            console.warn(
                "[ResQSync] Failed to remove map marker.",
                error
            );
        }

        markerStore.delete(key);

        return true;
    }

    function removeMarkersByType(
        type
    ) {
        const entries =
            Array.from(
                markerStore.entries()
            );

        entries.forEach(
            ([key, item]) => {
                if (
                    item.type === type
                ) {
                    try {
                        item.marker.remove();
                    } catch (error) {
                        console.warn(
                            "[ResQSync] Marker cleanup warning.",
                            error
                        );
                    }

                    markerStore.delete(
                        key
                    );
                }
            }
        );
    }

    function clearAllMarkers() {
        markerStore.forEach(
            ({ marker }) => {
                try {
                    marker.remove();
                } catch (error) {
                    console.warn(
                        "[ResQSync] Marker cleanup warning.",
                        error
                    );
                }
            }
        );

        markerStore.clear();
    }

    function addVehicleMarker(
        container,
        vehicle
    ) {
        if (
            !vehicle ||
            !vehicle.vehicleId
        ) {
            throw new Error(
                "Vehicle ID is required."
            );
        }

        return addMarker(
            container,
            {
                type: "vehicle",
                id: vehicle.vehicleId,
                latitude:
                    vehicle.latitude,
                longitude:
                    vehicle.longitude,
                title:
                    vehicle.name ||
                    vehicle.vehicleId,
                metadata: {
                    vehicleId:
                        vehicle.vehicleId,
                    status:
                        vehicle.status,
                    speed:
                        vehicle.speed !==
                        undefined
                            ? `${vehicle.speed} km/h`
                            : null,
                    gpsStatus:
                        vehicle.gpsStatus
                }
            }
        );
    }

    function updateVehicleMarker(
        vehicleId,
        gpsData
    ) {
        return updateMarker(
            "vehicle",
            vehicleId,
            {
                latitude:
                    gpsData?.latitude,
                longitude:
                    gpsData?.longitude,
                title:
                    gpsData?.name ||
                    vehicleId,
                metadata: {
                    speed:
                        gpsData?.speed !==
                        undefined
                            ? `${gpsData.speed} km/h`
                            : null,
                    heading:
                        gpsData?.heading !==
                        undefined
                            ? `${gpsData.heading}°`
                            : null,
                    gpsStatus:
                        gpsData?.gpsStatus
                }
            }
        );
    }

    function addEmergencyMarker(
        container,
        emergency
    ) {
        if (
            !emergency ||
            !emergency.emergencyId
        ) {
            throw new Error(
                "Emergency ID is required."
            );
        }

        return addMarker(
            container,
            {
                type: "emergency",
                id:
                    emergency.emergencyId,
                latitude:
                    emergency.latitude,
                longitude:
                    emergency.longitude,
                title:
                    emergency.title ||
                    emergency.emergencyId,
                metadata: {
                    emergencyId:
                        emergency.emergencyId,
                    priority:
                        emergency.priority,
                    status:
                        emergency.status
                }
            }
        );
    }

    function addHospitalMarker(
        container,
        hospital
    ) {
        if (
            !hospital ||
            !hospital.hospitalId
        ) {
            throw new Error(
                "Hospital ID is required."
            );
        }

        return addMarker(
            container,
            {
                type: "hospital",
                id:
                    hospital.hospitalId,
                latitude:
                    hospital.latitude,
                longitude:
                    hospital.longitude,
                title:
                    hospital.name ||
                    hospital.hospitalId,
                metadata: {
                    hospitalId:
                        hospital.hospitalId,
                    status:
                        hospital.status
                }
            }
        );
    }

    function addJunctionMarker(
        container,
        junction
    ) {
        if (
            !junction ||
            !junction.nodeId
        ) {
            throw new Error(
                "Junction/node ID is required."
            );
        }

        return addMarker(
            container,
            {
                type: "junction",
                id:
                    junction.nodeId,
                latitude:
                    junction.latitude,
                longitude:
                    junction.longitude,
                title:
                    junction.name ||
                    junction.nodeId,
                metadata: {
                    nodeId:
                        junction.nodeId,
                    status:
                        junction.status,
                    signalState:
                        junction.signalState
                }
            }
        );
    }

    function getMarker(
        type,
        id
    ) {
        return getStoredMarker(
            type,
            id
        );
    }

    function getAllMarkers() {
        return Array.from(
            markerStore.values()
        );
    }

    window.RESQ_MARKERS =
        Object.freeze({
            addMarker,
            updateMarker,
            removeMarker,
            removeMarkersByType,
            clearAllMarkers,
            addVehicleMarker,
            updateVehicleMarker,
            addEmergencyMarker,
            addHospitalMarker,
            addJunctionMarker,
            getMarker,
            getAllMarkers,
            hasValidCoordinates
        });
})();