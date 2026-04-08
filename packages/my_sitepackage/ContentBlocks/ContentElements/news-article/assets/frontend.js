document.addEventListener("DOMContentLoaded", () => {
    const articleBody = document.querySelector(".cb-news-article-body");
    const tocContainer = document.getElementById(
        "cb-news-article-toc-container",
    );

    if (!articleBody || !tocContainer) return;

    const headings = articleBody.querySelectorAll("h2, h3");
    if (headings.length === 0) return;

    // Mobile Select Dropdown (Auswahlliste)
    const selectWrapper = document.createElement("div");
    selectWrapper.className = "cb-toc-select-wrapper d-md-none mb-4";

    const select = document.createElement("select");
    select.className = "form-select cb-toc-select shadow-sm";
    select.setAttribute("aria-label", "Inhaltsverzeichnis");

    const defaultOption = document.createElement("option");
    defaultOption.textContent = "Inhaltsverzeichnis...";
    defaultOption.value = "";
    select.appendChild(defaultOption);

    select.addEventListener("change", (e) => {
        if (e.target.value) {
            const targetId = e.target.value;
            const targetElement = document.getElementById(targetId);
            const articleContainer = document.querySelector(".cb-news-article");
            const firstHeadingId = headings[0]?.id;

            if (targetElement) {
                // If it's the first heading, scroll to the top of the article container
                let y;
                if (targetId === firstHeadingId && articleContainer) {
                    y = articleContainer.getBoundingClientRect().top + window.scrollY - 40;
                } else {
                    y = targetElement.getBoundingClientRect().top + window.scrollY - 100;
                }
                window.scrollTo({ top: y, behavior: "smooth" });
            }

            // Optionally reset select so users can select the same again if they scroll away
            setTimeout(() => {
                e.target.value = "";
            }, 1000);
        }
    });

    selectWrapper.appendChild(select);

    // Desktop List
    const desktopNav = document.createElement("nav");
    desktopNav.className = "cb-toc-desktop d-none d-md-block";

    const ul = document.createElement("ul");
    ul.className = "cb-toc-list list-unstyled m-0";

    headings.forEach((heading, index) => {
        const id = heading.id || `section-heading-${index}`;
        heading.id = id;

        // Mobile Select Option
        const option = document.createElement("option");
        option.value = id;
        option.textContent = (heading.tagName === "H3" ? "   — " : "") + heading.textContent;
        select.appendChild(option);

        // Sidebar List Item
        const li = document.createElement("li");
        li.className = (heading.tagName === "H3" ? "ms-3 mb-2" : "mb-2");

        const a = document.createElement("a");
        a.href = `#${id}`;
        a.textContent = heading.textContent;
        a.className = "cb-toc-link text-decoration-none text-muted";
        if (heading.tagName === "H2") a.classList.add("fw-bold");

        li.appendChild(a);
        ul.appendChild(li);
    });

    desktopNav.appendChild(ul);

    // Sidebar placement
    const articleContainer = document.querySelector(".cb-news-article");
    if (articleContainer) {
        selectWrapper.style.position = "sticky";
        selectWrapper.style.top = "4rem";
        selectWrapper.style.zIndex = "1030";
        selectWrapper.style.backgroundColor = "#f8f9fa";
        articleContainer.insertBefore(selectWrapper, articleContainer.firstChild);
    }
    tocContainer.appendChild(desktopNav);

    /**
     * Logic: Scroll heading to align with link's sidebar height
     */
    function getTargetViewportY(link) {
        const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const stickyTop = 8 * remInPx; // Viewport top offset
        
        // Use the actual current viewport position of the link 
        // relative to the sticky sidebar container
        const tocRect = tocContainer.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        
        // The distance from the top of the sticky sidebar to the link
        const relativeOffset = linkRect.top - tocRect.top;
        
        return stickyTop + relativeOffset;
    }

    const navLinks = ul.querySelectorAll('.cb-toc-link');

    // Desktop Click: Precision Scroll
    navLinks.forEach((a) => {
        a.addEventListener("click", (e) => {
            e.preventDefault();
            const id = a.getAttribute('href').substring(1);
            const heading = document.getElementById(id);
            if (heading) {
                const scrollY = heading.getBoundingClientRect().top + window.scrollY - getTargetViewportY(a);
                window.scrollTo({ top: scrollY, behavior: "smooth" });
                if (history.replaceState) history.replaceState(null, null, `#${id}`);
            }
        });
    });

    // Mobile Select: Scroll
    select.addEventListener("change", (e) => {
        if (!e.target.value) return;
        const heading = document.getElementById(e.target.value);
        if (heading) {
            // Mobile: Standard Offset
            window.scrollTo({ top: heading.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
        }
    });

    // ScrollSpy: Sync highlights during scroll
    function updateScrollSpy() {
        let activeId = null;
        headings.forEach((heading) => {
            const link = ul.querySelector(`.cb-toc-link[href="#${heading.id}"]`);
            if (!link) return;
            if (heading.getBoundingClientRect().top <= getTargetViewportY(link) + 20) {
                activeId = heading.id;
            }
        });

        navLinks.forEach(link => {
            const id = link.getAttribute('href').substring(1);
            if (id === activeId) {
                link.classList.add('active');
                select.value = id;
            } else {
                link.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', updateScrollSpy);
    updateScrollSpy();
});
