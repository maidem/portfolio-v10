// Generic technical dimensioning (DIN 406) for arbitrary blocks. Same idea as
// banner/news/skills: attach to a fit-content wrapper (.js-measure), measure
// its offset dimensions, append the SVG lines.
//
// CSS convention (see Main.entry.scss):
//   .js-measure     → position:relative; width:fit-content; margin-bottom (space for H line)
//   parent element  → padding-left (space for vertical line); 0 on mobile → no vertical line
//
// data-measure-h="edges": use the real left/right text edge instead of
// clientWidth — needed for wrapping text, where fit-content stays too wide.

import { makeDim, makeVerticalDim, pxToRem, getDimColors, inkBounds } from "./dimension.js";

function dimensionMeasure(measure) {
    measure.querySelectorAll(":scope > .js-measure-dim").forEach((el) => el.remove());

    // Opt-in via CSS: only draw when --measure: on is set. Lets a :has()
    // context (e.g. section-header only in the contact section) control this
    // without conditional classes in the template.
    if (getComputedStyle(measure).getPropertyValue("--measure").trim() !== "on")
        return;

    // Space for the vertical line = padding-left on the parent (indents the
    // content); 0 on mobile → no vertical dimensioning.
    const parent = measure.parentElement;
    const padLeft = parent ? parseFloat(getComputedStyle(parent).paddingLeft) || 0 : 0;
    const marginBottom = parseFloat(getComputedStyle(measure).marginBottom) || 0;

    // Vertical measuring range relative to the wrapper's top edge. Default is
    // the whole wrapper. data-measure-from/-until="<selector>" restricts it
    // from one element's top edge to another's bottom edge (e.g. form: from
    // the first field to the checkbox, skipping padding-top/captcha/button).
    // Origin is the wrapper's border-box top edge since dim children are
    // absolutely positioned (top:0) against it.
    const originTop = measure.getBoundingClientRect().top;
    let top = 0;
    let bottom = measure.clientHeight;
    const fromEl = measure.dataset.measureFrom && measure.querySelector(measure.dataset.measureFrom);
    const untilEl = measure.dataset.measureUntil && measure.querySelector(measure.dataset.measureUntil);

    // For text: align to the real ink edge, not the line box — line-height
    // makes the box taller than the glyphs, and text-box-trim only works on
    // direct children, not nested text.
    // data-measure-v="box": use element boxes instead — needed for forms,
    // where the visual reference is the field border or checkbox, not the
    // (floating) label text.
    const useBox = measure.dataset.measureV === "box";
    const topEl = fromEl || measure;
    const bottomEl = untilEl || measure;
    const topInk = useBox ? null : inkBounds(topEl);
    const bottomInk = useBox ? null : inkBounds(bottomEl);
    top = (topInk ? topInk.top : topEl.getBoundingClientRect().top) - originTop;
    bottom =
        (bottomInk ? bottomInk.bottom : bottomEl.getBoundingClientRect().bottom) -
        originTop;
    const height = bottom - top;
    if (height < 1) return;

    const colors = getDimColors(measure);

    // ── horizontal (width) — line below the block, label centered ────────────
    let left, width;
    if (measure.dataset.measureH === "edges") {
        const bounds = inkBounds(measure);
        if (!bounds) return;
        const originX = measure.getBoundingClientRect().left;
        left = bounds.left - originX;
        width = bounds.right - bounds.left;
    } else {
        left = 0;
        width = measure.clientWidth;
    }
    if (width < 1) return;

    // H line normally sits below the measured range. data-measure-hbelow=
    // "<selector>" moves it below that element's bottom edge instead — e.g.
    // below the whole checkbox block in a form when its text wraps across
    // multiple lines.
    let hBase = bottom;
    const hBelowEl =
        measure.dataset.measureHbelow && measure.querySelector(measure.dataset.measureHbelow);
    if (hBelowEl) {
        hBase = Math.max(
            hBase,
            hBelowEl.getBoundingClientRect().bottom - originTop,
        );
    }

    const hDim = makeDim(pxToRem(width).toFixed(2), width, colors);
    hDim.classList.add("js-measure-dim");
    hDim.style.left = left + "px";
    hDim.style.width = width + "px";
    hDim.style.top = hBase + marginBottom / 2 + "px";
    measure.appendChild(hDim);

    // ── vertical (height) — label at the indented edge, line on the right ────
    if (padLeft > 0) {
        // makeVerticalDim already sets the vertical position from topPx
        // (top:topPx-pad) — don't overwrite style.top here, it'd wipe that out.
        const vDim = makeVerticalDim(pxToRem(height).toFixed(2), top, height, "standard", colors, "leftOutside");
        vDim.classList.add("js-measure-dim");
        vDim.style.left = -padLeft + "px";
        measure.appendChild(vDim);
    }
}

function dimensionAll() {
    document.querySelectorAll(".js-measure").forEach(dimensionMeasure);
}

function init() {
    if (!document.querySelector(".js-measure")) return;

    // Coalesce resize events into one rAF pass, but only re-measure the
    // wrappers that actually changed — a FAQ <details> transition resizes its
    // wrapper every frame, and re-measuring all blocks each frame is what
    // makes the line lag behind the animation.
    let rafId = null;
    const pending = new Set();
    const flush = () => {
        rafId = null;
        const targets = pending.has(document.body)
            ? document.querySelectorAll(".js-measure")
            : pending;
        pending.clear();
        targets.forEach(dimensionMeasure);
    };
    const scheduleUpdate = (target) => {
        pending.add(target || document.body);
        if (rafId === null) rafId = requestAnimationFrame(flush);
    };

    // Observe each wrapper individually too — height changes within a block
    // (e.g. a FAQ <details> expanding) need to trigger re-measurement right
    // away, the body observer alone isn't reliable enough for that.
    const ro = new ResizeObserver((entries) => {
        entries.forEach((e) => scheduleUpdate(e.target));
    });
    ro.observe(document.body);
    document.querySelectorAll(".js-measure").forEach((m) => ro.observe(m));
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(dimensionAll);

    // picks up .js-measure blocks swapped in later (e.g. contact-form.js
    // replacing .cb-form-wrap after an ajax submit). Must ignore the dim nodes
    // we append ourselves — reacting to them re-triggers the measurement in an
    // endless rAF loop.
    const isOwnDim = (n) =>
        n.nodeType === 1 &&
        (n.classList.contains("js-measure-dim") || n.closest?.(".js-measure-dim"));
    new MutationObserver((muts) => {
        const relevant = muts.some((m) =>
            [...m.addedNodes, ...m.removedNodes].some((n) => !isOwnDim(n)),
        );
        if (!relevant) return;
        document.querySelectorAll(".js-measure").forEach((m) => ro.observe(m));
        scheduleUpdate();
    }).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
