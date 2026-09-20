/**
 * ResQSync - Toast Notifications
 */

(function () {
    "use strict";

    let container = null;
    let toastCounter = 0;

    function ensureContainer() {
        if (container && document.body.contains(container)) {
            return container;
        }

        container = document.createElement("div");

        container.id = "toast-container";
        container.className = "toast-container";
        container.setAttribute(
            "aria-live",
            "polite"
        );
        container.setAttribute(
            "aria-atomic",
            "false"
        );

        document.body.appendChild(container);

        return container;
    }

    function normalizeType(type) {
        const allowedTypes = [
            "success",
            "warning",
            "danger",
            "info"
        ];

        return allowedTypes.includes(type)
            ? type
            : "info";
    }

    function getIcon(type) {
        const icons = {
            success:
                "fa-solid fa-circle-check",
            warning:
                "fa-solid fa-triangle-exclamation",
            danger:
                "fa-solid fa-circle-xmark",
            info:
                "fa-solid fa-circle-info"
        };

        return icons[type];
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function createToast(options = {}) {
        const {
            type = "info",
            title = "",
            message = "",
            duration = null,
            dismissible = true
        } = options;

        const normalizedType =
            normalizeType(type);

        const toastDuration =
            Number.isFinite(Number(duration))
                ? Number(duration)
                : (
                    Number.isFinite(
                        Number(
                            window.RESQ_CONFIG?.UI
                                ?.TOAST_DURATION_MS
                        )
                    )
                        ? Number(
                            window.RESQ_CONFIG.UI
                                .TOAST_DURATION_MS
                        )
                        : 3500
                );

        const id =
            `toast-${Date.now()}-${++toastCounter}`;

        const toast =
            document.createElement("div");

        toast.className =
            `toast toast-${normalizedType}`;

        toast.dataset.toastId = id;
        toast.setAttribute("role", "status");

        const safeTitle =
            escapeHtml(title);

        const safeMessage =
            escapeHtml(message);

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${getIcon(
                    normalizedType
                )}"></i>
            </div>

            <div class="toast-content">
                ${
                    safeTitle
                        ? `
                            <div class="toast-title">
                                ${safeTitle}
                            </div>
                        `
                        : ""
                }

                ${
                    safeMessage
                        ? `
                            <div class="toast-message">
                                ${safeMessage}
                            </div>
                        `
                        : ""
                }
            </div>

            ${
                dismissible
                    ? `
                        <button
                            type="button"
                            class="toast-close"
                            data-toast-close
                            aria-label="Close notification"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    `
                    : ""
            }
        `;

        if (dismissible) {
            const closeButton =
                toast.querySelector(
                    "[data-toast-close]"
                );

            closeButton?.addEventListener(
                "click",
                () => remove(id)
            );
        }

        const target =
            ensureContainer();

        target.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("is-visible");
        });

        if (toastDuration > 0) {
            window.setTimeout(() => {
                remove(id);
            }, toastDuration);
        }

        return id;
    }

    function remove(id) {
        if (!container) {
            return;
        }

        const toast =
            container.querySelector(
                `[data-toast-id="${CSS.escape(id)}"]`
            );

        if (!toast) {
            return;
        }

        toast.classList.remove("is-visible");
        toast.classList.add("is-removing");

        window.setTimeout(() => {
            toast.remove();
        }, 250);
    }

    function clearAll() {
        if (!container) {
            return;
        }

        const toasts =
            container.querySelectorAll(".toast");

        toasts.forEach((toast) => {
            toast.classList.remove("is-visible");
            toast.classList.add("is-removing");

            window.setTimeout(() => {
                toast.remove();
            }, 250);
        });
    }

    function success(
        message,
        title = "Success"
    ) {
        return createToast({
            type: "success",
            title,
            message
        });
    }

    function warning(
        message,
        title = "Warning"
    ) {
        return createToast({
            type: "warning",
            title,
            message
        });
    }

    function danger(
        message,
        title = "Error"
    ) {
        return createToast({
            type: "danger",
            title,
            message
        });
    }

    function info(
        message,
        title = "Information"
    ) {
        return createToast({
            type: "info",
            title,
            message
        });
    }

    window.RESQ_TOAST = Object.freeze({
        create: createToast,
        remove,
        clearAll,
        success,
        warning,
        danger,
        info
    });
})();