// DIN-406-Bemaßung für die Login-Box: misst real die Feld-/Button-Kanten und
// setzt Linie, Pfeilspitzen und Maß-Label exakt auf diese Koordinaten — nach
// demselben Prinzip wie dimension.js im Frontend (Label mittig auf der Linie,
// Pfeilspitzen an den Linienenden, kein Positions-Rätselraten mit Offsets).
(function () {
    var TICK = 7; // Länge der Endstriche (halbe Länge je Seite)
    var AH = 4; // Pfeilhöhe
    var AW = 7; // Pfeilbreite
    var GAP = 32; // Abstand der Maßlinie zur gemessenen Kante (2rem, wie im Frontend)
    var LBL_GAP = 3; // Abstand der Maßzahl zur Maßlinie (DIN 406)
    // vertikal braucht mehr Luft als horizontal, damit die gedrehte Maßzahl
    // nicht an den Endstrichen klebt — entspricht dem Frontend (dimension.js)
    var LBL_GAP_V = 8;

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

    // horizontale Bemaßung: Linie + Endstriche + Pfeile nach innen + Label
    // mittig ÜBER der Linie (3px Gap), analog makeDim() im Frontend
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

        // DIN 406: Maßzahl steht ÜBER der Maßlinie, nicht auf ihr
        var lbl = document.createElement("span");
        lbl.className = "dim-label";
        lbl.style.cssText =
            "position:absolute;left:50%;top:" + (cy - LBL_GAP) + "px;transform:translate(-50%,-100%);";
        lbl.textContent = rem + " REM";
        wrap.appendChild(lbl);

        return wrap;
    }

    // vertikale Bemaßung: Linie + Endstriche + Pfeile nach innen + Label
    // mittig auf der Linie, um -90° gedreht (liest sich von unten nach oben)
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

        // DIN 406: Maßzahl steht LINKS der Maßlinie, nicht auf ihr.
        // rotate(-90deg) zuerst, dann translateY in der gedrehten Achse —
        // -50% zentriert längs der Linie, die Verschiebung nach links kommt
        // aus dem left-Offset des Elements selbst.
        var lbl = document.createElement("span");
        lbl.className = "dim-label";
        lbl.style.cssText =
            "position:absolute;left:" + (cx - LBL_GAP_V) + "px;top:" + heightPx / 2 +
            "px;transform:rotate(-90deg) translate(-50%,-100%);transform-origin:left top;white-space:nowrap;";
        lbl.textContent = rem + " REM";
        wrap.appendChild(lbl);

        return wrap;
    }

    // Logo-Zeile über dem Formular zur Formel erweitern:
    // [Portfolio-Logo] + [TYPO3-Logo] = [Herz]
    function buildLogoFormula() {
        var wrap = document.querySelector(".typo3-login .typo3-login-logo");
        var typo3Logo = wrap && wrap.querySelector("img");
        if (!wrap || !typo3Logo || wrap.classList.contains("logo-formula")) return;

        wrap.classList.add("logo-formula");

        // Quelle ist das Favicon der Seite — so bleibt der Asset-Hash im Pfad
        // korrekt, ohne ihn hier fest zu verdrahten.
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

        // viewBox exakt auf die Pfad-Bounding-Box: das Herz füllt im
        // 24er-Raster nur ~16 Einheiten und wirkt sonst kleiner als die
        // anderen beiden Logos, obwohl die CSS-Höhe gleich ist.
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

        var vDim = makeVDim(pxToRem(vHeight), vHeight);
        vDim.style.left = vX - 10 + "px";
        vDim.style.top = vTop + "px";
        cardLogin.appendChild(vDim);

        var hLeft = fieldLeft;
        var hRight = r(firstRect.right - origin.left);
        var hWidth = hRight - hLeft;

        // Die H-Linie muss unter allem liegen, was noch in der Card folgt
        // (Footer mit "Mehr über TYPO3") — sonst überlappt sie den Text.
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
})();
