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

// Detect Firefox
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
if (isFirefox) {
    const customWrapper = document.getElementById('customColorWrapper');
    if (customWrapper) customWrapper.style.display = 'none';
}

function updateColorActiveState(color) {
    // Update swatches
    document.querySelectorAll('.color-swatch').forEach(btn => {
        if (btn.dataset.color.toLowerCase() === color.toLowerCase()) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update custom picker
    const customInput = document.getElementById('textColor');
    customInput.value = color;
    
    // Check if it's a custom color
    const isStandard = Array.from(document.querySelectorAll('.color-swatch')).some(btn => btn.dataset.color.toLowerCase() === color.toLowerCase());
    const customWrapper = document.getElementById('customColorWrapper');
    if (customWrapper) {
        if (!isStandard) {
            customWrapper.classList.add('active');
        } else {
            customWrapper.classList.remove('active');
        }
    }
}

// Load current settings
chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    document.getElementById('enableToggle').checked = items.enabled;
    document.getElementById('fontSize').value = items.fontSize;
    document.getElementById('dateFormat').value = items.dateFormat;
    
    updateColorActiveState(items.textColor);
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

// Real-time preview for color on input (Custom Picker)
document.getElementById('textColor').addEventListener('input', (e) => {
    const newColor = e.target.value;
    updateColorActiveState(newColor);
    sendPreviewMessage('textColor', newColor);
});

// Save to storage only on change (when drag is complete / picker is closed)
document.getElementById('textColor').addEventListener('change', (e) => {
    chrome.storage.sync.set({ textColor: e.target.value });
});

// Color Swatch Clicks
document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const newColor = e.target.dataset.color;
        updateColorActiveState(newColor);
        chrome.storage.sync.set({ textColor: newColor });
        sendPreviewMessage('textColor', newColor);
    });
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
        document.getElementById('fontSize').value = DEFAULT_SETTINGS.fontSize;
        document.getElementById('dateFormat').value = DEFAULT_SETTINGS.dateFormat;
        
        updateColorActiveState(DEFAULT_SETTINGS.textColor);
        updateUIState(DEFAULT_SETTINGS.enabled);
        
        // Reset preview as well
        sendPreviewMessage('textColor', DEFAULT_SETTINGS.textColor);
    });
});
