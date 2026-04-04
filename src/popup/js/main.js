// main.js — Popup entry point. Imports and boots all modules.

import { initTabs }                from './ui/tabs.js';
import { initServerStatus }        from './ui/server-status.js';
import { fetchVideoInfo }          from './ui/video-detect.js';
import { initSpeedController }     from './speed/index.js';
import { initCustomSelect }        from './utils/custom-select.js';
import { initDownloadsController } from './downloads/index.js';

function initPopup() {
    initTabs();
    initSpeedController();
    initCustomSelect();
    initDownloadsController();
    initServerStatus();
    fetchVideoInfo();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup);
} else {
    initPopup();
}
