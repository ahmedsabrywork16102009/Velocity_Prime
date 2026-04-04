// server-status.js — Ping the local server and update the status indicator.

import { pingServer } from '../downloads/api.js';

export function initServerStatus() {
    const dot      = document.getElementById('server-status-dot');
    const label    = document.getElementById('server-status-text');
    const retryBtn = document.getElementById('server-retry-btn');

    function check() {
        pingServer()
            .then(() => {
                if (dot)      dot.className  = 'status-dot online';
                if (label)    label.innerText = 'Server online';
                retryBtn?.classList.add('hidden');
            })
            .catch(() => {
                if (dot)      dot.className  = 'status-dot offline';
                if (label)    label.innerText = 'Server offline — start run_hidden.vbs';
                retryBtn?.classList.remove('hidden');
            });
    }

    retryBtn?.addEventListener('click', check);
    check();
    setInterval(check, 5000);
}
