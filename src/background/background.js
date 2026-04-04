// ============================================================
// Velocity Prime v2.0 — Background Service Worker
//
// Responsibilities:
//   • Wake the local Python download server via Native Messaging
//     when the popup requests it (action: 'wake_server').
//   • The native host pings the server and returns once it is ready.
// ============================================================

const HOST_NAME = 'com.velocityprime.bridge';
const SERVER    = 'http://127.0.0.1:9527';

/**
 * Wake the Python server via Native Messaging.
 * Resolves once the server signals readiness, rejects on error.
 * @returns {Promise<void>}
 */
function wakeServer() {
    return new Promise((resolve, reject) => {
        let port;
        try {
            port = chrome.runtime.connectNative(HOST_NAME);
        } catch (e) {
            reject(e);
            return;
        }

        port.onMessage.addListener(() => {
            port.disconnect();
            // Give the server 1.5 s to begin listening on its port
            setTimeout(resolve, 1500);
        });

        port.onDisconnect.addListener(() => {
            const err = chrome.runtime.lastError;
            if (err) reject(new Error(err.message));
            else setTimeout(resolve, 1500);
        });

        port.postMessage({ action: 'wake' });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action !== 'wake_server') return;

    wakeServer()
        .then(()  => sendResponse({ ok: true }))
        .catch((e) => sendResponse({ ok: false, error: e.message }));

    return true; // Keep message channel open for async response
});
