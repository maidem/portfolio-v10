(function () {
    "use strict";

    const banner = document.querySelector(".cb-portfolio-banner");
    const text = document.querySelector(".cb-portfolio-text");
    if (!banner || !text) return;

    // Profile mode: multi-line rich text instead of the single-line wordmark.
    // Dimensions measure the whole text block; no font scaling / ink trimming.
    const isProfile = text.classList.contains("cb-portfolio-text--profile");

    // ── constants ──────────────────────────────────────────────────────────────

    // Rendered thickness of the rotated dimension label box
    // (9px font × 1.6 line-height + 2px padding)
    const LABEL_BOX_H = 17;

    // ── helpers ────────────────────────────────────────────────────────────────

    function measureLabelWidth(labelText) {
        const ctx = document.createElement("canvas").getContext("2d");
        if (!ctx) return 56;
        ctx.font = '700 9px "JetBrains Mono", monospace';
        const tracking = 0.2 * 9 * Math.max(0, labelText.length - 1);
        return ctx.measureText(labelText).width + tracking + 16;
    }

    // Split an rgb(a) color into its opaque base and alpha. Painting the SVG
    // with the OPAQUE color and setting opacity on the <svg> avoids dark seams
    // where arrows, ticks and the dim line overlap.
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

    function getDimColors() {
        const cs = getComputedStyle(document.documentElement);
        const wordmarkColor = getComputedStyle(text).color;
        const { color: stroke, alpha: strokeOpacity } = splitColorAlpha(
            wordmarkColor ||
                cs.getPropertyValue("--color-dim-stroke").trim() ||
                "rgba(90, 90, 90, 0.45)",
        );
        return {
            stroke,
            strokeOpacity,
            labelBg: isProfile
                ? "#111111"
                : cs.getPropertyValue("--color-banner-label-bg").trim() ||
                  "#111111",
            labelColor:
                cs.getPropertyValue("--color-banner-label-text").trim() ||
                "#ffffff",
        };
    }

    // ── horizontal dimension ───────────────────────────────────────────────────

    function makeDim(rem, widthPx) {
        const ns = "http://www.w3.org/2000/svg";
        const cy = 10;
        const tickH = 7;
        const ah = 4;
        const aw = 8;
        const { stroke: col, strokeOpacity, labelBg, labelColor } =
            getDimColors();

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
        const lblBase =
            `background-color:${labelBg};padding:1px 0.5rem;` +
            'font-family:"JetBrains Mono",monospace;font-size:0.5625rem;font-weight:700;' +
            `letter-spacing:0.2em;color:${labelColor};white-space:nowrap;` +
            "text-transform:uppercase;line-height:1.6;" +
            "-webkit-text-stroke:0;text-shadow:none;";
        if (compact) {
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

    // ── vertical dimension ─────────────────────────────────────────────────────

    function labelFitsOnLine(heightPx, rem) {
        const aw = 7;
        return heightPx >= measureLabelWidth((rem + " rem").toUpperCase()) + aw * 2 + 8;
    }

    function makeVerticalDim(rem, topPx, heightPx, mode) {
        mode = mode || "standard";
        const ns = "http://www.w3.org/2000/svg";
        const cx = 10;
        const tickW = 7;
        const ah = 4;
        const aw = 7;
        const { stroke: col, strokeOpacity, labelBg, labelColor } =
            getDimColors();

        const labelOnLine = mode === "standard" && labelFitsOnLine(heightPx, rem);
        const outward = mode === "compactLeft" || heightPx < aw * 2 + 4;
        const over = 4;
        const pad = outward ? aw + 2 + over : 0;
        const totalH = heightPx + pad * 2;
        const y1 = pad;
        const y2 = pad + heightPx;

        const el = document.createElement("div");
        el.style.cssText =
            `position:absolute;width:1.25rem;height:${totalH}px;` +
            `top:${topPx - pad}px;pointer-events:none;`;
        el.setAttribute("aria-hidden", "true");

        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", String(totalH));
        svg.setAttribute("opacity", String(strokeOpacity));
        svg.setAttribute("shape-rendering", "geometricPrecision");
        svg.style.cssText = "position:absolute;left:0;top:0;display:block;";

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

        const lblMidY = (y1 + y2) / 2;
        const lbl = document.createElement("span");
        const vLblBase =
            `background-color:${labelBg};padding:1px 0.5rem;` +
            'font-family:"JetBrains Mono",monospace;font-size:0.5625rem;font-weight:700;' +
            `letter-spacing:0.2em;color:${labelColor};white-space:nowrap;` +
            "text-transform:uppercase;line-height:1.6;" +
            "-webkit-text-stroke:0;text-shadow:none;";
        const lblOffsetX = cx - (LABEL_BOX_H / 2 + 3);
        if (labelOnLine) {
            // DIN 406: label left of the dimension line, 3 px gap, rotated
            lbl.style.cssText =
                `position:absolute;left:${lblOffsetX}px;top:${lblMidY}px;transform:translate(-50%,-50%) rotate(-90deg);` +
                vLblBase;
        } else {
            lbl.style.cssText =
                `position:absolute;left:${lblOffsetX}px;top:${lblMidY}px;transform:translate(-50%,-50%) rotate(-90deg);` +
                vLblBase;
        }
        lbl.textContent = rem + " rem";
        el.appendChild(lbl);

        return el;
    }

    // ── state ──────────────────────────────────────────────────────────────────

    let dims = [];
    let rafId = null;

    function pxToRem(px) {
        const rootSize = parseFloat(
            window.getComputedStyle(document.documentElement).fontSize,
        );
        return px / (Number.isFinite(rootSize) && rootSize > 0 ? rootSize : 16);
    }

    function scheduleUpdate() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(function () {
            rafId = null;
            update();
        });
    }

    function update() {
        dims.forEach(function (d) { d.remove(); });
        dims = [];

        // Scale down only — target 82 % of container width
        text.style.removeProperty("font-size");
        if (!isProfile) {
            const w = text.getBoundingClientRect().width;
            const target = banner.clientWidth * 0.82;
            if (w > target && w > 0) {
                const fs = parseFloat(window.getComputedStyle(text).fontSize);
                text.style.fontSize = (fs * (target / w)).toFixed(2) + "px";
            }
        }

        const tRect = text.getBoundingClientRect();
        let startX = 0;
        let totalWidth = tRect.width;

        // Accurate ink bounds via Range + canvas side-bearing trim
        if (!isProfile) {
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

                        const inkLeft =
                            firstOrigin - mFirst.actualBoundingBoxLeft;
                        const inkRight =
                            lastOrigin + mLast.actualBoundingBoxRight;

                        const tol =
                            (parseFloat(cs.fontSize) || 16) * 0.25;
                        let newLeft = startX;
                        let newRight = startX + totalWidth;
                        if (
                            Number.isFinite(inkLeft) &&
                            Math.abs(inkLeft - newLeft) <= tol
                        ) {
                            newLeft = inkLeft;
                        }
                        if (
                            Number.isFinite(inkRight) &&
                            Math.abs(inkRight - newRight) <= tol
                        ) {
                            newRight = inkRight;
                        }
                        if (newRight - newLeft > totalWidth * 0.5) {
                            startX = newLeft;
                            totalWidth = newRight - newLeft;
                        }
                    }
                }
            }
        }

        // Cap-height probe for ink top/height
        const makeProbe = () => {
            const s = document.createElement("span");
            s.style.cssText =
                "display:inline-block;width:0;height:1cap;vertical-align:baseline;" +
                "line-height:0;overflow:visible;pointer-events:none;";
            return s;
        };
        let inkTop = 0;
        let inkHeight = tRect.height;
        if (isProfile) {
            // Multi-line block: cap top of first line → last-line baseline + descender
            const first = text.firstElementChild || text;
            const last = text.lastElementChild || text;
            const p1 = makeProbe();
            first.insertBefore(p1, first.firstChild);
            const r1 = p1.getBoundingClientRect();
            p1.remove();
            const p2 = makeProbe();
            last.appendChild(p2);
            const r2 = p2.getBoundingClientRect();
            p2.remove();
            const fs = parseFloat(getComputedStyle(last).fontSize) || 16;
            inkTop = r1.top - tRect.top;
            inkHeight = r2.bottom + fs * 0.22 - tRect.top - inkTop;
        } else {
            const probe = makeProbe();
            text.appendChild(probe);
            const probeRect = probe.getBoundingClientRect();
            text.removeChild(probe);
            inkTop = probeRect.top - tRect.top;
            inkHeight = probeRect.height;
        }
        const inkBottom = inkTop + inkHeight;
        // ponytail: profile gap tuned so the dim band ends on the 8px grid
        const gap = isProfile ? 46 : 26;

        if (totalWidth > 1) {
            const dim = makeDim(pxToRem(totalWidth).toFixed(2), totalWidth);
            dim.style.left = startX + "px";
            dim.style.width = totalWidth + "px";
            dim.style.top = inkBottom + gap - 10 + "px";
            text.appendChild(dim);
            dims.push(dim);
        }

        if (inkHeight > 1) {
            const remH = pxToRem(inkHeight).toFixed(2);
            const standardOffset = gap + 20;
            const compactOffset = 12 + 10;
            const besideExtra = labelFitsOnLine(inkHeight, remH)
                ? 0
                : LABEL_BOX_H + 4;
            const roomLeft = tRect.left;

            if (roomLeft >= standardOffset + besideExtra + 4) {
                const vdim = makeVerticalDim(remH, inkTop, inkHeight, "standard");
                vdim.style.left = -standardOffset + "px";
                text.appendChild(vdim);
                dims.push(vdim);
            } else if (roomLeft >= compactOffset + LABEL_BOX_H + 4 + 4) {
                const vdim = makeVerticalDim(remH, inkTop, inkHeight, "compactLeft");
                vdim.style.left = -compactOffset + "px";
                text.appendChild(vdim);
                dims.push(vdim);
            }
        }
    }

    // ── init ───────────────────────────────────────────────────────────────────

    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(scheduleUpdate).observe(banner);
    } else {
        window.addEventListener("resize", scheduleUpdate);
    }

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(update);
})();
