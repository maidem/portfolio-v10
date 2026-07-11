// Technische Bemaßung (DIN 406) für jede News-Box. Wie beim Banner sitzt die
// Bemaßung an einem fit-content-Wrapper (.cb-news-measure) um Titel + Teaser:
// er ist automatisch exakt so breit/hoch wie der Text. JS misst nur dessen
// offset-Maße und hängt die SVG-Linien an — siehe banner/assets/frontend.js.

import { makeDim, makeVerticalDim, pxToRem, getDimColors, inkBounds } from "./dimension.js";

function dimensionItem(item) {
    const measure = item.querySelector(".cb-news-measure");
    if (!measure) return;

    measure.querySelectorAll(":scope > .cb-news-item__dim").forEach((el) => el.remove());

    // Der eingerückte Platz für die vertikale Bemaßung liegt als padding-left
    // an der content-col (rückt den ganzen Textblock ein); mobil ist er 0.
    const col = item.querySelector(".cb-news-item__content-col");
    const padLeft = col ? parseFloat(getComputedStyle(col).paddingLeft) || 0 : 0;
    const marginBottom = parseFloat(getComputedStyle(measure).marginBottom) || 0;

    // Echte Glyphenkanten (links/rechts/oben/unten) statt der Element-Box: die
    // Zeilen-Box ist durch line-height höher als der sichtbare Text.
    const box = measure.getBoundingClientRect();
    const ink = inkBounds(measure);
    if (!ink) return;
    const left = ink.left - box.left;
    const top = ink.top - box.top;
    const width = ink.right - ink.left;
    const height = ink.bottom - ink.top;
    if (width < 1 || height < 1) return;

    const colors = getDimColors(measure);

    // ── horizontal (Breite) — Linie exakt von linker bis rechter Textkante ────
    const hDim = makeDim(pxToRem(width).toFixed(2), width, colors);
    hDim.classList.add("cb-news-item__dim");
    hDim.style.left = left + "px";
    hDim.style.width = width + "px";
    hDim.style.top = top + height + marginBottom / 2 + "px";
    measure.appendChild(hDim);

    // ── vertikal (Höhe) — Linie links neben dem Textblock ─────────────────────
    // content-col reserviert links padding-left; die Linie sitzt an dessen Kante
    // (= -padLeft relativ zum eingerückten measure). Mobil ist padLeft 0 → keine
    // vertikale Bemaßung.
    if (padLeft > 0) {
        const vDim = makeVerticalDim(
            pxToRem(height).toFixed(2),
            top,
            height,
            "standard",
            colors,
            "leftOutside",
        );
        vDim.classList.add("cb-news-item__dim");
        vDim.style.left = -padLeft + "px";
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
