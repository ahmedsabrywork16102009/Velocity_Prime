// ============================================================
// Velocity Prime v2.0 — Downloads Controller Module
// Manages the download panel: polling server status,
// rendering download cards, and handling user actions
// (start, pause, resume, remove) for single videos & playlists.
// ============================================================

const SERVER = 'http://127.0.0.1:9527';

export function initDownloadsController() {
    const startDownloadBtn = document.getElementById('start-download-btn');
    if (!startDownloadBtn) return;

    // ── Poll server every second ─────────────────────────────
    setInterval(pollAllDownloads, 1000);
    pollAllDownloads();

    function pollAllDownloads() {
        fetch(`${SERVER}/status/all`)
            .then(r  => r.json())
            .then(data => renderDownloads(data))
            .catch(() => {});
    }

    // ── Render / update download cards ──────────────────────
    function renderDownloads(downloads) {
        const list = document.getElementById('active-downloads-list');
        if (!list) return;

        // Remove cards that no longer exist on the server
        list.querySelectorAll('.download-card').forEach(card => {
            if (!downloads[card.dataset.id]) card.remove();
        });

        for (const [id, info] of Object.entries(downloads)) {
            let card = document.getElementById(`dl-c-${id}`);

            // ── Create card if it doesn't exist yet ──────────
            if (!card) {
                card = document.createElement('div');
                card.id        = `dl-c-${id}`;
                card.className = 'download-card';
                card.dataset.id = id;
                list.prepend(card);

                card.innerHTML = `
                    <div class="dl-header">
                        <div class="dl-title" title="${info.filename || 'Video'}">${info.filename || 'Video'}</div>
                        <div class="dl-status" id="dl-s-${id}">--</div>
                    </div>
                    <div class="dl-progress-row">
                        <div class="progress-bar-track">
                            <div id="dl-pb-${id}" class="progress-bar-fill"></div>
                        </div>
                        <div class="dl-controls" id="dl-ctrls-${id}">
                            <button id="dl-p-${id}" class="ctrl-btn pause-btn" title="Pause Download">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            </button>
                            <button id="dl-r-${id}" class="ctrl-btn pause-btn hidden" title="Resume Download">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            </button>
                            <button id="dl-x-${id}" class="ctrl-btn stop-btn" title="Remove">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                            </button>
                        </div>
                    </div>
                `;

                const btnP = card.querySelector(`#dl-p-${id}`);
                const btnR = card.querySelector(`#dl-r-${id}`);
                const btnX = card.querySelector(`#dl-x-${id}`);

                // PAUSE — signal server to cancel; keep record in paused state
                btnP.addEventListener('click', () => {
                    fetch(`${SERVER}/cancel/${id}`, { method: 'POST' }).catch(() => {});
                    btnP.classList.add('hidden');
                    btnR.classList.remove('hidden');
                    const s = document.getElementById(`dl-s-${id}`);
                    if (s) s.innerText = '⏸️ Paused';
                });

                // RESUME — delete old record then start a fresh download
                // (yt-dlp auto-resumes from the .part file in the temp dir)
                btnR.addEventListener('click', () => {
                    if (!info.url) return;
                    fetch(`${SERVER}/download/${id}`, { method: 'DELETE' })
                        .then(() => {
                            card.remove();
                            return fetch(`${SERVER}/download`, {
                                method:  'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body:    JSON.stringify({
                                    name:    info.filename,
                                    quality: info.quality || '720',
                                    url:     info.url
                                })
                            });
                        })
                        .then(() => pollAllDownloads())
                        .catch(() => {});
                });

                // REMOVE — permanently delete from server + remove card
                btnX.addEventListener('click', () => {
                    fetch(`${SERVER}/download/${id}`, { method: 'DELETE' }).catch(() => {});
                    card.remove();
                });
            }

            // ── Update card state ─────────────────────────────
            const s    = document.getElementById(`dl-s-${id}`);
            const p    = document.getElementById(`dl-pb-${id}`);
            const btnP = document.getElementById(`dl-p-${id}`);
            const btnR = document.getElementById(`dl-r-${id}`);

            if (!s) continue;

            const qualStr = info.quality === 'audio' ? 'Audio' : `${info.quality || ''}p`;
            const sizeStr = info.size  ? ` • ${info.size}`  : '';
            const spdStr  = info.speed ? ` (${info.speed})` : '';

            if (info.status === 'queued') {
                s.innerText    = '🕐 Queued';
                s.style.color  = 'var(--muted)';
                if (p)    p.style.width = '0%';
                if (btnP) btnP.classList.add('hidden');
                if (btnR) btnR.classList.add('hidden');

            } else if (info.status === 'started' || info.status === 'downloading') {
                s.innerText    = `[${qualStr}]${sizeStr} • ${info.progress}%${spdStr}`;
                s.style.color  = 'var(--accent)';
                if (p)    p.style.width = `${info.progress}%`;
                if (btnP) btnP.classList.remove('hidden');
                if (btnR) btnR.classList.add('hidden');

            } else if (info.status === 'done') {
                s.innerText    = `✅ Done [${qualStr}]${sizeStr}`;
                s.style.color  = '#50fa7b';
                if (p)    p.style.width = '100%';
                if (btnP) btnP.classList.add('hidden');
                if (btnR) btnR.classList.add('hidden');

            } else if (info.status === 'error') {
                s.innerText    = '❌ Error';
                s.style.color  = 'var(--danger)';
                if (btnP) btnP.classList.add('hidden');
                if (btnR) btnR.classList.add('hidden');

            } else if (info.status === 'cancelled') {
                s.innerText    = '⏸️ Paused';
                s.style.color  = 'var(--muted)';
                if (btnP)         btnP.classList.add('hidden');
                if (btnR && info.url) btnR.classList.remove('hidden');
                else if (btnR)    btnR.classList.add('hidden');
            }
        }
    }

    // ── Single Video Download ────────────────────────────────
    startDownloadBtn.addEventListener('click', () => {
        const videoName    = document.getElementById('video-name').value;
        const videoQuality = document.getElementById('video-quality').value;
        const btn          = startDownloadBtn;

        btn.innerText     = '⏳ Triggering...';
        btn.disabled      = true;
        btn.style.opacity = '0.7';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const pageUrl  = tabs[0]?.url || '';
            const videoUrl = btn.dataset.videoUrl || pageUrl;
            const payload  = { name: videoName, quality: videoQuality, url: videoUrl };

            function reset(label = '⬇️ Start Download') {
                btn.innerText     = label;
                btn.disabled      = false;
                btn.style.opacity = '1';
            }

            fetch(`${SERVER}/download`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            })
            .then(r  => r.json())
            .then(() => {
                reset('✅ Started!');
                setTimeout(() => reset(), 2000);
                pollAllDownloads();
            })
            .catch(() => {
                reset('❌ Server Error');
                setTimeout(() => reset(), 2000);
            });
        });
    });

    // ── Playlist Download ────────────────────────────────────
    const playlistBtn = document.getElementById('download-playlist-btn');
    if (!playlistBtn) return;

    playlistBtn.addEventListener('click', () => {
        const videoQuality = document.getElementById('video-quality').value;

        playlistBtn.innerText     = '⏳ Fetching playlist...';
        playlistBtn.disabled      = true;
        playlistBtn.style.opacity = '0.7';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const pageUrl = tabs[0]?.url || '';
            const payload = { url: pageUrl, quality: videoQuality };

            function resetPlaylist(text = '📋 Download Playlist') {
                playlistBtn.innerText     = text;
                playlistBtn.disabled      = false;
                playlistBtn.style.opacity = '1';
            }

            fetch(`${SERVER}/download/playlist`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            })
            .then(r  => r.json())
            .then(data => {
                if (data.error) {
                    resetPlaylist('❌ ' + data.error);
                    setTimeout(() => resetPlaylist(), 3000);
                } else {
                    resetPlaylist(`✅ ${data.count} videos queued!`);
                    setTimeout(() => resetPlaylist(), 3000);
                    pollAllDownloads();
                }
            })
            .catch(() => {
                resetPlaylist('❌ Server Error');
                setTimeout(() => resetPlaylist(), 2000);
            });
        });
    });
}
