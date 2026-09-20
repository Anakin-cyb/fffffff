const FormatUtils = {
    formatDistance(meters) {
        if (meters === null || meters === undefined) {
            return 'N/A';
        }

        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        }

        const km = meters / 1000;
        return `${km.toFixed(1)} km`;
    },

    formatDuration(seconds) {
        if (seconds === null || seconds === undefined) {
            return 'N/A';
        }

        if (seconds < 60) {
            return `${Math.round(seconds)} sec`;
        }

        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} min`;
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (minutes === 0) {
            return `${hours} hr`;
        }

        return `${hours} hr ${minutes} min`;
    },

    formatSpeed(kmh) {
        if (kmh === null || kmh === undefined) {
            return 'N/A';
        }

        return `${Math.round(kmh)} km/h`;
    },

    formatTimestamp(timestamp, includeTime = true) {
        if (!timestamp) {
            return 'N/A';
        }

        const date = new Date(timestamp);

        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'just now';
        }

        if (diffMins < 60) {
            return `${diffMins} min ago`;
        }

        if (diffHours < 24) {
            return `${diffHours} hr ago`;
        }

        if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        }

        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

        if (!includeTime) {
            return dateStr;
        }

        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        return `${dateStr} ${timeStr}`;
    },

    formatDate(timestamp) {
        if (!timestamp) {
            return 'N/A';
        }

        const date = new Date(timestamp);

        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    },

    formatTime(timestamp) {
        if (!timestamp) {
            return 'N/A';
        }

        const date = new Date(timestamp);

        if (isNaN(date.getTime())) {
            return 'Invalid time';
        }

        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    },

    formatDateTime(timestamp) {
        if (!timestamp) {
            return 'N/A';
        }

        const date = new Date(timestamp);

        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    },

    formatCoordinate(latitude, longitude) {
        if (
            latitude === null ||
            longitude === null ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return 'N/A';
        }

        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    },

    formatPercentage(value, decimals = 1) {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        return `${(value * 100).toFixed(decimals)}%`;
    },

    formatNumber(num) {
        if (num === null || num === undefined) {
            return 'N/A';
        }

        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    formatETA(seconds) {
        if (seconds === null || seconds === undefined || seconds < 0) {
            return 'Calculating...';
        }

        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        }

        const minutes = Math.floor(seconds / 60);
        const secondsRemainder = Math.round(seconds % 60);

        if (minutes < 60) {
            if (secondsRemainder === 0) {
                return `${minutes}m`;
            }

            return `${minutes}m ${secondsRemainder}s`;
        }

        const hours = Math.floor(minutes / 60);
        const minutesRemainder = minutes % 60;

        if (minutesRemainder === 0) {
            return `${hours}h`;
        }

        return `${hours}h ${minutesRemainder}m`;
    },

    formatStatus(status) {
        if (!status) {
            return 'N/A';
        }

        return status
            .replace(/_/g, ' ')
            .split(' ')
            .map(
                word =>
                    word.charAt(0) + word.slice(1).toLowerCase()
            )
            .join(' ');
    },

    truncate(text, length = 50) {
        if (!text) {
            return '';
        }

        if (text.length <= length) {
            return text;
        }

        return text.substring(0, length) + '...';
    },

    capitalize(text) {
        if (!text) {
            return '';
        }

        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormatUtils;
}