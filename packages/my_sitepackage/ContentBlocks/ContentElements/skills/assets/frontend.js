// DIN 406 dimension lines for each skill category group. Same approach as
// banner/news list: attaches to a fit-content wrapper (.cb-skills-measure)
// around title + chips, JS measures it and appends the SVG lines.

import {
    makeDim,
    makeVerticalDim,
    pxToRem,
    getDimColors,
    inkBounds,
} from "../../../../Resources/Private/JavaScript/dimension.js";

function dimensionGroup(group) {
    const measure = group.querySelector(".cb-skills-measure");
    if (!measure) return;

    measure.querySelectorAll(":scope > .cb-skills-dim").forEach((el) => el.remove());

    const padLeft = parseFloat(getComputedStyle(group).paddingLeft) || 0;
    const marginBottom = parseFloat(getComputedStyle(measure).marginBottom) || 0;

    // Top: real glyph edge of the title, not the line box (line-height inflates it).
    // Bottom/sides: chip pill borders, not the chip text.
    const box = measure.getBoundingClientRect();
    const title = measure.querySelector(".cb-skills-group__title");
    const chips = measure.querySelectorAll(".cb-skill-chip");
    if (!title || !chips.length) return;

    const titleInk = inkBounds(title);
    const topAbs = titleInk ? titleInk.top : title.getBoundingClientRect().top;

    let leftAbs = Infinity;
    let rightAbs = -Infinity;
    let bottomAbs = -Infinity;
    chips.forEach((chip) => {
        const r = chip.getBoundingClientRect();
        if (r.left < leftAbs) leftAbs = r.left;
        if (r.right > rightAbs) rightAbs = r.right;
        if (r.bottom > bottomAbs) bottomAbs = r.bottom;
    });
    // title can stick out wider than the chip rows
    if (titleInk) {
        if (titleInk.left < leftAbs) leftAbs = titleInk.left;
        if (titleInk.right > rightAbs) rightAbs = titleInk.right;
    }

    const left = leftAbs - box.left;
    const top = topAbs - box.top;
    const width = rightAbs - leftAbs;
    const height = bottomAbs - topAbs;
    if (width < 1 || height < 1) return;

    const colors = getDimColors(measure);

    // ── horizontal (width): line centered below the group ──────────────────────
    const hDim = makeDim(pxToRem(width).toFixed(2), width, colors);
    hDim.classList.add("cb-skills-dim");
    hDim.style.left = left + "px";
    hDim.style.width = width + "px";
    hDim.style.top = top + height + marginBottom / 2 + "px";
    measure.appendChild(hDim);

    // ── vertical (height): label left, line right (always standard mode) ───────
    if (padLeft > 0) {
        const vDim = makeVerticalDim(pxToRem(height).toFixed(2), top, height, "standard", colors, "leftOutside");
        vDim.classList.add("cb-skills-dim");
        vDim.style.left = -padLeft + "px";
        measure.appendChild(vDim);
    }
}

function dimensionAll() {
    document.querySelectorAll(".cb-skills-group").forEach(dimensionGroup);
}

function init() {
    if (!document.querySelector(".cb-skills-measure")) return;

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
