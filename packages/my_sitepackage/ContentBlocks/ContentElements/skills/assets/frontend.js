/**
 * Simple script to convert comma-separated string into pill-shaped span elements.
 * Following Bootstrap 5 Badge/Pill best practices.
 */
const initSkills = () => {
    const containers = document.querySelectorAll('.skill-pills-container');

    containers.forEach(container => {
        const skillsString = container.dataset.skills;
        if (!skillsString) return;

        // Clear container (removes fallback innerHTML)
        container.innerHTML = '';

        // Split by comma, trim whitespace, and filter empty strings
        const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean);

        skills.forEach(skill => {
            const pill = document.createElement('span');
            // Bootstrap: badge (base), rounded-pill (pill shape), text-bg-light (theme)
            pill.className = 'glass-badge-pill px-3 py-1 font-monospace fw-normal';
            pill.textContent = skill;
            container.appendChild(pill);
        });
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkills);
} else {
    initSkills();
}
