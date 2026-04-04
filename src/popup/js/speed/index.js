// index.js — Speed controller bootstrap. Wires all UI to applySpeed.

import { applySpeed, currentSpeed } from './apply.js';
import { initScrubbing }            from './scrubbing.js';
import { initSpeedKeyboard }        from './keyboard.js';
import { round }                    from '../utils/round.js';
import { STEP }                     from '../constants.js';

export function initSpeedController() {
    const slider       = document.getElementById('main-slider');
    const speedInput   = document.getElementById('current-speed-input');
    const speedDownBtn = document.getElementById('speed-down-btn');
    const speedUpBtn   = document.getElementById('speed-up-btn');
    const presetBtns   = document.querySelectorAll('.preset-btn');

    if (!slider || !speedInput) return;

    // Restore saved speed on open
    chrome.storage.local.get(['globalVideoSpeed'], (res) => {
        applySpeed(res.globalVideoSpeed || '1.0');
    });

    // +/− buttons
    speedDownBtn?.addEventListener('click', () => applySpeed(currentSpeed - STEP));
    speedUpBtn?.addEventListener('click',   () => applySpeed(currentSpeed + STEP));

    // Manual text input
    speedInput.addEventListener('change',  () => applySpeed(speedInput.value));
    speedInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { speedInput.blur(); applySpeed(speedInput.value); }
    });

    // Slider
    slider.addEventListener('input',  () => applySpeed(slider.value));
    slider.addEventListener('wheel', (e) => {
        e.preventDefault();
        applySpeed(round(currentSpeed + (e.deltaY > 0 ? -STEP : STEP), 2));
    }, { passive: false });

    // Preset buttons
    presetBtns.forEach(btn => btn.addEventListener('click', () => applySpeed(btn.dataset.speed)));

    // Sub-features
    initScrubbing();
    initSpeedKeyboard();
}
