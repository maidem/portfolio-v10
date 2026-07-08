console.log("Main JS loaded");

// JetBrains Mono — locally hosted via @fontsource (GDPR-compliant, no Google Fonts)
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/800.css";

import "../Styles/Main.entry.scss";

// Code highlighting for CKEditor codeBlock output (RTE Default.yaml codeBlock.languages)
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-php";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup"; // html
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markup-templating"; // required by typoscript
import "prismjs/components/prism-typoscript";
import "prismjs/components/prism-twig"; // closest highlighting match for Fluid
import "prismjs/components/prism-docker";
Prism.highlightAll();

// Leere <p>&nbsp;</p>, die CKEditor vor/nach einem Codeblock einfügt,
// bekommen margin:0, damit sie keinen zusätzlichen Abstand neben dem
// pre-margin erzeugen (siehe Main.entry.scss .cb-empty-around-code)
const markEmptyParagraphsAroundCode = () => {
    document.querySelectorAll(".cb-news-article-body pre").forEach((pre) => {
        [pre.previousElementSibling, pre.nextElementSibling].forEach((p) => {
            if (p && p.tagName === "P" && p.textContent.trim() === "") {
                p.classList.add("cb-empty-around-code");
            }
        });
    });
};

// Copy-Button für Code-Blöcke im Artikeltext
const initCodeCopy = () => {
    markEmptyParagraphsAroundCode();
    document.querySelectorAll(".cb-news-article-body pre").forEach((pre) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cb-code-copy";
        btn.textContent = "Kopieren";

        const code = pre.querySelector("code");

        btn.addEventListener("click", async () => {
            await navigator.clipboard.writeText(code ? code.textContent : pre.textContent);
            btn.textContent = "Kopiert!";
            setTimeout(() => (btn.textContent = "Kopieren"), 1500);
        });

        pre.appendChild(btn);
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCodeCopy);
} else {
    initCodeCopy();
}

// PDF Cart — pre-selection feature for PDF export
import "../../../../maidem_pdfexport/Resources/Private/JavaScript/PdfCart.js";
import "../../../../maidem_pdfexport/Resources/Private/Scss/PdfCart.scss";

// Vite Collector "Glob-Module" (Best Practice nach Simon Praetorius)
// Alle frontend.{js,scss,css} Dateien aus den Content-Blöcken automatisch laden
import.meta.glob(
    "../../../ContentBlocks/ContentElements/*/assets/frontend.{js,scss,css}",
    { eager: true },
);

// =============================
// Mobile Navigation — Bottom Sheet
// =============================
const initNav = () => {
    const toggle = document.querySelector(".cb-nav__toggle");
    const overlay = document.getElementById("cb-nav-overlay");
    const backdrop = document.getElementById("cb-nav-backdrop");

    if (!toggle || !overlay) return;

    const items = overlay.querySelectorAll(".cb-nav__overlay-item");
    let isOpen = false;

    const open = () => {
        isOpen = true;
        toggle.setAttribute("aria-expanded", "true");
        overlay.classList.add("cb-nav__overlay--open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("cb-nav--open");
        if (backdrop) backdrop.classList.add("cb-nav__backdrop--open");

        // Staggered fade-in for items
        items.forEach((item, i) => {
            item.style.transitionDelay = `${(i + 1) * 55}ms`;
            item.style.opacity = "1";
            item.style.transform = "translateY(0)";
        });
    };

    const close = () => {
        isOpen = false;
        toggle.setAttribute("aria-expanded", "false");
        overlay.classList.remove("cb-nav__overlay--open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("cb-nav--open");
        if (backdrop) backdrop.classList.remove("cb-nav__backdrop--open");

        items.forEach((item) => {
            item.style.transitionDelay = "0ms";
            item.style.opacity = "0";
            item.style.transform = "translateY(10px)";
        });
    };

    toggle.addEventListener("click", () => {
        isOpen ? close() : open();
    });

    // Close on link click
    overlay.querySelectorAll(".cb-nav__overlay-link").forEach((link) => {
        link.addEventListener("click", close);
    });

    // Close on backdrop click
    if (backdrop) {
        backdrop.addEventListener("click", close);
    }

    // Close on Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) {
            close();
            toggle.focus();
        }
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNav);
} else {
    initNav();
}

// =============================
// News Category Filter — Client-side
// =============================
const initNewsFilter = () => {
    const filter = document.querySelector(".cb-news-filter");
    if (!filter) return;

    const buttons = filter.querySelectorAll(".cb-news-filter__btn");
    const items = document.querySelectorAll(".cb-news-item");

    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const selected = btn.dataset.filter;

            buttons.forEach((b) =>
                b.classList.remove("cb-news-filter__btn--active"),
            );
            btn.classList.add("cb-news-filter__btn--active");

            items.forEach((item) => {
                const labels = item.querySelectorAll(".cb-news-category-label");
                const cats = Array.from(labels).map((l) =>
                    l.textContent.trim(),
                );
                const visible = selected === "all" || cats.includes(selected);
                item.style.display = visible ? "" : "none";
            });
        });
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNewsFilter);
} else {
    initNewsFilter();
}

// =============================
// Scrollspy — highlight active nav link for the section in view
// =============================
const initScrollspy = () => {
    const navLinks = document.querySelectorAll(
        ".cb-nav__link[href^='#'], .cb-nav__overlay-link[href^='#']",
    );
    if (!navLinks.length) return;

    const sections = Array.from(navLinks)
        .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
        .filter(Boolean);
    if (!sections.length) return;

    const setActive = (id) => {
        navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("cb-nav__link--active", isActive);
            link.classList.toggle("cb-nav__overlay-link--active", isActive);
        });
    };

    // Active = last section whose top passed the line just below the nav.
    // At page bottom the last section (Kontakt) wins even if its top never reaches it.
    const update = () => {
        const line = scrollY + 100;
        const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
        let current = sections[0];
        for (const section of sections) {
            if (section.offsetTop <= line) current = section;
        }
        if (atBottom) current = sections[sections.length - 1];
        setActive(current.id);
    };

    addEventListener("scroll", update, { passive: true });
    update();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollspy);
} else {
    initScrollspy();
}
