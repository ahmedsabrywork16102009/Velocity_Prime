// api.js — Fetch wrappers for all server endpoints.

import { SERVER } from '../constants.js';

export const pollDownloads = () =>
    fetch(`${SERVER}/status/all`).then(r => r.json()).catch(() => ({}));

export const startDownload = (payload) =>
    fetch(`${SERVER}/download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());

export const startPlaylistDownload = (payload) =>
    fetch(`${SERVER}/download/playlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());

export const deleteDownload = (id) =>
    fetch(`${SERVER}/download/${id}`, { method: 'DELETE' }).catch(() => {});

export const cancelDownload = (id) =>
    fetch(`${SERVER}/cancel/${id}`, { method: 'POST' }).catch(() => {});

export const pingServer = () =>
    fetch(`${SERVER}/ping`, { signal: AbortSignal.timeout(2000) }).then(r => r.json());
