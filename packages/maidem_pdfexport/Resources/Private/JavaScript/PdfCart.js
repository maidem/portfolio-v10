/**
 * PDF Cart — manages user PDF section pre-selections via localStorage.
 *
 * Features:
 *  - "Add to PDF" toggle buttons on content elements (data-pdf-section attribute,
 *    optional data-pdf-label for a human-readable name)
 *  - Floating panel (bottom right): shows collected items, allows removal,
 *    explains the feature and downloads the PDF directly (pageType 1711)
 *  - Cross-tab sync via the storage event
 */

const STORAGE_KEY = "maidem_pdf_cart";
const PANEL_KEY = "maidem_pdf_panel_open";

// ── Cart state helpers ───────────────────────────────────────────────────────
// entries: { id: "news_5", label: "Article title" }
// old entries were plain strings, migrate on read

function getCart() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return raw.map((e) => (typeof e === "string" ? { id: e, label: e } : e));
    } catch {
        return [];
    }
}

function setCart(items) {
    const seen = new Set();
    const unique = items.filter((e) => !seen.has(e.id) && seen.add(e.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    onCartChange();
}

function isInCart(sectionId) {
    return getCart().some((e) => e.id === sectionId);
}

function removeFromCart(sectionId) {
    setCart(getCart().filter((e) => e.id !== sectionId));
}

/** move dragId to targetId's position */
function reorderCart(dragId, targetId) {
    if (dragId === targetId) return;
    const cart = getCart();
    const from = cart.findIndex((e) => e.id === dragId);
    const to = cart.findIndex((e) => e.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = cart.splice(from, 1);
    cart.splice(to, 0, moved);
    setCart(cart);
}

/** toggle sectionId, returns true if added */
function toggleInCart(sectionId, label) {
    if (isInCart(sectionId)) {
        removeFromCart(sectionId);
        return false;
    }
    setCart([...getCart(), { id: sectionId, label: label || sectionId }]);
    return true;
}

// ── Internal change dispatcher ───────────────────────────────────────────────

function onCartChange() {
    updateAllAddButtons();
    renderPanel();
}

// ── Floating cart panel ──────────────────────────────────────────────────────

let panelEl = null;
let fabEl = null;
let panelOpen = false;
let autoCloseTimer = null;

/** fallback labels for known section ids */
const SECTION_LABELS = {
    info: "Profil & Vitals",
    story: "My Story",
    tech: "Skills & Tech-Stack",
};

function labelFor(entry) {
    return SECTION_LABELS[entry.id] || entry.label || entry.id;
}

/** pageType 1711 expects sections[] as POST data */
function pdfDownloadForm(cart) {
    const inputs = cart
        .map(
            (e) =>
                `<input type="hidden" name="sections[]" value="${escapeHtml(e.id)}">`,
        )
        .join("");
    return `
        <form method="post" action="?type=1711" class="cb-pdf-panel__form">
            ${inputs}
            <button type="submit" class="cb-pdf-panel__cta">PDF-Dossier herunterladen</button>
        </form>`;
}

/** fetch instead of normal submit, so no new tab opens */
async function submitPdfForm(form) {
    const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
    });
    if (!response.ok) throw new Error("PDF generation failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Maik_Demuth_Portfolio_Export.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function escapeHtml(str) {
    return String(str).replace(
        /[&<>"']/g,
        (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
}

function buildPanel() {
    if (panelEl) return;

    fabEl = document.createElement("button");
    fabEl.type = "button";
    fabEl.className = "cb-pdf-panel-fab";
    fabEl.setAttribute("aria-expanded", "false");
    fabEl.setAttribute("aria-controls", "cb-pdf-panel");
    fabEl.innerHTML =
        '<span class="cb-pdf-panel-fab__text">PDF-Dossier</span>' +
        '<span class="cb-pdf-panel-fab__count" aria-hidden="true">0</span>';
    fabEl.addEventListener("click", () => togglePanel());

    panelEl = document.createElement("section");
    panelEl.id = "cb-pdf-panel";
    panelEl.className = "cb-pdf-panel";
    panelEl.setAttribute("aria-label", "PDF-Dossier — gesammelte Inhalte");
    panelEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-pdf-remove]");
        if (btn) removeFromCart(btn.dataset.pdfRemove);
    });

    // drag & drop reordering (native)
    let dragId = null;
    let touchDragId = null;
    panelEl.addEventListener("dragstart", (e) => {
        const li = e.target.closest("[data-pdf-id]");
        if (!li) return;
        dragId = li.dataset.pdfId;
        e.dataTransfer.effectAllowed = "move";
        li.classList.add("cb-pdf-panel__item--dragging");
    });
    panelEl.addEventListener("dragover", (e) => {
        if (!dragId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    });
    panelEl.addEventListener("drop", (e) => {
        const li = e.target.closest("[data-pdf-id]");
        if (!li || !dragId) return;
        e.preventDefault();
        reorderCart(dragId, li.dataset.pdfId);
        dragId = null;
    });
    panelEl.addEventListener("dragend", () => {
        dragId = null;
        panelEl
            .querySelector(".cb-pdf-panel__item--dragging")
            ?.classList.remove("cb-pdf-panel__item--dragging");
    });

    // touch devices don't get native DnD, so drag via the handle with pointer events
    panelEl.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse") return; // mouse already handled by native DnD above
        const handle = e.target.closest(".cb-pdf-panel__drag");
        if (!handle) return;
        const li = handle.closest("[data-pdf-id]");
        if (!li) return;
        e.preventDefault();
        touchDragId = li.dataset.pdfId;
        li.classList.add("cb-pdf-panel__item--dragging");
    });
    panelEl.addEventListener("pointermove", (e) => {
        if (!touchDragId) return;
        e.preventDefault();
        const over = document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest("[data-pdf-id]");
        if (over && over.dataset.pdfId !== touchDragId) {
            reorderCart(touchDragId, over.dataset.pdfId);
        }
    });
    const endTouch = () => {
        touchDragId = null;
        panelEl
            .querySelector(".cb-pdf-panel__item--dragging")
            ?.classList.remove("cb-pdf-panel__item--dragging");
    };
    panelEl.addEventListener("pointerup", endTouch);
    panelEl.addEventListener("pointercancel", endTouch);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && panelOpen) togglePanel(false);
    });

    document.body.append(panelEl, fabEl);
    renderPanel();
    if (sessionStorage.getItem(PANEL_KEY) && getCart().length > 0) {
        togglePanel(true);
    }
}

function renderPanel() {
    if (!panelEl) return;
    const cart = getCart();

    fabEl.classList.toggle("cb-pdf-panel-fab--visible", cart.length > 0);
    fabEl.querySelector(".cb-pdf-panel-fab__count").textContent = cart.length;
    if (cart.length === 0 && panelOpen) togglePanel(false);

    const items = cart
        .map(
            (e) => `
        <li class="cb-pdf-panel__item" draggable="true" data-pdf-id="${escapeHtml(e.id)}">
            <span class="cb-pdf-panel__drag" aria-hidden="true">&#8942;&#8942;</span>
            <span class="cb-pdf-panel__item-label">${escapeHtml(labelFor(e))}</span>
            <button type="button" class="cb-pdf-panel__remove" data-pdf-remove="${escapeHtml(e.id)}"
                aria-label="${escapeHtml(labelFor(e))} entfernen">&times;</button>
        </li>`,
        )
        .join("");

    panelEl.innerHTML = `
        <header class="cb-pdf-panel__header">
            <h2 class="cb-pdf-panel__title">Dein PDF-Dossier</h2>
            <button type="button" class="cb-pdf-panel__close" aria-label="Schließen">&times;</button>
        </header>
        <p class="cb-pdf-panel__intro">
            Sammle die Inhalte, die für dein Gespräch mit mir interessant sind,
            und lade sie gebündelt als PDF herunter.
        </p>
        <ul class="cb-pdf-panel__list">${items}</ul>
        ${pdfDownloadForm(cart)}
    `;
    panelEl
        .querySelector(".cb-pdf-panel__close")
        .addEventListener("click", () => togglePanel(false));
    panelEl.querySelector(".cb-pdf-panel__form").addEventListener("submit", (e) => {
        e.preventDefault();
        togglePanel(false);
        showExportToast();
        submitPdfForm(e.target)
            .catch(() => showExportToast("Die PDF-Erstellung ist fehlgeschlagen. Bitte versuche es erneut."))
            .finally(() => setCart([]));
    });
}

/** same look as the contact form's .cb-toast */
function showExportToast(
    message = "Dein PDF-Dossier wird erstellt und heruntergeladen.",
) {
    const toast = document.createElement("div");
    toast.className = "cb-pdf-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
        message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("cb-pdf-toast--hide");
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function togglePanel(open = !panelOpen) {
    panelOpen = open;
    // survives page navigation — otherwise the panel closes on every click-through
    sessionStorage.setItem(PANEL_KEY, open ? "1" : "");
    clearTimeout(autoCloseTimer);
    panelEl.classList.toggle("cb-pdf-panel--open", open);
    fabEl.setAttribute("aria-expanded", String(open));
}

/** open panel as feedback; on mobile it auto-closes again to free the screen */
function flashPanel() {
    togglePanel(true);
    if (window.matchMedia("(max-width: 767.98px)").matches) {
        autoCloseTimer = setTimeout(() => togglePanel(false), 6000);
    }
}

// ── "Add to PDF" buttons ─────────────────────────────────────────────────────

function renderAddButton(btn) {
    const inCart = isInCart(btn.dataset.pdfSection);
    const label = btn.querySelector(".cb-pdf-add-btn__label");
    btn.classList.toggle("cb-pdf-add-btn--active", inCart);
    btn.setAttribute("aria-pressed", String(inCart));
    if (label) {
        label.textContent = inCart ? "Im PDF-Dossier" : "Zum PDF-Dossier hinzufügen";
    }
}

function updateAllAddButtons() {
    document.querySelectorAll("[data-pdf-section]").forEach(renderAddButton);
    document.querySelectorAll("[data-pdf-group]").forEach(renderGroupButton);
}

// ── Group buttons ("add whole section") ──────────────────────────────────────
// grabs all [data-pdf-item] elements inside the closest [data-pdf-group-scope]

function groupItemsFor(btn) {
    const scope = btn.closest("[data-pdf-group-scope]") || document;
    return [...scope.querySelectorAll("[data-pdf-item]")].map((el) => ({
        id: el.dataset.pdfItem,
        label: el.dataset.pdfItemLabel || el.dataset.pdfItem,
    }));
}

function renderGroupButton(btn) {
    const items = groupItemsFor(btn);
    const allIn = items.length > 0 && items.every((e) => isInCart(e.id));
    btn.classList.toggle("cb-pdf-add-btn--active", allIn);
    btn.setAttribute("aria-pressed", String(allIn));
    const label = btn.querySelector(".cb-pdf-add-btn__label");
    if (label) {
        label.textContent = allIn
            ? "Alle im PDF-Dossier"
            : "Alle zum PDF-Dossier hinzufügen";
    }
}

function initGroupButtons() {
    document.querySelectorAll("[data-pdf-group]").forEach((btn) => {
        renderGroupButton(btn);
        btn.addEventListener("click", () => {
            const items = groupItemsFor(btn);
            const allIn =
                items.length > 0 && items.every((e) => isInCart(e.id));
            if (allIn) {
                const ids = new Set(items.map((e) => e.id));
                setCart(getCart().filter((e) => !ids.has(e.id)));
            } else {
                setCart([...getCart(), ...items]);
                flashPanel();
            }
        });
    });
}

function initAddButtons() {
    document.querySelectorAll("[data-pdf-section]").forEach((btn) => {
        renderAddButton(btn);
        btn.addEventListener("click", () => {
            const added = toggleInCart(
                btn.dataset.pdfSection,
                btn.dataset.pdfLabel || document.title,
            );
            if (added) flashPanel();
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
    buildPanel();
    initAddButtons();
    initGroupButtons();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
