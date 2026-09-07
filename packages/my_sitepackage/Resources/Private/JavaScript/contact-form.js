// TYPO3 Form Framework via fetch instead of a normal submit — no page reload
// on step change/error, and on the final success (redirect to ?contact=sent)
// only swap the URL instead of reloading.
(function () {
    if (!document.querySelector(".cb-form-wrap")) return;

    // Mosparo initializes captcha divs only once on DOMContentLoaded (see
    // mosparo-form.js). After the Ajax swap of the form page this has to be
    // redone manually here for newly inserted .mosparo-captcha divs.
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

    // After its invisible verification, Mosparo calls form.submit() natively —
    // that fires NO submit event and bypasses the delegation below
    // (result: full-page reload + jump to top). The method is therefore
    // rerouted to the fetch path per form.
    function hijackNativeSubmit(root) {
        root.querySelectorAll("form").forEach((form) => {
            form.submit = () =>
                submitForm(form, form.querySelector('button[type="submit"], input[type="submit"]'));
        });
    }

    // Replaces the current form wrap with the one from the server response and
    // rewires everything (submit hijack, Mosparo, dimension lines). Used for BOTH
    // cases: error fragment (with messages) and success page (fresh empty form) —
    // form.reset() is not enough there, because the error fragment carries the
    // old inputs as value attributes and the error-message nodes would stay in
    // the DOM.
    function swapWrap(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newWrap = doc.querySelector(".cb-form-wrap");
        const wrap = document.querySelector(".cb-form-wrap");
        if (!newWrap || !wrap) return false;
        // Remember the scroll position and restore it after the swap:
        // replaceWith can briefly change the document height and make the
        // viewport jump — the user should stay in place.
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
            // The redirect target page contains the freshly rendered, empty
            // form — take that instead of form.reset(), so previous error
            // messages and baked-in value attributes disappear too.
            if (!swapWrap(html)) form.reset();
            showSuccessToast();
            return;
        }

        swapWrap(html);
    }

    // Delegation on document instead of .cb-form-wrap: the wrap is swapped via
    // replaceWith after every error submit, a directly bound listener would be
    // gone afterwards — the second click would then go through as a native
    // full-page submit (reload + jump to top).
    document.addEventListener("submit", (e) => {
        if (!e.target.closest(".cb-form-wrap")) return;
        // Mosparo intercepts unverified submits itself (preventDefault on the
        // form) and calls form.submit() after verification — which is rerouted
        // to the fetch path above. Don't send twice here, otherwise a submit
        // without a mosparo token goes out.
        if (e.defaultPrevented) return;
        e.preventDefault();
        submitForm(e.target, e.submitter);
    });

    hijackNativeSubmit(document.querySelector(".cb-form-wrap"));
})();
