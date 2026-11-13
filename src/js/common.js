// Shared helpers + nav highlight. Imported by every page.
import { initI18n } from "./i18n.js";
import { initAuthUi } from "./auth-ui.js";
import { revealWhenReady } from "./reveal.js";

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function escapeHtml(str = "") {
    return String(str ?? "").replace(/[&<>"']/g, (c) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
}

// Highlight the current page in the tab bar, top nav and footer links.
function markActiveNav() {
    const clean = (p) => (p.replace(/index\.html$/, "").replace(/\.html$/, "").replace(/\/$/, "") || "/");
    let here = clean(location.pathname);
    // single article pages (/a/<id> or /article) belong to the Articles tab
    if (here.startsWith("/a/") || here === "/article") here = "/articles";
    $$(".tabbar a, .top-nav a").forEach((a) => {
        const target = clean(new URL(a.getAttribute("href"), location.origin).pathname);
        a.setAttribute("aria-current", target === here ? "page" : "false");
    });
}

markActiveNav();

initI18n();
revealWhenReady([initAuthUi()]);
