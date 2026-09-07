// Selbsttest fuer die Geometrie in news-metro.js (orthPath + pos).
// Lauf: node news-metro.test.mjs
// ponytail: Konstanten hier gespiegelt, weil news-metro.js sonst das DOM
// anfassen wuerde. Bei Aenderung dort hier nachziehen.

const COL_W = 230,
    ROW_H = 84,
    PAD_X = 120,
    PAD_Y = 46;

function pos(node) {
    return {
        x: PAD_X + (node.col || 0) * COL_W,
        y: PAD_Y + (node.row || 0) * ROW_H,
    };
}

function orthPath(a, b) {
    if (a.y === b.y) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    const midX = a.x + (b.x - a.x) / 2;
    return `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`;
}

// gleiche Zeile -> gerade Linie mit genau 2 Punkten
const straight = orthPath(pos({ col: 0, row: 0 }), pos({ col: 2, row: 0 }));
console.assert(
    straight === `M ${PAD_X} ${PAD_Y} L ${PAD_X + 2 * COL_W} ${PAD_Y}`,
    "same row = straight segment",
);

// Zeilenwechsel -> Treppe mit 4 Punkten, Knick auf halber Strecke
const branch = orthPath(pos({ col: 3, row: 0 }), pos({ col: 4, row: 2 }));
const pts = branch.match(/[ML] [\d.]+ [\d.]+/g);
console.assert(pts.length === 4, "row change = 4-point orthogonal path");
const midX = PAD_X + 3 * COL_W + COL_W / 2;
console.assert(branch.includes(`L ${midX} ${PAD_Y}`), "knee at half distance");
console.assert(
    branch.endsWith(`L ${PAD_X + 4 * COL_W} ${PAD_Y + 2 * ROW_H}`),
    "ends at target node",
);

// zwei Kanten koennen auf denselben Zielknoten zeigen (Zusammenfuehrung)
const nodes = {
    a: { col: 0, row: 0 },
    b: { col: 0, row: 2 },
    live: { col: 2, row: 1 },
};
const toLiveA = orthPath(pos(nodes.a), pos(nodes.live));
const toLiveB = orthPath(pos(nodes.b), pos(nodes.live));
const endA = toLiveA.match(/L ([\d.]+) ([\d.]+)$/);
const endB = toLiveB.match(/L ([\d.]+) ([\d.]+)$/);
console.assert(
    endA[1] === endB[1] && endA[2] === endB[2],
    "both edges land on the same merge node",
);

console.log("metro geometry OK");
