// TYPO3 Form Framework per fetch statt normalem Submit — kein Seiten-Reload
// beim Seitenwechsel/Fehler, und beim finalen Erfolg (Redirect zu ?contact=sent)
// nur die URL wechseln statt neu zu laden.
(function () {
    if (!document.querySelector(".cb-form-wrap")) return;

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
            "Danke für deine Nachricht!";
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add("cb-toast--hide");
            setTimeout(() => toast.remove(), 400);
        }, 5000);
    }

    // Mosparo ruft nach seiner unsichtbaren Verifizierung form.submit() nativ
    // auf — das feuert KEIN submit-Event und umgeht die Delegation unten
    // (Folge: Full-Page-Reload + Sprung nach oben). Die Methode wird deshalb
    // pro Formular auf den fetch-Weg umgebogen.
    function hijackNativeSubmit(root) {
        root.querySelectorAll("form").forEach((form) => {
            form.submit = () =>
                submitForm(form, form.querySelector('button[type="submit"], input[type="submit"]'));
        });
    }

    // Ersetzt den aktuellen Formular-Wrap durch den aus der Server-Antwort und
    // verdrahtet alles neu (Submit-Hijack, Mosparo, Maßlinien). Wird für BEIDE
    // Fälle genutzt: Fehler-Fragment (mit Meldungen) und Erfolgs-Seite (frisches
    // leeres Formular) — form.reset() reicht dort nicht, weil das Fehler-Fragment
    // die alten Eingaben als value-Attribute trägt und die Fehlermeldungs-Knoten
    // im DOM stehen bleiben würden.
    function swapWrap(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newWrap = doc.querySelector(".cb-form-wrap");
        const wrap = document.querySelector(".cb-form-wrap");
        if (!newWrap || !wrap) return false;
        // Scroll-Position merken und nach dem Austausch wiederherstellen:
        // replaceWith kann die Dokumenthöhe kurz ändern und den Viewport
        // springen lassen — der Nutzer soll an Ort und Stelle bleiben.
        const scrollY = window.scrollY;
        wrap.replaceWith(newWrap);
        window.scrollTo({ top: scrollY, behavior: "instant" });
        hijackNativeSubmit(newWrap);
        initMosparo(newWrap);
        // measure-block.js's own observers re-measure on the next layout
        // change, which can race with this swap and leave a stale dimension
        // line on screen — force one explicit pass two frames out, once the
        // browser has fully reflowed the new content.
        requestAnimationFrame(() => requestAnimationFrame(() => window.dimensionAllMeasureBlocks?.()));
        return true;
    }

    async function submitForm(form, submitter) {
        const response = await fetch(form.action, {
            method: form.method || "POST",
            body: new FormData(form, submitter),
        });
        const html = await response.text();

        const sent = new URL(response.url).searchParams.get("contact") === "sent";
        if (sent) {
            history.pushState(null, "", location.pathname + "#" + form.id);
            // Die Redirect-Zielseite enthält das frisch gerenderte, leere
            // Formular — übernehmen statt form.reset(), damit auch vorherige
            // Fehlermeldungen und eingebackene value-Attribute verschwinden.
            if (!swapWrap(html)) form.reset();
            showSuccessToast();
            return;
        }

        swapWrap(html);
    }

    // Delegation auf document statt auf .cb-form-wrap: der Wrap wird nach
    // jedem Fehler-Submit per replaceWith ausgetauscht, ein direkt gebundener
    // Listener wäre danach weg — der zweite Klick würde dann als nativer
    // Full-Page-Submit durchgehen (Reload + Sprung nach oben).
    document.addEventListener("submit", (e) => {
        if (!e.target.closest(".cb-form-wrap")) return;
        // Mosparo fängt unverifizierte Submits selbst ab (preventDefault am
        // Formular) und ruft nach der Verifizierung form.submit() auf — das
        // ist oben auf den fetch-Weg umgebogen. Hier nicht doppelt senden,
        // sonst geht ein Submit ohne mosparo-Token raus.
        if (e.defaultPrevented) return;
        e.preventDefault();
        submitForm(e.target, e.submitter);
    });

    hijackNativeSubmit(document.querySelector(".cb-form-wrap"));
})();
