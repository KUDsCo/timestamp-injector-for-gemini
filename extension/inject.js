(function() {
    const originalParse = JSON.parse;
    
    function extractTimestamps(data) {
        if (!Array.isArray(data)) return;
        
        try {
            if (data.length >= 2 && Array.isArray(data[0]) && data[0].length >= 2 && 
                typeof data[0][0] === 'string' && data[0][0].startsWith('c_') &&
                typeof data[0][1] === 'string' && data[0][1].startsWith('r_')) {
                
                const turnId = data[0][1].replace('r_', '');
                
                for (let i = data.length - 1; i >= Math.max(0, data.length - 3); i--) {
                    const el = data[i];
                    if (Array.isArray(el) && el.length >= 2 && typeof el[0] === 'number' && el[0] > 1000000000 && typeof el[1] === 'number') {
                        window.dispatchEvent(new CustomEvent('gemini-timestamp-extracted', {
                            detail: { id: turnId, timestamp: el[0] }
                        }));
                        break;
                    }
                }
            }
        } catch(e) {}
        
        for (let i = 0; i < data.length; i++) {
            if (Array.isArray(data[i])) {
                extractTimestamps(data[i]);
            }
        }
    }

    JSON.parse = function() {
        const result = originalParse.apply(this, arguments);
        if (Array.isArray(result)) {
            extractTimestamps(result);
        }
        return result;
    };

    let originalAF = window.AF_initDataCallback;
    function hookAF() {
        if (typeof originalAF === 'function' && !originalAF.__hooked) {
            const func = originalAF;
            originalAF = function(params) {
                if (params && params.data) {
                    extractTimestamps(params.data);
                }
                return func.apply(this, arguments);
            };
            originalAF.__hooked = true;
        }
    }
    hookAF();
    
    try {
        Object.defineProperty(window, 'AF_initDataCallback', {
            get: function() { return originalAF; },
            set: function(val) {
                originalAF = val;
                hookAF();
            }
        });
    } catch(e) {
        // Ignore "Cannot redefine property" errors if already defined as non-configurable
    }
})();
