/**
 * ResQSync - Login Page
 */

(function () {
    "use strict";

    let container = null;

    function getContainer() {
        return document.querySelector(
            '[data-route-container="/login"]'
        );
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getLandingRoute(role) {
        switch (role) {
            case "citizen":
                return "/citizen-home";

            case "vehicle_operator":
                return "/vehicle-dashboard";

            default:
                return "/dashboard";
        }
    }

    function render() {
        container = getContainer();

        if (!container) {
            return null;
        }
          container.hidden = false;

        container.innerHTML = `
            <div class="login-page">

                <div class="login-card">

                    <div class="login-brand">

                        <div class="login-logo">
                            <i
                                class="fa-solid fa-truck-medical"
                                aria-hidden="true"
                            ></i>
                        </div>

                        <h1 class="login-title">
                            ResQSync
                        </h1>

                        <p class="login-subtitle">
                            Emergency Corridor Coordination System
                        </p>

                    </div>

                    <form
                        class="form"
                        data-login-form
                        novalidate
                    >

                        <div class="form-group">

                            <label
                                class="form-label"
                                for="login-identifier"
                            >
                                Email / User ID
                                <span
                                    class="form-required"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </label>

                            <input
                                id="login-identifier"
                                name="identifier"
                                type="text"
                                class="form-input"
                                autocomplete="username"
                                placeholder="Enter your email or user ID"
                                required
                            >

                            <span
                                class="form-error"
                                data-login-identifier-error
                                hidden
                            ></span>

                        </div>

                        <div class="form-group">

                            <label
                                class="form-label"
                                for="login-password"
                            >
                                Password
                                <span
                                    class="form-required"
                                    aria-hidden="true"
                                >
                                    *
                                </span>
                            </label>

                            <input
                                id="login-password"
                                name="password"
                                type="password"
                                class="form-input"
                                autocomplete="current-password"
                                placeholder="Enter your password"
                                required
                            >

                            <span
                                class="form-error"
                                data-login-password-error
                                hidden
                            ></span>

                        </div>

                        <div
                            class="alert alert-danger"
                            data-login-error
                            hidden
                        ></div>

                        <button
                            type="submit"
                            class="btn btn-primary btn-lg btn-block"
                            data-login-submit
                        >
                            <i
                                class="fa-solid fa-right-to-bracket"
                                aria-hidden="true"
                            ></i>

                            <span data-login-submit-text>
                                Sign In
                            </span>
                        </button>

                    </form>

                    <div class="login-footer">
                        Authorized users only
                    </div>

                </div>

            </div>
        `;

        bindEvents();

        return container;
    }

    function bindEvents() {
        if (!container) {
            return;
        }

        const form =
            container.querySelector(
                "[data-login-form]"
            );

        form?.addEventListener(
            "submit",
            handleSubmit
        );
    }

    function clearErrors() {
        const identifierError =
            container.querySelector(
                "[data-login-identifier-error]"
            );

        const passwordError =
            container.querySelector(
                "[data-login-password-error]"
            );

        const formError =
            container.querySelector(
                "[data-login-error]"
            );

        if (identifierError) {
            identifierError.hidden = true;
            identifierError.textContent = "";
        }

        if (passwordError) {
            passwordError.hidden = true;
            passwordError.textContent = "";
        }

        if (formError) {
            formError.hidden = true;
            formError.textContent = "";
        }
    }

    function showFieldError(
        selector,
        message
    ) {
        const element =
            container.querySelector(
                selector
            );

        if (!element) {
            return;
        }

        element.textContent = message;
        element.hidden = false;
    }

    function showFormError(message) {
        const element =
            container.querySelector(
                "[data-login-error]"
            );

        if (!element) {
            return;
        }

        element.textContent = message;
        element.hidden = false;
    }

    function setLoading(
        loading
    ) {
        const submitButton =
            container.querySelector(
                "[data-login-submit]"
            );

        const submitText =
            container.querySelector(
                "[data-login-submit-text]"
            );

        if (!submitButton) {
            return;
        }

        submitButton.disabled = loading;

        if (submitText) {
            submitText.textContent =
                loading
                    ? "Signing In..."
                    : "Sign In";
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        clearErrors();

        const form =
            event.currentTarget;

        const formData =
            new FormData(form);

        const identifier =
            String(
                formData.get("identifier") || ""
            ).trim();

        const password =
            String(
                formData.get("password") || ""
            );

        let valid = true;

        if (
            !identifier
        ) {
            showFieldError(
                "[data-login-identifier-error]",
                "Email or User ID is required."
            );

            valid = false;
        }

        if (
            !password
        ) {
            showFieldError(
                "[data-login-password-error]",
                "Password is required."
            );

            valid = false;
        }

        if (!valid) {
            return;
        }

        setLoading(true);

        try {
            if (
                !window.RESQ_AUTH ||
                typeof window.RESQ_AUTH.login !==
                    "function"
            ) {
                throw new Error(
                    "Authentication module is not available."
                );
            }

            const result =
                await window.RESQ_AUTH.login({
                    identifier,
                    password
                });

            const role =
                result?.user?.role ||
                window.RESQ_AUTH.getRole();

            if (
                window.RESQ_TOAST &&
                typeof window.RESQ_TOAST.success ===
                    "function"
            ) {
                window.RESQ_TOAST.success(
                    "You have been authenticated successfully.",
                    "Welcome"
                );
            }

            const destination =
                getLandingRoute(role);

            if (
                window.RESQ_ROUTER &&
                typeof window.RESQ_ROUTER.navigate ===
                    "function"
            ) {
                window.RESQ_ROUTER.navigate(
                    destination
                );
            }
        } catch (error) {
            showFormError(
                error?.message ||
                "Unable to sign in. Please try again."
            );

            if (
                window.RESQ_TOAST &&
                typeof window.RESQ_TOAST.danger ===
                    "function"
            ) {
                window.RESQ_TOAST.danger(
                    error?.message ||
                    "Login failed.",
                    "Authentication Error"
                );
            }
        } finally {
            setLoading(false);
        }
    }

    function initialize() {
        return render();
    }

    window.RESQ_LOGIN_PAGE =
        Object.freeze({
            initialize,
            render
        });
})();