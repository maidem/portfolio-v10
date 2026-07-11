// Technische Bemaßung (DIN 406) für jede News-Box. Wie beim Banner sitzt die
// Bemaßung an einem fit-content-Wrapper (.cb-news-measure) um Titel + Teaser:
// er ist automatisch exakt so breit/hoch wie der Text. JS misst nur dessen
// offset-Maße und hängt die SVG-Linien an — siehe banner/assets/frontend.js.

import { makeDim, makeVerticalDim, pxToRem, getDimColors } from "./dimension.js";

// Linkeste und rechteste Ink-Kante über alle Textzeilen im Container, als
// Offsets relativ zu originX (linke Kante der measure-Box).
function textBounds(container, originX) {
    let left = Infinity;
    let right = -Infinity;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
            if (!n.textContent.trim()) return NodeFilter.FILTER_REJECT;
            // Text in den angehängten Maßlinien-Labels ignorieren.
            if (n.parentElement && n.parentElement.closest(".cb-news-item__dim"))
                return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    let node;
    const range = document.createRange();
    while ((node = walker.nextNode())) {
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
            if (r.width < 1) continue;
            if (r.left < left) left = r.left;
            if (r.right > right) right = r.right;
        }
    }
    if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
    return { left: left - originX, right: right - originX };
}

function dimensionItem(item) {
    const measure = item.querySelector(".cb-news-measure");
    if (!measure) return;

    measure.querySelectorAll(":scope > .cb-news-item__dim").forEach((el) => el.remove());

    // Der eingerückte Platz für die vertikale Bemaßung liegt als padding-left
    // an der content-col (rückt den ganzen Textblock ein); mobil ist er 0.
    const col = item.querySelector(".cb-news-item__content-col");
    const padLeft = col ? parseFloat(getComputedStyle(col).paddingLeft) || 0 : 0;
    const marginBottom = parseFloat(getComputedStyle(measure).marginBottom) || 0;
    const height = measure.clientHeight;

    // Echte Textkanten (linkeste/rechteste Ink-Kante über alle Zeilen), relativ
    // zur measure-Box. fit-content reicht nicht: bei umbrechendem Text schrumpft
    // es nur bis max-content, nicht auf die breiteste umgebrochene Zeile.
    const box = measure.getBoundingClientRect();
    const bounds = textBounds(measure, box.left);
    if (!bounds || height < 1) return;
    const width = bounds.right - bounds.left;
    if (width < 1) return;

    const colors = getDimColors(measure);

    // ── horizontal (Breite) — Linie exakt von linker bis rechter Textkante ────
    const hDim = makeDim(pxToRem(width).toFixed(2), width, colors);
    hDim.classList.add("cb-news-item__dim");
    hDim.style.left = bounds.left + "px";
    hDim.style.width = width + "px";
    hDim.style.top = height + marginBottom / 2 + "px";
    measure.appendChild(hDim);

    // ── vertikal (Höhe) — Linie links neben dem Textblock ─────────────────────
    // content-col reserviert links padding-left; die Linie sitzt an dessen Kante
    // (= -padLeft relativ zum eingerückten measure). Mobil ist padLeft 0 → keine
    // vertikale Bemaßung.
    if (padLeft > 0) {
        const vDim = makeVerticalDim(
            pxToRem(height).toFixed(2),
            0,
            height,
            "standard",
            colors,
            "leftOutside",
        );
        vDim.classList.add("cb-news-item__dim");
        vDim.style.left = -padLeft + "px";
        vDim.style.top = "0px";
        measure.appendChild(vDim);
    }
}

function dimensionAll() {
    document.querySelectorAll(".cb-news-item").forEach(dimensionItem);
}

function init() {
    if (!document.querySelector(".cb-news-measure")) return;

    let rafId = null;
    const scheduleUpdate = () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = null;
            dimensionAll();
        });
    };

    new ResizeObserver(scheduleUpdate).observe(document.body);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(dimensionAll);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
