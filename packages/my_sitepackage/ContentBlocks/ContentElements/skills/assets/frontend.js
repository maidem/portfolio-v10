document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".cb-skills-wrapper").forEach((wrapper) => {
        const filterBar = wrapper.querySelector(".cb-skills-filter-bar");
        const tiles = wrapper.querySelectorAll(".cb-skill-tile[data-category]");

        if (!filterBar || tiles.length === 0) return;

        // ── Collect unique, non-empty categories (preserving first-seen order) ──
        const seen = new Set();
        const categories = [];
        tiles.forEach((tile) => {
            const cat = (tile.dataset.category || "").trim();
            if (cat && !seen.has(cat)) {
                seen.add(cat);
                categories.push(cat);
            }
        });

        // Only show filter bar when there's at least one category assigned
        if (categories.length === 0) return;

        // ── Build buttons ────────────────────────────────────────────────────
        const makeBtn = (label, value) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cb-skills-filter-btn";
            btn.textContent = label;
            btn.dataset.filter = value;
            if (value === "*") btn.classList.add("active");
            return btn;
        };

        filterBar.appendChild(makeBtn("Alle", "*"));
        categories.forEach((cat) => filterBar.appendChild(makeBtn(cat, cat)));

        // ── Filter logic ─────────────────────────────────────────────────────
        const applyFilter = (active) => {
            filterBar.querySelectorAll(".cb-skills-filter-btn").forEach((b) => {
                b.classList.toggle("active", b.dataset.filter === active);
            });

            tiles.forEach((tile) => {
                const cat = (tile.dataset.category || "").trim();
                const visible = active === "*" || cat === active;
                tile.classList.toggle("cb-skill-tile--hidden", !visible);
            });
        };

        filterBar.addEventListener("click", (e) => {
            const btn = e.target.closest(".cb-skills-filter-btn");
            if (btn) applyFilter(btn.dataset.filter);
        });
    });
});
