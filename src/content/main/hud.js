// hud.js — On-screen speed indicator shown when speed changes.

import { state } from './state.js';

let hudTimer = null;

export function showHUD(speed) {
    if (!state.trackedVideos.size) return;

    const container = document.body || document.documentElement;
    if (!container) { setTimeout(() => showHUD(speed), 50); return; }

    let hud = document.getElementById('velocity-prime-hud');
    if (!hud) {
        hud    = document.createElement('div');
        hud.id = 'velocity-prime-hud';
        Object.assign(hud.style, {
            position: 'fixed', top: '25px', right: '25px',
            backgroundColor: 'rgba(15,23,42,0.95)', color: '#818cf8',
            padding: '6px 14px', borderRadius: '10px',
            fontFamily: '"Outfit",sans-serif', fontSize: '18px', fontWeight: '800',
            zIndex: '2147483647', border: '1px solid rgba(129,140,248,0.4)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            pointerEvents: 'none', opacity: '0', transform: 'scale(0.8)',
            display: 'flex', alignItems: 'baseline', userSelect: 'none',
        });

        const val  = document.createElement('span'); val.id = 'vprime-hud-val';
        const unit = document.createElement('span'); unit.textContent = 'x';
        Object.assign(unit.style, { fontSize: '14px', marginLeft: '1px', opacity: '0.8' });
        hud.append(val, unit);
        container.appendChild(hud);
    }

    if (!hud.parentElement) container.appendChild(hud);

    const valEl = document.getElementById('vprime-hud-val');
    if (valEl) {
        const p = Math.abs(speed * 10 - Math.round(speed * 10)) < 0.001 ? 1 : 2;
        valEl.innerText = speed.toFixed(p);
    }

    clearTimeout(hudTimer);
    hud.style.opacity = '1'; hud.style.transform = 'scale(1)';
    hudTimer = setTimeout(() => { hud.style.opacity = '0'; hud.style.transform = 'scale(0.8)'; }, 3000);
}
