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
        if (!e.target.value) return;
        const targetElement = document.getElementById(e.target.value);
        if (!targetElement) return;

        // Calculate sticky offset: nav height + TOC bar height + breathing room
        const navEl = document.querySelector(".cb-nav");
        const navH = navEl ? navEl.offsetHeight : 88;
        const tocH = selectWrapper ? selectWrapper.offsetHeight : 0;
        const offset = navH + tocH + 16;

        window.scrollTo({
            top:
                targetElement.getBoundingClientRect().top +
                window.scrollY -
                offset,
            behavior: "smooth",
        });

        // Reset so users can re-select the same entry after scrolling away
        setTimeout(() => {
            e.target.value = "";
        }, 1000);
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
        option.textContent =
            (heading.tagName === "H3" ? "   — " : "") + heading.textContent;
        select.appendChild(option);

        // Sidebar List Item
        const li = document.createElement("li");
        li.className = heading.tagName === "H3" ? "ms-3 mb-2" : "mb-2";

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
        selectWrapper.style.top = "5.5rem"; // Below cb-nav (88px)
        selectWrapper.style.zIndex = "1030";
        selectWrapper.style.marginBottom = "1.5rem";
        articleContainer.insertBefore(
            selectWrapper,
            articleContainer.firstChild,
        );
    }
    tocContainer.appendChild(desktopNav);

    /**
     * Logic: Scroll heading to align with link's sidebar height
     */
    function getTargetViewportY(link) {
        const remInPx = parseFloat(
            getComputedStyle(document.documentElement).fontSize,
        );
        const stickyTop = 8 * remInPx; // Viewport top offset

        // Use the actual current viewport position of the link
        // relative to the sticky sidebar container
        const tocRect = tocContainer.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();

        // The distance from the top of the sticky sidebar to the link
        const relativeOffset = linkRect.top - tocRect.top;

        return stickyTop + relativeOffset;
    }

    const navLinks = ul.querySelectorAll(".cb-toc-link");

    // Desktop Click: Precision Scroll
    navLinks.forEach((a) => {
        a.addEventListener("click", (e) => {
            e.preventDefault();
            const id = a.getAttribute("href").substring(1);
            const heading = document.getElementById(id);
            if (heading) {
                const scrollY =
                    heading.getBoundingClientRect().top +
                    window.scrollY -
                    getTargetViewportY(a);
                window.scrollTo({ top: scrollY, behavior: "smooth" });
                if (history.replaceState)
                    history.replaceState(null, null, `#${id}`);
            }
        });
    });

    // ScrollSpy: Sync highlights during scroll
    function updateScrollSpy() {
        let activeId = null;
        headings.forEach((heading) => {
            const link = ul.querySelector(
                `.cb-toc-link[href="#${heading.id}"]`,
            );
            if (!link) return;
            if (
                heading.getBoundingClientRect().top <=
                getTargetViewportY(link) + 20
            ) {
                activeId = heading.id;
            }
        });

        navLinks.forEach((link) => {
            const id = link.getAttribute("href").substring(1);
            if (id === activeId) {
                link.classList.add("active");
                select.value = id;
                // Mark select wrapper so CSS can highlight it with brand blue
                if (select.parentElement)
                    select.parentElement.classList.add("has-active");
                select.classList.add("has-selection");
            } else {
                link.classList.remove("active");
            }
        });

        if (!activeId) {
            select.classList.remove("has-selection");
        }
    }

    window.addEventListener("scroll", updateScrollSpy);
    updateScrollSpy();
});
