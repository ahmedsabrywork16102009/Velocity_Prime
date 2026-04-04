// ============================================================
// Velocity Prime v2.0 — Utilities Module
// Shared helper functions used across popup modules.
// ============================================================

/**
 * Round a number to a given number of decimal places.
 * @param {number} num
 * @param {number} places
 * @returns {number}
 */
export function round(num, places) {
    return parseFloat(Number(num).toFixed(places));
}

/**
 * Initialize the custom quality-select dropdown.
 * Binds all click/close behaviour to the DOM elements.
 */
export function initCustomSelect() {
    const selected   = document.getElementById('quality-selected');
    const itemsList  = document.getElementById('quality-items');
    const hiddenInput = document.getElementById('video-quality');

    if (!selected || !itemsList) return;

    // Toggle open/close on trigger click
    selected.addEventListener('click', function (e) {
        e.stopPropagation();
        this.classList.toggle('select-arrow-active');
        itemsList.classList.toggle('hidden');
    });

    // Handle option selection
    const items = itemsList.querySelectorAll('div');
    items.forEach(item => {
        item.addEventListener('click', function (e) {
            e.stopPropagation();
            selected.innerHTML    = this.innerHTML;
            hiddenInput.value     = this.getAttribute('data-value');

            items.forEach(i => i.classList.remove('same-as-selected'));
            this.classList.add('same-as-selected');

            selected.classList.remove('select-arrow-active');
            itemsList.classList.add('hidden');
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!selected.contains(e.target)) {
            selected.classList.remove('select-arrow-active');
            itemsList.classList.add('hidden');
        }
    });
}
