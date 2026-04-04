// tracker.js — Track video elements and enforce desired playback speed.

import { state }                     from './state.js';
import { isYouTube, nativeSet, nativeGet } from './anti-cheat.js';
import { isAdPlaying }               from './ad-detect.js';
import { showHUD }                   from './hud.js';

export function enforceOnVideo(video) {
    if (!video) return;
    try {
        const target = isAdPlaying(video) ? 16.0 : state.desiredSpeed;
        if (isYouTube) {
            if (Math.abs(video.playbackRate - target) > 0.001) video.playbackRate = target;
        } else {
            const actual = nativeGet ? nativeGet.call(video) : video.playbackRate;
            if (Math.abs(actual - target) > 0.001) nativeSet?.call(video, target);
        }
    } catch {}
}

export function captureVideo(video) {
    if (!video || state.trackedVideos.has(video)) return;
    state.trackedVideos.add(video);
    enforceOnVideo(video);

    const onActive = () => { enforceOnVideo(video); showHUD(state.desiredSpeed); };
    video.addEventListener('play',       onActive, true);
    video.addEventListener('playing',    onActive, true);
    video.addEventListener('loadeddata', onActive, true);
}
