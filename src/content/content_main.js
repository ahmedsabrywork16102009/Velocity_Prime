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

    // HUD (Heads-Up Display) Logic
    let hudTimer = null;

    function updateMainSpeed(speed) {
        const val = Math.max(0.1, Math.min(16, speed));
        desiredSpeed = parseFloat(val.toFixed(2));
        
        const valEl = document.getElementById('vprime-hud-val');
        if (valEl) valEl.innerText = desiredSpeed.toFixed(desiredSpeed % 1 === 0 ? 1 : 2);
        
        window.postMessage({
            type: 'VELOCITY_PRIME_MAIN_UPDATE',
            speed: desiredSpeed
        }, '*');

        trackedVideos.forEach(enforceOnVideo);
    }

    function showHUD(speed) {
        let hud = document.getElementById('velocity-prime-hud');
        if (!hud) {
            hud = document.createElement('div');
            hud.id = 'velocity-prime-hud';
            Object.assign(hud.style, {
                position: 'fixed',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate-900
                color: '#818cf8', // Indigo-400
                padding: '10px 20px',
                borderRadius: '12px',
                fontFamily: '"Outfit", sans-serif',
                fontSize: '24px',
                fontWeight: 'bold',
                zIndex: '2147483647',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                transition: 'opacity 0.3s ease, border-color 0.2s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents: 'auto',
                opacity: '0',
                transform: 'scale(0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'ew-resize',
                userSelect: 'none'
            });

            let isDragging = false;
            let startX = 0;
            let startSpeed = 1.0;

            const handleStart = (clientX) => {
                isDragging = true;
                startX = clientX;
                startSpeed = desiredSpeed;
                hud.style.borderColor = '#818cf8';
                hud.style.boxShadow = '0 0 20px rgba(129, 140, 248, 0.4)';
                document.body.style.cursor = 'ew-resize';
                // Stop the auto-fade timer
                clearTimeout(hudTimer);
            };

            const handleMove = (clientX) => {
                if (!isDragging) return;
                const deltaX = clientX - startX;
                // Sensitivity: 1px = 0.05 speed increment for faster scrubbing
                const newSpeed = startSpeed + (deltaX * 0.05);
                updateMainSpeed(newSpeed);
            };

            const handleEnd = () => {
                if (isDragging) {
                    isDragging = false;
                    hud.style.borderColor = 'rgba(129, 140, 248, 0.3)';
                    hud.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.5)';
                    document.body.style.cursor = '';
                    // Restart auto-fade
                    hudTimer = setTimeout(() => {
                        hud.style.opacity = '0';
                        hud.style.transform = 'scale(0.8)';
                    }, 1500);
                }
            };

            hud.addEventListener('mousedown', (e) => handleStart(e.clientX));
            window.addEventListener('mousemove', (e) => handleMove(e.clientX));
            window.addEventListener('mouseup', handleEnd);

            // Touch support
            hud.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientX));
            window.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientX));
            window.addEventListener('touchend', handleEnd);

            // Keep HUD visible on hover
            hud.addEventListener('mouseenter', () => {
                if (!isDragging) {
                    clearTimeout(hudTimer);
                    hud.style.opacity = '1';
                    hud.style.transform = 'scale(1)';
                }
            });

            hud.addEventListener('mouseleave', () => {
                if (!isDragging) {
                    hudTimer = setTimeout(() => {
                        hud.style.opacity = '0';
                        hud.style.transform = 'scale(0.8)';
                    }, 1000);
                }
            });

            const label = document.createElement('span');
            label.textContent = 'Speed';
            Object.assign(label.style, {
                fontSize: '14px',
                opacity: '0.7',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            });

            const val = document.createElement('span');
            val.id = 'vprime-hud-val';
            val.textContent = '1.0';

            const unit = document.createElement('span');
            unit.textContent = 'x';
            unit.style.color = '#6366f1';

            hud.appendChild(label);
            hud.appendChild(val);
            hud.appendChild(unit);
            document.body.appendChild(hud);
        }

        const valEl = document.getElementById('vprime-hud-val');
        if (valEl) valEl.innerText = speed.toFixed(speed % 1 === 0 ? 1 : 2);

        // Reset timer and show
        clearTimeout(hudTimer);
        hud.style.opacity = '1';
        hud.style.transform = 'scale(1)';

        hudTimer = setTimeout(() => {
            hud.style.opacity = '0';
            hud.style.transform = 'scale(0.8)';
        }, 1500);
    }

    // Listen for speed updates from the popup (via isolated world bridge)
    window.addEventListener('message', (event) => {
        if (!event.data || event.data.type !== 'VELOCITY_PRIME_SYNC') return;
        const newSpeed = parseFloat(event.data.speed) || 1.0;
        
        // Only show HUD if speed actually changed (avoids spam from the 500ms interval)
        if (Math.abs(newSpeed - desiredSpeed) > 0.001) {
            showHUD(newSpeed);
        }
        
        desiredSpeed = newSpeed;
        trackedVideos.forEach(enforceOnVideo); // Instant apply
    });

    // Start the engine
    document.querySelectorAll('video').forEach(captureVideo);
    requestAnimationFrame(quantumLoop);

})();
