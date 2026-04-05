// keyboard.js — Global keyboard shortcuts: Ctrl+Shift+Alt + Arrow / R.

import { applyGlobalSpeed, currentSpeed } from './core.js';

const snap = (v, step) => Math.floor(Math.round(v * 1e10) / Math.round(step * 1e10) * Math.round(step * 1e10)) / 1e10;

export function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
        if (!e.ctrlKey || !e.shiftKey || !e.altKey) return;

        const key  = e.key.toLowerCase();
        const STEP = 0.05;

        if (key === 'r') { e.preventDefault(); applyGlobalSpeed(1.0); return; }
        if (key === 'arrowup'    || key === 'arrowright') { e.preventDefault(); applyGlobalSpeed(parseFloat((snap(currentSpeed, STEP) + STEP).toFixed(2))); }
        if (key === 'arrowdown'  || key === 'arrowleft')  { e.preventDefault(); applyGlobalSpeed(parseFloat((snap(currentSpeed, STEP) - STEP).toFixed(2))); }
    }, true);
}
