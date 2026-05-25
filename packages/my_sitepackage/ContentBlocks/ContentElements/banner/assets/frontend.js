(function () {
    "use strict";

    const banner = document.querySelector(".cb-portfolio-banner");
    const text = document.querySelector(".cb-portfolio-text");
    if (!banner || !text) return;

    // ── helpers ────────────────────────────────────────────────────────────────

    /** Return [{word, rangeLeft, inkOffsetLeft, inkWidth}] using canvas ink-bounds.
     *  actualBoundingBoxLeft (negative) = blank before first glyph ink.
     *  inkOffsetLeft = pixels to shift right from Range.left to actual ink start.
     *  inkWidth     = total ink span (excludes blank side-bearings). */
    function getWordRects(el) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if (!node) return [];

        const src = node.textContent;
        const words = src.trim().split(/\s+/).filter(Boolean);

        // Canvas for accurate ink measurements.
        // Build font string from individual properties — the `font` shorthand
        // may return "" on some mobile browsers (e.g. older WebKit), which would
        // silently reset the canvas to 10px sans-serif and misalign arrows.
        const style = window.getComputedStyle(el);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const fWeight = style.fontWeight || "900";
        const fSize = style.fontSize || "16px";
        const fFamily = style.fontFamily || "monospace";
        ctx.font = `${fWeight} ${fSize} ${fFamily}`;
        if ("letterSpacing" in ctx)
            ctx.letterSpacing = style.letterSpacing || "0px";

        const out = [];
        let cursor = 0;

        for (const word of words) {
            const pos = src.indexOf(word, cursor);
            if (pos < 0) continue;
            const range = document.createRange();
            range.setStart(node, pos);
            range.setEnd(node, pos + word.length);
            const rangeLeft = range.getBoundingClientRect().left;

            // text-transform:uppercase → measure the uppercase glyph
            const m = ctx.measureText(word.toUpperCase());
            const hasBounds =
                m.actualBoundingBoxLeft != null &&
                typeof m.actualBoundingBoxRight === "number" &&
                m.actualBoundingBoxRight > 0;
            // actualBoundingBoxLeft is negative when ink starts RIGHT of origin
            const inkOffsetLeft = hasBounds ? -m.actualBoundingBoxLeft : 0;
            const inkWidth = hasBounds
                ? m.actualBoundingBoxLeft + m.actualBoundingBoxRight // abl(neg) + abr(pos)
                : range.getBoundingClientRect().width;

            out.push({ word, rangeLeft, inkOffsetLeft, inkWidth });
            cursor = pos + word.length;
        }
        return out;
    }

    /** Erstellt ein Bemaßungselement mit SVG-Pfeilen.
     *  Pfeilspitzen liegen exakt auf SVG-Koordinate x=0 (Wortanfang)
     *  und x=widthPx (Wortende) — pixelgenau, ohne CSS-Dreieck-Trick. */
    function makeDim(rem, widthPx) {
        const ns = "http://www.w3.org/2000/svg";
        const cy = 10; // Vertikale Mitte des 20px-Containers
        const ah = 4; // Pfeilspitzen-Halbhöhe
        const aw = 7; // Pfeilspitzen-Tiefe (horizontal)
        const col = "rgba(120,60,255,0.5)";

        const el = document.createElement("div");
        el.className = "cb-banner-dimension";
        el.setAttribute("aria-hidden", "true");

        // SVG — Breite = exakte Wortbreite in CSS-px, keine viewBox-Skalierung
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("width", widthPx);
        svg.setAttribute("height", "20");
        svg.style.cssText =
            "position:absolute;left:0;top:0;display:block;overflow:visible;";

        // Horizontale Linie zwischen den Pfeilspitzen
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", aw);
        line.setAttribute("y1", cy);
        line.setAttribute("x2", widthPx - aw);
        line.setAttribute("y2", cy);
        line.setAttribute("stroke", col);
        line.setAttribute("stroke-width", "1");
        svg.appendChild(line);

        // Linke Pfeilspitze ◁ — Spitze bei (0, cy)
        const la = document.createElementNS(ns, "polygon");
        la.setAttribute("points", `0,${cy} ${aw},${cy - ah} ${aw},${cy + ah}`);
        la.setAttribute("fill", col);
        svg.appendChild(la);

        // Rechte Pfeilspitze ▷ — Spitze bei (widthPx, cy)
        const ra = document.createElementNS(ns, "polygon");
        ra.setAttribute(
            "points",
            `${widthPx},${cy} ${widthPx - aw},${cy - ah} ${widthPx - aw},${cy + ah}`,
        );
        ra.setAttribute("fill", col);
        svg.appendChild(ra);

        el.appendChild(svg);

        const lbl = document.createElement("span");
        lbl.className = "cb-banner-dimension__label";
        lbl.textContent = rem + " rem";
        el.appendChild(lbl);

        return el;
    }

    // ── state ──────────────────────────────────────────────────────────────────

    let dims = [];

    function pxToRem(px) {
        const rootSize = parseFloat(
            window.getComputedStyle(document.documentElement).fontSize,
        );
        return px / (Number.isFinite(rootSize) && rootSize > 0 ? rootSize : 16);
    }

    function update() {
        dims.forEach((d) => d.remove());
        dims = [];

        // ── Fit font-size to container ─────────────────────────────────────────
        // Reset to CSS-defined value first (clamp(4rem, 19vw, 22rem))
        text.style.fontSize = "";
        {
            const s = window.getComputedStyle(text);
            const fs = parseFloat(s.fontSize);
            const c = document.createElement("canvas");
            const x = c.getContext("2d");
            // Same individual-property approach as getWordRects — avoids empty
            // font shorthand on certain mobile browsers.
            x.font = `${s.fontWeight || "900"} ${s.fontSize || "16px"} ${s.fontFamily || "monospace"}`;
            if ("letterSpacing" in x)
                x.letterSpacing = s.letterSpacing || "0px";
            const fullW = x.measureText(
                text.textContent.trim().toUpperCase(),
            ).width;
            // Scale down only when text would overflow — target 92 % of container
            if (fullW > banner.clientWidth) {
                text.style.fontSize =
                    ((fs * (banner.clientWidth * 0.92)) / fullW).toFixed(2) +
                    "px";
            }
        }

        const bannerRect = banner.getBoundingClientRect();
        const wordRects = getWordRects(text);

        for (const { inkWidth, rangeLeft, inkOffsetLeft } of wordRects) {
            if (inkWidth < 1) continue;
            const dim = makeDim(pxToRem(inkWidth).toFixed(2), inkWidth);
            const left = rangeLeft - bannerRect.left + inkOffsetLeft;
            dim.style.left = left + "px";
            dim.style.width = inkWidth + "px";
            banner.appendChild(dim);
            dims.push(dim);
        }
    }

    // ── init ───────────────────────────────────────────────────────────────────

    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(update).observe(banner);
    } else {
        window.addEventListener("resize", update);
    }

    // Wait for fonts so measurements are accurate
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(update);
})();
