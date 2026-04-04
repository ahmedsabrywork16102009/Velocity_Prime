/** Bind the custom quality-select dropdown to the DOM. */
export function initCustomSelect() {
    const selected    = document.getElementById('quality-selected');
    const itemsList   = document.getElementById('quality-items');
    const hiddenInput = document.getElementById('video-quality');

    if (!selected || !itemsList) return;

    selected.addEventListener('click', function (e) {
        e.stopPropagation();
        this.classList.toggle('select-arrow-active');
        itemsList.classList.toggle('hidden');
    });

    const items = itemsList.querySelectorAll('div');
    items.forEach(item => {
        item.addEventListener('click', function (e) {
            e.stopPropagation();
            selected.innerHTML  = this.innerHTML;
            hiddenInput.value   = this.getAttribute('data-value');
            items.forEach(i => i.classList.remove('same-as-selected'));
            this.classList.add('same-as-selected');
            selected.classList.remove('select-arrow-active');
            itemsList.classList.add('hidden');
        });
    });

    document.addEventListener('click', (e) => {
        if (!selected.contains(e.target)) {
            selected.classList.remove('select-arrow-active');
            itemsList.classList.add('hidden');
        }
    });
}
