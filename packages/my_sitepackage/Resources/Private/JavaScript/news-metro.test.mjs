// Selbsttest fuer die Spalten-/Umstiegs-Logik in news-metro.js.
// Lauf: node news-metro.test.mjs
// ponytail: keine Framework-Abhaengigkeit – layout() ist hier gespiegelt,
// weil news-metro.js sonst das DOM anfassen wuerde. Konstanten synchron halten.

const COL_W = 150,
    ROW_H = 90,
    PAD_X = 90,
    PAD_Y = 60;

function layout(lines) {
    const colOf = new Map();
    lines.forEach((l) =>
        l.stations.forEach((s) => {
            if (!colOf.has(s)) colOf.set(s, colOf.size);
        }),
    );
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

const r = layout([
    { color: "#111", stations: ["A", "B", "C"] },
    { color: "#222", stations: ["B", "D"] },
]);

const bMain = r.nodes.find((n) => n.name === "B" && n.li === 0);
const bBranch = r.nodes.find((n) => n.name === "B" && n.li === 1);

console.assert(bMain.x === bBranch.x, "shared station keeps its column");
console.assert(bBranch.y === bMain.y + ROW_H, "branch line sits one row below");
console.assert(r.width === PAD_X * 2 + 3 * COL_W, "width spans 4 unique columns");
console.assert(
    r.paths[0].pts.length === 3 && r.paths[1].pts.length === 2,
    "point counts per line",
);

console.log("metro layout OK");
