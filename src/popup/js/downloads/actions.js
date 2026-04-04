// actions.js — Pause / Resume / Remove button handlers for a download card.

import { cancelDownload, deleteDownload, startDownload } from './api.js';

/**
 * Attach event listeners to the three control buttons on a card.
 * @param {HTMLElement} card - The .download-card element
 * @param {string}      id   - Download ID
 * @param {object}      info - Download info object from server
 * @param {Function}    onPoll - Callback to trigger an immediate poll
 */
export function attachCardActions(card, id, info, onPoll) {
    const btnP = card.querySelector(`#dl-p-${id}`);
    const btnR = card.querySelector(`#dl-r-${id}`);
    const btnX = card.querySelector(`#dl-x-${id}`);

    // PAUSE — signal server to cancel; UI switches to resume state
    btnP?.addEventListener('click', () => {
        cancelDownload(id);
        btnP.classList.add('hidden');
        btnR?.classList.remove('hidden');
        const s = document.getElementById(`dl-s-${id}`);
        if (s) s.innerText = '⏸️ Paused';
    });

    // RESUME — delete stale record, restart download (yt-dlp resumes .part file)
    btnR?.addEventListener('click', () => {
        if (!info.url) return;
        deleteDownload(id)
            .then(() => {
                card.remove();
                return startDownload({ name: info.filename, quality: info.quality || '720', url: info.url });
            })
            .then(() => onPoll())
            .catch(() => {});
    });

    // REMOVE — permanently delete from server and remove card from DOM
    btnX?.addEventListener('click', () => {
        deleteDownload(id);
        card.remove();
    });
}
