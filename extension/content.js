let currentSettings = {
    enabled: true,
    textColor: '#888888',
    fontSize: '0.875rem',
    dateFormat: 'YYYY/MM/DD HH:mm:ss'
};

if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(currentSettings, (items) => {
        currentSettings = items;
        processAllContainers(); // Re-process after getting settings
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (changes.enabled !== undefined) currentSettings.enabled = changes.enabled.newValue;
        if (changes.textColor) currentSettings.textColor = changes.textColor.newValue;
        if (changes.fontSize) currentSettings.fontSize = changes.fontSize.newValue;
        if (changes.dateFormat) currentSettings.dateFormat = changes.dateFormat.newValue;

        // Update existing timestamps
        document.querySelectorAll('.gemini-timestamp').forEach(el => {
            el.style.display = currentSettings.enabled ? 'block' : 'none';
            el.style.color = currentSettings.textColor;
            el.style.fontSize = currentSettings.fontSize;
            
            // Re-format text
            const timestampStr = el.getAttribute('data-timestamp');
            if (timestampStr) {
                const date = new Date(parseInt(timestampStr, 10) * 1000);
                el.textContent = formatTimestamp(date, currentSettings.dateFormat);
            }
        });
    });
    
    // Listen for real-time preview messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'previewSetting') {
            if (message.type === 'textColor') {
                document.querySelectorAll('.gemini-timestamp').forEach(el => {
                    el.style.color = message.value;
                });
            }
        }
    });
}

// 1. Script Injection for intercepting JSON.parse and AF_initDataCallback
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// 2. Map to store extracted timestamps
const timestampMap = new Map();

window.addEventListener('gemini-timestamp-extracted', (e) => {
    const { id, timestamp } = e.detail;
    timestampMap.set(id, timestamp);
    processAllContainers();
});

// 3. Format Date
function formatTimestamp(date, format) {
    const pad = (n) => n.toString().padStart(2, '0');
    const YYYY = date.getFullYear();
    // Use non-padded month and day if the format contains M/D, but our options have MM/DD.
    // Let's standardise with padded.
    const MM = pad(date.getMonth() + 1);
    const DD = pad(date.getDate());
    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    
    // Support non-padded for M and D just in case
    const M = (date.getMonth() + 1).toString();
    const D = date.getDate().toString();

    let formatted = format;
    formatted = formatted.replace('YYYY', YYYY);
    formatted = formatted.replace('MM', MM);
    formatted = formatted.replace('DD', DD);
    formatted = formatted.replace('HH', HH);
    formatted = formatted.replace('mm', mm);
    formatted = formatted.replace('ss', ss);
    // If format doesn't have MM, but has M (Not requested, but good to have)
    // Keep it simple based on our select options.
    return formatted;
}

// 4. Inject Time Element
function appendTimestampElement(targetElem, timestamp, role) {
    if (!targetElem) return;
    if (targetElem.nextElementSibling && targetElem.nextElementSibling.classList.contains('gemini-timestamp')) return;

    const date = new Date(timestamp * 1000);
    const timeText = formatTimestamp(date, currentSettings.dateFormat);
    const timeEl = document.createElement('time');
    timeEl.className = 'gemini-timestamp';
    timeEl.dateTime = date.toISOString();
    timeEl.title = date.toLocaleString();
    timeEl.textContent = timeText;
    timeEl.setAttribute('data-timestamp', timestamp);

    Object.assign(timeEl.style, {
        color: currentSettings.textColor,
        fontSize: currentSettings.fontSize,
        fontStyle: 'italic',
        opacity: '0.8',
        display: currentSettings.enabled ? 'block' : 'none',
        width: '100%',
        padding: role === 'user' ? '4px 16px' : '4px 0',
        boxSizing: 'border-box',
        textAlign: role === 'user' ? 'right' : 'left'
    });

    targetElem.insertAdjacentElement('afterend', timeEl);
}

// 5. Process containers
// Also, keep track of seen containers so we can assign local time to genuinely new ones
const seenContainers = new Set();
// We'll consider a message "new" if it was not present during the first few seconds of page load.
let initialLoadComplete = false;
setTimeout(() => { initialLoadComplete = true; }, 3000);

function processAllContainers() {
    const containers = document.querySelectorAll('.conversation-container[id]');
    for (const container of containers) {
        const id = container.id;
        let timestamp = timestampMap.get(id);

        if (!seenContainers.has(id)) {
            seenContainers.add(id);
            if (!timestamp && initialLoadComplete) {
                // If it's a new container added after initial load and we don't have a timestamp,
                // generate a local timestamp for it.
                timestamp = Math.floor(Date.now() / 1000);
                timestampMap.set(id, timestamp);
            }
        }

        if (timestamp) {
            const userQuery = container.querySelector('user-query');
            if (userQuery) {
                appendTimestampElement(userQuery, timestamp, 'user');
            }
            
            const modelResponse = container.querySelector('model-response');
            if (modelResponse) {
                // Only append if it looks like it's done or at least started
                appendTimestampElement(modelResponse, timestamp, 'model');
            }
        }
    }
}

// 6. Mutation Observer to detect DOM changes
const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (const mut of mutations) {
        if (mut.addedNodes.length > 0) {
            shouldProcess = true;
            break;
        }
    }
    if (shouldProcess) {
        processAllContainers();
    }
});

function startObserver() {
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
        processAllContainers();
    } else {
        setTimeout(startObserver, 100);
    }
}

startObserver();
