// scrubbing.js — Click-drag on the speed display to scrub speed.

import { applySpeed, currentSpeed } from './apply.js';

export function initScrubbing() {
    const wrapper = document.querySelector('.speed-input-wrapper');
    if (!wrapper) return;

    let isDragging = false;
    let startX     = 0;
    let startSpeed = 1.0;

    wrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX     = e.clientX;
        startSpeed = currentSpeed;
        document.body.style.cursor = 'ew-resize';
        wrapper.classList.add('scrubbing');
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        // 1 px = 0.02 speed units — good balance for popup width
        applySpeed(startSpeed + (e.clientX - startX) * 0.02);
    });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.cursor = '';
        wrapper.classList.remove('scrubbing');
    });
}
