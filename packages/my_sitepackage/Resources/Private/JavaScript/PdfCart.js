/**
 * PDF Cart — manages user PDF section pre-selections via localStorage.
 *
 * Features:
 *  - "Add to PDF" toggle buttons on content elements (data-pdf-section attribute)
 *  - Badge counter on the nav "Pdf-Export" link (found by title attribute)
 *  - Toast feedback on add/remove
 *  - Pre-selection sync on the PDF Export page
 *  - Cross-tab sync via the storage event
 */

const STORAGE_KEY = "gripsraum_pdf_cart";

// ── Cart state helpers ───────────────────────────────────────────────────────

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

function setCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(items)]));
    onCartChange();
}

function isInCart(sectionId) {
    return getCart().includes(sectionId);
}

/** Toggle sectionId in cart; returns true if added, false if removed. */
function toggleInCart(sectionId) {
    const cart = getCart();
    if (cart.includes(sectionId)) {
        setCart(cart.filter((id) => id !== sectionId));
        return false;
    }
    setCart([...cart, sectionId]);
    return true;
}

// ── Internal change dispatcher ───────────────────────────────────────────────

function onCartChange() {
    updateAllBadges();
    updateAllAddButtons();
    syncExportTiles();
}

// ── Nav badge ────────────────────────────────────────────────────────────────

function updateAllBadges() {
    const count = getCart().length;
    document.querySelectorAll(".cb-pdf-cart-badge").forEach((badge) => {
        badge.textContent = count;
        badge.setAttribute("aria-label", `${count} Einträge im PDF-Export`);
        badge.classList.toggle("cb-pdf-cart-badge--visible", count > 0);
    });
}

/**
 * Inject badge spans into all nav links pointing to the PDF export page.
 * The TYPO3 nav renders <a title="Pdf-Export"> — we locate it by that attribute.
 */
function injectBadges() {
    const PDF_LINK_SELECTORS = [
        '.cb-nav__link[title="Pdf-Export"]',
        '.cb-nav__overlay-link[title="Pdf-Export"]',
    ];
    PDF_LINK_SELECTORS.forEach((selector) => {
        const link = document.querySelector(selector);
        if (!link) return;
        if (!link.querySelector(".cb-pdf-cart-badge")) {
            const badge = document.createElement("span");
            badge.className = "badge rounded-pill cb-pdf-cart-badge";
            badge.setAttribute("aria-hidden", "true");
            link.appendChild(badge);
        }
    });
    updateAllBadges();
}

// ── Toast notification ───────────────────────────────────────────────────────

function showToast(message) {
    let container = document.getElementById("cb-pdf-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "cb-pdf-toast-container";
        container.setAttribute("aria-live", "polite");
        container.setAttribute("aria-atomic", "true");
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "cb-pdf-toast";
    toast.textContent = message;
    container.appendChild(toast);

    // Animate in on next frame
    requestAnimationFrame(() =>
        requestAnimationFrame(() => toast.classList.add("cb-pdf-toast--show")),
    );

    setTimeout(() => {
        toast.classList.remove("cb-pdf-toast--show");
        toast.addEventListener("transitionend", () => toast.remove(), {
            once: true,
        });
    }, 2500);
}

// ── "Add to PDF" buttons ─────────────────────────────────────────────────────

function renderAddButton(btn) {
    const inCart = isInCart(btn.dataset.pdfSection);
    const label = btn.querySelector(".cb-pdf-add-btn__label");
    btn.classList.toggle("cb-pdf-add-btn--active", inCart);
    btn.setAttribute("aria-pressed", String(inCart));
    if (label) {
        label.textContent = inCart
            ? "Im PDF-Export"
            : "Zu PDF-Export hinzufügen";
    }
}

function updateAllAddButtons() {
    document.querySelectorAll("[data-pdf-section]").forEach(renderAddButton);
}

function initAddButtons() {
    document.querySelectorAll("[data-pdf-section]").forEach((btn) => {
        renderAddButton(btn);
        btn.addEventListener("click", () => {
            const added = toggleInCart(btn.dataset.pdfSection);
            showToast(
                added
                    ? "Zum PDF-Export hinzugefügt"
                    : "Aus dem PDF-Export entfernt",
            );
        });
    });
}

// ── PDF Export page: tile sync ───────────────────────────────────────────────

function syncExportTiles() {
    const checkboxes = document.querySelectorAll(
        ".cb-pdf-export__grid input[type='checkbox']",
    );
    if (!checkboxes.length) return;
    const cart = getCart();
    checkboxes.forEach((cb) => {
        cb.checked = cart.includes(cb.value);
    });
}

function initExportPageSync() {
    const grid = document.querySelector(".cb-pdf-export__grid");
    if (!grid) return;

    // Pre-check tiles based on cart
    syncExportTiles();

    // Keep cart in sync when user toggles tiles directly on the export page
    grid.querySelectorAll("input[type='checkbox']").forEach((cb) => {
        cb.addEventListener("change", () => {
            const cart = getCart();
            if (cb.checked) {
                if (!cart.includes(cb.value)) {
                    setCart([...cart, cb.value]);
                }
            } else {
                setCart(cart.filter((id) => id !== cb.value));
            }
        });
    });
}

// ── Cross-tab sync ───────────────────────────────────────────────────────────

window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
        onCartChange();
    }
});

// ── Init ─────────────────────────────────────────────────────────────────────

function init() {
    injectBadges();
    initAddButtons();
    initExportPageSync();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
