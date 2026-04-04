// cards.js — Render and update download cards in the active-downloads list.

import { attachCardActions } from './actions.js';

const CARD_HTML = (id, filename) => `
    <div class="dl-header">
        <div class="dl-title" title="${filename}">${filename}</div>
        <div class="dl-status" id="dl-s-${id}">--</div>
    </div>
    <div class="dl-progress-row">
        <div class="progress-bar-track">
            <div id="dl-pb-${id}" class="progress-bar-fill"></div>
        </div>
        <div class="dl-controls" id="dl-ctrls-${id}">
            <button id="dl-p-${id}" class="ctrl-btn pause-btn" title="Pause">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button id="dl-r-${id}" class="ctrl-btn pause-btn hidden" title="Resume">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button id="dl-x-${id}" class="ctrl-btn stop-btn" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
        </div>
    </div>
`;

export function renderDownloads(downloads, onPoll) {
    const list = document.getElementById('active-downloads-list');
    if (!list) return;

    // Remove cards that no longer exist on the server
    list.querySelectorAll('.download-card').forEach(card => {
        if (!downloads[card.dataset.id]) card.remove();
    });

    for (const [id, info] of Object.entries(downloads)) {
        let card = document.getElementById(`dl-c-${id}`);
        if (!card) {
            card            = document.createElement('div');
            card.id         = `dl-c-${id}`;
            card.className  = 'download-card';
            card.dataset.id = id;
            card.innerHTML  = CARD_HTML(id, info.filename || 'Video');
            list.prepend(card);
            attachCardActions(card, id, info, onPoll);
        }
        updateCardState(id, info);
    }
}

function updateCardState(id, info) {
    const s    = document.getElementById(`dl-s-${id}`);
    const p    = document.getElementById(`dl-pb-${id}`);
    const btnP = document.getElementById(`dl-p-${id}`);
    const btnR = document.getElementById(`dl-r-${id}`);

    if (!s) return;

    const q = info.quality === 'audio' ? 'Audio' : `${info.quality || ''}p`;
    const z = info.size  ? ` • ${info.size}`  : '';
    const v = info.speed ? ` (${info.speed})` : '';

    const hide = (...els) => els.forEach(e => e?.classList.add('hidden'));
    const show = (...els) => els.forEach(e => e?.classList.remove('hidden'));

    switch (info.status) {
        case 'queued':
            s.innerText = '🕐 Queued'; s.style.color = 'var(--muted)';
            if (p) p.style.width = '0%'; hide(btnP, btnR); break;
        case 'started':
        case 'downloading':
            s.innerText = `[${q}]${z} • ${info.progress}%${v}`; s.style.color = 'var(--accent)';
            if (p) p.style.width = `${info.progress}%`; show(btnP); hide(btnR); break;
        case 'done':
            s.innerText = `✅ Done [${q}]${z}`; s.style.color = '#50fa7b';
            if (p) p.style.width = '100%'; hide(btnP, btnR); break;
        case 'error':
            s.innerText = '❌ Error'; s.style.color = 'var(--danger)'; hide(btnP, btnR); break;
        case 'cancelled':
            s.innerText = '⏸️ Paused'; s.style.color = 'var(--muted)';
            hide(btnP);
            info.url ? show(btnR) : hide(btnR); break;
    }
}
