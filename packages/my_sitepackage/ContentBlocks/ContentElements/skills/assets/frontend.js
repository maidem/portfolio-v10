/**
 * Progressive enhancement for skills pills from comma-separated textarea values.
 */
const initSkills = () => {
    const containers = document.querySelectorAll(".skill-pills-container");

    containers.forEach((container) => {
        const skillsString = container.dataset.skills;
        if (!skillsString) return;

        // Remove fallback content before rendering enhanced pills.
        container.innerHTML = "";

        const skills = skillsString
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        skills.forEach((skill) => {
            const pill = document.createElement("span");
            pill.className =
                "glass-badge-pill px-3 py-1 me-2 mb-2 font-monospace fw-normal";
            pill.textContent = skill;
            container.appendChild(pill);
        });
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSkills);
} else {
    initSkills();
}
