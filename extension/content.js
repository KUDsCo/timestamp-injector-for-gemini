let currentSettings = {
    enabled: true,
    textColor: '#888888',
    fontSize: '0.875rem',
    dateFormat: 'YYYY/MM/DD HH:mm:ss',
    hourCycle: '24'
};

if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(currentSettings, (items) => {
        currentSettings = items;
        scheduleRender();
        refreshSettings();
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'sync') return;
        if (changes.hourCycle) currentSettings.hourCycle = changes.hourCycle.newValue;
        if (changes.enabled !== undefined) currentSettings.enabled = changes.enabled.newValue;
        if (changes.textColor) currentSettings.textColor = changes.textColor.newValue;
        if (changes.fontSize) currentSettings.fontSize = changes.fontSize.newValue;
        if (changes.dateFormat) currentSettings.dateFormat = changes.dateFormat.newValue;

        refreshSettings();
    });

    function refreshSettings() {
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
    }
    
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

const timestampMap = new Map();
let pending = false;
function scheduleRender() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
        pending = false;
        processAllContainers();
    });
}

window.addEventListener('gemini-timestamp-extracted', event => {
    if (typeof event.detail !== 'string') return;
    let turns;
    try {
        turns = JSON.parse(event.detail);
    } catch {
        return;
    }
    if (!Array.isArray(turns)) return;
    for (const turn of turns) {
        if (!Array.isArray(turn)) continue;
        const [id, seconds] = turn;
        if (typeof id === 'string' && /^[a-f0-9]+$/i.test(id) &&
                Number.isInteger(seconds) && seconds >= 1000000000 && seconds <= 253402300799) {
            timestampMap.set(id, seconds);
        }
    }
    scheduleRender();
});

function formatTimestamp(date, format) {
    const pad = n => String(n).padStart(2, '0');
    const hours = date.getHours();
    const use12 = currentSettings.hourCycle === '12';
    const tokens = {
        YYYY: date.getFullYear(), MM: pad(date.getMonth() + 1), DD: pad(date.getDate()),
        HH: pad(use12 ? hours % 12 || 12 : hours), mm: pad(date.getMinutes()), ss: pad(date.getSeconds())
    };
    const pattern = use12 ? format.replace(/HH:mm(:ss)?/, '$& A') : format;
    return pattern.replace(/YYYY|MM|DD|HH|mm|ss|A/g, token =>
        token === 'A' ? (hours < 12 ? 'AM' : 'PM') : tokens[token]);
}

// 4. Inject Time Element
function appendTimestampElement(targetElem, timestamp, role) {
    if (!targetElem) return;
    const sibling = targetElem.nextElementSibling;
    const existing = sibling?.classList.contains('gemini-timestamp') ? sibling : null;
    if (existing?.dataset.timestamp === String(timestamp)) return;

    const date = new Date(timestamp * 1000);
    const timeText = formatTimestamp(date, currentSettings.dateFormat);
    const timeEl = existing || document.createElement('time');
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

    if (!existing) targetElem.insertAdjacentElement('afterend', timeEl);
}

function processAllContainers() {
    for (const container of document.querySelectorAll('.conversation-container[id]')) {
        const timestamp = timestampMap.get(container.id);
        for (const [selector, role] of [['user-query', 'user'], ['model-response', 'model']]) {
            const target = container.querySelector(selector);
            if (timestamp) {
                appendTimestampElement(target, timestamp, role);
            } else if (target?.nextElementSibling?.classList.contains('gemini-timestamp')) {
                target.nextElementSibling.remove();
            }
        }
    }
}

new MutationObserver(scheduleRender).observe(document, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['id']
});
