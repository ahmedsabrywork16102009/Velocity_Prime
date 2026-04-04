// ============================================================
// Velocity Prime v2.0 — Isolated World Content Script
//
// Runs in Chrome's ISOLATED world (has access to chrome.* APIs).
// Responsibilities:
//   • Sync playback speed from chrome.storage → MAIN world via postMessage
//   • Handle global keyboard shortcuts (Ctrl+Shift+Alt + Arrow / R)
//   • Handle global scroll-wheel speed adjustment (Ctrl+Shift+Alt + Scroll)
//   • Bridge message listener for popup's getVideoInfo request
// ============================================================

let currentSpeed = 1.0;

// ── Context guard ────────────────────────────────────────────
function isContextValid() {
    return !!(typeof chrome !== 'undefined' && chrome.runtime?.id);
}

// ── Broadcast speed change to MAIN world ─────────────────────
function broadcastSpeedToMainWorld(isManual = false) {
    window.postMessage({
        type:     'VELOCITY_PRIME_SYNC',
        speed:    currentSpeed,
        isManual: isManual
    }, '*');
}

// ── Apply a new speed (clamp, persist, broadcast) ────────────
function applyGlobalSpeed(speed) {
    const raw = parseFloat(speed);
    currentSpeed = parseFloat(Math.max(0.1, Math.min(16.0, isNaN(raw) ? 1.0 : raw)).toFixed(2));

    if (isContextValid()) {
        try {
            chrome.storage.local.set({ globalVideoSpeed: String(currentSpeed) });
        } catch (err) {
            console.debug('Velocity Prime: Extension context invalidated — storage write skipped.');
        }
    }

    broadcastSpeedToMainWorld(true);
}

// ── Receive speed updates from MAIN world (HUD interactions) ─
window.addEventListener('message', (event) => {
    if (event.data?.type !== 'VELOCITY_PRIME_MAIN_UPDATE') return;
    const newSpeed = parseFloat(event.data.speed);
    if (!isNaN(newSpeed)) applyGlobalSpeed(newSpeed);
});

// ── Global Keyboard Shortcuts (Ctrl+Shift+Alt + Key) ─────────
document.addEventListener('keydown', (e) => {
    // Ignore when the user is typing
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    // Require the full modifier combo to avoid conflicts
    if (!e.ctrlKey || !e.shiftKey || !e.altKey) return;

    const key  = e.key.toLowerCase();
    const STEP = 0.05;

    if (key === 'r') { e.preventDefault(); applyGlobalSpeed(1.0); return; }

    if (key === 'arrowup'    || key === 'arrowright') { e.preventDefault(); applyGlobalSpeed(currentSpeed + STEP); }
    else if (key === 'arrowdown' || key === 'arrowleft') { e.preventDefault(); applyGlobalSpeed(currentSpeed - STEP); }
}, true); // Capture phase — ensures we intercept before site handlers

// ── Global Scroll Wheel (Ctrl+Shift+Alt + Scroll) ────────────
document.addEventListener('wheel', (e) => {
    if (!(e.ctrlKey && e.shiftKey && e.altKey)) return;
    e.preventDefault();
    applyGlobalSpeed(currentSpeed + (e.deltaY > 0 ? -0.05 : 0.05));
}, { passive: false });

// ── Load initial speed from storage ──────────────────────────
if (isContextValid()) {
    try {
        chrome.storage.local.get(['globalVideoSpeed'], (res) => {
            if (!isContextValid() || chrome.runtime.lastError) return;
            if (res?.globalVideoSpeed) {
                currentSpeed = parseFloat(res.globalVideoSpeed) || 1.0;
                broadcastSpeedToMainWorld(false);
            }
        });
    } catch (err) {
        console.debug('Velocity Prime: Failed to read initial speed from storage.');
    }

    // ── Listen for storage changes (popup updates speed) ─────
    try {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (!isContextValid()) return;
            if (area === 'local' && changes.globalVideoSpeed) {
                currentSpeed = parseFloat(changes.globalVideoSpeed.newValue) || 1.0;
                broadcastSpeedToMainWorld(true);
            }
        });
    } catch (err) {
        console.debug('Velocity Prime: Failed to attach storage change listener.');
    }

    // ── Periodic sync to MAIN world (every 500ms) ────────────
    // Ensures newly created iframes / videos receive the current speed
    const syncInterval = setInterval(() => {
        if (!isContextValid()) { clearInterval(syncInterval); return; }
        broadcastSpeedToMainWorld(false);
    }, 500);

    // ── Video info extraction for the popup ──────────────────
    try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action !== 'getVideoInfo') return;

            let title = document.title
                .replace(/^\(\d+\)\s+/, '')
                .replace(/ - YouTube$/, '');

            let thumbnail = '';
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage?.content) {
                thumbnail = ogImage.content;
            } else if (location.hostname.includes('youtube.com')) {
                const v = new URLSearchParams(window.location.search).get('v');
                if (v) thumbnail = `https://i.ytimg.com/vi/${v}/hqdefault.jpg`;
            }

            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle?.content) title = ogTitle.content;

            sendResponse({
                title:        title || 'Unknown Video',
                thumbnailUrl: thumbnail || ''
            });

            return true; // Keep message channel open for async response
        });
    } catch (err) {
        console.debug('Velocity Prime: Failed to attach message listener.');
    }
}
