// Page "reveal": the real content is already in the HTML (good for Google and
// WhatsApp previews), but it stays hidden behind a skeleton until the page is
// ready: fonts + images loaded, sign-in state checked, and the page's own data
// (editions / articles / videos) fetched. Then everything appears together.
//
// Page scripts call holdReveal(promise) for their first data load.

const held = [];
export function holdReveal(p) {
    held.push(Promise.resolve(p).catch(() => { /* a failed load must never block the page */ }));
    return p;
}

const MIN_SKELETON_MS = 250;     // avoids a 50ms flash of skeleton on fast connections
const MAX_WAIT_MS = 4000;        // never keep visitors waiting longer than this

function reveal() {
    const root = document.documentElement;
    root.classList.remove("is-loading");
    root.classList.add("is-ready");
}

export function revealWhenReady(extra = []) {
    const root = document.documentElement;
    if (!root.classList.contains("is-loading")) return;      // no skeleton on this page

    const fonts = document.fonts?.ready ?? Promise.resolve();
    const loaded = document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((r) => addEventListener("load", r, { once: true }));

    const ready = (async () => {
        await new Promise((r) => setTimeout(r, 0));          // let page scripts register their holds
        await Promise.all([fonts, loaded, ...extra, ...held]);
    })();
    const minShow = new Promise((r) => setTimeout(r, MIN_SKELETON_MS));
    const cap = new Promise((r) => setTimeout(r, MAX_WAIT_MS));

    Promise.race([Promise.all([ready, minShow]), cap]).then(reveal);

    // back/forward cache: page restored already built, never show the skeleton again
    addEventListener("pageshow", (e) => { if (e.persisted) reveal(); });
}
