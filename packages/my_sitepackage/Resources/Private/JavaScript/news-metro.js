// Metro / Netzplan-Grafik fuer Projekt-Detailseiten.
//
// data-metro JSON beschreibt einen gerichteten Graphen:
//   { nodes: { id: { label, col, row } }, edges: [{ from, to, color }] }
// col/row sind Rasterkoordinaten (du legst das Layout selbst fest, kein
// Auto-Layout). Das SVG:
//   - eine Linie pro Kante (from -> to), Ecken rechtwinklig gefuehrt
//   - ein Kreis + Label pro Knoten
//   - erst wachsen die Kanten beim Scroll ins Bild (stroke-dashoffset),
//     dann laeuft dauerhaft ein Puls jede Kante entlang (Richtung = from->to)
//
// ponytail: rechtwinklige Verbindungen (H, dann V, dann H), keine Kurven,
// keine Label-Kollisionsvermeidung. Reicht das optisch nicht, kommt danach
// eine Graph-Layout-Lib.

const NS = "http://www.w3.org/2000/svg";
const COL_W = 230; // px pro Raster-Spalte
const ROW_H = 84; // px pro Raster-Zeile
const PAD_X = 120;
const PAD_Y = 46;
const R = 6; // Knoten-Radius
const LANE = 7; // Versatz paralleler Kanten, damit sie sich nicht decken
const DEFAULT_COLOR = "#1c8a7d";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
}

function pos(node) {
    return {
        x: PAD_X + (node.col || 0) * COL_W,
        y: PAD_Y + (node.row || 0) * ROW_H,
    };
}

// rechtwinkliger Pfad von a nach b: halber Weg horizontal, dann vertikal,
// dann Rest horizontal. Gleiche Zeile => gerade Linie.
// laneShift verschiebt das vertikale Teilstueck seitlich, damit mehrere
// Kanten zwischen denselben Spalten nicht exakt uebereinander liegen.
function orthPath(a, b, laneShift = 0) {
    if (a.y === b.y) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    const midX = a.x + (b.x - a.x) / 2 + laneShift;
    return `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`;
}

function build(container) {
    let data;
    try {
        data = JSON.parse(container.dataset.metro);
    } catch {
        return;
    }
    if (!data || !data.nodes || !Array.isArray(data.edges)) return;

    const ids = Object.keys(data.nodes);
    if (!ids.length) return;

    let maxCol = 0;
    let maxRow = 0;
    for (const id of ids) {
        const n = data.nodes[id];
        maxCol = Math.max(maxCol, n.col || 0);
        maxRow = Math.max(maxRow, n.row || 0);
    }
    const width = PAD_X * 2 + maxCol * COL_W;
    const height = PAD_Y * 2 + maxRow * ROW_H;

    const svg = el(
        "svg",
        {
            viewBox: `0 0 ${width} ${height}`,
            class: "cb-metro__svg",
            preserveAspectRatio: "xMinYMid meet",
            role: "img",
            "aria-label":
                "Netzplan des Projektaufbaus: " +
                data.edges
                    .map(
                        (e) =>
                            `${data.nodes[e.from]?.label || e.from} führt zu ${
                                data.nodes[e.to]?.label || e.to
                            }`,
                    )
                    .join("; "),
        },
        container,
    );

    // pro Spaltenpaar zaehlen, damit parallele Kanten seitlich gestaffelt werden
    const laneSeen = {};

    // ── Kanten ─────────────────────────────────────────────────────────────
    data.edges.forEach((e, i) => {
        const from = data.nodes[e.from];
        const to = data.nodes[e.to];
        if (!from || !to) return;

        let laneShift = 0;
        if ((from.row || 0) !== (to.row || 0)) {
            const key = `${from.col || 0}-${to.col || 0}`;
            const n = laneSeen[key] || 0;
            laneSeen[key] = n + 1;
            laneShift = n * LANE * 2 - LANE; // ...-LANE, +LANE, +3*LANE, ...
        }
        const d = orthPath(pos(from), pos(to), laneShift);
        const color = e.color || DEFAULT_COLOR;

        const line = el(
            "path",
            {
                d,
                fill: "none",
                stroke: color,
                "stroke-width": 5,
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                class: "cb-metro__line",
            },
            svg,
        );

        if (!reduceMotion) {
            const len = line.getTotalLength();
            line.style.strokeDasharray = len;
            line.style.strokeDashoffset = len;
            line.style.animationDelay = `${i * 0.12}s`;

            const pulse = el(
                "circle",
                { r: 4, fill: color, class: "cb-metro__pulse" },
                svg,
            );
            el(
                "animateMotion",
                {
                    dur: "2.4s",
                    repeatCount: "indefinite",
                    path: d,
                    begin: `${0.9 + i * 0.12}s`,
                },
                pulse,
            );
        }
    });

    // ── Knoten ─────────────────────────────────────────────────────────────
    ids.forEach((id, i) => {
        const n = data.nodes[id];
        const p = pos(n);
        const g = el(
            "g",
            { class: "cb-metro__station", style: `--i:${i}` },
            svg,
        );
        el("circle", { cx: p.x, cy: p.y, r: R, class: "cb-metro__dot" }, g);

        // Endknoten (keine ausgehende Kante) => Label rechts daneben.
        // Startknoten (keine eingehende Kante) => Label links daneben, damit
        // ein langes Tool-Label nicht ueber den SVG-Rand laeuft.
        // Sonst ober- oder unterhalb: nach unten nur, wenn dort keine weitere
        // Zeile mit Knoten ist – sonst nach oben. Bleibt beides frei, wird nach
        // Spaltenparitaet alterniert, damit lange Nachbar-Labels sich nicht decken.
        const outCount = data.edges.filter((e) => e.from === id).length;
        const inCount = data.edges.filter((e) => e.to === id).length;
        const rowBelowUsed = ids.some(
            (o) => o !== id && (data.nodes[o].row || 0) > (n.row || 0),
        );
        const rowAboveUsed = ids.some(
            (o) => o !== id && (data.nodes[o].row || 0) < (n.row || 0),
        );
        let attrs;
        if (outCount === 0) {
            attrs = {
                x: p.x + R + 8,
                y: p.y + 4,
                "text-anchor": "start",
                class: "cb-metro__label",
            };
        } else if (inCount === 0) {
            attrs = {
                x: p.x - R - 8,
                y: p.y + 4,
                "text-anchor": "end",
                class: "cb-metro__label",
            };
        } else {
            const above =
                rowBelowUsed ||
                outCount > 1 ||
                (!rowAboveUsed && (n.col || 0) % 2 === 0);
            attrs = {
                x: p.x,
                y: above ? p.y - R - 10 : p.y + R + 22,
                "text-anchor": "middle",
                class: "cb-metro__label",
            };
        }
        const label = el("text", attrs, g);
        label.textContent = n.label || id;
    });

    // viewBox an die tatsaechliche Bounding-Box anpassen, damit lange Labels
    // am Rand (Start-/Endknoten) nicht abgeschnitten werden. getBBox geht nur,
    // wenn das SVG schon Layout hat – rAF abwarten.
    requestAnimationFrame(() => {
        const b = svg.getBBox();
        const m = 6;
        svg.setAttribute(
            "viewBox",
            `${b.x - m} ${b.y - m} ${b.width + m * 2} ${b.height + m * 2}`,
        );
    });

    if (!reduceMotion) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        container.classList.add("cb-metro--play");
                        io.disconnect();
                    }
                });
            },
            { threshold: 0.25 },
        );
        io.observe(container);
    }
}

function init() {
    document.querySelectorAll(".cb-metro[data-metro]").forEach(build);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
