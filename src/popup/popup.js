// Velocity Prime v2.0 — Popup Controller

const STEP      = 0.1;
const MIN_SPEED = 0.1;
const MAX_SPEED = 16.0;

// Keyboard preset map: key -> speed
const KEY_PRESETS = {
  '1': 0.5, '2': 0.75, '3': 1.0,
  '4': 1.25, '5': 1.5, '6': 1.75,
  '7': 2.0, '8': 3.0, '9': 10.0 // Added 10 as per user request
};

let currentSpeed = 1.0;

function initPopup() {
  const slider       = document.getElementById('main-slider');
  const speedInput   = document.getElementById('current-speed-input');
  const speedDownBtn = document.getElementById('speed-down-btn');
  const speedUpBtn   = document.getElementById('speed-up-btn');
  const presetBtns   = document.querySelectorAll('.preset-btn');

  if (!slider || !speedInput) {
    console.error('Critical UI components not found.');
    return;
  }

  function applySpeed(rawSpeed) {
    const speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, parseFloat(rawSpeed)));
    if (isNaN(speed)) return;
    const fixed = parseFloat(speed.toFixed(2));
    currentSpeed = fixed;

    // 1. Update Slider
    slider.value = fixed;
    const pct = (fixed / MAX_SPEED) * 100;
    slider.style.setProperty('--val', `${pct}%`);

    // 2. Update Input (unless it's already focused)
    if (document.activeElement !== speedInput) {
      speedInput.value = Number.isInteger(fixed) ? fixed.toFixed(1) : fixed;
    }

    // 3. Update Preset button styles
    presetBtns.forEach(btn => {
      const btnSpeed = parseFloat(btn.dataset.speed);
      if (Math.abs(btnSpeed - fixed) < 0.05) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 4. Persistence — This synchronizes with content scripts automatically
    chrome.storage.local.set({ globalVideoSpeed: String(fixed) });
  }

  // Initial Load
  chrome.storage.local.get(['globalVideoSpeed'], (res) => {
    applySpeed(res.globalVideoSpeed || '1.0');
  });

  // UI Event Listeners
  if (speedDownBtn) speedDownBtn.onclick = () => applySpeed(currentSpeed - STEP);
  if (speedUpBtn)   speedUpBtn.onclick   = () => applySpeed(currentSpeed + STEP);

  speedInput.onchange = () => applySpeed(speedInput.value);
  speedInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      speedInput.blur();
      applySpeed(speedInput.value);
    }
  };

  slider.oninput = () => applySpeed(slider.value);
  slider.onwheel = (e) => {
    e.preventDefault();
    applySpeed((currentSpeed + (e.deltaY > 0 ? -STEP : STEP)).toFixed(2));
  };

  // Preset Buttons (Was broken/missing logic)
  presetBtns.forEach(btn => {
    btn.onclick = () => applySpeed(btn.dataset.speed);
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (KEY_PRESETS[e.key] !== undefined) { applySpeed(KEY_PRESETS[e.key]); return; }
    if (e.key === 'r' || e.key === 'R')   { applySpeed(1.0); return; }
    if (e.key === 'ArrowUp')    { e.preventDefault(); applySpeed((currentSpeed + STEP).round(2)); return; }
    if (e.key === 'ArrowDown')  { e.preventDefault(); applySpeed((currentSpeed - STEP).round(2)); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); applySpeed((currentSpeed + 0.25).round(2)); return; }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); applySpeed((currentSpeed - 0.25).round(2)); }
  });
}

// Math Utility
Number.prototype.round = function(places) {
  return +(Math.round(this + "e+" + places)  + "e-" + places);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}