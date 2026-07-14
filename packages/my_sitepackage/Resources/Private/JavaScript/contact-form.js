// TYPO3 Form Framework per fetch statt normalem Submit — kein Seiten-Reload
// beim Seitenwechsel/Fehler, und beim finalen Erfolg (Redirect zu ?contact=sent)
// nur die URL wechseln statt neu zu laden.
(function () {
    const wrap = document.querySelector(".cb-form-wrap");
    if (!wrap) return;

    // Mosparo initialisiert Captcha-Divs nur einmal bei DOMContentLoaded (siehe
    // mosparo-form.js). Nach dem Ajax-Austausch der Formularseite muss das für
    // neu eingefügte .mosparo-captcha-Divs hier manuell nachgeholt werden.
    function initMosparo(root) {
        root.querySelectorAll("div.mosparo-captcha").forEach((div) => {
            if (div.dataset.initialized === "true" || typeof mosparo === "undefined") return;
            div.dataset.initialized = "true";
            const formEl = document.getElementById(div.dataset.formId);
            const submitBtn = formEl?.querySelector('button[type="submit"], input[type="submit"]');
            const toggle = (enable) => submitBtn?.toggleAttribute("disabled", !enable);
            toggle(false);
            new mosparo(
                div.id,
                div.dataset.captchaServer,
                div.dataset.captchaUuid,
                div.dataset.captchaPublickey,
                {
                    loadCssResource: true,
                    onCheckForm: toggle,
                    onResetState: () => toggle(false),
                    onSwitchToInvisible: () => toggle(true),
                },
            );
        });
    }

    function showSuccessToast() {
        const toast = document.createElement("div");
        toast.className = "cb-toast";
        toast.setAttribute("role", "status");
        toast.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
            "Danke für deine Nachricht! Ich melde mich so schnell wie möglich bei dir.";
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add("cb-toast--hide");
            setTimeout(() => toast.remove(), 400);
        }, 5000);
    }

    async function submitForm(form, submitter) {
        const response = await fetch(form.action, {
            method: form.method || "POST",
            body: new FormData(form, submitter),
        });

        const sent = new URL(response.url).searchParams.get("contact") === "sent";
        if (sent) {
            history.pushState(null, "", location.pathname + "#" + form.id);
            form.reset();
            showSuccessToast();
            return;
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newWrap = doc.querySelector(".cb-form-wrap");
        if (newWrap) {
            wrap.replaceWith(newWrap);
            newWrap.scrollIntoView({ behavior: "instant", block: "start" });
            initMosparo(newWrap);
        }
    }

    wrap.addEventListener("submit", (e) => {
        e.preventDefault();
        submitForm(e.target, e.submitter);
    });
})();
