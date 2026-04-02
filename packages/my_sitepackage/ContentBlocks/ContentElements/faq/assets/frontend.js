(function() {
    /**
     * FAQ Toggle Logic - Bundled via Vite Glob Import
     */
    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('.cb-faq__trigger');
        if (!trigger) return;

        const item = trigger.closest('.cb-faq__item');
        if (!item) return;

        const isOpen = item.classList.contains('is-open');
        
        // Toggle current item
        if (isOpen) {
            item.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        } else {
            item.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
        }
    });
})();
