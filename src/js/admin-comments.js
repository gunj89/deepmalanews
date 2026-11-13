import { Query } from "appwrite";
import { tablesDB } from "./appwrite.js";
import { DATABASE_ID, ARTICLES_TABLE_ID } from "./config.js";
import { listRecentComments, deleteComment } from "./engagement.js";
import { formatDate } from "./articles-api.js";
import { escapeHtml } from "./common.js";

const listEl = document.getElementById("commentRows");
const msg = document.getElementById("commentsMsg");

async function titles(ids) {
    const map = {};
    if (!ids.length) return map;
    try {
        const res = await tablesDB.listRows({
            databaseId: DATABASE_ID, tableId: ARTICLES_TABLE_ID,
            queries: [Query.equal("$id", ids), Query.limit(100)]
        });
        res.rows.forEach((r) => { map[r.$id] = r.title; });
    } catch { /* titles are a nicety */ }
    return map;
}

export async function load() {
    msg.textContent = "Loading…";
    try {
        const res = await listRecentComments(50);
        const map = await titles([...new Set(res.rows.map((c) => c.articleId))]);
        listEl.innerHTML = res.rows.map((c) => `
            <li class="a-row" data-id="${escapeHtml(c.$id)}">
                <div class="a-main">
                    <strong>${escapeHtml(c.authorName)}</strong>
                    <span>${escapeHtml(formatDate(c.$createdAt, true))} ·
                        <a href="/a/${escapeHtml(c.articleId)}" target="_blank" rel="noopener">${escapeHtml(map[c.articleId] || "article")}</a></span>
                    <p class="c-text">${escapeHtml(c.text)}</p>
                </div>
                <div class="a-btns"><button type="button" class="mini danger" data-del="${escapeHtml(c.$id)}">Delete</button></div>
            </li>`).join("");
        msg.textContent = res.rows.length ? `Showing latest ${res.rows.length} of ${res.total} comments.` : "No comments yet.";
    } catch (err) {
        console.error(err);
        msg.textContent = "Could not load comments: " + err.message;
    }
}

listEl.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-del]");
    if (!b || !confirm("Delete this comment?")) return;
    b.disabled = true;
    try { await deleteComment(b.dataset.del); b.closest(".a-row").remove(); }
    catch (err) { msg.textContent = "Failed: " + err.message; b.disabled = false; }
});

document.getElementById("commentsRefresh").addEventListener("click", load);
