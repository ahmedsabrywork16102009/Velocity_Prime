// bridge.js — Listen for speed updates from the ISOLATED world via postMessage.

import { state }          from './state.js';
import { enforceOnVideo } from './tracker.js';
import { showHUD }        from './hud.js';

export function initBridge() {
    window.addEventListener('message', (event) => {
        if (event.data?.type !== 'VELOCITY_PRIME_SYNC') return;
        const newSpeed = parseFloat(event.data.speed) || 1.0;
        const isManual = !!event.data.isManual;

        if (Math.abs(newSpeed - state.desiredSpeed) > 0.001) {
            if (isManual) showHUD(newSpeed);
            state.desiredSpeed = newSpeed;
            state.trackedVideos.forEach(enforceOnVideo);
        }
    });
}
