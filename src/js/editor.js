// Small rich-text editor (contenteditable) for articles.
// Output is always passed through sanitizeHtml(), so only allow-listed tags are stored.
import { sanitizeHtml } from "./sanitize.js";
import { parseVideoUrl } from "./embed.js";
import { uploadMedia } from "./media.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const BUTTONS = [
    ["bold", "B", "Bold"], ["italic", "I", "Italic"], ["underline", "U", "Underline"],
    ["|"],
    ["h2", "H2", "Heading"], ["h3", "H3", "Sub-heading"], ["p", "¶", "Normal paragraph"], ["quote", "❝", "Quote"],
    ["|"],
    ["ul", "• List", "Bulleted list"], ["ol", "1. List", "Numbered list"],
    ["|"],
    ["link", "🔗 Link", "Add link"], ["unlink", "Unlink", "Remove link"],
    ["|"],
    ["image", "🖼 Image", "Insert image"], ["video", "▶ Video", "Insert YouTube / Vimeo link or upload video"],
    ["hr", "―", "Divider line"],
    ["|"],
    ["removeBlock", "🗑 Remove media", "Remove selected image/video (click it first)"],
    ["clear", "Clear format", "Clear formatting"],
    ["undo", "↶", "Undo"], ["redo", "↷", "Redo"]
];

export function createEditor(host) {
    host.classList.add("rte");
    host.innerHTML = `
        <div class="rte-bar" role="toolbar" aria-label="Formatting">
            ${BUTTONS.map(([id, label, title]) => id === "|"
                ? `<span class="rte-sep"></span>`
                : `<button type="button" data-cmd="${id}" title="${esc(title)}">${esc(label)}</button>`).join("")}
        </div>
        <div class="rte-area prose" contenteditable="true" spellcheck="false" role="textbox" aria-multiline="true" aria-label="Article content"></div>
        <p class="rte-status" role="status"></p>`;

    const area = host.querySelector(".rte-area");
    // Lives on <body>: the editor sits inside the article <form>, and a <form> can't be nested in another.
    const dialog = document.createElement("dialog");
    dialog.className = "rte-dialog";
    document.body.appendChild(dialog);
    const status = host.querySelector(".rte-status");
    let saved = null;      // selection saved while a dialog is open
    let selected = null;   // currently selected media block

    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* ignore */ }

    const lock = (root) => root.querySelectorAll("figure.media, .embed").forEach((n) => n.setAttribute("contenteditable", "false"));
    const say = (t, bad = false) => { status.textContent = t; status.classList.toggle("bad", bad); };

    const saveSel = () => {
        const sel = getSelection();
        if (sel.rangeCount && area.contains(sel.anchorNode)) saved = sel.getRangeAt(0).cloneRange();
    };
    const restoreSel = () => {
        area.focus();
        if (!saved) {  // no caret yet → go to the end
            const r = document.createRange(); r.selectNodeContents(area); r.collapse(false); saved = r;
        }
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(saved);
    };
    const insert = (html) => { restoreSel(); document.execCommand("insertHTML", false, html + "<p><br></p>"); lock(area); };

    /* ---- dialogs ---- */
    function ask(title, bodyHtml, onSubmit) {
        saveSel();
        dialog.innerHTML = `
            <form method="dialog" class="rte-form" novalidate>
                <h3>${esc(title)}</h3>
                ${bodyHtml}
                <p class="rte-dmsg" role="status"></p>
                <div class="rte-dbtns">
                    <button type="button" value="cancel" class="rte-cancel">Cancel</button>
                    <button type="submit" class="rte-ok">Insert</button>
                </div>
            </form>`;
        const form = dialog.querySelector("form");
        const msg = dialog.querySelector(".rte-dmsg");
        const ok = dialog.querySelector(".rte-ok");
        dialog.querySelector(".rte-cancel").onclick = () => dialog.close();
        form.onsubmit = async (e) => {
            e.preventDefault();
            ok.disabled = true; msg.textContent = "Please wait…";
            try { const after = await onSubmit(form); dialog.close(); after?.(); }   // insert AFTER closing: a modal makes the editor inert
            catch (err) { msg.textContent = err.message || "Something went wrong."; }
            finally { ok.disabled = false; }
        };
        dialog.showModal();
        form.querySelector("input")?.focus();
    }

    const actions = {
        bold: () => document.execCommand("bold"),
        italic: () => document.execCommand("italic"),
        underline: () => document.execCommand("underline"),
        h2: () => document.execCommand("formatBlock", false, "h2"),
        h3: () => document.execCommand("formatBlock", false, "h3"),
        p: () => document.execCommand("formatBlock", false, "p"),
        quote: () => document.execCommand("formatBlock", false, "blockquote"),
        ul: () => document.execCommand("insertUnorderedList"),
        ol: () => document.execCommand("insertOrderedList"),
        hr: () => document.execCommand("insertHorizontalRule"),
        unlink: () => document.execCommand("unlink"),
        clear: () => { document.execCommand("removeFormat"); document.execCommand("formatBlock", false, "p"); },
        undo: () => document.execCommand("undo"),
        redo: () => document.execCommand("redo"),

        removeBlock() {
            if (selected) { selected.remove(); selected = null; }
            else say("Click an image or video first, then press this button.", true);
        },

        link() {
            const txt = String(getSelection()).trim();
            ask("Add link", `
                <label>Link (https://…)<input type="url" name="url" placeholder="https://" required></label>
                ${txt ? "" : `<label>Link text<input type="text" name="text" placeholder="Text to show"></label>`}`,
                (f) => {
                    let url = f.url.value.trim();
                    if (!url) throw new Error("Paste a link first.");
                    if (!/^(https?:|mailto:|tel:)/i.test(url)) url = "https://" + url;
                    const label = f.text?.value.trim() || url;
                    return () => {
                        restoreSel();
                        if (txt) document.execCommand("createLink", false, url);
                        else document.execCommand("insertHTML", false, `<a href="${esc(url)}">${esc(label)}</a>`);
                    };
                });
        },

        image() {
            ask("Insert image", `
                <label>Choose image<input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" required></label>
                <label>Caption (optional)<input type="text" name="cap" maxlength="200"></label>`,
                async (f) => {
                    const file = f.file.files[0];
                    if (!file) throw new Error("Choose an image.");
                    const { url } = await uploadMedia(file);
                    const cap = f.cap.value.trim();
                    return () => insert(`<figure class="media" contenteditable="false"><img src="${esc(url)}" alt="${esc(cap)}">${cap ? `<figcaption>${esc(cap)}</figcaption>` : ""}</figure>`);
                });
        },

        video() {
            ask("Insert video", `
                <label>YouTube or Vimeo link<input type="url" name="url" placeholder="https://www.youtube.com/watch?v=…"></label>
                <p class="rte-or">— or upload a video file (MP4 / WebM, max 50 MB) —</p>
                <label>Video file<input type="file" name="file" accept="video/mp4,video/webm"></label>`,
                async (f) => {
                    const file = f.file.files[0];
                    const link = f.url.value.trim();
                    if (link) {
                        const v = parseVideoUrl(link);
                        if (!v) throw new Error("Only YouTube and Vimeo links can be embedded. Use the 🔗 Link button for other sites.");
                        return () => insert(`<div class="embed" contenteditable="false"><iframe src="${esc(v.src)}" title="Video" allowfullscreen></iframe></div>`);
                    } else if (file) {
                        const { url } = await uploadMedia(file);
                        return () => insert(`<div class="embed" contenteditable="false"><video src="${esc(url)}" controls preload="metadata"></video></div>`);
                    } else throw new Error("Paste a YouTube/Vimeo link or choose a video file.");
                });
        }
    };

    host.querySelector(".rte-bar").addEventListener("mousedown", (e) => e.preventDefault()); // keep selection
    host.querySelector(".rte-bar").addEventListener("click", (e) => {
        const b = e.target.closest("[data-cmd]");
        if (!b) return;
        say("");
        if (!["link", "image", "video", "removeBlock"].includes(b.dataset.cmd)) area.focus();
        actions[b.dataset.cmd]?.();
    });

    /* ---- media block selection (click → Delete/Backspace or 🗑 button) ---- */
    area.addEventListener("click", (e) => {
        selected?.classList.remove("is-selected");
        selected = e.target.closest("figure.media, .embed");
        selected?.classList.add("is-selected");
    });
    area.addEventListener("keydown", (e) => {
        if (selected && (e.key === "Delete" || e.key === "Backspace")) {
            e.preventDefault(); selected.remove(); selected = null;
        }
    });

    /* ---- paste: keep structure, drop styles/junk ---- */
    area.addEventListener("paste", (e) => {
        e.preventDefault();
        const html = e.clipboardData.getData("text/html");
        const text = e.clipboardData.getData("text/plain");
        const out = html
            ? sanitizeHtml(html)
            : text.split(/\n{2,}/).map((t) => `<p>${esc(t).replace(/\n/g, "<br>")}</p>`).join("");
        document.execCommand("insertHTML", false, out);
        lock(area);
    });

    return {
        setHtml(html) {
            area.innerHTML = sanitizeHtml(html) || "<p><br></p>";
            lock(area); selected = null; saved = null;
        },
        getHtml() {
            const html = sanitizeHtml(area.innerHTML);
            return html.replace(/<p>(<br>|\s)*<\/p>/g, "").trim();   // drop empty paragraphs
        },
        focus: () => area.focus()
    };
}
