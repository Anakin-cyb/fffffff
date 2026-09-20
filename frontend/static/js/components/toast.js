const Toast = (() => {
    const show = (
        message,
        type = 'info',
        duration = CONFIG.ui.toastDuration
    ) => {
        const container = document.getElementById('toast-container');

        if (!container) {
            Logger.error('Toast', 'Toast container not found');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type} fade-in`;

        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');

        const removeToast = () => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        };

        closeBtn.addEventListener('click', removeToast);

        setTimeout(removeToast, duration);

        Logger.debug('Toast', 'Shown', { message, type });
    };

    return {
        success(message, duration) {
            show(message, 'success', duration);
        },

        error(message, duration) {
            show(message, 'error', duration);
        },

        warning(message, duration) {
            show(message, 'warning', duration);
        },

        info(message, duration) {
            show(message, 'info', duration);
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toast;
}