window.StatusBadge = (() => {
    const escapeHtml = (value) => {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const normalize = (value) => {
        return String(value ?? 'UNKNOWN')
            .trim()
            .toUpperCase();
    };

    const label = (value) => {
        return normalize(value)
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const badge = (value, type = 'default') => {
        const normalized = normalize(value);

        let tone = 'neutral';
        let icon = 'fa-circle-info';

        if (
            normalized === 'ONLINE' ||
            normalized === 'ACTIVE' ||
            normalized === 'COMPLETED' ||
            normalized === 'ACKNOWLEDGED' ||
            normalized === 'GREEN'
        ) {
            tone = 'success';
            icon = 'fa-circle-check';
        } else if (
            normalized === 'CRITICAL' ||
            normalized === 'FAILED' ||
            normalized === 'CANCELLED' ||
            normalized === 'OFFLINE' ||
            normalized === 'RED'
        ) {
            tone = 'danger';
            icon = 'fa-circle-xmark';
        } else if (
            normalized === 'HIGH' ||
            normalized === 'PENDING' ||
            normalized === 'CONNECTING' ||
            normalized === 'AMBER' ||
            normalized === 'ACTIVATING' ||
            normalized === 'RECOVERING'
        ) {
            tone = 'warning';
            icon = 'fa-triangle-exclamation';
        } else if (
            normalized === 'ASSIGNED' ||
            normalized === 'EN_ROUTE' ||
            normalized === 'CORRIDOR_ACTIVE' ||
            normalized === 'SENT'
        ) {
            tone = 'info';
            icon = 'fa-circle-dot';
        }

        return `
            <span class="status-badge status-badge-${tone}" data-badge-type="${escapeHtml(type)}">
                <i class="fas ${icon}" aria-hidden="true"></i>
                <span>${escapeHtml(label(normalized))}</span>
            </span>
        `;
    };

    const emergency = (status) => {
        return badge(status, 'emergency');
    };

    const connection = (status) => {
        return badge(status, 'connection');
    };

    const signal = (status) => {
        return badge(status, 'signal');
    };

    const corridor = (status) => {
        return badge(status, 'corridor');
    };

    const create = (status) => {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = badge(status);
        return wrapper.firstElementChild;
    };

    return {
        badge,
        emergency,
        connection,
        signal,
        corridor,
        create
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatusBadge;
}