// keyboard.js — Arrow key shortcuts inside the popup window.

import { applySpeed, currentSpeed } from './apply.js';
import { round }                    from '../utils/round.js';
import { STEP }                     from '../constants.js';

const snap = (v, step) => Math.floor(round(v, 10) / step) * step;

export function initSpeedKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (document.activeElement?.tagName === 'INPUT') return;

        const key = e.key.toLowerCase();

        if (key === 'r') { e.preventDefault(); applySpeed(1.0); return; }

        if (key === 'arrowup'   || key === 'arrowright') { e.preventDefault(); applySpeed(round(snap(currentSpeed, STEP) + STEP, 2)); }
        if (key === 'arrowdown' || key === 'arrowleft')  { e.preventDefault(); applySpeed(round(snap(currentSpeed, STEP) - STEP, 2)); }
    });
}
