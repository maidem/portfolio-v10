document.addEventListener('DOMContentLoaded', () => {
    const articleBody = document.querySelector('.cb-news-article-body');
    const tocContainer = document.getElementById('cb-news-article-toc-container');
    
    if (!articleBody || !tocContainer) return;

    const headings = articleBody.querySelectorAll('h2, h3');
    if (headings.length === 0) return;

    // Mobile Select Dropdown (Auswahlliste)
    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'cb-toc-select-wrapper d-md-none mb-4';

    const select = document.createElement('select');
    select.className = 'form-select cb-toc-select shadow-sm';
    select.setAttribute('aria-label', 'Inhaltsverzeichnis');
    
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Inhaltsverzeichnis...';
    defaultOption.value = '';
    select.appendChild(defaultOption);

    select.addEventListener('change', (e) => {
        if (e.target.value) {
            const targetId = e.target.value;
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Offset for sticky navs
                const y = targetElement.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
            
            // Optionally reset select so users can select the same again if they scroll away
            setTimeout(() => { e.target.value = ''; }, 1000);
        }
    });

    selectWrapper.appendChild(select);

    // Desktop List
    const desktopNav = document.createElement('nav');
    desktopNav.className = 'cb-toc-desktop d-none d-md-block';
    
    const tocHeading = document.createElement('h2');
    tocHeading.className = 'cb-section-heading mb-4';
    tocHeading.textContent = 'Inhalt';
    desktopNav.appendChild(tocHeading);

    const ul = document.createElement('ul');
    ul.className = 'cb-toc-list list-unstyled m-0';

    headings.forEach((heading, index) => {
        // IDs für Sprungmarken generieren, falls nicht existent
        const id = heading.id || `section-heading-${index}`;
        heading.id = id;

        // --- Option für Mobile Select ---
        const option = document.createElement('option');
        option.value = id;
        option.textContent = (heading.tagName === 'H3' ? '   — ' : '') + heading.textContent;
        select.appendChild(option);

        // --- List Item für Desktop ---
        const li = document.createElement('li');
        li.className = heading.tagName === 'H3' ? 'ms-3 mb-2' : 'mb-2'; 
        
        const a = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = heading.textContent;
        // Minimalist styling for links
        a.className = 'cb-toc-link text-decoration-none text-muted';
        if (heading.tagName === 'H2') {
            a.classList.add('fw-bold');
        }
        
        // Smooth scroll listener for desktop links
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const y = heading.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
            
            // Update URL hash without breaking the "Back" button history
            if(history.replaceState) {
                history.replaceState(null, null, `#${id}`);
            } else {
                // Fallback for older browsers (will break history but works)
                location.replace(`#${id}`);
            }
        });

        li.appendChild(a);
        ul.appendChild(li);
    });

    desktopNav.appendChild(ul);

    // Füge Select-Wrapper direkt oben in den Artikel-Container für Mobile ein
    const articleContainer = document.querySelector('.cb-news-article');
    if (articleContainer) {
        selectWrapper.style.position = 'sticky';
        selectWrapper.style.top = '4rem'; // Knapp unter der Navbar
        selectWrapper.style.zIndex = '1030';
        selectWrapper.style.backgroundColor = '#f8f9fa'; // Passend zur Haupt-Hintergrundfarbe (verdeckt Text)
        selectWrapper.style.padding = '0.5rem 0';
        selectWrapper.style.marginLeft = '-15px';
        selectWrapper.style.marginRight = '-15px';
        selectWrapper.style.paddingLeft = '15px';
        selectWrapper.style.paddingRight = '15px';
        // Füge es ganz oben an
        articleContainer.insertBefore(selectWrapper, articleContainer.firstChild);
    } else {
        tocContainer.appendChild(selectWrapper);
    }

    tocContainer.appendChild(desktopNav);
});
