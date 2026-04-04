// loop.js — requestAnimationFrame loop that enforces speed at ~60fps.

import { state }          from './state.js';
import { enforceOnVideo, captureVideo } from './tracker.js';

let lastFullScan = 0;

function quantumLoop(timestamp) {
    state.trackedVideos.forEach(enforceOnVideo);

    // Full DOM scan once per second to catch any newly added videos
    if (timestamp - lastFullScan > 1000) {
        lastFullScan = timestamp;
        document.querySelectorAll('video').forEach(captureVideo);
    }

    requestAnimationFrame(quantumLoop);
}

export function startQuantumLoop() {
    requestAnimationFrame(quantumLoop);
}
