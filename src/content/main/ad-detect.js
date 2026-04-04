// ad-detect.js — Detect if a video element is inside an ad container.

const AD_SELECTORS = [
    '.ad-showing', '.ad-interrupting', '.video-ads', '.ytp-ad-module',
    '.ima-ad-container', '[data-testid="ad-video"]', '[id^="ad-video"]',
    '[class*="video-ad"]', '[class*="ad-video"]',
].join(', ');

export function isAdPlaying(video) {
    if (!video) return false;
    try { return !!video.closest(AD_SELECTORS); } catch { return false; }
}
