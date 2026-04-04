// intercept.js — Intercept dynamic video creation to capture React/Vue video elements.

import { captureVideo } from './tracker.js';

const _createElement   = Document.prototype.createElement;
const _addEventListener = EventTarget.prototype.addEventListener;

export function applyIntercepts() {
    Document.prototype.createElement = function (tag) {
        const el = _createElement.apply(this, arguments);
        if (typeof tag === 'string' && tag.toLowerCase() === 'video') captureVideo(el);
        return el;
    };

    EventTarget.prototype.addEventListener = function () {
        if (this instanceof HTMLVideoElement) captureVideo(this);
        return _addEventListener.apply(this, arguments);
    };
}
