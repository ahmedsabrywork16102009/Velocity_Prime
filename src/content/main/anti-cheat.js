// anti-cheat.js — Override playbackRate on non-YouTube sites to hide true speed.

import { state } from './state.js';

export const isYouTube = location.hostname.includes('youtube.com');

const mediaDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
export const nativeSet = mediaDesc?.set ?? null;
export const nativeGet = mediaDesc?.get ?? null;

/** Install the anti-cheat property override (skipped on YouTube). */
export function applyAntiCheat() {
    if (isYouTube || !nativeSet || !nativeGet) return;
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
        get: function ()  { return 1.0; },
        set: function ()  { try { nativeSet.call(this, state.desiredSpeed); } catch (e) {} },
        configurable: true,
    });
}
