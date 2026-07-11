import {
    makeDim,
    makeVerticalDim,
    pxToRem,
    getDimColors,
} from "../../../../Resources/Private/JavaScript/dimension.js";

// ── Profile-Banner (»My Story«) ──────────────────────────────────────────────
// Die Bemaßung sitzt an einem fit-content-Wrapper (.cb-portfolio-measure), der
// automatisch exakt so breit/hoch ist wie Überschrift + Text. JS misst nur noch
// dessen offset-Maße (kein Ink-/Range-Messen mehr) und hängt die SVG-Linien an.
(function () {
    "use strict";

    const measure = document.querySelector(".cb-portfolio-measure");
    if (measure) {
        initProfile(measure);
        return;
    }

    // Wordmark-Variante (Impressum/Datenschutz) – unverändertes Alt-Verhalten.
    initWordmark();
})();

function initProfile(measure) {
    const text = measure.closest(".cb-portfolio-text");
    let dims = [];
    let rafId = null;

    function draw() {
        dims.forEach((d) => d.remove());
        dims = [];

        const width = measure.clientWidth;
        const height = measure.clientHeight - dimBottomPadding(measure);
        if (width < 1 || height < 1) return;

        const colors = getDimColors(text, "#111111");

        // ── horizontal (Breite) — Linie unter dem Text, Label mittig ──────────
        const hdim = makeDim(pxToRem(width).toFixed(2), width, colors);
        hdim.style.left = "0px";
        hdim.style.width = width + "px";
        hdim.style.bottom = "0px";
        measure.appendChild(hdim);
        dims.push(hdim);

        // ── vertikal (Höhe) — Label linksbündig an der Container-/Logo-Kante,
        //    Linie rechts daneben ───────────────────────────────────────────────
        // Reservierter Platz links = padding-left des Textelements. Mobil ist das
        // per CSS 0 (kein Platz) → dann keine vertikale Bemaßung zeichnen.
        const padLeft = parseFloat(getComputedStyle(text).paddingLeft) || 0;
        if (padLeft > 0) {
            const vdim = makeVerticalDim(
                pxToRem(height).toFixed(2),
                0,
                height,
                "standard",
                colors,
                "leftOutside",
            );
            vdim.style.left = -padLeft + "px";
            vdim.style.top = "0px";
            measure.appendChild(vdim);
            dims.push(vdim);
        }
    }

    function schedule() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = null;
            draw();
        });
    }

    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(schedule).observe(measure);
    } else {
        window.addEventListener("resize", schedule);
    }
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(draw);
}

// padding-bottom des measure-Wrappers (Reserve für die horizontale Maßlinie)
// nicht in die gemessene Texthöhe einrechnen.
function dimBottomPadding(measure) {
    return parseFloat(getComputedStyle(measure).paddingBottom) || 0;
}

// ── Wordmark-Variante (unverändert) ──────────────────────────────────────────
function initWordmark() {
    const banner = document.querySelector(".cb-portfolio-banner");
    const text = document.querySelector(".cb-portfolio-text");
    if (!banner || !text) return;

    const LABEL_BOX_H = 17;
    let dims = [];
    let rafId = null;

    function scheduleUpdate() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(update);
    }

    function update() {
        dims.forEach((d) => d.remove());
        dims = [];

        text.style.removeProperty("font-size");
        const REFERENCE_TITLE = "Datenschutzerklärung";
        const baseFs = parseFloat(window.getComputedStyle(text).fontSize);
        const target = banner.clientWidth * 0.82;

        const probe = document.createElement("span");
        probe.style.cssText =
            "position:absolute;visibility:hidden;white-space:nowrap;" +
            `font:${baseFs}px "JetBrains Mono", monospace;font-weight:800;` +
            "letter-spacing:-0.04em;text-transform:uppercase;";
        probe.textContent = REFERENCE_TITLE;
        document.body.appendChild(probe);
        const refWidth = probe.getBoundingClientRect().width;
        probe.remove();

        if (refWidth > 0 && target > 0) {
            const sharedFs = baseFs * Math.min(1, target / refWidth);
            text.style.fontSize = sharedFs.toFixed(2) + "px";
        }

        const tRect = text.getBoundingClientRect();
        let startX = 0;
        let totalWidth = tRect.width;

        // Accurate ink bounds via Range + canvas side-bearing trim
        const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if (node && node.length > 0) {
            const range = document.createRange();
            range.selectNodeContents(node);
            const box = range.getBoundingClientRect();
            if (box.width > 1) {
                startX = box.left - tRect.left;
                totalWidth = box.width;

                const cs = window.getComputedStyle(text);
                const upper = (node.textContent || "").toUpperCase();
                const ctx = document.createElement("canvas").getContext("2d");
                if (ctx && upper.length > 0) {
                    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
                    if ("letterSpacing" in ctx)
                        ctx.letterSpacing = cs.letterSpacing || "0px";

                    const mFirst = ctx.measureText(upper[0]);
                    const mLast = ctx.measureText(upper[upper.length - 1]);

                    const rFirst = document.createRange();
                    rFirst.setStart(node, 0);
                    rFirst.setEnd(node, 1);
                    const firstOrigin =
                        rFirst.getBoundingClientRect().left - tRect.left;

                    const rLast = document.createRange();
                    rLast.setStart(node, node.length - 1);
                    rLast.setEnd(node, node.length);
                    const lastOrigin =
                        rLast.getBoundingClientRect().left - tRect.left;

                    const inkLeft = firstOrigin - mFirst.actualBoundingBoxLeft;
                    const inkRight = lastOrigin + mLast.actualBoundingBoxRight;

                    const tol = (parseFloat(cs.fontSize) || 16) * 0.25;
                    let newLeft = startX;
                    let newRight = startX + totalWidth;
                    if (Number.isFinite(inkLeft) && Math.abs(inkLeft - newLeft) <= tol)
                        newLeft = inkLeft;
                    if (Number.isFinite(inkRight) && Math.abs(inkRight - newRight) <= tol)
                        newRight = inkRight;
                    if (newRight - newLeft > totalWidth * 0.5) {
                        startX = newLeft;
                        totalWidth = newRight - newLeft;
                    }
                }
            }
        }

        const makeProbe = () => {
            const s = document.createElement("span");
            s.style.cssText =
                "display:inline-block;width:0;height:1cap;vertical-align:baseline;" +
                "line-height:0;overflow:visible;pointer-events:none;";
            return s;
        };
        const probe2 = makeProbe();
        text.appendChild(probe2);
        const probeRect = probe2.getBoundingClientRect();
        text.removeChild(probe2);
        const inkTop = probeRect.top - tRect.top;
        const inkHeight = probeRect.height;
        const inkBottom = inkTop + inkHeight;
        const textGap = 16;

        const colors = getDimColors(text, undefined);

        if (totalWidth > 1) {
            const dim = makeDim(pxToRem(totalWidth).toFixed(2), totalWidth, colors);
            dim.style.left = startX + "px";
            dim.style.width = totalWidth + "px";
            dim.style.top = inkBottom + textGap + "px";
            text.appendChild(dim);
            dims.push(dim);
        }

        if (inkHeight > 1) {
            const remH = pxToRem(inkHeight).toFixed(2);
            const standardOffset = textGap + 20;
            const roomLeft = tRect.left;
            if (roomLeft >= standardOffset + 4) {
                const vdim = makeVerticalDim(remH, inkTop, inkHeight, "standard", colors);
                vdim.style.left = -standardOffset + "px";
                text.appendChild(vdim);
                dims.push(vdim);
            }
        }
    }

    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(scheduleUpdate).observe(banner);
    } else {
        window.addEventListener("resize", scheduleUpdate);
    }
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(update);
}
