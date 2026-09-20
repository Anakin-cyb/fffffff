/**
 * ResQSync - Map Core
 * Leaflet map initialization and lifecycle management.
 */

(function () {
    "use strict";

    const maps = new Map();

    function getConfig() {
        return window.RESQ_CONFIG || {};
    }

    function getDefaultCenter() {
        return (
            getConfig().MAP?.DEFAULT_CENTER || [
                28.6139,
                77.2090
            ]
        );
    }

    function getDefaultZoom() {
        return (
            Number(
                getConfig().MAP?.DEFAULT_ZOOM
            ) || 12
        );
    }

    function ensureLeaflet() {
        if (
            typeof window.L === "undefined"
        ) {
            throw new Error(
                "Leaflet is not loaded."
            );
        }
    }

    function resolveContainer(
        container
    ) {
        if (
            typeof container === "string"
        ) {
            return document.querySelector(
                container
            );
        }

        if (
            container instanceof HTMLElement
        ) {
            return container;
        }

        return null;
    }

    function init(
        container,
        options = {}
    ) {
        ensureLeaflet();

        const element =
            resolveContainer(container);

        if (!element) {
            throw new Error(
                "Map container was not found."
            );
        }

        const existingMap =
            maps.get(element);

        if (existingMap) {
            return existingMap;
        }

        const center =
            Array.isArray(options.center)
                ? options.center
                : getDefaultCenter();

        const zoom =
            Number.isFinite(
                Number(options.zoom)
            )
                ? Number(options.zoom)
                : getDefaultZoom();

        const map = L.map(
            element,
            {
                zoomControl:
                    options.zoomControl !== false,
                attributionControl:
                    options.attributionControl !== false,
                ...options.leaflet
            }
        );

        L.tileLayer(
            options.tileUrl ||
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom:
                    options.maxZoom || 19,
                attribution:
                    options.attribution ||
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);

        map.setView(
            center,
            zoom
        );

        maps.set(
            element,
            map
        );

        element.dataset.mapInitialized =
            "true";

        return map;
    }

    function getMap(container) {
        const element =
            resolveContainer(container);

        if (!element) {
            return null;
        }

        return maps.get(element) || null;
    }

    function hasMap(container) {
        return Boolean(
            getMap(container)
        );
    }

    function invalidateSize(container) {
        const map =
            getMap(container);

        if (!map) {
            return false;
        }

        map.invalidateSize();

        return true;
    }

    function setView(
        container,
        center,
        zoom = null
    ) {
        const map =
            getMap(container);

        if (!map) {
            return false;
        }

        if (
            !Array.isArray(center) ||
            center.length < 2
        ) {
            return false;
        }

        if (
            Number.isFinite(Number(zoom))
        ) {
            map.setView(
                center,
                Number(zoom)
            );
        } else {
            map.setView(center);
        }

        return true;
    }

    function fitBounds(
        container,
        bounds,
        options = {}
    ) {
        const map =
            getMap(container);

        if (!map) {
            return false;
        }

        if (!bounds) {
            return false;
        }

        try {
            map.fitBounds(
                bounds,
                options
            );

            return true;
        } catch (error) {
            console.warn(
                "[ResQSync] Invalid map bounds.",
                error
            );

            return false;
        }
    }

    function addLayer(
        container,
        layer
    ) {
        const map =
            getMap(container);

        if (!map || !layer) {
            return false;
        }

        layer.addTo(map);

        return true;
    }

    function removeLayer(
        container,
        layer
    ) {
        const map =
            getMap(container);

        if (!map || !layer) {
            return false;
        }

        try {
            map.removeLayer(layer);
            return true;
        } catch (error) {
            return false;
        }
    }

    function clearLayers(container) {
        const map =
            getMap(container);

        if (!map) {
            return false;
        }

        map.eachLayer(
            (layer) => {
                if (
                    layer instanceof
                    L.TileLayer
                ) {
                    return;
                }

                map.removeLayer(layer);
            }
        );

        return true;
    }

    function destroy(container) {
        const element =
            resolveContainer(container);

        if (!element) {
            return false;
        }

        const map =
            maps.get(element);

        if (!map) {
            return false;
        }

        try {
            map.remove();
        } catch (error) {
            console.warn(
                "[ResQSync] Map cleanup warning.",
                error
            );
        }

        maps.delete(element);

        delete element.dataset
            .mapInitialized;

        return true;
    }

    function destroyAll() {
        maps.forEach(
            (map, element) => {
                try {
                    map.remove();
                } catch (error) {
                    console.warn(
                        "[ResQSync] Map cleanup warning.",
                        error
                    );
                }

                delete element.dataset
                    .mapInitialized;
            }
        );

        maps.clear();
    }

    function getAllMaps() {
        return Array.from(
            maps.values()
        );
    }

    window.RESQ_MAP = Object.freeze({
        init,
        getMap,
        hasMap,
        invalidateSize,
        setView,
        fitBounds,
        addLayer,
        removeLayer,
        clearLayers,
        destroy,
        destroyAll,
        getAllMaps
    });
})();