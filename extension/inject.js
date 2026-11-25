// Runs before the page parses its initial or paginated history.
(() => {
    const parse = JSON.parse;
    function isTimestamp(value) {
        return Array.isArray(value) && value.length === 2 &&
            Number.isInteger(value[0]) && value[0] >= 1000000000 && value[0] <= 253402300799 &&
            Number.isInteger(value[1]) && value[1] >= 0 && value[1] < 1000000000;
    }

    function collect(data) {
        const stack = [data];
        const turns = [];
        while (stack.length) {
            const row = stack.pop();
            if (!Array.isArray(row)) continue;
            if (Array.isArray(row[0]) && typeof row[0][0] === 'string' &&
                    typeof row[0][1] === 'string' && /^c_[\da-f]+$/i.test(row[0][0]) &&
                    /^r_[\da-f]+$/i.test(row[0][1])) {
                // Current history rows retain trailing metadata after the timestamp.
                // Older records expose a timestamp within the last three fields.
                const legacy = isTimestamp(row[4]) ? [] : row.slice(-3).filter(isTimestamp);
                const stamp = isTimestamp(row[4]) ? row[4] : legacy.length === 1 && legacy[0];
                if (stamp) {
                    turns.push([row[0][1].slice(2), stamp[0]]);
                }
            }
            for (const child of row) {
                if (Array.isArray(child)) stack.push(child);
            }
        }
        if (turns.length) {
            // A string is readable from Firefox's isolated content script.
            window.dispatchEvent(new CustomEvent('gemini-timestamp-extracted', {
                detail: JSON.stringify(turns)
            }));
        }
    }

    JSON.parse = function (...args) {
        const result = parse.apply(this, args);
        if (Array.isArray(result) && typeof args[1] !== 'function') collect(result);
        return result;
    };

    // Some initial history arrives as inline bootstrap data.
    function wrap(callback) {
        if (typeof callback !== 'function') return callback;
        return function (...args) {
            if (Array.isArray(args[0]?.data)) collect(args[0].data);
            return callback.apply(this, args);
        };
    }
    let callback = wrap(window.AF_initDataCallback);
    try {
        Object.defineProperty(window, 'AF_initDataCallback', {
            configurable: true,
            get: () => callback,
            set: value => { callback = wrap(value); }
        });
    } catch {
        // Already defined by the page. JSON history can still be observed.
    }
})();
