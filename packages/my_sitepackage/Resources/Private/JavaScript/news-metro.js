// Metro / Netzplan-Grafik fuer Projekt-Detailseiten.
//
// Liest data-metro (JSON: { lines: [{ color, stations: [name, ...] }] }) und
// baut ein Inline-SVG: eine Polyline pro Linie, ein Kreis + Label pro Station.
// Gleichnamige Stationen verschiedener Linien teilen sich eine X-Spalte
// (= Umstieg). Erst wachsen die Linien beim Scroll ins Bild (stroke-dashoffset),
// dann laeuft dauerhaft ein Puls entlang jeder Linie.
//
// ponytail: gerade Segmente, Labels abwechselnd oben/unten, keine Kurven-
// Glaettung und keine Label-Kollisionsvermeidung. Reicht das optisch nicht,
// kommt danach eine Layout-Lib.

const NS = "http://www.w3.org/2000/svg";
const COL_W = 150; // px pro Stations-Spalte
const ROW_H = 90; // px pro Linie (vertikaler Versatz)
const PAD_X = 90;
const PAD_Y = 60;
const R = 7; // Stations-Radius

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
}

function layout(lines) {
    // gemeinsame Spalten-Belegung: jede eindeutige Station bekommt einen Index
    // in Reihenfolge ihres ersten Auftretens
    const colOf = new Map();
    lines.forEach((line) => {
        line.stations.forEach((s) => {
            if (!colOf.has(s)) colOf.set(s, colOf.size);
        });
    });

    const nodes = [];
    const paths = lines.map((line, li) => {
        const y = PAD_Y + li * ROW_H;
        const pts = line.stations.map((s) => {
            const x = PAD_X + colOf.get(s) * COL_W;
            nodes.push({ x, y, name: s, li });
            return [x, y];
        });
        return { color: line.color || "#1c8a7d", pts };
    });

    const width = PAD_X * 2 + (colOf.size - 1) * COL_W;
    const height = PAD_Y * 2 + (lines.length - 1) * ROW_H;
    return { paths, nodes, width, height };
}

function build(container) {
    let data;
    try {
        data = JSON.parse(container.dataset.metro);
    } catch {
        return;
    }
    if (!data || !Array.isArray(data.lines) || !data.lines.length) return;

    const { paths, nodes, width, height } = layout(data.lines);

    const svg = el(
        "svg",
        {
            viewBox: `0 0 ${width} ${height}`,
            class: "cb-metro__svg",
            role: "img",
            "aria-label":
                "Netzplan des Projektaufbaus: " +
                data.lines
                    .map((l) => l.stations.join(" – "))
                    .join("; "),
        },
        container,
    );

    // Linien
    paths.forEach((p, i) => {
        const d =
            "M " + p.pts.map(([x, y]) => `${x} ${y}`).join(" L ");
        const line = el(
            "path",
            {
                d,
                fill: "none",
                stroke: p.color,
                "stroke-width": 6,
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
            line.style.setProperty("--metro-len", len);
            line.style.animationDelay = `${i * 0.25}s`;
        }

        // Dauer-Puls entlang der Linie
        if (!reduceMotion) {
            const pulse = el(
                "circle",
                { r: 5, fill: p.color, class: "cb-metro__pulse" },
                svg,
            );
            const motion = el(
                "animateMotion",
                {
                    dur: `${Math.max(3, p.pts.length * 1.1)}s`,
                    repeatCount: "indefinite",
                    path: d,
                    // erst nach dem Aufbau starten
                    begin: `${1.2 + i * 0.25}s`,
                },
                pulse,
            );
            void motion;
        }
    });

    // Stationen + Labels
    nodes.forEach((n, i) => {
        const g = el(
            "g",
            { class: "cb-metro__station", style: `--i:${i}` },
            svg,
        );
        el(
            "circle",
            {
                cx: n.x,
                cy: n.y,
                r: R,
                class: "cb-metro__dot",
            },
            g,
        );
        const above = n.li % 2 === 0;
        const label = el(
            "text",
            {
                x: n.x,
                y: above ? n.y - R - 10 : n.y + R + 20,
                "text-anchor": "middle",
                class: "cb-metro__label",
            },
            g,
        );
        label.textContent = n.name;
    });

    // Aufbau beim Sichtbarwerden ausloesen
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
