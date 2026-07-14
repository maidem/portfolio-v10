// Shared DIN 406 dimension-line renderer, used by the hero banner (frontend.js)
// and the news list. One calculation, multiple call sites — see
// frontend.js / news-dimension.js.

const LABEL_BOX_H = 17;

export function measureLabelWidth(labelText) {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return 56;
    ctx.font = '700 9px "JetBrains Mono", monospace';
    const tracking = 0.2 * 9 * Math.max(0, labelText.length - 1);
    return ctx.measureText(labelText).width + tracking + 16;
}

export function labelFitsOnLine(heightPx, rem) {
    const aw = 7;
    return heightPx >= measureLabelWidth((rem + " rem").toUpperCase()) + aw * 2 + 8;
}

export function pxToRem(px) {
    const rootSize = parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
    );
    return px / (Number.isFinite(rootSize) && rootSize > 0 ? rootSize : 16);
}

const inkCtx = document.createElement("canvas").getContext("2d");

// Real glyph edges of all text in the container (dimension-line labels excluded).
// Range rects cover the full font box (ascent+descent), not the actual glyphs —
// digits/capitals without descenders end at the baseline, for example. So per
// line we derive the baseline from the font box and get the real top/bottom
// via actualBoundingBox.
// Returns absolute viewport coords, or null if no text found.
export function inkBounds(container) {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
            if (!n.textContent.trim()) return NodeFilter.FILTER_REJECT;
            // skip text inside the dimension-line labels we appended
            if (
                n.parentElement &&
                n.parentElement.closest(
                    ".js-measure-dim, .cb-news-item__dim, .cb-skills-dim, [aria-hidden='true']",
                )
            )
                return NodeFilter.FILTER_REJECT;
            // skip hidden content of closed <details> (FAQ) — their ranges
            // produce ghost rects and throw off the measurement
            if (
                n.parentElement &&
                n.parentElement.closest("details:not([open])") &&
                !n.parentElement.closest("summary")
            )
                return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    let node;
    const range = document.createRange();
    while ((node = walker.nextNode())) {
        const cs = node.parentElement && getComputedStyle(node.parentElement);
        if (inkCtx && cs) {
            inkCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        }
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
            if (r.width < 1) continue;
            if (r.left < left) left = r.left;
            if (r.right > right) right = r.right;

            let lineTop = r.top;
            let lineBottom = r.bottom;
            if (inkCtx && cs) {
                const m = inkCtx.measureText(node.textContent);
                const baseline = r.top + m.fontBoundingBoxAscent;
                if (Number.isFinite(m.actualBoundingBoxAscent))
                    lineTop = baseline - m.actualBoundingBoxAscent;
                if (Number.isFinite(m.actualBoundingBoxDescent))
                    lineBottom = baseline + m.actualBoundingBoxDescent;
            }
            if (lineTop < top) top = lineTop;
            if (lineBottom > bottom) bottom = lineBottom;
        }
    }
    if (!Number.isFinite(left) || !Number.isFinite(bottom)) return null;
    return { left, right, top, bottom };
}

// Split an rgb(a) color into opaque base + alpha. Painting the SVG with the
// opaque color and setting opacity on the <svg> itself avoids dark seams where
// arrows, ticks and the dim line overlap.
function splitColorAlpha(c) {
    const m = c.match(/^rgba?\(([^)]+)\)$/);
    if (!m) return { color: c, alpha: 1 };
    const p = m[1].split(",").map((s) => s.trim());
    if (p.length === 4) {
        const alpha = parseFloat(p[3]);
        return {
            color: `rgb(${p[0]}, ${p[1]}, ${p[2]})`,
            alpha: Number.isFinite(alpha) ? alpha : 1,
        };
    }
    return { color: c, alpha: 1 };
}

export function getDimColors(refEl, labelBgFallback) {
    const cs = getComputedStyle(document.documentElement);
    const refColor = getComputedStyle(refEl).color;
    const { color: stroke, strokeOpacity } = (() => {
        const r = splitColorAlpha(
            refColor ||
                cs.getPropertyValue("--color-dim-stroke").trim() ||
                "rgba(90, 90, 90, 0.45)",
        );
        return { color: r.color, strokeOpacity: r.alpha };
    })();
    return {
        stroke,
        strokeOpacity,
        labelBg:
            labelBgFallback ||
            cs.getPropertyValue("--color-banner-label-bg").trim() ||
            "#111111",
        labelColor:
            cs.getPropertyValue("--color-banner-label-text").trim() ||
            "#ffffff",
    };
}

const LBL_BASE =
    'font-family:"JetBrains Mono",monospace;font-size:0.5625rem;font-weight:700;' +
    "letter-spacing:0.2em;white-space:nowrap;text-transform:uppercase;line-height:1.6;" +
    "-webkit-text-stroke:0;text-shadow:none;";

// ── horizontal dimension ────────────────────────────────────────────────────

export function makeDim(rem, widthPx, colors, labelAlign) {
    labelAlign = labelAlign || "center";
    const ns = "http://www.w3.org/2000/svg";
    const cy = 10;
    const tickH = 7;
    const ah = 4;
    const aw = 8;
    const { stroke: col, strokeOpacity, labelBg, labelColor } = colors;

    const labelWidth = measureLabelWidth((rem + " rem").toUpperCase());
    const compact = widthPx < labelWidth + aw * 2 + 8;
    const ext = compact ? aw + 4 : 0;
    const svgW = widthPx + ext * 2;

    const el = document.createElement("div");
    el.style.cssText = `position:absolute;height:${cy * 2}px;pointer-events:none;overflow:visible;`;
    el.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(svgW));
    svg.setAttribute("height", String(cy * 2));
    svg.setAttribute("opacity", String(strokeOpacity));
    svg.setAttribute("shape-rendering", "geometricPrecision");
    svg.style.cssText = `position:absolute;left:${-ext}px;top:0;display:block;overflow:visible;`;

    const x1 = ext;
    const x2 = ext + widthPx;
    const over = 4;

    const dimLine = document.createElementNS(ns, "line");
    dimLine.setAttribute("x1", String(compact ? x1 - aw - over : x1));
    dimLine.setAttribute("y1", String(cy));
    dimLine.setAttribute("x2", String(compact ? x2 + aw + over : x2));
    dimLine.setAttribute("y2", String(cy));
    dimLine.setAttribute("stroke", col);
    dimLine.setAttribute("stroke-width", "1");
    svg.appendChild(dimLine);

    const lt = document.createElementNS(ns, "line");
    lt.setAttribute("x1", String(x1));
    lt.setAttribute("y1", String(cy - tickH));
    lt.setAttribute("x2", String(x1));
    lt.setAttribute("y2", String(cy + tickH));
    lt.setAttribute("stroke", col);
    lt.setAttribute("stroke-width", "1.5");
    svg.appendChild(lt);

    const rt = document.createElementNS(ns, "line");
    rt.setAttribute("x1", String(x2));
    rt.setAttribute("y1", String(cy - tickH));
    rt.setAttribute("x2", String(x2));
    rt.setAttribute("y2", String(cy + tickH));
    rt.setAttribute("stroke", col);
    rt.setAttribute("stroke-width", "1.5");
    svg.appendChild(rt);

    if (!compact) {
        const la = document.createElementNS(ns, "polygon");
        la.setAttribute(
            "points",
            `${x1},${cy} ${x1 + aw},${cy - ah} ${x1 + aw},${cy + ah}`,
        );
        la.setAttribute("fill", col);
        svg.appendChild(la);

        const ra = document.createElementNS(ns, "polygon");
        ra.setAttribute(
            "points",
            `${x2},${cy} ${x2 - aw},${cy - ah} ${x2 - aw},${cy + ah}`,
        );
        ra.setAttribute("fill", col);
        svg.appendChild(ra);
    } else {
        // DIN 406-11 compact: arrows outside the ticks, pointing inward
        const la = document.createElementNS(ns, "polygon");
        la.setAttribute(
            "points",
            `${x1},${cy} ${x1 - aw},${cy - ah} ${x1 - aw},${cy + ah}`,
        );
        la.setAttribute("fill", col);
        svg.appendChild(la);

        const ra = document.createElementNS(ns, "polygon");
        ra.setAttribute(
            "points",
            `${x2},${cy} ${x2 + aw},${cy - ah} ${x2 + aw},${cy + ah}`,
        );
        ra.setAttribute("fill", col);
        svg.appendChild(ra);
    }

    el.appendChild(svg);

    const lbl = document.createElement("span");
    const lblBase = `background-color:${labelBg};padding:1px 0.5rem;color:${labelColor};${LBL_BASE}`;
    if (labelAlign === "outward") {
        // Label sits left-aligned above the line (3px gap), not centered.
        // Horizontal position comes from --dim-label-left, set by the caller
        // (e.g. to align with a container/logo edge instead of the line's
        // start x1). Falls back to the line start.
        lbl.style.cssText =
            `position:absolute;left:var(--dim-label-left, ${x1}px);top:${cy - tickH - 3}px;transform:translateY(-100%);` +
            lblBase;
    } else if (compact) {
        lbl.style.cssText =
            "position:absolute;left:50%;bottom:100%;transform:translateX(-50%);" +
            lblBase;
    } else {
        // DIN 406: label above the dimension line, 3 px gap
        lbl.style.cssText =
            `position:absolute;left:50%;top:50%;transform:translate(-50%,calc(-50% - ${LABEL_BOX_H / 2 + 3}px));` +
            lblBase;
    }
    lbl.textContent = rem + " rem";
    el.appendChild(lbl);

    return el;
}

// ── vertical dimension ──────────────────────────────────────────────────────

export function makeVerticalDim(rem, topPx, heightPx, mode, colors, labelAlign) {
    mode = mode || "standard";
    labelAlign = labelAlign || "center";
    const ns = "http://www.w3.org/2000/svg";
    const tickW = 7;
    const ah = 4;
    const aw = 7;
    const gap = 3;
    // "leftOutside": label flush left at the wrapper edge (x=0), line shifts
    // right by label width + gap so it doesn't sit on top of the label.
    // otherwise the line sits at the 20px standard center.
    const cx =
        labelAlign === "leftOutside" ? LABEL_BOX_H + gap + tickW : 10;
    const svgW = cx + tickW + 1;
    const { stroke: col, strokeOpacity, labelBg, labelColor } = colors;

    const labelOnLine = mode === "standard" && labelFitsOnLine(heightPx, rem);
    const outward = mode === "compactLeft" || heightPx < aw * 2 + 4;
    const over = 4;
    const pad = outward ? aw + 2 + over : 0;
    const totalH = heightPx + pad * 2;
    const y1 = pad;
    const y2 = pad + heightPx;

    const el = document.createElement("div");
    el.style.cssText =
        `position:absolute;width:${svgW}px;height:${totalH}px;` +
        `top:${topPx - pad}px;pointer-events:none;overflow:visible;`;
    el.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(svgW));
    svg.setAttribute("height", String(totalH));
    svg.setAttribute("opacity", String(strokeOpacity));
    svg.setAttribute("shape-rendering", "geometricPrecision");
    // overflow:visible like the horizontal version — otherwise the end ticks
    // (stroke-width 1.5) at y=0 / y=totalH get half-clipped at the SVG edge.
    svg.style.cssText = "position:absolute;left:0;top:0;display:block;overflow:visible;";

    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", String(cx));
    line.setAttribute("y1", outward ? String(y1 - aw - over) : String(y1));
    line.setAttribute("x2", String(cx));
    line.setAttribute("y2", outward ? String(y2 + aw + over) : String(y2));
    line.setAttribute("stroke", col);
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);

    const tt = document.createElementNS(ns, "line");
    tt.setAttribute("x1", String(cx - tickW));
    tt.setAttribute("y1", String(y1));
    tt.setAttribute("x2", String(cx + tickW));
    tt.setAttribute("y2", String(y1));
    tt.setAttribute("stroke", col);
    tt.setAttribute("stroke-width", "1.5");
    svg.appendChild(tt);

    const bt = document.createElementNS(ns, "line");
    bt.setAttribute("x1", String(cx - tickW));
    bt.setAttribute("y1", String(y2));
    bt.setAttribute("x2", String(cx + tickW));
    bt.setAttribute("y2", String(y2));
    bt.setAttribute("stroke", col);
    bt.setAttribute("stroke-width", "1.5");
    svg.appendChild(bt);

    const ta = document.createElementNS(ns, "polygon");
    const ba = document.createElementNS(ns, "polygon");

    if (outward) {
        ta.setAttribute(
            "points",
            `${cx},${y1} ${cx - ah},${y1 - aw} ${cx + ah},${y1 - aw}`,
        );
        ba.setAttribute(
            "points",
            `${cx},${y2} ${cx - ah},${y2 + aw} ${cx + ah},${y2 + aw}`,
        );
    } else {
        ta.setAttribute(
            "points",
            `${cx},${y1} ${cx - ah},${y1 + aw} ${cx + ah},${y1 + aw}`,
        );
        ba.setAttribute(
            "points",
            `${cx},${y2} ${cx - ah},${y2 - aw} ${cx + ah},${y2 - aw}`,
        );
    }
    ta.setAttribute("fill", col);
    ba.setAttribute("fill", col);
    svg.appendChild(ta);
    svg.appendChild(ba);
    el.appendChild(svg);

    const lbl = document.createElement("span");
    const vLblBase = `background-color:${labelBg};padding:1px 0.5rem;color:${labelColor};${LBL_BASE}`;
    // "center": label centered on the line (default — e.g. news boxes, where the
    // line sits outside the box so the label's outer edge doesn't matter).
    // "leftOutside": label flush left at the wrapper edge (x=0, e.g. aligned
    // with the logo edge), line sits to the right of it.
    const lblOffsetX =
        labelAlign === "leftOutside"
            ? LABEL_BOX_H / 2
            : cx - (LABEL_BOX_H / 2 + 6);

    // if the rotated label doesn't fit between the extension lines (height too
    // small, DIN 406 compact case), put it above the upper arrowhead instead
    // of centering it on a line that's too short
    if (mode === "compactLeft" && !labelFitsOnLine(heightPx, rem)) {
        lbl.style.cssText =
            `position:absolute;left:${lblOffsetX}px;top:${y1 - aw - over}px;` +
            "transform:translate(-50%,-100%) rotate(-90deg);transform-origin:center;" +
            vLblBase;
    } else {
        const lblMidY = (y1 + y2) / 2;
        lbl.style.cssText =
            `position:absolute;left:${lblOffsetX}px;top:${lblMidY}px;transform:translate(-50%,-50%) rotate(-90deg);` +
            vLblBase;
    }
    lbl.textContent = rem + " rem";
    el.appendChild(lbl);

    return el;
}
