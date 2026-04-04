// keyboard.js — Global keyboard shortcuts: Ctrl+Shift+Alt + Arrow / R.

import { applyGlobalSpeed, currentSpeed } from './core.js';

export function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
        if (!e.ctrlKey || !e.shiftKey || !e.altKey) return;

        const key  = e.key.toLowerCase();
        const STEP = 0.05;

        if (key === 'r') { e.preventDefault(); applyGlobalSpeed(1.0); return; }
        if (key === 'arrowup'    || key === 'arrowright') { e.preventDefault(); applyGlobalSpeed(currentSpeed + STEP); }
        if (key === 'arrowdown'  || key === 'arrowleft')  { e.preventDefault(); applyGlobalSpeed(currentSpeed - STEP); }
    }, true);
}
