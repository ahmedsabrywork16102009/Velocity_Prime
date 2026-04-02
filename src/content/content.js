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

function applyGlobalSpeed(speed) {
    const newSpeed = Math.max(0.1, Math.min(16.0, parseFloat(speed)));
    currentSpeed = parseFloat(newSpeed.toFixed(2));
    chrome.storage.local.set({ globalVideoSpeed: String(currentSpeed) });
    broadcastSpeedToMainWorld();
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore when typing in inputs/textareas
    const target = e.target.tagName.toLowerCase();
    if (target === 'input' || target === 'textarea' || e.target.isContentEditable) return;

    // We use Ctrl + Shift + Alt + Key as requested for global shortcuts
    if (!e.ctrlKey || !e.shiftKey || !e.altKey) return;

    const key = e.key.toLowerCase();

    // R to Reset
    if (key === 'r') {
        e.preventDefault();
        applyGlobalSpeed(1.0);
        return;
    }

    const STEP = 0.01; // Fine-tuning 0.01 for both arrows

    if (key === 'arrowup') {
        e.preventDefault();
        applyGlobalSpeed(currentSpeed + STEP);
    } else if (key === 'arrowdown') {
        e.preventDefault();
        applyGlobalSpeed(currentSpeed - STEP);
    } else if (key === 'arrowright') {
        e.preventDefault();
        applyGlobalSpeed(currentSpeed + STEP);
    } else if (key === 'arrowleft') {
        e.preventDefault();
        applyGlobalSpeed(currentSpeed - STEP);
    }
}, true); // Use capture phase to ensure we catch it

// Global Mouse Wheel (Ultra-micro: 0.01)
document.addEventListener('wheel', (e) => {
    if (e.ctrlKey && e.shiftKey && e.altKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.01 : 0.01;
        applyGlobalSpeed(currentSpeed + delta);
    }
}, { passive: false });

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
