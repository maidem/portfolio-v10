// Wrap & characters in hero text with technical-drawing dimension annotation
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".cb-hero__text").forEach((container) => {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
        );
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) textNodes.push(node);

        textNodes.forEach((textNode) => {
            if (!textNode.textContent.includes("&")) return;
            const parts = textNode.textContent.split("&");
            if (parts.length < 2) return;

            const frag = document.createDocumentFragment();
            parts.forEach((part, i) => {
                if (part) frag.appendChild(document.createTextNode(part));
                if (i < parts.length - 1) {
                    const span = document.createElement("span");
                    span.className = "cb-dim-amp";
                    span.setAttribute("aria-label", "und");
                    span.textContent = "&";
                    frag.appendChild(span);
                }
            });
            textNode.parentNode.replaceChild(frag, textNode);
        });
    });
});
