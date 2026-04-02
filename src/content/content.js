// ============================================================================
// 1. ISOLATED WORLD SCRIPT (Chrome Extension context)
// Because of the strict CSP on Inkrypt, we do not inject scripts into the DOM.
// Chrome handles the MAIN world injection natively via manifest.json.
// ============================================================================

let currentSpeed = 1.0;

function broadcastSpeedToMainWorld() {
    window.postMessage({ 
        type: 'VELOCITY_PRIME_SYNC', 
        speed: currentSpeed 
    }, '*');
}

chrome.storage.local.get(['globalVideoSpeed'], (res) => {
    if (res.globalVideoSpeed) {
        currentSpeed = parseFloat(res.globalVideoSpeed) || 1.0;
        broadcastSpeedToMainWorld();
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.globalVideoSpeed) {
        currentSpeed = parseFloat(changes.globalVideoSpeed.newValue) || 1.0;
        broadcastSpeedToMainWorld();
    }
});

setInterval(broadcastSpeedToMainWorld, 500);
