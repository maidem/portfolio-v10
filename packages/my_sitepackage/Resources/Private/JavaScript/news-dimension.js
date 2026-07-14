// Technical dimensioning (DIN 406) for each news box. Same as the banner:
// dimensioning attaches to a fit-content wrapper (.cb-news-measure) around
// title + teaser, so it's automatically exactly as wide/tall as the text. JS
// just measures the offset dimensions and appends the SVG lines — see
// banner/assets/frontend.js.

import { makeDim, makeVerticalDim, pxToRem, getDimColors, inkBounds } from "./dimension.js";

function dimensionItem(item) {
    const measure = item.querySelector(".cb-news-measure");
    if (!measure) return;

    measure.querySelectorAll(":scope > .cb-news-item__dim").forEach((el) => el.remove());

    // Space for the vertical dimensioning is padding-left on content-col
    // (indents the whole text block); 0 on mobile.
    const col = item.querySelector(".cb-news-item__content-col");
    const padLeft = col ? parseFloat(getComputedStyle(col).paddingLeft) || 0 : 0;
    const marginBottom = parseFloat(getComputedStyle(measure).marginBottom) || 0;

    // Use real glyph edges (left/right/top/bottom), not the element box —
    // line-height makes the line box taller than the visible text.
    const box = measure.getBoundingClientRect();
    const ink = inkBounds(measure);
    if (!ink) return;
    const left = ink.left - box.left;
    const top = ink.top - box.top;
    const width = ink.right - ink.left;
    const height = ink.bottom - ink.top;
    if (width < 1 || height < 1) return;

    const colors = getDimColors(measure);

    // ── horizontal (width) — line exactly from left to right text edge ───────
    const hDim = makeDim(pxToRem(width).toFixed(2), width, colors);
    hDim.classList.add("cb-news-item__dim");
    hDim.style.left = left + "px";
    hDim.style.width = width + "px";
    hDim.style.top = top + height + marginBottom / 2 + "px";
    measure.appendChild(hDim);

    // ── vertical (height) — line to the left of the text block ───────────────
    // content-col reserves padding-left, line sits at its edge (= -padLeft
    // relative to the indented measure). padLeft is 0 on mobile → no vertical line.
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
