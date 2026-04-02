/**
 * Velocity Prime v1.8 — Quantum Lock Engine (God-Mode MAIN World)
 * Runs 60 times per second using requestAnimationFrame to lock speed instantly.
 */

(function() {
    let desiredSpeed = 1.0;
    let trackedVideos = new Set();

    // Cache native descriptor BEFORE site code can tamper with it
    const mediaDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
    const nativeSet = mediaDesc ? mediaDesc.set : null;
    const nativeGet = mediaDesc ? mediaDesc.get : null;

    // THE ILLUSION FIELD: Lie to the site's anti-cheat — always report speed as 1.0
    // Disabled on YouTube because lying about playbackRate breaks its DASH buffering algorithm.
    const isYouTube = location.hostname.includes('youtube.com');
    if (!isYouTube && nativeSet && nativeGet) {
        Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
            get: function() { return 1.0; },
            set: function() { try { nativeSet.call(this, desiredSpeed); } catch(e) {} },
            configurable: true
        });
    }

    const adSelectors = [
        '.ad-showing',
        '.ad-interrupting',
        '.video-ads',
        '.ytp-ad-module',
        '.ima-ad-container',
        '[data-testid="ad-video"]',
        '[id^="ad-video"]',
        '[class*="video-ad"]',
        '[class*="ad-video"]'
    ].join(', ');

    function isAdPlaying(video) {
        if (!video) return false;
        try {
            return !!video.closest(adSelectors);
        } catch (e) {
            return false;
        }
    }

    function enforceOnVideo(video) {
        if (!video) return;
        try {
            let targetSpeed = desiredSpeed;
            
            // Auto-speedup if video is inside an ad container
            if (isAdPlaying(video)) {
                targetSpeed = 16.0;
            }

            if (isYouTube) {
                // On YouTube, act like a normal bookmarklet so YouTube updates its internal state & UI
                if (Math.abs(video.playbackRate - targetSpeed) > 0.001) {
                    video.playbackRate = targetSpeed;
                }
            } else {
                // God-mode for Inkrypt / strict sites
                const actual = nativeGet ? nativeGet.call(video) : video.playbackRate;
                if (Math.abs(actual - targetSpeed) > 0.001) {
                    if (nativeSet) nativeSet.call(video, targetSpeed);
                }
            }
        } catch(e) {}
    }

    function captureVideo(video) {
        if (!video || trackedVideos.has(video)) return;
        trackedVideos.add(video);
        enforceOnVideo(video);
        const e = () => enforceOnVideo(video);
        video.addEventListener('play', e, true);
        video.addEventListener('playing', e, true);
        video.addEventListener('loadeddata', e, true);
    }

    // Intercept all video tags created by React/Vue/Inkrypt engine
    const origCreate = Document.prototype.createElement;
    Document.prototype.createElement = function(tag) {
        const el = origCreate.apply(this, arguments);
        if (typeof tag === 'string' && tag.toLowerCase() === 'video') captureVideo(el);
        return el;
    };

    // Intercept addEventListener to catch any video getting connected
    const origAddEvent = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, fn, opts) {
        if (this instanceof HTMLVideoElement) captureVideo(this);
        return origAddEvent.apply(this, arguments);
    };

    // ────────────────────────────────────────────────────────────────────────
    // QUANTUM LOCK: requestAnimationFrame loops at ~60fps
    // Every single frame: enforce speed on all known videos
    // Every 1000ms: do a full DOM scan to discover any new videos
    // ────────────────────────────────────────────────────────────────────────
    let lastFullScan = 0;
    function quantumLoop(timestamp) {
        trackedVideos.forEach(enforceOnVideo);

        if (timestamp - lastFullScan > 1000) {
            lastFullScan = timestamp;
            document.querySelectorAll('video').forEach(captureVideo);
        }

        requestAnimationFrame(quantumLoop);
    }

    // Listen for speed updates from the popup (via isolated world bridge)
    window.addEventListener('message', (event) => {
        if (!event.data || event.data.type !== 'VELOCITY_PRIME_SYNC') return;
        desiredSpeed = parseFloat(event.data.speed) || 1.0;
        trackedVideos.forEach(enforceOnVideo); // Instant apply
    });

    // Start the engine
    document.querySelectorAll('video').forEach(captureVideo);
    requestAnimationFrame(quantumLoop);

})();
