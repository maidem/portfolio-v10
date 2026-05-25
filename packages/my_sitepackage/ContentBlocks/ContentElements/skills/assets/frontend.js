document.addEventListener("DOMContentLoaded", () => {
    // ── Skill category filter ─────────────────────────────────────────────────
    document.querySelectorAll(".cb-skills-wrapper").forEach((wrapper) => {
        const filterBar = wrapper.querySelector(".cb-skills-filter-bar");
        const tiles = wrapper.querySelectorAll(".cb-skill-tile[data-category]");

        if (!filterBar || tiles.length === 0) return;

        // Collect unique, non-empty categories (preserving first-seen order)
        // data-category may contain comma-separated values, e.g. "Frontend, Design"
        const seen = new Set();
        const categories = [];
        tiles.forEach((tile) => {
            (tile.dataset.category || "")
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
                .forEach((cat) => {
                    if (!seen.has(cat)) {
                        seen.add(cat);
                        categories.push(cat);
                    }
                });
        });

        if (categories.length === 0) return;

        const makeFilterBtn = (label, value) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cb-skills-filter-btn";
            btn.textContent = label;
            btn.dataset.filter = value;
            if (value === "*") btn.classList.add("active");
            return btn;
        };

        filterBar.appendChild(makeFilterBtn("Alle", "*"));
        categories.forEach((cat) =>
            filterBar.appendChild(makeFilterBtn(cat, cat)),
        );

        const applyFilter = (active) => {
            filterBar.querySelectorAll(".cb-skills-filter-btn").forEach((b) => {
                b.classList.toggle("active", b.dataset.filter === active);
            });
            tiles.forEach((tile) => {
                const cats = (tile.dataset.category || "")
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean);
                tile.classList.toggle(
                    "cb-skill-tile--hidden",
                    active !== "*" && !cats.includes(active),
                );
            });
        };

        filterBar.addEventListener("click", (e) => {
            const btn = e.target.closest(".cb-skills-filter-btn");
            if (btn) applyFilter(btn.dataset.filter);
        });
    });
});
