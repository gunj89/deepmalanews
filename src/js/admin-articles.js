import { Query } from "appwrite";
import { tablesDB } from "./appwrite.js";
import { DATABASE_ID, ARTICLES_TABLE_ID, REACTIONS_TABLE_ID, COMMENTS_TABLE_ID } from "./config.js";
import { listAll, saveArticle, setStatus, mediaUrl, articleHref, formatDate, articleDate } from "./articles-api.js";
import { createEditor } from "./editor.js";
import { uploadMedia } from "./media.js";
import { htmlToText } from "./sanitize.js";
import { escapeHtml } from "./common.js";

const $ = (s) => document.querySelector(s);

const listView = $("#articlesListView");
const editView = $("#articleEditorView");
const rowsEl = $("#articleRows");
const moreBtn = $("#articlesMore");
const listMsg = $("#articlesMsg");
const form = $("#articleForm");
const formMsg = $("#articleFormMsg");
const editor = createEditor($("#editorHost"));

let rows = [];          // loaded rows
let cursor = null;
let editing = null;     // row being edited (null = new)
let coverId = "";
let started = false;

/* ---------- list ---------- */

const badge = (s) => `<span class="badge ${s === "published" ? "ok" : "draft"}">${s === "published" ? "Published" : "Draft"}</span>`;

function rowHtml(r) {
    const pub = r.status === "published";
    return `
    <li class="a-row" data-id="${escapeHtml(r.$id)}">
        <div class="a-main">
            <strong>${escapeHtml(r.title)}</strong>
            <span>${badge(r.status)} · ${escapeHtml(formatDate(pub ? articleDate(r) : r.$updatedAt))}</span>
        </div>
        <div class="a-btns">
            <a class="mini" href="${articleHref(r)}" target="_blank" rel="noopener">${pub ? "View" : "Preview"}</a>
            <button type="button" class="mini" data-act="edit">Edit</button>
            <button type="button" class="mini" data-act="toggle">${pub ? "Unpublish" : "Publish"}</button>
            <button type="button" class="mini danger" data-act="delete">Delete</button>
        </div>
    </li>`;
}

async function loadMore(reset = false) {
    if (reset) { rows = []; cursor = null; rowsEl.innerHTML = ""; }
    listMsg.textContent = "Loading…";
    try {
        const res = await listAll({ cursor, limit: 25 });
        rows.push(...res.rows);
        rowsEl.insertAdjacentHTML("beforeend", res.rows.map(rowHtml).join(""));
        cursor = res.rows.length ? res.rows[res.rows.length - 1].$id : cursor;
        moreBtn.hidden = res.rows.length < 25;
        listMsg.textContent = rows.length ? "" : "No news yet. Click “Add news” to write the first one.";
    } catch (err) {
        console.error(err);
        listMsg.textContent = "Could not load news: " + err.message;
    }
}

moreBtn.addEventListener("click", () => loadMore());

async function cascadeDelete(tableId, articleId) {
    for (let i = 0; i < 50; i++) {
        const res = await tablesDB.listRows({
            databaseId: DATABASE_ID, tableId,
            queries: [Query.equal("articleId", [articleId]), Query.limit(100)]
        });
        if (!res.rows.length) return;
        for (const r of res.rows) await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId, rowId: r.$id });
    }
}

rowsEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const li = btn.closest(".a-row");
    const row = rows.find((r) => r.$id === li.dataset.id);
    if (!row) return;

    if (btn.dataset.act === "edit") return openEditor(row);

    btn.disabled = true;
    try {
        if (btn.dataset.act === "toggle") {
            await setStatus(row, row.status === "published" ? "draft" : "published");
        } else if (confirm(`Delete “${row.title}” with all its likes and comments? This cannot be undone.`)) {
            listMsg.textContent = "Deleting…";
            await cascadeDelete(COMMENTS_TABLE_ID, row.$id);
            await cascadeDelete(REACTIONS_TABLE_ID, row.$id);
            await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: ARTICLES_TABLE_ID, rowId: row.$id });
        } else { btn.disabled = false; return; }
        await loadMore(true);
    } catch (err) {
        console.error(err);
        listMsg.textContent = "Failed: " + err.message;
        btn.disabled = false;
    }
});

/* ---------- editor ---------- */

function paintCover() {
    const img = $("#coverPreview");
    img.hidden = !coverId;
    if (coverId) img.src = mediaUrl(coverId);
    $("#coverRemove").hidden = !coverId;
}

function openEditor(row = null) {
    editing = row;
    coverId = row?.coverImageId || "";
    form.reset();
    form.elements.title.value = row?.title || "";
    form.elements.author.value = row?.author || localStorage.getItem("dm_author") || "Deepmala News";
    form.elements.excerpt.value = row?.excerpt || "";
    editor.setHtml(row?.content || "");
    paintCover();
    formMsg.textContent = "";
    const pub = row?.status === "published";
    $("#editorHeading").textContent = row ? "Edit news" : "Add news";
    $("#btnPublish").textContent = pub ? "Update news" : "Publish";
    $("#btnDraft").textContent = pub ? "Unpublish (save as draft)" : "Save as draft";
    listView.hidden = true;
    editView.hidden = false;
    window.scrollTo({ top: 0 });
    form.elements.title.focus();
}

function closeEditor() {
    editView.hidden = true;
    listView.hidden = false;
}

$("#newArticleBtn").addEventListener("click", () => openEditor(null));
$("#editorBack").addEventListener("click", () => {
    if (confirm("Leave without saving?")) closeEditor();
});

$("#coverFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    formMsg.textContent = "Uploading cover image…";
    try {
        coverId = (await uploadMedia(file)).fileId;
        paintCover();
        formMsg.textContent = "";
    } catch (err) {
        console.error(err);
        formMsg.textContent = "Cover upload failed: " + err.message;
    }
    e.target.value = "";
});
$("#coverRemove").addEventListener("click", () => { coverId = ""; paintCover(); });

async function save(status) {
    const title = form.elements.title.value.trim();
    const content = editor.getHtml();
    if (!title) { formMsg.textContent = "Please write a title."; form.elements.title.focus(); return; }
    if (!content) { formMsg.textContent = "The news is empty."; editor.focus(); return; }

    const author = form.elements.author.value.trim();
    const excerpt = form.elements.excerpt.value.trim() || htmlToText(content, 200);
    const data = { title, author, excerpt, content, coverImageId: coverId, status };

    $("#btnPublish").disabled = $("#btnDraft").disabled = true;
    formMsg.textContent = "Saving…";
    try {
        const saved = await saveArticle(editing, data);
        try { localStorage.setItem("dm_author", author); } catch { /* ignore */ }
        formMsg.textContent = "";
        closeEditor();
        await loadMore(true);
        listMsg.textContent = status === "published" ? `Saved & published: “${saved.title}”` : `Saved as draft: “${saved.title}”`;
    } catch (err) {
        console.error(err);
        formMsg.textContent = "Save failed: " + err.message;
    } finally {
        $("#btnPublish").disabled = $("#btnDraft").disabled = false;
    }
}

$("#btnPublish").addEventListener("click", () => save("published"));
$("#btnDraft").addEventListener("click", () => save("draft"));
form.addEventListener("submit", (e) => e.preventDefault());

export function init() {
    if (started) return;
    started = true;
    loadMore(true);
}
