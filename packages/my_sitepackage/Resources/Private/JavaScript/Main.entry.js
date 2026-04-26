console.log("Main JS loaded");

// Bootstrap JS – nur Modal-Komponente
import "bootstrap/js/dist/modal";

// JetBrains Mono — locally hosted via @fontsource (GDPR-compliant, no Google Fonts)
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";

import "../Styles/Main.entry.scss";

// Vite Collector "Glob-Module" (Best Practice nach Simon Praetorius)
// Alle frontend.{js,scss,css} Dateien aus den Content-Blöcken automatisch laden
import.meta.glob(
    "../../../ContentBlocks/ContentElements/*/assets/frontend.{js,scss,css}",
    { eager: true },
);

// =============================
// Mobile Navigation Overlay
// =============================
const initNav = () => {
    const toggle = document.querySelector(".cb-nav__toggle");
    const overlay = document.getElementById("cb-nav-overlay");

    if (!toggle || !overlay) return;

    const items = overlay.querySelectorAll(".cb-nav__overlay-item");
    let isOpen = false;

    const open = () => {
        isOpen = true;
        toggle.setAttribute("aria-expanded", "true");
        overlay.classList.add("cb-nav__overlay--open");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("cb-nav--open");

        // Staggered fade-in for items
        items.forEach((item, i) => {
            item.style.transitionDelay = `${(i + 1) * 60}ms`;
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

    // Close on explicit close button
    const closeBtn = overlay.querySelector(".cb-nav__overlay-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", close);
    }

    // Close on backdrop click (outside box)
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
    });

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
