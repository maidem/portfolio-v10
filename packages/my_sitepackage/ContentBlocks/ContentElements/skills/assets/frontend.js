document.addEventListener("DOMContentLoaded", () => {
    // ── Skill category filter ─────────────────────────────────────────────────
    document.querySelectorAll(".cb-skills-wrapper").forEach((wrapper) => {
        const filterBar = wrapper.querySelector(".cb-skills-filter-bar");
        const tiles = wrapper.querySelectorAll(".cb-skill-tile[data-category]");

        if (!filterBar || tiles.length === 0) return;

        // Set tile index for staggered entrance animation
        tiles.forEach((tile, i) => tile.style.setProperty("--tile-i", i));

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

            let showIndex = 0;
            tiles.forEach((tile, originalIndex) => {
                const cats = (tile.dataset.category || "")
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean);
                const shouldHide = active !== "*" && !cats.includes(active);
                const isHidden = tile.classList.contains("cb-skill-tile--hidden");

                if (shouldHide && !isHidden) {
                    // Animate out, then hide
                    tile.classList.add("cb-skill-tile--exiting");
                    setTimeout(() => {
                        tile.classList.add("cb-skill-tile--hidden");
                        tile.classList.remove("cb-skill-tile--exiting");
                    }, 165);
                } else if (!shouldHide && isHidden) {
                    // Show with staggered entrance animation
                    const idx = active === "*" ? originalIndex : showIndex;
                    tile.style.setProperty("--tile-i", idx);
                    tile.classList.remove(
                        "cb-skill-tile--hidden",
                        "cb-skill-tile--entering",
                    );
                    void tile.offsetWidth; // force reflow to restart animation
                    tile.classList.add("cb-skill-tile--entering");
                    setTimeout(
                        () => tile.classList.remove("cb-skill-tile--entering"),
                        460,
                    );
                    showIndex++;
                } else if (!shouldHide) {
                    showIndex++;
                }
            });
        };

        filterBar.addEventListener("click", (e) => {
            const btn = e.target.closest(".cb-skills-filter-btn");
            if (btn) applyFilter(btn.dataset.filter);
        });
    });
});
