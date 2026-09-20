const StorageUtil = {
    set(key, value) {
        try {
            const serialized =
                typeof value === 'string' ? value : JSON.stringify(value);

            localStorage.setItem(key, serialized);
        } catch (error) {
            Logger.error('Storage', 'Failed to set item', {
                key,
                error: error.message,
            });
        }
    },

    get(key, parse = true) {
        try {
            const value = localStorage.getItem(key);

            if (value === null) {
                return null;
            }

            if (!parse) {
                return value;
            }

            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            Logger.error('Storage', 'Failed to get item', {
                key,
                error: error.message,
            });

            return null;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            Logger.error('Storage', 'Failed to remove item', {
                key,
                error: error.message,
            });
        }
    },

    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            Logger.error('Storage', 'Failed to clear storage', {
                error: error.message,
            });
        }
    },

    exists(key) {
        try {
            return localStorage.getItem(key) !== null;
        } catch (error) {
            Logger.error('Storage', 'Failed to check existence', {
                key,
                error: error.message,
            });

            return false;
        }
    },

    keys() {
        try {
            return Object.keys(localStorage);
        } catch (error) {
            Logger.error('Storage', 'Failed to get keys', {
                error: error.message,
            });

            return [];
        }
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageUtil;
}