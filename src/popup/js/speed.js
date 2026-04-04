// ============================================================
// Velocity Prime v2.0 — Speed Controller Module
// Handles all speed-related UI: slider, +/− buttons,
// preset buttons, keyboard shortcuts, and scrubbing.
// ============================================================

import { round } from './utils.js';

const STEP      = 0.05;
const MIN_SPEED = 0.1;
const MAX_SPEED = 16.0;

export function initSpeedController() {
    let currentSpeed = 1.0;

    const slider       = document.getElementById('main-slider');
    const speedInput   = document.getElementById('current-speed-input');
    const speedDownBtn = document.getElementById('speed-down-btn');
    const speedUpBtn   = document.getElementById('speed-up-btn');
    const presetBtns   = document.querySelectorAll('.preset-btn');

    if (!slider || !speedInput) return;

    // ── Core: apply a new speed ─────────────────────────────
    function applySpeed(rawSpeed) {
        const speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, parseFloat(rawSpeed)));
        if (isNaN(speed)) return;

        const fixed  = round(speed, 2);
        currentSpeed = fixed;

        // Sync slider position and CSS fill
        slider.value = fixed;
        slider.style.setProperty('--val', `${(fixed / MAX_SPEED) * 100}%`);

        // Sync input display (skip if user is currently typing)
        if (document.activeElement !== speedInput) {
            speedInput.value = Number.isInteger(fixed) ? fixed.toFixed(1) : fixed;
        }

        // Highlight matching preset button
        presetBtns.forEach(btn => {
            const match = Math.abs(parseFloat(btn.dataset.speed) - fixed) < 0.05;
            btn.classList.toggle('active', match);
        });

        // Persist to storage — content scripts listen to this change
        chrome.storage.local.set({ globalVideoSpeed: String(fixed) });
    }

    // ── Initial load from storage ───────────────────────────
    chrome.storage.local.get(['globalVideoSpeed'], (res) => {
        applySpeed(res.globalVideoSpeed || '1.0');
    });

    // ── Button clicks ───────────────────────────────────────
    if (speedDownBtn) speedDownBtn.onclick = () => applySpeed(currentSpeed - STEP);
    if (speedUpBtn)   speedUpBtn.onclick   = () => applySpeed(currentSpeed + STEP);

    // ── Manual number input ─────────────────────────────────
    speedInput.onchange  = () => applySpeed(speedInput.value);
    speedInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            speedInput.blur();
            applySpeed(speedInput.value);
        }
    };

    // ── Slider ──────────────────────────────────────────────
    slider.oninput = () => applySpeed(slider.value);

    slider.onwheel = (e) => {
        e.preventDefault();
        applySpeed(round(currentSpeed + (e.deltaY > 0 ? -STEP : STEP), 2));
    };

    // ── Speed Scrubbing (click-drag on the number display) ──
    const speedInputWrapper = document.querySelector('.speed-input-wrapper');
    if (speedInputWrapper) {
        let isDragging = false;
        let startX     = 0;
        let startSpeed = 1.0;

        speedInputWrapper.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX     = e.clientX;
            startSpeed = currentSpeed;
            document.body.style.cursor = 'ew-resize';
            speedInputWrapper.classList.add('scrubbing');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            // 1px of drag = 0.02 speed — good balance for popup width
            applySpeed(startSpeed + (e.clientX - startX) * 0.02);
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.cursor = '';
            speedInputWrapper.classList.remove('scrubbing');
        });
    }

    // ── Preset buttons ──────────────────────────────────────
    presetBtns.forEach(btn => {
        btn.onclick = () => applySpeed(btn.dataset.speed);
    });

    // ── Keyboard shortcuts (popup only, no modifier needed) ─
    document.addEventListener('keydown', (e) => {
        // Don't interfere while user is typing in an input
        if (document.activeElement === speedInput || document.activeElement.tagName === 'INPUT') return;

        const key = e.key.toLowerCase();

        if (key === 'r') {
            e.preventDefault();
            applySpeed(1.0);
            return;
        }

        if (key === 'arrowup'   || key === 'arrowright') { e.preventDefault(); applySpeed(round(currentSpeed + STEP, 2)); }
        if (key === 'arrowdown' || key === 'arrowleft')  { e.preventDefault(); applySpeed(round(currentSpeed - STEP, 2)); }
    });
}
