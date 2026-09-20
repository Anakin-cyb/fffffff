const TableComponent = (() => {
    const escapeHtml = (value) => {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const render = (containerId, columns, data = [], options = {}) => {
        const container = document.getElementById(containerId);

        if (!container) {
            Logger.warn('TableComponent', 'Container not found', {
                containerId
            });
            return;
        }

        const emptyMessage = options.emptyMessage || 'No data available';

        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `
                <div class="table-empty">
                    ${escapeHtml(emptyMessage)}
                </div>
            `;
            return;
        }

        const rows = data.map((row, index) => {
            return `
                <tr>
                    ${columns.map(column => {
                        let value = row[column.key];

                        if (typeof column.render === 'function') {
                            value = column.render(value, row, index);
                        } else {
                            value = escapeHtml(value);
                        }

                        return `<td>${value ?? ''}</td>`;
                    }).join('')}
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="table-wrapper">
                <table class="${options.className || 'data-table'}">
                    <thead>
                        <tr>
                            ${columns.map(column => `
                                <th>${escapeHtml(column.label)}</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    };

    const formatStatus = (status) => {
        if (typeof StatusBadge !== 'undefined' && StatusBadge.render) {
            return StatusBadge.render(status);
        }

        return escapeHtml(status || 'UNKNOWN');
    };

    const formatDate = (value) => {
        if (typeof FormatUtils !== 'undefined' && FormatUtils.formatTimestamp) {
            return FormatUtils.formatTimestamp(value);
        }

        return escapeHtml(value);
    };

    const createColumn = (key, label, render = null) => {
        return {
            key,
            label,
            ...(render ? { render } : {})
        };
    };

    const clear = (containerId) => {
        const container = document.getElementById(containerId);

        if (container) {
            container.innerHTML = '';
        }
    };

    return {
        render,
        formatStatus,
        formatDate,
        createColumn,
        clear,
        escapeHtml
    };
})();

const TablesComponent = TableComponent;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TableComponent;
}