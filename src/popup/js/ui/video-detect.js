// video-detect.js — Detect video/playlist on the active tab and populate the download panel.

export function fetchVideoInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        const els = {
            noVideo:   document.getElementById('no-video-state'),
            panel:     document.getElementById('download-panel'),
            startBtn:  document.getElementById('start-download-btn'),
            listBtn:   document.getElementById('download-playlist-btn'),
            nameGroup: document.getElementById('video-name-group'),
        };

        // Default: hide everything until detection runs
        els.noVideo?.classList.add('hidden');
        els.panel?.classList.add('hidden');
        els.startBtn?.classList.add('hidden');
        els.listBtn?.classList.add('hidden');
        els.nameGroup?.classList.remove('hidden');

        // Skip internal browser pages
        if (!tab?.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            els.noVideo?.classList.remove('hidden');
            return;
        }

        chrome.scripting.executeScript({ target: { tabId: tab.id }, func: detectPageInfo }, (results) => {
            const res = results?.[0]?.result;
            if (chrome.runtime.lastError || !res) { els.noVideo?.classList.remove('hidden'); return; }
            applyDetectionResult(res, els);
        });
    });
}

/** Runs inside the target page — pure DOM inspection, no closure access. */
function detectPageInfo() {
    const loc    = window.location;
    const params = new URLSearchParams(loc.search);

    const isPurePlaylist = loc.hostname.includes('youtube.com') && loc.pathname === '/playlist' && params.has('list');
    const isVideoPage    = !isPurePlaylist && (
        loc.href.includes('youtube.com/watch') ||
        loc.href.includes('vimeo.com/')        ||
        (!!document.querySelector('video') && !loc.hostname.includes('youtube.com'))
    );
    const hasPlaylist = !isPurePlaylist && loc.hostname.includes('youtube.com') && params.has('list') && params.get('list').length > 0;

    let title = (document.title || '').replace(/^\(\d+\)\s+/, '').replace(/ - YouTube$/, '').trim();
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle?.content) title = ogTitle.content;

    let thumbnail = '';
    if (isPurePlaylist) {
        const count  = document.querySelectorAll('ytd-playlist-panel-video-renderer, ytd-playlist-video-renderer').length;
        const ogImg  = document.querySelector('meta[property="og:image"]');
        if (ogImg?.content) thumbnail = ogImg.content;
        title = `${count > 0 ? count + ' videos — ' : ''}${title}`;
    } else {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage?.content) thumbnail = ogImage.content;
        else if (params.get('v')) thumbnail = `https://i.ytimg.com/vi/${params.get('v')}/hqdefault.jpg`;
        if (!thumbnail) {
            const fav = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
            thumbnail = fav ? fav.href : `${loc.origin}/favicon.ico`;
        }
    }

    const videoUrls = [];
    if (isVideoPage) videoUrls.push(loc.href);
    document.querySelectorAll('iframe').forEach(f => {
        const src = f.src || f.getAttribute('data-src') || '';
        if ((src.includes('youtube') || src.includes('vimeo') || src.includes('bunny') ||
             src.includes('mediadelivery') || src.includes('player.')) && !videoUrls.includes(src))
            videoUrls.push(src);
    });

    return { title, thumbnail, videoUrls, isPurePlaylist, isVideoPage, hasPlaylist };
}

function applyDetectionResult(res, els) {
    const { isPurePlaylist, isVideoPage, hasPlaylist } = res;

    if (!isPurePlaylist && !isVideoPage) {
        els.noVideo?.classList.remove('hidden');
        els.panel?.classList.add('hidden');
        return;
    }

    els.noVideo?.classList.add('hidden');
    els.panel?.classList.remove('hidden');

    if (res.thumbnail) document.getElementById('video-thumbnail').src = res.thumbnail;

    const badge     = document.getElementById('playlist-badge');
    const badgeText = document.getElementById('playlist-badge-text');

    if (isPurePlaylist) {
        badge?.classList.remove('hidden');
        const m = res.title.match(/^(\d+) videos/);
        if (badgeText) badgeText.innerText = m ? `${m[1]} videos` : 'Playlist';
        document.getElementById('video-name').value = res.title.replace(/^\d+ videos — /, '');
        els.nameGroup?.classList.add('hidden');
        els.startBtn?.classList.add('hidden');
        els.listBtn?.classList.remove('hidden');
    } else {
        badge?.classList.add('hidden');
        if (res.title) document.getElementById('video-name').value = res.title;
        if (res.videoUrls.length > 0) els.startBtn.dataset.videoUrl = res.videoUrls[0];
        els.nameGroup?.classList.remove('hidden');
        els.startBtn?.classList.remove('hidden');
        els.listBtn?.classList.toggle('hidden', !hasPlaylist);
    }
}
