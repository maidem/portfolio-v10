// Generische technische Bemaßung (DIN 406) für beliebige Blöcke. Wie bei
// Banner/News/Skills sitzt die Bemaßung an einem fit-content-Wrapper mit der
// Klasse .js-measure; JS misst dessen offset-Maße und hängt die SVG-Linien an.
//
// CSS-Konvention (siehe Main.entry.scss):
//   .js-measure          → position:relative; width:fit-content; margin-bottom (Platz H-Linie)
//   Elternelement        → padding-left (Platz vertikale Linie); mobil 0 → keine vertikale
//
// data-measure-h="edges" misst die echte linke/rechte Textkante statt clientWidth
// (für umbrechenden Fließtext, wo fit-content zu breit bleibt).

import { makeDim, makeVerticalDim, pxToRem, getDimColors, inkBounds } from "./dimension.js";

function dimensionMeasure(measure) {
    measure.querySelectorAll(":scope > .js-measure-dim").forEach((el) => el.remove());

    // Opt-in per CSS: nur zeichnen, wenn --measure: on gesetzt ist. So kann ein
    // :has()-Kontext (z.B. section-header nur im Kontakt) die Bemaßung steuern,
    // ohne die Klasse im Template kontextabhängig setzen zu müssen.
    if (getComputedStyle(measure).getPropertyValue("--measure").trim() !== "on")
        return;

    // Platz für die vertikale Linie liegt als padding-left am Elternelement
    // (rückt den Inhalt ein); mobil 0 → keine vertikale Bemaßung.
    const parent = measure.parentElement;
    const padLeft = parent ? parseFloat(getComputedStyle(parent).paddingLeft) || 0 : 0;
    const marginBottom = parseFloat(getComputedStyle(measure).marginBottom) || 0;

    // Vertikaler Messbereich relativ zur Wrapper-Oberkante. Standard: ganzer
    // Wrapper. data-measure-from/-until="<selector>" grenzen ihn auf die Ober-
    // kante des einen bis zur Unterkante des anderen Elements ein (z.B. Formular
    // vom ersten Feld bis zur Checkbox, ohne padding-top/Captcha/Button).
    // Absolut positionierte Dim-Kinder (top:0) hängen an der Border-Box-Oberkante
    // des Wrappers, also ist das der Nullpunkt für den vertikalen Messbereich.
    const originTop = measure.getBoundingClientRect().top;
    let top = 0;
    let bottom = measure.clientHeight;
    const fromEl = measure.dataset.measureFrom && measure.querySelector(measure.dataset.measureFrom);
    const untilEl = measure.dataset.measureUntil && measure.querySelector(measure.dataset.measureUntil);

    // Für Text: an der echten Ink-Kante ausrichten, nicht an der Zeilen-Box (die
    // durch line-height höher ist als die Glyphen) — CSS text-box-trim greift
    // nur auf direkte Kinder, nicht auf verschachtelten Text.
    // data-measure-v="box": Element-Boxen nutzen — für Formulare, wo der
    // visuelle Bezug der Feldrahmen bzw. das Checkbox-Kästchen ist, nicht der
    // (schwebende) Label-Text.
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

    // ── horizontal (Breite) — Linie unter dem Block, Label mittig ─────────────
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

    // Die H-Linie liegt normalerweise unter dem gemessenen Bereich. Mit
    // data-measure-hbelow="<selector>" rutscht sie unter die Unterkante dieses
    // Elements — z.B. beim Formular unter den ganzen Checkbox-Block, wenn dessen
    // Text mehrzeilig unter das (bemasste) Kästchen läuft.
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

    // ── vertikal (Höhe) — Label links an der eingerückten Kante, Linie rechts ──
    if (padLeft > 0) {
        // makeVerticalDim setzt die vertikale Position selbst aus dem topPx-Offset
        // (top:topPx-pad); style.top NICHT überschreiben, sonst geht er verloren.
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
