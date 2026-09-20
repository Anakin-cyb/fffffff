/**
 * ResQSync - API Service
 * Centralized REST API communication layer.
 */

(function () {
    "use strict";

    function getConfig() {
        return window.RESQ_CONFIG || {
            API_BASE_URL: "http://127.0.0.1:5000"
        };
    }

    function getBaseUrl() {
        return String(
            getConfig().API_BASE_URL || ""
        ).replace(/\/+$/, "");
    }

    function buildUrl(
        endpoint,
        query = {}
    ) {
        const cleanEndpoint = String(endpoint || "")
            .startsWith("/")
            ? String(endpoint)
            : `/${String(endpoint)}`;

        const url = new URL(
            `${getBaseUrl()}${cleanEndpoint}`,
            window.location.origin
        );

        Object.entries(query || {}).forEach(
            ([key, value]) => {
                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    url.searchParams.set(
                        key,
                        String(value)
                    );
                }
            }
        );

        return url.toString();
    }

    async function parseResponse(response) {
        const contentType =
            response.headers.get("content-type") || "";

        if (
            contentType.includes("application/json")
        ) {
            try {
                return await response.json();
            } catch (error) {
                return null;
            }
        }

        try {
            return await response.text();
        } catch (error) {
            return null;
        }
    }

    function getErrorMessage(
        response,
        data
    ) {
        if (data && typeof data === "object") {
            return (
                data.message ||
                data.error ||
                data.detail ||
                `Request failed with status ${response.status}.`
            );
        }

        if (typeof data === "string" && data.trim()) {
            return data;
        }

        return `Request failed with status ${response.status}.`;
    }

    async function request(
        endpoint,
        options = {}
    ) {
        const {
            method = "GET",
            query = {},
            body = undefined,
            headers = {},
            signal = undefined
        } = options;

        const requestHeaders = {
            Accept: "application/json",
            ...headers
        };

        const fetchOptions = {
            method,
            headers: requestHeaders,
            credentials: "include"
        };

        if (signal) {
            fetchOptions.signal = signal;
        }

        if (body !== undefined) {
            requestHeaders["Content-Type"] =
                "application/json";

            fetchOptions.body = JSON.stringify(body);
        }

        const url = buildUrl(
            endpoint,
            query
        );

        let response;

        try {
            response = await fetch(
                url,
                fetchOptions
            );
        } catch (error) {
            if (error?.name === "AbortError") {
                throw error;
            }

            throw new Error(
                "Unable to connect to the ResQSync backend."
            );
        }

        const data =
            await parseResponse(response);

        if (!response.ok) {
            const error = new Error(
                getErrorMessage(
                    response,
                    data
                )
            );

            error.status = response.status;
            error.data = data;

            if (
                response.status === 401 &&
                window.RESQ_LOGGER
            ) {
                window.RESQ_LOGGER.warn(
                    "API authentication required.",
                    {
                        endpoint,
                        status: response.status
                    }
                );
            }

            throw error;
        }

        return {
            success: true,
            status: response.status,
            data
        };
    }

    function get(
        endpoint,
        query = {},
        options = {}
    ) {
        return request(endpoint, {
            ...options,
            method: "GET",
            query
        });
    }

    function post(
        endpoint,
        body = {},
        options = {}
    ) {
        return request(endpoint, {
            ...options,
            method: "POST",
            body
        });
    }

    function put(
        endpoint,
        body = {},
        options = {}
    ) {
        return request(endpoint, {
            ...options,
            method: "PUT",
            body
        });
    }

    function patch(
        endpoint,
        body = {},
        options = {}
    ) {
        return request(endpoint, {
            ...options,
            method: "PATCH",
            body
        });
    }

    function del(
        endpoint,
        options = {}
    ) {
        return request(endpoint, {
            ...options,
            method: "DELETE"
        });
    }

    async function health() {
        return get("/api/health");
    }

    window.RESQ_API = Object.freeze({
        request,
        get,
        post,
        put,
        patch,
        delete: del,
        health,
        buildUrl
    });
})();