/**
 * ResQSync - Formatting Utilities
 */

(function () {
    "use strict";

    function isValidDate(value) {
        const date = value instanceof Date
            ? value
            : new Date(value);

        return !Number.isNaN(date.getTime());
    }

    function formatDate(value, options = {}) {
        if (!isValidDate(value)) {
            return "—";
        }

        const date = value instanceof Date
            ? value
            : new Date(value);

        return new Intl.DateTimeFormat(
            options.locale || "en-IN",
            {
                day: "2-digit",
                month: options.shortMonth ? "short" : "2-digit",
                year: "numeric",
                ...options
            }
        ).format(date);
    }

    function formatTime(value, options = {}) {
        if (!isValidDate(value)) {
            return "—";
        }

        const date = value instanceof Date
            ? value
            : new Date(value);

        return new Intl.DateTimeFormat(
            options.locale || "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: options.showSeconds ? "2-digit" : undefined,
                hour12: options.hour12 ?? true
            }
        ).format(date);
    }

    function formatDateTime(value, options = {}) {
        if (!isValidDate(value)) {
            return "—";
        }

        const date = value instanceof Date
            ? value
            : new Date(value);

        return new Intl.DateTimeFormat(
            options.locale || "en-IN",
            {
                day: "2-digit",
                month: options.shortMonth ? "short" : "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: options.showSeconds ? "2-digit" : undefined,
                hour12: options.hour12 ?? true
            }
        ).format(date);
    }

    function formatNumber(value, options = {}) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "—";
        }

        return new Intl.NumberFormat(
            options.locale || "en-IN",
            {
                maximumFractionDigits:
                    options.maximumFractionDigits ?? 2,
                minimumFractionDigits:
                    options.minimumFractionDigits ?? 0
            }
        ).format(number);
    }

    function formatDistance(meters) {
        const value = Number(meters);

        if (!Number.isFinite(value) || value < 0) {
            return "—";
        }

        if (value < 1000) {
            return `${Math.round(value)} m`;
        }

        const kilometers = value / 1000;

        return `${kilometers.toFixed(
            kilometers >= 100 ? 0 : 1
        )} km`;
    }

    function formatSpeed(kmh) {
        const value = Number(kmh);

        if (!Number.isFinite(value) || value < 0) {
            return "—";
        }

        return `${Math.round(value)} km/h`;
    }

    function formatCoordinates(latitude, longitude) {
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {
            return "Location unavailable";
        }

        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    function formatETA(seconds) {
        const value = Number(seconds);

        if (!Number.isFinite(value) || value < 0) {
            return "—";
        }

        const totalMinutes = Math.ceil(value / 60);

        if (totalMinutes < 1) {
            return "Under 1 min";
        }

        if (totalMinutes < 60) {
            return `${totalMinutes} min`;
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (minutes === 0) {
            return `${hours} hr`;
        }

        return `${hours} hr ${minutes} min`;
    }

    function formatPercentage(value, decimals = 0) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "—";
        }

        return `${number.toFixed(decimals)}%`;
    }

    function formatBytes(bytes) {
        const value = Number(bytes);

        if (!Number.isFinite(value) || value < 0) {
            return "—";
        }

        if (value === 0) {
            return "0 B";
        }

        const units = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        const exponent = Math.min(
            Math.floor(Math.log(value) / Math.log(1024)),
            units.length - 1
        );

        const result =
            value / Math.pow(1024, exponent);

        return `${result.toFixed(
            exponent === 0 ? 0 : 1
        )} ${units[exponent]}`;
    }

    function formatBoolean(value) {
        if (value === true) {
            return "Yes";
        }

        if (value === false) {
            return "No";
        }

        return "—";
    }

    function formatStatus(value) {
        if (!value) {
            return "Unknown";
        }

        return String(value)
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, character =>
                character.toUpperCase()
            );
    }

    function formatRole(value) {
        return formatStatus(value);
    }

    function formatPhone(value) {
        if (!value) {
            return "—";
        }

        const digits = String(value)
            .replace(/\D/g, "");

        if (digits.length === 10) {
            return `${digits.slice(0, 5)} ${digits.slice(5)}`;
        }

        return String(value);
    }

    window.RESQ_FORMAT = Object.freeze({
        formatDate,
        formatTime,
        formatDateTime,
        formatNumber,
        formatDistance,
        formatSpeed,
        formatCoordinates,
        formatETA,
        formatPercentage,
        formatBytes,
        formatBoolean,
        formatStatus,
        formatRole,
        formatPhone
    });
})();