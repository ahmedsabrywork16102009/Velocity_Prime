// storage.js — Load initial speed + listen for popup updates via chrome.storage.

import { isContextValid, broadcastSpeedToMainWorld, setCurrentSpeed } from './core.js';

export function initStorage() {
    if (!isContextValid()) return;

    // Load saved speed on startup
    try {
        chrome.storage.local.get(['globalVideoSpeed'], (res) => {
            if (!isContextValid() || chrome.runtime.lastError) return;
            if (res?.globalVideoSpeed) {
                setCurrentSpeed(parseFloat(res.globalVideoSpeed) || 1.0);
                broadcastSpeedToMainWorld(false);
            }
        });
    } catch { console.debug('Velocity Prime: Failed to read initial speed.'); }

    // React to popup changes in real time
    try {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (!isContextValid()) return;
            if (area === 'local' && changes.globalVideoSpeed) {
                setCurrentSpeed(parseFloat(changes.globalVideoSpeed.newValue) || 1.0);
                broadcastSpeedToMainWorld(true);
            }
        });
    } catch { console.debug('Velocity Prime: Failed to attach storage listener.'); }

    // Periodic sync (every 500ms) ensures new iframes/videos receive current speed
    const id = setInterval(() => {
        if (!isContextValid()) { clearInterval(id); return; }
        broadcastSpeedToMainWorld(false);
    }, 500);
}
