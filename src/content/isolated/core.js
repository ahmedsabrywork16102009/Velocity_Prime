// core.js — Shared speed state and core functions for the isolated world.

export let currentSpeed = 1.0;

export function setCurrentSpeed(speed) { currentSpeed = speed; }

export function isContextValid() {
    return !!(typeof chrome !== 'undefined' && chrome.runtime?.id);
}

export function broadcastSpeedToMainWorld(isManual = false) {
    window.postMessage({ type: 'VELOCITY_PRIME_SYNC', speed: currentSpeed, isManual }, '*');
}

export function applyGlobalSpeed(speed) {
    const raw  = parseFloat(speed);
    currentSpeed = parseFloat(Math.max(0.1, Math.min(16.0, isNaN(raw) ? 1.0 : raw)).toFixed(2));
    if (isContextValid()) {
        try { chrome.storage.local.set({ globalVideoSpeed: String(currentSpeed) }); }
        catch { console.debug('Velocity Prime: Storage write skipped.'); }
    }
    broadcastSpeedToMainWorld(true);
}
