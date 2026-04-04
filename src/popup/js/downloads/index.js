// index.js — Downloads controller bootstrap: polling + start/playlist buttons.

import { pollDownloads, startDownload, startPlaylistDownload } from './api.js';
import { renderDownloads } from './cards.js';

export function initDownloadsController() {
    const startBtn    = document.getElementById('start-download-btn');
    const playlistBtn = document.getElementById('download-playlist-btn');
    if (!startBtn) return;

    // ── Polling ────────────────────────────────────────────────
    function poll() {
        pollDownloads().then(data => renderDownloads(data, poll));
    }
    setInterval(poll, 1000);
    poll();

    // ── Single video download ──────────────────────────────────
    startBtn.addEventListener('click', () => {
        const name    = document.getElementById('video-name').value;
        const quality = document.getElementById('video-quality').value;

        function reset(label = '⬇️ Start Download') {
            startBtn.innerText = label; startBtn.disabled = false; startBtn.style.opacity = '1';
        }
        startBtn.innerText = '⏳ Triggering...'; startBtn.disabled = true; startBtn.style.opacity = '0.7';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const url     = startBtn.dataset.videoUrl || tabs[0]?.url || '';
            startDownload({ name, quality, url })
                .then(() => { reset('✅ Started!'); setTimeout(reset, 2000); poll(); })
                .catch(() => { reset('❌ Server Error'); setTimeout(reset, 2000); });
        });
    });

    // ── Playlist download ──────────────────────────────────────
    if (!playlistBtn) return;
    playlistBtn.addEventListener('click', () => {
        const quality = document.getElementById('video-quality').value;

        function reset(text = '📋 Download Playlist') {
            playlistBtn.innerText = text; playlistBtn.disabled = false; playlistBtn.style.opacity = '1';
        }
        playlistBtn.innerText = '⏳ Fetching...'; playlistBtn.disabled = true; playlistBtn.style.opacity = '0.7';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            startPlaylistDownload({ url: tabs[0]?.url || '', quality })
                .then(data => {
                    data.error
                        ? (reset('❌ ' + data.error), setTimeout(reset, 3000))
                        : (reset(`✅ ${data.count} videos queued!`), setTimeout(reset, 3000), poll());
                })
                .catch(() => { reset('❌ Server Error'); setTimeout(reset, 2000); });
        });
    });
}
