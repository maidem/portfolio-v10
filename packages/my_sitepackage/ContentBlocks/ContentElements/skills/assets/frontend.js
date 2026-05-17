document.addEventListener("DOMContentLoaded", () => {
    // ── Skill category filter ─────────────────────────────────────────────────
    document.querySelectorAll(".cb-skills-wrapper").forEach((wrapper) => {
        const filterBar = wrapper.querySelector(".cb-skills-filter-bar");
        const tiles = wrapper.querySelectorAll(".cb-skill-tile[data-category]");

        if (!filterBar || tiles.length === 0) return;

        // Collect unique, non-empty categories (preserving first-seen order)
        const seen = new Set();
        const categories = [];
        tiles.forEach((tile) => {
            const cat = (tile.dataset.category || "").trim();
            if (cat && !seen.has(cat)) {
                seen.add(cat);
                categories.push(cat);
            }
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
                const cat = (tile.dataset.category || "").trim();
                tile.classList.toggle(
                    "cb-skill-tile--hidden",
                    active !== "*" && cat !== active,
                );
            });
        };

        filterBar.addEventListener("click", (e) => {
            const btn = e.target.closest(".cb-skills-filter-btn");
            if (btn) applyFilter(btn.dataset.filter);
        });
    });

    // ── Workflow chain filter ─────────────────────────────────────────────────
    document.querySelectorAll(".cb-workflows-card").forEach((card) => {
        const filterBar = card.querySelector(".cb-workflow-filter-bar");
        const chains = card.querySelectorAll(
            ".cb-workflow-chain[data-workflow-id]",
        );

        if (!filterBar || chains.length === 0) return;

        // Build one button per workflow
        const makeBtn = (label, id) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cb-skills-filter-btn cb-workflow-filter-btn";
            btn.textContent = label;
            btn.dataset.workflowId = id;
            return btn;
        };

        chains.forEach((chain) => {
            filterBar.appendChild(
                makeBtn(chain.dataset.workflowName, chain.dataset.workflowId),
            );
        });

        // Show first workflow by default
        const showChain = (activeId) => {
            filterBar
                .querySelectorAll(".cb-workflow-filter-btn")
                .forEach((b) => {
                    b.classList.toggle(
                        "active",
                        b.dataset.workflowId === activeId,
                    );
                });
            chains.forEach((chain) => {
                const isActive = chain.dataset.workflowId === activeId;
                chain.classList.toggle("cb-workflow-chain--hidden", !isActive);
                chain.setAttribute("aria-hidden", String(!isActive));
            });
        };

        const firstId = chains[0].dataset.workflowId;
        showChain(firstId);

        filterBar.addEventListener("click", (e) => {
            const btn = e.target.closest(".cb-workflow-filter-btn");
            if (btn) showChain(btn.dataset.workflowId);
        });
    });
});
