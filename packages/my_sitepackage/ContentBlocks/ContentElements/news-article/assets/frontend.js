document.addEventListener("DOMContentLoaded", () => {
    // Scoped per article — supports multiple news-article elements on one page
    document.querySelectorAll(".cb-news-article").forEach((articleEl) => {
        const articleBody = articleEl.querySelector(".cb-news-article-body");
        const tocContainer = articleEl.querySelector(".cb-toc-minimal");

        if (!articleBody || !tocContainer) return;

        const headings = articleBody.querySelectorAll("h2, h3");
        if (headings.length === 0) return;

        // ── Mobile: Collapsible <details>/<summary> Panel ─────────────────
        // Best practice: native HTML, no JS required for toggle, a11y built-in
        const tocPanel = document.createElement("details");
        tocPanel.className = "cb-toc-panel d-md-none";

        const summary = document.createElement("summary");
        summary.className = "cb-toc-panel__header";
        summary.textContent = "Inhaltsübersicht";
        tocPanel.appendChild(summary);

        const mobileUl = document.createElement("ul");
        mobileUl.className = "cb-toc-panel__list list-unstyled m-0";
        tocPanel.appendChild(mobileUl);

        // ── Desktop: Sidebar Nav ──────────────────────────────────────────
        const desktopNav = document.createElement("nav");
        desktopNav.setAttribute("aria-label", "Inhaltsübersicht");
        desktopNav.className = "cb-toc-desktop";

        const ul = document.createElement("ul");
        ul.className = "cb-toc-list list-unstyled m-0";

        headings.forEach((heading, index) => {
            const id = heading.id || `section-heading-${index}`;
            heading.id = id;

            // Mobile panel link
            const mobileLi = document.createElement("li");
            mobileLi.className =
                "cb-toc-panel__item" +
                (heading.tagName === "H3" ? " cb-toc-panel__item--sub" : "");

            const mobileLink = document.createElement("a");
            mobileLink.href = `#${id}`;
            mobileLink.textContent = heading.textContent;
            mobileLink.className = "cb-toc-panel__link";
            mobileLink.addEventListener("click", (e) => {
                e.preventDefault();
                tocPanel.removeAttribute("open"); // Collapse after selection
                const el = document.getElementById(id);
                if (!el) return;
                const navEl = document.querySelector(".cb-nav");
                const navH = navEl ? navEl.offsetHeight : 88;
                window.scrollTo({
                    top:
                        el.getBoundingClientRect().top +
                        window.scrollY -
                        navH -
                        16,
                    behavior: "smooth",
                });
                if (history.replaceState)
                    history.replaceState(null, null, `#${id}`);
            });
            mobileLi.appendChild(mobileLink);
            mobileUl.appendChild(mobileLi);

            // Sidebar list link
            const li = document.createElement("li");
            li.className = heading.tagName === "H3" ? "ms-3 mb-2" : "mb-2";

            const a = document.createElement("a");
            a.href = `#${id}`;
            a.textContent = heading.textContent;
            a.className = "cb-toc-link text-decoration-none";
            if (heading.tagName === "H2") a.classList.add("fw-bold");

            li.appendChild(a);
            ul.appendChild(li);
        });

        desktopNav.appendChild(ul);

        // ── Place Mobile TOC inline before article body ───────────────────
        if (articleBody.parentElement) {
            articleBody.parentElement.insertBefore(tocPanel, articleBody);
        }

        // ── Place Desktop TOC: heading + nav in sidebar container ─────────
        const desktopHeading = document.createElement("div");
        desktopHeading.className = "cb-toc-heading";
        desktopHeading.textContent = "Inhaltsübersicht";
        tocContainer.appendChild(desktopHeading);
        tocContainer.appendChild(desktopNav);

        // ── Precision Scroll for sidebar links ────────────────────────────
        function getTargetViewportY(link) {
            const remInPx = parseFloat(
                getComputedStyle(document.documentElement).fontSize,
            );
            const stickyTop = 8 * remInPx;
            const tocRect = tocContainer.getBoundingClientRect();
            const linkRect = link.getBoundingClientRect();
            return stickyTop + (linkRect.top - tocRect.top);
        }

        const navLinks = ul.querySelectorAll(".cb-toc-link");

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

        // ── ScrollSpy ─────────────────────────────────────────────────────
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
                link.classList.toggle(
                    "active",
                    link.getAttribute("href").substring(1) === activeId,
                );
            });

            mobileUl.querySelectorAll(".cb-toc-panel__link").forEach((link) => {
                link.classList.toggle(
                    "active",
                    link.getAttribute("href").substring(1) === activeId,
                );
            });
        }

        window.addEventListener("scroll", updateScrollSpy, { passive: true });
        updateScrollSpy();
    }); // end querySelectorAll forEach
});
