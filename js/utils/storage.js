/**
 * ResQSync - Storage Utilities
 */

(function () {
    "use strict";

    const PREFIX = "resqsync_";

    function buildKey(key) {
        return `${PREFIX}${String(key)}`;
    }

    function set(
        key,
        value,
        options = {}
    ) {
        const storageType =
            options.storage || "local";

        const storage =
            storageType === "session"
                ? window.sessionStorage
                : window.localStorage;

        if (!storage) {
            return false;
        }

        try {
            storage.setItem(
                buildKey(key),
                JSON.stringify(value)
            );

            return true;
        } catch (error) {
            console.error(
                "ResQSync storage: failed to save value.",
                error
            );

            return false;
        }
    }

    function get(
        key,
        defaultValue = null,
        options = {}
    ) {
        const storageType =
            options.storage || "local";

        const storage =
            storageType === "session"
                ? window.sessionStorage
                : window.localStorage;

        if (!storage) {
            return defaultValue;
        }

        try {
            const raw = storage.getItem(
                buildKey(key)
            );

            if (raw === null) {
                return defaultValue;
            }

            return JSON.parse(raw);
        } catch (error) {
            console.warn(
                "ResQSync storage: failed to read value.",
                error
            );

            return defaultValue;
        }
    }

    function remove(
        key,
        options = {}
    ) {
        const storageType =
            options.storage || "local";

        const storage =
            storageType === "session"
                ? window.sessionStorage
                : window.localStorage;

        if (!storage) {
            return false;
        }

        try {
            storage.removeItem(
                buildKey(key)
            );

            return true;
        } catch (error) {
            console.error(
                "ResQSync storage: failed to remove value.",
                error
            );

            return false;
        }
    }

    function has(
        key,
        options = {}
    ) {
        const storageType =
            options.storage || "local";

        const storage =
            storageType === "session"
                ? window.sessionStorage
                : window.localStorage;

        if (!storage) {
            return false;
        }

        try {
            return storage.getItem(
                buildKey(key)
            ) !== null;
        } catch (error) {
            return false;
        }
    }

    function clear(
        options = {}
    ) {
        const storageType =
            options.storage || "local";

        const storage =
            storageType === "session"
                ? window.sessionStorage
                : window.localStorage;

        if (!storage) {
            return false;
        }

        try {
            const keysToRemove = [];

            for (let index = 0; index < storage.length; index += 1) {
                const key = storage.key(index);

                if (
                    key &&
                    key.startsWith(PREFIX)
                ) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach((key) => {
                storage.removeItem(key);
            });

            return true;
        } catch (error) {
            console.error(
                "ResQSync storage: failed to clear values.",
                error
            );

            return false;
        }
    }

    function setLocal(key, value) {
        return set(key, value, {
            storage: "local"
        });
    }

    function getLocal(
        key,
        defaultValue = null
    ) {
        return get(
            key,
            defaultValue,
            {
                storage: "local"
            }
        );
    }

    function removeLocal(key) {
        return remove(key, {
            storage: "local"
        });
    }

    function setSession(key, value) {
        return set(key, value, {
            storage: "session"
        });
    }

    function getSession(
        key,
        defaultValue = null
    ) {
        return get(
            key,
            defaultValue,
            {
                storage: "session"
            }
        );
    }

    function removeSession(key) {
        return remove(key, {
            storage: "session"
        });
    }

    window.RESQ_STORAGE = Object.freeze({
        set,
        get,
        remove,
        has,
        clear,
        setLocal,
        getLocal,
        removeLocal,
        setSession,
        getSession,
        removeSession
    });
})();