// index.js — MAIN world entry point. esbuild wraps this in an IIFE automatically.

import { applyAntiCheat }  from './anti-cheat.js';
import { applyIntercepts } from './intercept.js';
import { captureVideo }    from './tracker.js';
import { startQuantumLoop } from './loop.js';
import { initBridge }      from './bridge.js';

// 1. Install anti-cheat before any site code can override playbackRate
applyAntiCheat();

// 2. Intercept dynamic video creation (React, Vue, Angular, etc.)
applyIntercepts();

// 3. Connect to the isolated world speed broadcaster
initBridge();

// 4. Capture any videos already in the DOM at injection time
document.querySelectorAll('video').forEach(captureVideo);

// 5. Start the 60fps enforcement loop
startQuantumLoop();
