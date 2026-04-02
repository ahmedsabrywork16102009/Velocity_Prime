// Velocity Prime v2.0 — Popup Controller

const STEP      = 0.01;
const MIN_SPEED = 0.1;
const MAX_SPEED = 16.0;

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

  // Speed Scrubbing (Hover & Move Logic)
  const speedInputWrapper = document.querySelector('.speed-input-wrapper');
  if (speedInputWrapper) {
    let isDragging = false;
    let startX = 0;
    let startSpeed = 1.0;

    speedInputWrapper.style.cursor = 'ew-resize';

    speedInputWrapper.addEventListener('mousedown', (e) => {
      // If clicking exactly on the input, we might want to focus it instead
      // but usually scrubbing starts on the wrapper/padding
      isDragging = true;
      startX = e.clientX;
      startSpeed = currentSpeed;
      document.body.style.cursor = 'ew-resize';
      speedInputWrapper.classList.add('scrubbing');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      // Sensitivity: 1px = 0.02 speed increment for precise control in popup
      applySpeed(startSpeed + (deltaX * 0.02));
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        speedInputWrapper.classList.remove('scrubbing');
      }
    });

    // Support for scroll wheel on the number itself
    speedInputWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const WHEEL_STEP = 0.05;
      applySpeed(currentSpeed + (e.deltaY > 0 ? -WHEEL_STEP : WHEEL_STEP));
    }, { passive: false });
  }

  slider.onwheel = (e) => {
    e.preventDefault();
    const WHEEL_STEP = 0.01; // Ultra-micro adjustments
    applySpeed((currentSpeed + (e.deltaY > 0 ? -WHEEL_STEP : WHEEL_STEP)).round(2));
  };

  // Preset Buttons (Was broken/missing logic)
  presetBtns.forEach(btn => {
    btn.onclick = () => applySpeed(btn.dataset.speed);
  });

  // Popup-Only Keyboard Shortcuts (Simple keys, no modifiers needed)
  document.addEventListener('keydown', (e) => {
    if (document.activeElement === speedInput) return;

    const key = e.key.toLowerCase();
    
    // R to Reset
    if (key === 'r') {
      e.preventDefault();
      applySpeed(1.0);
      return;
    }

    const FINE_STEP = 0.01;
    if (key === 'arrowup')    { e.preventDefault(); applySpeed((currentSpeed + FINE_STEP).round(2)); return; }
    if (key === 'arrowdown')  { e.preventDefault(); applySpeed((currentSpeed - FINE_STEP).round(2)); return; }
    if (key === 'arrowright') { e.preventDefault(); applySpeed((currentSpeed + FINE_STEP).round(2)); return; }
    if (key === 'arrowleft')  { e.preventDefault(); applySpeed((currentSpeed - FINE_STEP).round(2)); }
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