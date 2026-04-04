// index.js — Isolated world entry point. Boots all modules.

import { applyGlobalSpeed }    from './core.js';
import { initStorage }         from './storage.js';
import { initKeyboard }        from './keyboard.js';
import { initWheel }           from './wheel.js';
import { initVideoInfo }       from './video-info.js';

// Bridge: receive speed updates from MAIN world (HUD interactions)
window.addEventListener('message', (event) => {
    if (event.data?.type !== 'VELOCITY_PRIME_MAIN_UPDATE') return;
    const speed = parseFloat(event.data.speed);
    if (!isNaN(speed)) applyGlobalSpeed(speed);
});

initStorage();
initKeyboard();
initWheel();
initVideoInfo();
