const Modal = (() => {
    let currentModal = null;

    const createModal = (title, content, buttons = []) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay fade-in';

        const modal = document.createElement('div');
        modal.className = 'modal';

        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${title}</h2>
                <button class="modal-close" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="modal-body">
                ${content}
            </div>

            <div class="modal-footer">
                ${buttons
                    .map(
                        (btn, idx) => `
                            <button class="btn ${btn.className || 'btn-primary'}" data-button-index="${idx}">
                                ${btn.text}
                            </button>
                        `
                    )
                    .join('')}
            </div>
        `;

        overlay.appendChild(modal);

        const closeBtn = modal.querySelector('.modal-close');

        const close = () => {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 300);
            currentModal = null;
        };

        closeBtn.addEventListener('click', close);

        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                close();
            }
        });

        modal.querySelectorAll('button[data-button-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.buttonIndex, 10);

                if (buttons[index].onClick) {
                    buttons[index].onClick();
                }
            });
        });

        modal.addEventListener('click', e => e.stopPropagation());

        return overlay;
    };

    return {
        alert(title, content, buttonText = 'OK') {
            const overlay = createModal(title, content, [
                {
                    text: buttonText,
                    onClick: () => this.close()
                }
            ]);

            document.body.appendChild(overlay);
            currentModal = overlay;
        },

        confirm(title, content, buttons = []) {
            if (!buttons || buttons.length === 0) {
                buttons = [
                    {
                        text: 'OK',
                        onClick: () => this.close()
                    },
                    {
                        text: 'Cancel',
                        className: 'btn-ghost',
                        onClick: () => this.close()
                    }
                ];
            }

            const overlay = createModal(title, content, buttons);
            document.body.appendChild(overlay);
            currentModal = overlay;
        },

        form(title, formHtml, onSubmit) {
            const buttons = [
                {
                    text: 'Submit',
                    onClick: () => {
                        if (onSubmit) {
                            onSubmit();
                        }

                        this.close();
                    }
                },
                {
                    text: 'Cancel',
                    className: 'btn-ghost',
                    onClick: () => this.close()
                }
            ];

            const overlay = createModal(title, formHtml, buttons);
            document.body.appendChild(overlay);
            currentModal = overlay;
        },

        close() {
            if (currentModal) {
                currentModal.classList.add('fade-out');

                setTimeout(() => {
                    if (currentModal && currentModal.parentNode) {
                        currentModal.remove();
                    }

                    currentModal = null;
                }, 300);
            }
        },

        closeAll() {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.remove());
            currentModal = null;
        },

        isOpen() {
            return currentModal !== null;
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
}