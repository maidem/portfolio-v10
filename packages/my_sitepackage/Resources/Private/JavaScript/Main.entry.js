console.log("Main JS loaded");

// JetBrains Mono, self-hosted via @fontsource — no Google Fonts, GDPR happy
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/800.css";

import "../Styles/Main.entry.scss";

// syntax highlighting for CKEditor codeBlock output (RTE Default.yaml codeBlock.languages)
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
import "prismjs/components/prism-markup-templating"; // typoscript needs this
import "prismjs/components/prism-typoscript";
import "prismjs/components/prism-twig"; // closest thing to Fluid highlighting
import "prismjs/components/prism-docker";
Prism.highlightAll();

// CKEditor drops empty <p>&nbsp;</p> before/after code blocks — margin:0 on
// them so they don't stack extra spacing on top of the pre-margin
// (see Main.entry.scss .cb-empty-around-code)
const markEmptyParagraphsAroundCode = () => {
    document.querySelectorAll(".cb-news-article-body pre").forEach((pre) => {
        [pre.previousElementSibling, pre.nextElementSibling].forEach((p) => {
            if (p && p.tagName === "P" && p.textContent.trim() === "") {
                p.classList.add("cb-empty-around-code");
            }
        });
    });
};

// copy button for code blocks in the article body
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

// PDF cart — lets you pre-select items for PDF export
import "../../../../maidem_pdfexport/Resources/Private/JavaScript/PdfCart.js";
import "../../../../maidem_pdfexport/Resources/Private/Scss/PdfCart.scss";

// glob import: pulls in every frontend.{js,scss,css} from the content blocks
// automatically
import.meta.glob(
    "../../../ContentBlocks/ContentElements/*/assets/frontend.{js,scss,css}",
    { eager: true },
);

// dimension lines for each news list item (see news-dimension.js)
import "./news-dimension.js";

// generic dimensioning for .js-measure blocks (contact section: section-header,
// contact-info, form) — see measure-block.js
import "./measure-block.js";

// Kontaktformular per fetch absenden statt normalem Submit — kein Seiten-Reload
import "./contact-form.js";

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

        // stagger the fade-in per item
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

    // close on link click
    overlay.querySelectorAll(".cb-nav__overlay-link").forEach((link) => {
        link.addEventListener("click", close);
    });

    // close on backdrop click
    if (backdrop) {
        backdrop.addEventListener("click", close);
    }

    // close on Escape
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
            // only toggle the class matching the link's own type, otherwise an
            // overlay link would also get the desktop link's ::after dot (and
            // vice versa), producing a second stray indicator
            const cls = link.classList.contains("cb-nav__overlay-link")
                ? "cb-nav__overlay-link--active"
                : "cb-nav__link--active";
            link.classList.toggle(cls, isActive);
        });
    };

    // active = last section whose top passed the line just below the nav.
    // at page bottom, the last section (contact) wins even if it never reaches the line
    const update = (updateHash) => {
        const line = scrollY + 100;
        const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
        let current = sections[0];
        for (const section of sections) {
            if (section.offsetTop <= line) current = section;
        }
        if (atBottom) current = sections[sections.length - 1];
        setActive(current.id);
        if (updateHash && location.hash.slice(1) !== current.id) {
            history.replaceState(null, "", `#${current.id}`);
        }
    };

    addEventListener("scroll", () => update(true), { passive: true });
    update(false);
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollspy);
} else {
    initScrollspy();
}
