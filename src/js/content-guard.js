/*
 * Article content guard — stops visitors selecting / copying the ARTICLE only
 * (title, byline, cover, body). The rest of the page (header, comments, buttons,
 * forms) stays fully selectable. Admins are exempt so they can still preview/copy.
 *
 * Honest limit: this deters casual copying (select, long-press, right-click,
 * Ctrl+C, drag, print). Anyone determined can still screenshot or use dev tools.
 */
const SELECTOR = "[data-guard]";
let enabled = true;
let wired = false;

const guarded = () => document.querySelectorAll(SELECTOR);
const inGuard = (node) => !!(node && (node.nodeType === 1 ? node : node.parentElement)?.closest(SELECTOR));

function selectionTouchesGuard() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (inGuard(range.commonAncestorContainer)) return true;
    return [...guarded()].some((el) => sel.containsNode(el, true));
}

function block(e) { if (enabled && inGuard(e.target)) e.preventDefault(); }

function onCopy(e) {
    if (!enabled || !selectionTouchesGuard()) return;
    e.preventDefault();
    e.clipboardData?.setData("text/plain", "");
}

function onKey(e) {
    if (!enabled || !(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    // Ctrl/Cmd + A (select all), X, C — only while focus is outside a text field
    if (!["a", "c", "x"].includes(k)) return;
    const tag = document.activeElement?.tagName;
    if (tag === "TEXTAREA" || tag === "INPUT") return;
    if (k === "a") { e.preventDefault(); return; }
    if (selectionTouchesGuard()) e.preventDefault();
}

export function setContentGuard(on) {
    enabled = !!on;
    document.documentElement.classList.toggle("guard-off", !enabled);
    if (enabled) window.getSelection()?.removeAllRanges();
}

export function initContentGuard() {
    if (wired) return;
    wired = true;
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("keydown", onKey);
    document.addEventListener("contextmenu", block);   // right-click / long-press menu
    document.addEventListener("selectstart", block);
    document.addEventListener("dragstart", block);     // dragging text / images out
}
