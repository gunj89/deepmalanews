import "../css/prose.css";
import { $, escapeHtml } from "./common.js";
import { getArticle, mediaUrl, articleDate, formatDate } from "./articles-api.js";
import { sanitizeHtml, htmlToText } from "./sanitize.js";
import { getCounts, getMine, react, listComments, addComment, deleteComment } from "./engagement.js";
import { t } from "./i18n.js";
import { holdReveal } from "./reveal.js";
import { isAdmin, isSignedIn } from "./auth.js";
import { ensureSignedIn, openSignIn, onAuthChange, getUser } from "./auth-ui.js";

const stateEl = $("#articleState");
const bodyEl = $("#articleBody");

const articleId = (() => {
    const m = location.pathname.match(/^\/a\/([\w.-]+)/);
    return m ? m[1] : new URLSearchParams(location.search).get("id");
})();

let me = null;          // signed-in user (null when logged out)
let mine = null;        // my reaction row

/* ---------- article ---------- */

function setMeta(name, value, attr = "name") {
    let el = document.head.querySelector(`meta[${attr}="${name}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute("content", value);
}

function renderArticle(row) {
    document.title = `${row.title} | Deepmala News`;
    const desc = row.excerpt || htmlToText(row.content, 160);
    setMeta("description", desc);
    setMeta("og:title", row.title, "property");
    setMeta("og:description", desc, "property");

    $("#articleTitle").textContent = row.title;
    $("#articleMeta").textContent = [row.author, formatDate(articleDate(row))].filter(Boolean).join(" • ");
    if (row.coverImageId) {
        $("#articleCoverImg").src = mediaUrl(row.coverImageId);
        $("#articleCover").hidden = false;
        setMeta("og:image", mediaUrl(row.coverImageId), "property");
    }
    $("#articleContent").innerHTML = sanitizeHtml(row.content);
    $("#draftBanner").hidden = row.status === "published";
    stateEl.hidden = true;
    bodyEl.hidden = false;
}

/* ---------- reactions ---------- */

const likeBtn = $("#likeBtn"), dislikeBtn = $("#dislikeBtn"), reactMsg = $("#reactMsg");
const counts = { like: 0, dislike: 0 };

function paintReactions() {
    $("#likeCount").textContent = counts.like;
    $("#dislikeCount").textContent = counts.dislike;
    likeBtn.setAttribute("aria-pressed", String(mine?.type === "like"));
    dislikeBtn.setAttribute("aria-pressed", String(mine?.type === "dislike"));
}

async function onReact(type) {
    // visitors can read everything, but must sign in to like / dislike
    if (!isSignedIn(me)) {
        const u = await ensureSignedIn("ગમ્યું / ન ગમ્યું માટે સાઇન ઇન કરો.");
        if (!u) return;                      // closed the popup
        me = u;
        mine = await getMine(articleId).catch(() => null);
        paintReactions();
    }
    const prev = mine;
    // optimistic update
    if (prev) counts[prev.type]--;
    if (!prev || prev.type !== type) counts[type]++;
    mine = (prev && prev.type === type) ? null : { type };
    paintReactions();
    reactMsg.textContent = "";
    likeBtn.disabled = dislikeBtn.disabled = true;
    try {
        mine = await react(articleId, type, prev);
    } catch (err) {
        console.error(err);
        mine = prev;
        try { Object.assign(counts, await getCounts(articleId)); } catch { /* keep */ }
        reactMsg.textContent = err.message === "AUTH_REQUIRED"
            ? "સાઇન ઇન કરો."
            : "હમણાં પ્રતિભાવ સાચવી શકાયો નથી. ફરી પ્રયાસ કરો.";
    } finally {
        likeBtn.disabled = dislikeBtn.disabled = false;
        paintReactions();
    }
}
likeBtn.addEventListener("click", () => onReact("like"));
dislikeBtn.addEventListener("click", () => onReact("dislike"));

async function loadReactions() {
    try {
        Object.assign(counts, await getCounts(articleId));
        mine = await getMine(articleId);
    } catch (err) { console.error("reactions:", err); }
    paintReactions();
}

/* ---------- share ---------- */

const shareUrl = () => `${location.origin}/a/${articleId}`;
const panel = $("#sharePanel");

function wireShare(title) {
    const u = encodeURIComponent(shareUrl()), t = encodeURIComponent(title);
    $("#shareWa").href = `https://wa.me/?text=${t}%20${u}`;
    $("#shareFb").href = `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    $("#shareX").href = `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    $("#shareTg").href = `https://t.me/share/url?url=${u}&text=${t}`;

    $("#shareBtn").addEventListener("click", async () => {
        if (navigator.share) {
            try { await navigator.share({ title, url: shareUrl() }); return; }
            catch (e) { if (e.name === "AbortError") return; }
        }
        panel.hidden = !panel.hidden;
        $("#shareBtn").setAttribute("aria-expanded", String(!panel.hidden));
    });

    $("#shareCopy").addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        try { await navigator.clipboard.writeText(shareUrl()); }
        catch {
            const ta = document.createElement("textarea");
            ta.value = shareUrl(); document.body.appendChild(ta); ta.select();
            try { document.execCommand("copy"); } catch { /* ignore */ }
            ta.remove();
        }
        btn.textContent = "લિંક કૉપી થઈ ✓";
        setTimeout(() => { btn.textContent = "લિંક કૉપી કરો"; }, 2000);
    });
}

/* ---------- comments ---------- */

const listEl = $("#commentList"), moreBtn = $("#commentMore");
const form = $("#commentForm"), msg = $("#cMsg");
let cCursor = null, cTotal = 0, lastPost = 0;

function commentHtml(c) {
    const canDelete = me && (c.userId === me.$id || isAdmin(me));
    return `
    <li class="comment" data-id="${escapeHtml(c.$id)}">
        <div class="comment-head">
            <strong>${escapeHtml(c.authorName)}</strong>
            <time datetime="${escapeHtml(c.$createdAt)}">${escapeHtml(formatDate(c.$createdAt, true))}</time>
        </div>
        <p>${escapeHtml(c.text)}</p>
        ${canDelete ? `<button type="button" class="comment-del" data-del="${escapeHtml(c.$id)}">કાઢી નાખો</button>` : ""}
    </li>`;
}

function paintCount() { $("#commentCount").textContent = cTotal ? `(${cTotal})` : ""; }

async function loadComments(reset = false) {
    try {
        const res = await listComments(articleId, { cursor: reset ? null : cCursor, limit: 20 });
        cTotal = res.total;
        if (reset) listEl.innerHTML = "";
        listEl.insertAdjacentHTML("beforeend", res.rows.map(commentHtml).join(""));
        cCursor = res.rows.length ? res.rows[res.rows.length - 1].$id : cCursor;
        moreBtn.hidden = listEl.children.length >= cTotal;
        paintCount();
        if (!listEl.children.length) listEl.innerHTML = `<li class="comment-empty">હજી કોઈ ટિપ્પણી નથી. પહેલી ટિપ્પણી તમે લખો!</li>`;
    } catch (err) {
        console.error("comments:", err);
        listEl.innerHTML = `<li class="comment-empty">ટિપ્પણીઓ લોડ થઈ શકી નથી.</li>`;
    }
}

moreBtn.addEventListener("click", () => loadComments());

form.elements.text.addEventListener("input", () => { $("#cLeft").textContent = 1000 - form.elements.text.value.length; });

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.elements.website.value) return;                  // honeypot
    if (!isSignedIn(me)) { openSignIn("ટિપ્પણી લખવા માટે સાઇન ઇન કરો."); return; }
    const name = (me.name || me.email.split("@")[0]).slice(0, 60);
    const text = form.elements.text.value.trim();
    if (!text) { msg.textContent = "ટિપ્પણી લખો."; return; }
    if (Date.now() - lastPost < 15000) { msg.textContent = "થોડી સેકન્ડ પછી ફરી મોકલો."; return; }

    $("#cSubmit").disabled = true;
    msg.textContent = "મોકલી રહ્યા છીએ…";
    try {
        const row = await addComment(articleId, name, text);
        lastPost = Date.now();
        listEl.querySelector(".comment-empty")?.remove();
        listEl.insertAdjacentHTML("afterbegin", commentHtml(row));
        cTotal++; paintCount();
        form.elements.text.value = ""; $("#cLeft").textContent = 1000;
        msg.textContent = "ટિપ્પણી પ્રકાશિત થઈ ✓";
    } catch (err) {
        console.error(err);
        msg.textContent = err.message === "AUTH_REQUIRED"
            ? "ટિપ્પણી માટે સાઇન ઇન કરો."
            : "હમણાં ટિપ્પણી મોકલી શકાઈ નથી. ફરી પ્રયાસ કરો.";
    } finally {
        $("#cSubmit").disabled = false;
    }
});

const gate = $("#commentGate");
$("#gateSignIn").addEventListener("click", () => openSignIn("ટિપ્પણી લખવા માટે સાઇન ઇન કરો."));

function paintCommentBox() {
    const signed = isSignedIn(me);
    form.hidden = !signed;
    gate.hidden = signed;
    $("#commentAs").textContent = signed ? `${me.name || me.email} તરીકે ટિપ્પણી` : "";
}

// Runs when the header finishes checking the session, and on every sign-in / log-out.
onAuthChange(async (u) => {
    me = isSignedIn(u) ? u : null;
    paintCommentBox();
    if (!articleId) return;
    mine = me ? await getMine(articleId).catch(() => null) : null;
    paintReactions();
    if (listEl.children.length) loadComments(true);   // refresh delete buttons
});

listEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-del]");
    if (!btn || !confirm(t("આ ટિપ્પણી કાઢી નાખવી છે?"))) return;
    try {
        await deleteComment(btn.dataset.del);
        btn.closest(".comment").remove();
        cTotal = Math.max(0, cTotal - 1); paintCount();
        if (!listEl.children.length) loadComments(true);
    } catch (err) { console.error(err); alert(t("કાઢી શકાઈ નથી.")); }
});

/* ---------- boot ---------- */

async function init() {
    if (!articleId) { stateEl.textContent = "આ લેખ મળ્યો નથી."; return; }
    me = getUser();
    paintCommentBox();
    try {
        const row = await getArticle(articleId);
        renderArticle(row);
        wireShare(row.title);
        loadReactions();
        loadComments(true);
    } catch (err) {
        console.error("Could not load article:", err);
        stateEl.textContent = err.code === 404 || err.code === 401
            ? "આ લેખ મળ્યો નથી."
            : "લેખ લોડ થઈ શક્યો નથી. થોડી વાર પછી ફરી પ્રયાસ કરો.";
    }
}

holdReveal(init());
