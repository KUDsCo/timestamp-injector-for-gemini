const DEFAULT_SETTINGS = {
    enabled: true,
    textColor: '#888888',
    fontSize: '0.875rem',
    dateFormat: 'YYYY/MM/DD HH:mm:ss'
};

function updateUIState(enabled) {
    const panel = document.getElementById('settingsPanel');
    if (enabled) {
        panel.classList.remove('disabled-overlay');
    } else {
        panel.classList.add('disabled-overlay');
    }
}

// Load current settings
chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    document.getElementById('enableToggle').checked = items.enabled;
    document.getElementById('textColor').value = items.textColor;
    document.getElementById('fontSize').value = items.fontSize;
    document.getElementById('dateFormat').value = items.dateFormat;
    
    updateUIState(items.enabled);
});

// Helper to send real-time preview message to content script
function sendPreviewMessage(type, value) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'previewSetting',
                type: type,
                value: value
            }).catch(err => {
                // Ignore errors (content script might not be injected on this page)
            });
        }
    });
}

// Event Listeners
document.getElementById('enableToggle').addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    updateUIState(isEnabled);
    chrome.storage.sync.set({ enabled: isEnabled });
});

// Real-time preview for color on input
document.getElementById('textColor').addEventListener('input', (e) => {
    sendPreviewMessage('textColor', e.target.value);
});

// Save to storage only on change (when drag is complete / picker is closed)
document.getElementById('textColor').addEventListener('change', (e) => {
    chrome.storage.sync.set({ textColor: e.target.value });
});

document.getElementById('fontSize').addEventListener('change', (e) => {
    chrome.storage.sync.set({ fontSize: e.target.value });
});

document.getElementById('dateFormat').addEventListener('change', (e) => {
    chrome.storage.sync.set({ dateFormat: e.target.value });
});

// Reset Button
document.getElementById('resetBtn').addEventListener('click', () => {
    chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
        document.getElementById('enableToggle').checked = DEFAULT_SETTINGS.enabled;
        document.getElementById('textColor').value = DEFAULT_SETTINGS.textColor;
        document.getElementById('fontSize').value = DEFAULT_SETTINGS.fontSize;
        document.getElementById('dateFormat').value = DEFAULT_SETTINGS.dateFormat;
        
        updateUIState(DEFAULT_SETTINGS.enabled);
        
        // Reset preview as well
        sendPreviewMessage('textColor', DEFAULT_SETTINGS.textColor);
    });
});
