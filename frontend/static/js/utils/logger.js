const Logger = (() => {
    const logLevels = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
    };

    let currentLevel = logLevels.INFO;

    if (CONFIG && CONFIG.development && CONFIG.development.logLevel) {
        const level = CONFIG.development.logLevel.toUpperCase();
        currentLevel = logLevels[level] || logLevels.INFO;
    }

    const formatLog = (level, category, message, data) => {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}] [${category}]`;

        if (data) {
            return { prefix, message, data };
        }

        return { prefix, message };
    };

    return {
        debug(category, message, data) {
            if (currentLevel <= logLevels.DEBUG) {
                const log = formatLog('DEBUG', category, message, data);
                console.log(log.prefix, log.message, log.data || '');
            }
        },

        info(category, message, data) {
            if (currentLevel <= logLevels.INFO) {
                const log = formatLog('INFO', category, message, data);
                console.info(log.prefix, log.message, log.data || '');
            }
        },

        warn(category, message, data) {
            if (currentLevel <= logLevels.WARN) {
                const log = formatLog('WARN', category, message, data);
                console.warn(log.prefix, log.message, log.data || '');
            }
        },

        error(category, message, data) {
            if (currentLevel <= logLevels.ERROR) {
                const log = formatLog('ERROR', category, message, data);
                console.error(log.prefix, log.message, log.data || '');
            }
        },

        setLevel(level) {
            const upper = level.toUpperCase();
            currentLevel = logLevels[upper] || logLevels.INFO;
        },

        getLevel() {
            return Object.keys(logLevels).find(
                key => logLevels[key] === currentLevel
            );
        },
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}