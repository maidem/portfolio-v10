/**
 * Simple script to convert comma-separated string into pill-shaped span elements.
 * Follows best practices and is mobile-friendly.
 */
document.addEventListener('DOMContentLoaded', () => {
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
            pill.className = 'skill-pill';
            pill.textContent = skill;
            container.appendChild(pill);
        });
    });
});
