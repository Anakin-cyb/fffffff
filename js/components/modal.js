/**
 * ResQSync - Modal Component
 */

(function () {
    "use strict";

    let modalContainer = null;
    let activeModal = null;
    let modalCounter = 0;

    function ensureContainer() {
        if (
            modalContainer &&
            document.body.contains(modalContainer)
        ) {
            return modalContainer;
        }

        modalContainer = document.createElement("div");

        modalContainer.id = "modal-container";
        modalContainer.className = "modal-container";

        document.body.appendChild(
            modalContainer
        );

        return modalContainer;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function closeActiveModal() {
        if (!activeModal) {
            return;
        }

        close(activeModal.id);
    }

    function create(options = {}) {
        const {
            title = "",
            content = "",
            size = "md",
            closeOnBackdrop = true,
            closeOnEscape = true,
            showCloseButton = true,
            confirmText = "Confirm",
            cancelText = "Cancel",
            showActions = false,
            onConfirm = null,
            onCancel = null,
            onOpen = null,
            onClose = null
        } = options;

        const id =
            `modal-${Date.now()}-${++modalCounter}`;

        const modal =
            document.createElement("div");

        modal.className =
            `modal modal-${size}`;

        modal.dataset.modalId = id;
        modal.setAttribute(
            "role",
            "dialog"
        );
        modal.setAttribute(
            "aria-modal",
            "true"
        );

        const safeTitle =
            escapeHtml(title);

        const safeConfirmText =
            escapeHtml(confirmText);

        const safeCancelText =
            escapeHtml(cancelText);

        modal.innerHTML = `
            <div
                class="modal-backdrop"
                data-modal-backdrop
            ></div>

            <div
                class="modal-dialog"
                role="document"
            >
                <div class="modal-header">

                    <div class="modal-title">
                        ${safeTitle}
                    </div>

                    ${
                        showCloseButton
                            ? `
                                <button
                                    type="button"
                                    class="modal-close"
                                    data-modal-close
                                    aria-label="Close dialog"
                                >
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            `
                            : ""
                    }

                </div>

                <div class="modal-body">
                    ${content}
                </div>

                ${
                    showActions
                        ? `
                            <div class="modal-footer">

                                <button
                                    type="button"
                                    class="btn btn-outline"
                                    data-modal-cancel
                                >
                                    ${safeCancelText}
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    data-modal-confirm
                                >
                                    ${safeConfirmText}
                                </button>

                            </div>
                        `
                        : ""
                }
            </div>
        `;

        const container =
            ensureContainer();

        container.appendChild(modal);

        function handleCloseClick() {
            close(id);
        }

        function handleBackdropClick(event) {
            if (
                closeOnBackdrop &&
                event.target ===
                    modal.querySelector(
                        "[data-modal-backdrop]"
                    )
            ) {
                close(id);
            }
        }

        function handleEscape(event) {
            if (
                closeOnEscape &&
                event.key === "Escape"
            ) {
                close(id);
            }
        }

        function handleCancel() {
            if (
                typeof onCancel ===
                "function"
            ) {
                onCancel();
            }

            close(id);
        }

        async function handleConfirm() {
            if (
                typeof onConfirm ===
                "function"
            ) {
                await onConfirm();
            }

            close(id);
        }

        const closeButton =
            modal.querySelector(
                "[data-modal-close]"
            );

        const backdrop =
            modal.querySelector(
                "[data-modal-backdrop]"
            );

        const cancelButton =
            modal.querySelector(
                "[data-modal-cancel]"
            );

        const confirmButton =
            modal.querySelector(
                "[data-modal-confirm]"
            );

        closeButton?.addEventListener(
            "click",
            handleCloseClick
        );

        backdrop?.addEventListener(
            "click",
            handleBackdropClick
        );

        cancelButton?.addEventListener(
            "click",
            handleCancel
        );

        confirmButton?.addEventListener(
            "click",
            handleConfirm
        );

        if (closeOnEscape) {
            document.addEventListener(
                "keydown",
                handleEscape
            );
        }

        modal._cleanup = () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );

            if (
                typeof onClose ===
                "function"
            ) {
                onClose();
            }
        };

        requestAnimationFrame(() => {
            modal.classList.add(
                "is-visible"
            );
        });

        activeModal = {
            id,
            element: modal
        };

        if (
            typeof onOpen ===
            "function"
        ) {
            onOpen(modal);
        }

        return id;
    }

    function open(options = {}) {
        return create(options);
    }

    function close(id) {
        if (!modalContainer) {
            return;
        }

        const targetId =
            id ||
            activeModal?.id;

        if (!targetId) {
            return;
        }

        const modal =
            modalContainer.querySelector(
                `[data-modal-id="${CSS.escape(
                    targetId
                )}"]`
            );

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "is-visible"
        );

        modal.classList.add(
            "is-closing"
        );

        const cleanup =
            modal._cleanup;

        window.setTimeout(() => {
            if (
                typeof cleanup ===
                "function"
            ) {
                cleanup();
            }

            modal.remove();

            if (
                activeModal?.id ===
                targetId
            ) {
                activeModal = null;
            }
        }, 250);
    }

    function closeAll() {
        if (!modalContainer) {
            return;
        }

        const modals =
            modalContainer.querySelectorAll(
                ".modal"
            );

        modals.forEach((modal) => {
            const id =
                modal.dataset.modalId;

            if (id) {
                close(id);
            }
        });
    }

    function getActive() {
        return activeModal;
    }

    function isOpen() {
        return Boolean(
            activeModal
        );
    }

    window.RESQ_MODAL = Object.freeze({
        open,
        create,
        close,
        closeActive: closeActiveModal,
        closeAll,
        getActive,
        isOpen
    });
})();