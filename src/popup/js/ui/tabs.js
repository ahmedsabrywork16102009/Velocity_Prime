// tabs.js — Tab switching and persisting active tab to chrome.storage.

export function initTabs() {
    const tabBtns  = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.tab;

            tabBtns.forEach(b  => b.classList.remove('active'));
            tabPanes.forEach(p => { p.classList.add('hidden'); p.classList.remove('active'); });

            btn.classList.add('active');
            const pane = document.getElementById(targetId);
            pane?.classList.remove('hidden');
            pane?.classList.add('active');

            // Server status bar only relevant on downloads tab
            document.getElementById('server-status-bar')
                ?.classList.toggle('hidden', targetId !== 'downloads-tab');

            chrome.storage.local.set({ activeTab: targetId });
        });
    });

    // Restore previously active tab
    chrome.storage.local.get(['activeTab'], (data) => {
        const valid  = ['speed-tab', 'downloads-tab'];
        const target = valid.includes(data.activeTab) ? data.activeTab : 'speed-tab';
        document.querySelector(`.tab-btn[data-tab="${target}"]`)?.click();
    });
}
