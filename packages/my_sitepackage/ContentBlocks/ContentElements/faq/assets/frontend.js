document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.cb-faq__item');

    faqItems.forEach(item => {
        const trigger = item.querySelector('.cb-faq__trigger');
        
        trigger.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');
            
            // Toggle current item
            if (isOpen) {
                item.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
            }
            
            // Note: If you wanted only one open at a time, you'd loop 
            // and remove 'is-open' from others here.
        });
    });
});
