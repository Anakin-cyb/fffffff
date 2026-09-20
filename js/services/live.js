/**
 * ResQSync - Live Data Service
 *
 * One shared poller for GET /api/live/snapshot (emergencies, vehicles, hospitals,
 * traffic nodes/signals, corridors, events, dashboard summary).
 * The dashboard and the live map subscribe to it, so the backend is hit once per
 * interval no matter how many widgets are on screen. Polling only runs while at
 * least one subscriber exists and the browser tab is visible.
 *
 * Usage:
 *   const unsubscribe = RESQ_LIVE_SERVICE.subscribe(({ snapshot, error, online }) => { ... });
 *   await RESQ_LIVE_SERVICE.refresh();     // force an immediate fetch
 */
(function () {
    "use strict";

    const subscribers = new Set();
    let timer = null;
    let inFlight = null;
    let lastSnapshot = null;
    let lastError = null;
    let lastSuccessAt = 0;

    function getInterval() {
        const config = window.RESQ_CONFIG || {};
        return Number(config.POLLING?.INTERVAL_MS) ||
            Number(config.GPS?.UPDATE_INTERVAL_MS) ||
            3000;
    }

    function api() {
        if (!window.RESQ_API) {
            throw new Error("ResQSync API service is not available.");
        }
        return window.RESQ_API;
    }

    function notify() {
        const payload = {
            snapshot: lastSnapshot,
            error: lastError,
            online: !lastError,
            updatedAt: lastSuccessAt
        };

        subscribers.forEach(function (callback) {
            try {
                callback(payload);
            } catch (error) {
                console.error("[ResQSync] Live subscriber failed.", error);
            }
        });
    }

    async function fetchSnapshot() {
        const response = await api().get("/api/live/snapshot");
        return response.data;
    }

    function refresh() {
        // coalesce overlapping calls
        if (inFlight) {
            return inFlight;
        }

        inFlight = fetchSnapshot()
            .then(function (snapshot) {
                lastSnapshot = snapshot;
                lastError = null;
                lastSuccessAt = Date.now();
                notify();
                return snapshot;
            })
            .catch(function (error) {
                lastError = error;
                notify();
                return null;
            })
            .finally(function () {
                inFlight = null;
            });

        return inFlight;
    }

    function schedule() {
        stopTimer();

        if (!subscribers.size || document.hidden) {
            return;
        }

        timer = window.setInterval(refresh, getInterval());
    }

    function stopTimer() {
        if (timer) {
            window.clearInterval(timer);
            timer = null;
        }
    }

    function subscribe(callback) {
        if (typeof callback !== "function") {
            return function () {};
        }

        subscribers.add(callback);

        // give a new subscriber the data we already have, then make sure it is fresh
        if (lastSnapshot || lastError) {
            try {
                callback({
                    snapshot: lastSnapshot,
                    error: lastError,
                    online: !lastError,
                    updatedAt: lastSuccessAt
                });
            } catch (error) {
                console.error("[ResQSync] Live subscriber failed.", error);
            }
        }

        schedule();
        refresh();

        return function unsubscribe() {
            subscribers.delete(callback);

            if (!subscribers.size) {
                stopTimer();
            }
        };
    }

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            stopTimer();
        } else if (subscribers.size) {
            schedule();
            refresh();
        }
    });

    window.RESQ_LIVE_SERVICE = Object.freeze({
        subscribe,
        refresh,
        getLast: function () {
            return lastSnapshot;
        }
    });
})();
