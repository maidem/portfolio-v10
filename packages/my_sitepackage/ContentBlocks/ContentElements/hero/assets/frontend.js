/**
 * Unified Hero & FAQ Accordion Logic
 */
(function() {
    'use strict';

    const initFaqAccordion = () => {
        const triggers = document.querySelectorAll('.cb-faq__trigger');
        
        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const item = trigger.closest('.cb-faq__item');
                const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

                // Close all other items in the same container
                const container = item.closest('.cb-faq__list');
                const allItems = container.querySelectorAll('.cb-faq__item');
                allItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('is-open');
                        otherItem.querySelector('.cb-faq__trigger').setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle current item
                item.classList.toggle('is-open');
                trigger.setAttribute('aria-expanded', !isExpanded);
            });
        });
    };

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFaqAccordion);
    } else {
        initFaqAccordion();
    }
})();
