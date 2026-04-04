/**
 * Velocity Prime v2.0 — Quantum Lock Engine (MAIN World)
 *
 * Runs in the page's MAIN JavaScript context (no chrome.* API access).
 * This script is wrapped in an IIFE to avoid polluting the global scope.
 *
 * Responsibilities:
 *   • Override HTMLMediaElement.playbackRate on non-YouTube sites to bypass
 *     anti-cheat (always report 1.0 to the site while enforcing true speed).
 *   • Intercept video element creation (React/Vue/etc.) to capture new videos.
 *   • Run a requestAnimationFrame loop (~60fps) to enforce speed on every frame.
 *   • Auto-force 16× during detected ad segments.
 *   • Display a compact on-screen HUD when speed changes.
 *   • Receive speed updates from the ISOLATED world via window.postMessage.
 */

(function () {
    'use strict';

    let desiredSpeed  = 1.0;
    let trackedVideos = new Set();

    // ── Cache native playbackRate descriptor before any site code runs ────────
    const mediaDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
    const nativeSet = mediaDesc?.set ?? null;
    const nativeGet = mediaDesc?.get ?? null;

    // ── Anti-cheat override (disabled on YouTube — breaks DASH buffering) ─────
    const isYouTube = location.hostname.includes('youtube.com');
    if (!isYouTube && nativeSet && nativeGet) {
        Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
            get: function ()  { return 1.0; },    // lie to site code
            set: function ()  { try { nativeSet.call(this, desiredSpeed); } catch (e) {} },
            configurable: true
        });
    }

    // ── Ad detection selectors ────────────────────────────────────────────────
    const AD_SELECTORS = [
        '.ad-showing', '.ad-interrupting', '.video-ads', '.ytp-ad-module',
        '.ima-ad-container', '[data-testid="ad-video"]', '[id^="ad-video"]',
        '[class*="video-ad"]', '[class*="ad-video"]'
    ].join(', ');

    function isAdPlaying(video) {
        if (!video) return false;
        try { return !!video.closest(AD_SELECTORS); } catch (e) { return false; }
    }

    // ── Enforce speed on a single video element ───────────────────────────────
    function enforceOnVideo(video) {
        if (!video) return;
        try {
            const targetSpeed = isAdPlaying(video) ? 16.0 : desiredSpeed;

            if (isYouTube) {
                // Act as a normal setter so YouTube can update its internal UI
                if (Math.abs(video.playbackRate - targetSpeed) > 0.001) {
                    video.playbackRate = targetSpeed;
                }
            } else {
                // God-mode: use the cached native setter directly
                const actual = nativeGet ? nativeGet.call(video) : video.playbackRate;
                if (Math.abs(actual - targetSpeed) > 0.001) {
                    nativeSet?.call(video, targetSpeed);
                }
            }
        } catch (e) {}
    }

    // ── Capture and track a video element ────────────────────────────────────
    function captureVideo(video) {
        if (!video || trackedVideos.has(video)) return;
        trackedVideos.add(video);
        enforceOnVideo(video);

        const onActive = () => {
            enforceOnVideo(video);
            showHUD(desiredSpeed);
        };
        video.addEventListener('play',       onActive, true);
        video.addEventListener('playing',    onActive, true);
        video.addEventListener('loadeddata', onActive, true);
    }

    // ── Intercept dynamic video element creation (React / Vue / etc.) ────────
    const origCreate = Document.prototype.createElement;
    Document.prototype.createElement = function (tag) {
        const el = origCreate.apply(this, arguments);
        if (typeof tag === 'string' && tag.toLowerCase() === 'video') captureVideo(el);
        return el;
    };

    // Intercept addEventListener calls on video elements
    const origAddEvent = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, opts) {
        if (this instanceof HTMLVideoElement) captureVideo(this);
        return origAddEvent.apply(this, arguments);
    };

    // ── Quantum Lock Loop (~60fps via rAF) ────────────────────────────────────
    // Every frame:  enforce speed on all tracked videos.
    // Every second: full DOM scan to discover newly inserted video elements.
    let lastFullScan = 0;

    function quantumLoop(timestamp) {
        trackedVideos.forEach(enforceOnVideo);

        if (timestamp - lastFullScan > 1000) {
            lastFullScan = timestamp;
            document.querySelectorAll('video').forEach(captureVideo);
        }

        requestAnimationFrame(quantumLoop);
    }

    // ── HUD — On-Screen Speed Indicator ──────────────────────────────────────
    let hudTimer = null;

    function showHUD(speed) {
        // Only show when there is at least one tracked video
        if (!trackedVideos.size) return;

        const container = document.body || document.documentElement;
        if (!container) { setTimeout(() => showHUD(speed), 50); return; }

        let hud = document.getElementById('velocity-prime-hud');
        if (!hud) {
            hud    = document.createElement('div');
            hud.id = 'velocity-prime-hud';

            Object.assign(hud.style, {
                position:        'fixed',
                top:             '25px',
                right:           '25px',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                color:           '#818cf8',
                padding:         '6px 14px',
                borderRadius:    '10px',
                fontFamily:      '"Outfit", sans-serif',
                fontSize:        '18px',
                fontWeight:      '800',
                zIndex:          '2147483647',
                border:          '1px solid rgba(129, 140, 248, 0.4)',
                boxShadow:       '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition:      'opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents:   'none',
                opacity:         '0',
                transform:       'scale(0.8)',
                display:         'flex',
                alignItems:      'baseline',
                userSelect:      'none'
            });

            const val  = document.createElement('span');
            val.id     = 'vprime-hud-val';

            const unit = document.createElement('span');
            unit.textContent = 'x';
            Object.assign(unit.style, { fontSize: '14px', marginLeft: '1px', opacity: '0.8' });

            hud.appendChild(val);
            hud.appendChild(unit);
            container.appendChild(hud);
        }

        // Re-attach if detached from the DOM
        if (!hud.parentElement) container.appendChild(hud);

        const valEl = document.getElementById('vprime-hud-val');
        if (valEl) {
            // Show 1 decimal for round numbers (e.g. 2.0), 2 for others (e.g. 1.75)
            const precision = Math.abs(speed * 10 - Math.round(speed * 10)) < 0.001 ? 1 : 2;
            valEl.innerText = speed.toFixed(precision);
        }

        // Animate in, then fade out after 3 seconds
        clearTimeout(hudTimer);
        hud.style.opacity   = '1';
        hud.style.transform = 'scale(1)';

        hudTimer = setTimeout(() => {
            hud.style.opacity   = '0';
            hud.style.transform = 'scale(0.8)';
        }, 3000);
    }

    // ── Update desired speed and notify ISOLATED world ────────────────────────
    function updateMainSpeed(speed) {
        desiredSpeed = parseFloat(Math.max(0.1, Math.min(16, speed)).toFixed(2));
        window.postMessage({ type: 'VELOCITY_PRIME_MAIN_UPDATE', speed: desiredSpeed }, '*');
        trackedVideos.forEach(enforceOnVideo);
    }

    // ── Listen for speed updates from the ISOLATED world ─────────────────────
    window.addEventListener('message', (event) => {
        if (event.data?.type !== 'VELOCITY_PRIME_SYNC') return;
        const newSpeed = parseFloat(event.data.speed) || 1.0;
        const isManual = !!event.data.isManual;

        if (Math.abs(newSpeed - desiredSpeed) > 0.001) {
            if (isManual) showHUD(newSpeed);
            desiredSpeed = newSpeed;
            trackedVideos.forEach(enforceOnVideo);
        }
    });

    // ── Start the engine ──────────────────────────────────────────────────────
    document.querySelectorAll('video').forEach(captureVideo);
    requestAnimationFrame(quantumLoop);

})();
