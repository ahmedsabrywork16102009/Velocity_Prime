// video-info.js — Respond to getVideoInfo messages from the popup.

import { isContextValid } from './core.js';

export function initVideoInfo() {
    if (!isContextValid()) return;
    try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action !== 'getVideoInfo') return;

            let title     = document.title.replace(/^\(\d+\)\s+/, '').replace(/ - YouTube$/, '');
            let thumbnail = '';

            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage?.content) thumbnail = ogImage.content;
            else if (location.hostname.includes('youtube.com')) {
                const v = new URLSearchParams(window.location.search).get('v');
                if (v) thumbnail = `https://i.ytimg.com/vi/${v}/hqdefault.jpg`;
            }

            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle?.content) title = ogTitle.content;

            sendResponse({ title: title || 'Unknown Video', thumbnailUrl: thumbnail || '' });
            return true;
        });
    } catch { console.debug('Velocity Prime: Failed to attach message listener.'); }
}
