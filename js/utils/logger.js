/**
 * ResQSync - Logger Utilities
 */

(function () {
    "use strict";

    const APP_PREFIX = "[ResQSync]";

    function timestamp() {
        return new Date().toISOString();
    }

    function buildPrefix(level) {
        return `${APP_PREFIX} [${level}] [${timestamp()}]`;
    }

    function info(message, data = null) {
        if (data === null) {
            console.info(buildPrefix("INFO"), message);
            return;
        }

        console.info(
            buildPrefix("INFO"),
            message,
            data
        );
    }

    function warn(message, data = null) {
        if (data === null) {
            console.warn(buildPrefix("WARN"), message);
            return;
        }

        console.warn(
            buildPrefix("WARN"),
            message,
            data
        );
    }

    function error(message, error = null) {
        if (error === null) {
            console.error(buildPrefix("ERROR"), message);
            return;
        }

        console.error(
            buildPrefix("ERROR"),
            message,
            error
        );
    }

    function debug(message, data = null) {
        if (data === null) {
            console.debug(buildPrefix("DEBUG"), message);
            return;
        }

        console.debug(
            buildPrefix("DEBUG"),
            message,
            data
        );
    }

    function event(eventName, data = null) {
        if (data === null) {
            console.info(
                buildPrefix("EVENT"),
                eventName
            );
            return;
        }

        console.info(
            buildPrefix("EVENT"),
            eventName,
            data
        );
    }

    function group(label, callback) {
        if (
            typeof console.group !== "function" ||
            typeof callback !== "function"
        ) {
            return;
        }

        console.group(
            buildPrefix("GROUP"),
            label
        );

        try {
            callback();
        } finally {
            console.groupEnd();
        }
    }

    function time(label) {
        if (typeof console.time === "function") {
            console.time(
                `${APP_PREFIX} ${label}`
            );
        }
    }

    function timeEnd(label) {
        if (typeof console.timeEnd === "function") {
            console.timeEnd(
                `${APP_PREFIX} ${label}`
            );
        }
    }

    window.RESQ_LOGGER = Object.freeze({
        info,
        warn,
        error,
        debug,
        event,
        group,
        time,
        timeEnd
    });
})();