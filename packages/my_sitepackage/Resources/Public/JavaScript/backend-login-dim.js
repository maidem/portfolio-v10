// DIN 406 dimensioning for the login box: actually measures the field/button
// edges and places the line, arrowheads and dimension label exactly on those
// coordinates — same principle as dimension.js in the frontend (label centered
// on the line, arrowheads at the line ends, no position guesswork with offsets).
(function () {
    var TICK = 7; // length of the end ticks (half the length per side)
    var AH = 4; // arrow height
    var AW = 7; // arrow width
    var GAP = 32; // distance of the dimension line from the measured edge (2rem, as in the frontend)
    var LBL_GAP = 3; // distance of the dimension number from the dimension line (DIN 406)
    // vertical needs more room than horizontal, so the rotated dimension number
    // doesn't stick to the end ticks — matches the frontend (dimension.js)
    var LBL_GAP_V = 8;
    var MOBILE_BP = 767.98; // as in the frontend: below this, no vertical dimensioning

    function svgEl(tag, attrs) {
        var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (var k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    function pxToRem(px) {
        return (px / 16).toFixed(2);
    }

    function r(px) {
        return Math.round(px);
    }

    // horizontal dimensioning: line + end ticks + arrows pointing inward + label
    // centered ABOVE the line (3px gap), analogous to makeDim() in the frontend
    function makeHDim(rem, widthPx) {
        var cy = 10;
        var wrap = document.createElement("div");
        wrap.className = "dim js-dim";
        wrap.style.cssText = "position:absolute;width:" + widthPx + "px;height:" + cy * 2 + "px;pointer-events:none;";

        var svg = svgEl("svg", { width: widthPx, height: cy * 2, style: "position:absolute;left:0;top:0;overflow:visible;" });
        svg.appendChild(svgEl("line", { x1: 0, y1: cy, x2: widthPx, y2: cy, stroke: "#111111", "stroke-width": 1 }));
        svg.appendChild(svgEl("line", { x1: 0, y1: cy - TICK, x2: 0, y2: cy + TICK, stroke: "#111111", "stroke-width": 1.5 }));
        svg.appendChild(svgEl("line", { x1: widthPx, y1: cy - TICK, x2: widthPx, y2: cy + TICK, stroke: "#111111", "stroke-width": 1.5 }));
        svg.appendChild(svgEl("polygon", { points: "0," + cy + " " + AW + "," + (cy - AH) + " " + AW + "," + (cy + AH), fill: "#111111" }));
        svg.appendChild(svgEl("polygon", { points: widthPx + "," + cy + " " + (widthPx - AW) + "," + (cy - AH) + " " + (widthPx - AW) + "," + (cy + AH), fill: "#111111" }));
        wrap.appendChild(svg);

        // DIN 406: the dimension number sits ABOVE the dimension line, not on it
        var lbl = document.createElement("span");
        lbl.className = "dim-label";
        lbl.style.cssText =
            "position:absolute;left:50%;top:" + (cy - LBL_GAP) + "px;transform:translate(-50%,-100%);";
        lbl.textContent = rem + " REM";
        wrap.appendChild(lbl);

        return wrap;
    }

    // vertical dimensioning: line + end ticks + arrows pointing inward + label
    // centered on the line, rotated -90° (reads bottom to top)
    function makeVDim(rem, heightPx) {
        var cx = 10;
        var wrap = document.createElement("div");
        wrap.className = "dim js-dim";
        wrap.style.cssText = "position:absolute;width:" + cx * 2 + "px;height:" + heightPx + "px;pointer-events:none;";

        var svg = svgEl("svg", { width: cx * 2, height: heightPx, style: "position:absolute;left:0;top:0;overflow:visible;" });
        svg.appendChild(svgEl("line", { x1: cx, y1: 0, x2: cx, y2: heightPx, stroke: "#111111", "stroke-width": 1 }));
        svg.appendChild(svgEl("line", { x1: cx - TICK, y1: 0, x2: cx + TICK, y2: 0, stroke: "#111111", "stroke-width": 1.5 }));
        svg.appendChild(svgEl("line", { x1: cx - TICK, y1: heightPx, x2: cx + TICK, y2: heightPx, stroke: "#111111", "stroke-width": 1.5 }));
        svg.appendChild(svgEl("polygon", { points: cx + ",0 " + (cx - AH) + "," + AW + " " + (cx + AH) + "," + AW, fill: "#111111" }));
        svg.appendChild(svgEl("polygon", { points: cx + "," + heightPx + " " + (cx - AH) + "," + (heightPx - AW) + " " + (cx + AH) + "," + (heightPx - AW), fill: "#111111" }));
        wrap.appendChild(svg);

        // DIN 406: the dimension number sits LEFT of the dimension line, not on it.
        // rotate(-90deg) first, then translateY along the rotated axis —
        // -50% centers it along the line, the shift to the left comes
        // from the element's own left offset.
        var lbl = document.createElement("span");
        lbl.className = "dim-label";
        lbl.style.cssText =
            "position:absolute;left:" + (cx - LBL_GAP_V) + "px;top:" + heightPx / 2 +
            "px;transform:rotate(-90deg) translate(-50%,-100%);transform-origin:left top;white-space:nowrap;";
        lbl.textContent = rem + " REM";
        wrap.appendChild(lbl);

        return wrap;
    }

    // Extend the logo row above the form into a formula:
    // [portfolio logo] + [TYPO3 logo] = [heart]
    function buildLogoFormula() {
        var wrap = document.querySelector(".typo3-login .typo3-login-logo");
        var typo3Logo = wrap && wrap.querySelector("img");
        if (!wrap || !typo3Logo || wrap.classList.contains("logo-formula")) return;

        wrap.classList.add("logo-formula");

        // Source is the page's favicon — this keeps the asset hash in the path
        // correct without hardcoding it here.
        var favicon = document.querySelector('link[rel~="icon"]');
        if (!favicon) return;

        var brand = document.createElement("img");
        brand.className = "logo-formula__brand";
        brand.src = favicon.href;
        brand.alt = "Maik Demuth";

        var plus = document.createElement("span");
        plus.className = "logo-formula__op";
        plus.textContent = "+";

        var equals = document.createElement("span");
        equals.className = "logo-formula__op";
        equals.textContent = "=";

        // viewBox exactly on the path bounding box: in the 24-unit grid the
        // heart only fills ~16 units and would otherwise look smaller than the
        // other two logos, even though the CSS height is the same.
        var heart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        heart.setAttribute("class", "logo-formula__heart");
        heart.setAttribute("viewBox", "3 4 18 16.3");
        heart.setAttribute("fill", "currentColor");
        heart.setAttribute("aria-hidden", "true");
        heart.appendChild(
            svgEl("path", {
                d: "M12 20.3C6.5 16.4 3 13 3 9.1 3 6.3 5.2 4 8 4c1.6 0 3.1.8 4 2.1C12.9 4.8 14.4 4 16 4c2.8 0 5 2.3 5 5.1 0 3.9-3.5 7.3-9 11.2z",
            })
        );

        wrap.insertBefore(brand, typo3Logo);
        wrap.insertBefore(plus, typo3Logo);
        wrap.appendChild(equals);
        wrap.appendChild(heart);
    }

    function init() {
        buildLogoFormula();

        var cardLogin = document.querySelector(".typo3-login .card-login");
        var fields = cardLogin && cardLogin.querySelectorAll(".form-group:has(.form-control), .form-group:has(.btn-login)");
        if (!cardLogin || !fields || fields.length < 2) return;

        var first = fields[0];
        var last = fields[fields.length - 1];
        var origin = cardLogin.getBoundingClientRect();
        var firstRect = first.getBoundingClientRect();
        var lastRect = last.getBoundingClientRect();

        cardLogin.querySelectorAll(".js-dim").forEach(function (el) { el.remove(); });

        var vTop = r(firstRect.top - origin.top);
        var vBottom = r(lastRect.bottom - origin.top);
        var vHeight = vBottom - vTop;
        var fieldLeft = r(firstRect.left - origin.left);
        var vX = fieldLeft - GAP;

        // On narrow viewports there's no room on the left for the vertical
        // dimensioning — as in the frontend (see .cb-form-wrap) it's dropped there.
        if (window.innerWidth > MOBILE_BP) {
            var vDim = makeVDim(pxToRem(vHeight), vHeight);
            vDim.style.left = vX - 10 + "px";
            vDim.style.top = vTop + "px";
            cardLogin.appendChild(vDim);
        }

        var hLeft = fieldLeft;
        var hRight = r(firstRect.right - origin.left);
        var hWidth = hRight - hLeft;

        // The H line has to sit below everything else that follows in the card
        // (footer with "Mehr über TYPO3") — otherwise it overlaps the text.
        var hY = vBottom + GAP;
        var footer = cardLogin.querySelector(".card-footer");
        if (footer) {
            var footerBottom = r(footer.getBoundingClientRect().bottom - origin.top);
            hY = Math.max(hY, footerBottom + GAP / 2);
        }

        var hDim = makeHDim(pxToRem(hWidth), hWidth);
        hDim.style.left = hLeft + "px";
        hDim.style.top = hY - 10 + "px";
        cardLogin.appendChild(hDim);
    }

    function scheduleInit() {
        requestAnimationFrame(init);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", scheduleInit);
    } else {
        scheduleInit();
    }
    window.addEventListener("resize", scheduleInit);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(scheduleInit);

    // The copyright block in the footer expands and thereby shifts the card's
    // bottom edge — the H line then has to follow. What's observed is the card
    // itself, not the injected markers (otherwise an infinite loop).
    if (window.ResizeObserver) {
        var observed = null;
        var ro = new ResizeObserver(scheduleInit);
        var attach = function () {
            var card = document.querySelector(".typo3-login .card-login");
            if (card && card !== observed) {
                if (observed) ro.unobserve(observed);
                ro.observe(card);
                observed = card;
            }
        };
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", attach);
        } else {
            attach();
        }
    }
})();
