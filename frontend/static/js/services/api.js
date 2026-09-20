const ApiClient = (() => {
    const request = async (method, url, data = null, options = {}) => {
        const fullUrl = `${CONFIG.api.baseUrl}${url}`;

        Logger.debug('API', `${method} ${url}`);

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = AuthManager.getToken();

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
            ...options
        };

        if (
            data &&
            (method === 'POST' ||
                method === 'PUT' ||
                method === 'PATCH')
        ) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await Promise.race([
                fetch(fullUrl, config),
                new Promise((_, reject) =>
                    setTimeout(
                        () =>
                            reject(
                                new Error('Request timeout')
                            ),
                        CONFIG.api.timeout
                    )
                )
            ]);

            let responseData;

            try {
                responseData = await response.json();
            } catch {
                responseData = await response.text();
            }

            Logger.debug('API', `Response ${response.status}`, {
                url,
                status: response.status
            });

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message:
                        responseData.message ||
                        `HTTP ${response.status}`,
                    data: responseData.data || null
                };
            }

            return {
                success: true,
                status: response.status,
                message: responseData.message || 'Success',
                data: responseData.data || responseData
            };
        } catch (error) {
            Logger.error('API', `Error ${method} ${url}`, {
                error: error.message
            });

            return {
                success: false,
                status: 0,
                message: error.message || 'Network error',
                data: null
            };
        }
    };

    return {
        get(url, options = {}) {
            return request('GET', url, null, options);
        },

        post(url, data = {}, options = {}) {
            return request('POST', url, data, options);
        },

        put(url, data = {}, options = {}) {
            return request('PUT', url, data, options);
        },

        patch(url, data = {}, options = {}) {
            return request('PATCH', url, data, options);
        },

        delete(url, options = {}) {
            return request('DELETE', url, null, options);
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}