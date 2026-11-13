import "../css/prose.css";
import { ID, Query } from "appwrite";
import { account, storage, tablesDB } from "./appwrite.js";
import { currentUser, isAdmin } from "./auth.js";
import { DATABASE_ID, NEWSPAPER_BUCKET_ID as BUCKET_ID, NEWSPAPER_TABLE_ID as TABLE_ID } from "./config.js";
import { allEditions, refreshEditions, viewUrl, formatDate } from "./editions.js";
import { escapeHtml } from "./common.js";

const $ = (id) => document.getElementById(id);
const loginContainer = $("loginContainer");
const dashboard = $("dashboard");
const loginForm = $("loginForm");
const loginMessage = $("loginMessage");

/* =========================
   LOGIN / LOGOUT
   Only users carrying the "admin" label may see the dashboard
   (readers get anonymous sessions too, so a session alone is not enough).
========================= */

function showDashboard() {
    loginContainer.style.display = "none";
    dashboard.style.display = "block";
    loadEditions();
}

function showLogin() {
    loginContainer.style.display = "flex";
    dashboard.style.display = "none";
}

async function checkLogin() {
    const user = await currentUser();
    if (isAdmin(user)) showDashboard(); else showLogin();
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMessage.textContent = "Logging in...";
    try {
        // A reader's anonymous session blocks a new login → drop it first.
        const existing = await currentUser();
        if (existing && !existing.email) await account.deleteSession({ sessionId: "current" });

        await account.createEmailPasswordSession({
            email: $("email").value,
            password: $("password").value
        });

        const me = await account.get();
        if (!isAdmin(me)) {
            await account.deleteSession({ sessionId: "current" });
            loginMessage.textContent = 'This account is not an admin. In Appwrite Console → Auth → Users, add the label "admin" to it.';
            return;
        }
        loginMessage.textContent = "";
        loginForm.reset();
        showDashboard();
    } catch (error) {
        console.error(error);
        loginMessage.textContent = error.message;
    }
});

$("logoutBtn").addEventListener("click", async () => {
    try { await account.deleteSession({ sessionId: "current" }); } catch (error) { console.error(error); }
    showLogin();
});

/* =========================
   TABS
========================= */

const tabs = { newspaper: $("tab-newspaper"), articles: $("tab-articles"), comments: $("tab-comments") };
const loaded = {};

document.querySelector(".tabs").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    const name = btn.dataset.tab;
    document.querySelectorAll(".tabs button").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", String(on));
    });
    Object.entries(tabs).forEach(([k, el]) => { el.hidden = k !== name; });

    if (name === "articles" && !loaded.articles) {
        loaded.articles = true;
        (await import("./admin-articles.js")).init();
    }
    if (name === "comments") {
        const m = await import("./admin-comments.js");
        m.load();
    }
});

/* =========================
   UPLOAD NEWSPAPER
========================= */

const uploadForm = $("uploadForm");
const uploadMessage = $("uploadMessage");

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = $("newspaper").files[0];
    const editionDate = $("editionDate").value;

    if (!file) { uploadMessage.textContent = "Please select a PDF."; return; }
    if (file.type !== "application/pdf") { uploadMessage.textContent = "Only PDF files are allowed."; return; }

    uploadMessage.textContent = "Uploading newspaper...";
    let uploadedFile = null;

    try {
        uploadedFile = await storage.createFile({ bucketId: BUCKET_ID, fileId: ID.unique(), file });

        await tablesDB.createRow({
            databaseId: DATABASE_ID,
            tableId: TABLE_ID,
            rowId: ID.unique(),
            data: {
                title: "DEEPMALA Weekly Newspaper",
                editionDate: new Date(editionDate).toISOString(),
                fileId: uploadedFile.$id
            }
        });

        uploadMessage.textContent = "Newspaper uploaded successfully!";
        uploadForm.reset();
        refreshEditions();
        loadEditions();
    } catch (error) {
        console.error(error);
        // don't leave an orphan PDF behind when the database row failed
        if (uploadedFile) { try { await storage.deleteFile({ bucketId: BUCKET_ID, fileId: uploadedFile.$id }); } catch { /* ignore */ } }
        uploadMessage.textContent = "Upload failed: " + error.message;
    }
});

/* =========================
   PREVIOUS EDITIONS
========================= */

const editionsList = $("editionsList");

async function loadEditions() {
    editionsList.innerHTML = "<p>Loading…</p>";
    try {
        const rows = await allEditions();
        if (!rows.length) { editionsList.innerHTML = "<p>No newspapers uploaded yet.</p>"; return; }
        editionsList.innerHTML = `<ul class="a-list">${rows.map((r) => `
            <li class="a-row" data-id="${escapeHtml(r.$id)}" data-file="${escapeHtml(r.fileId)}">
                <div class="a-main"><strong>${escapeHtml(formatDate(r.editionDate))}</strong></div>
                <div class="a-btns">
                    <a class="mini" href="${escapeHtml(viewUrl(r))}" target="_blank" rel="noopener">View</a>
                    <button type="button" class="mini danger" data-del>Delete</button>
                </div>
            </li>`).join("")}</ul>`;
    } catch (err) {
        console.error(err);
        editionsList.innerHTML = `<p>Could not load editions: ${escapeHtml(err.message)}</p>`;
    }
}

editionsList.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-del]");
    if (!btn) return;
    const li = btn.closest(".a-row");
    if (!confirm("Delete this edition?")) return;
    btn.disabled = true;
    try {
        await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: TABLE_ID, rowId: li.dataset.id });
        try { await storage.deleteFile({ bucketId: BUCKET_ID, fileId: li.dataset.file }); } catch { /* file may already be gone */ }
        refreshEditions();
        loadEditions();
    } catch (err) {
        console.error(err);
        alert("Delete failed: " + err.message);
        btn.disabled = false;
    }
});

checkLogin();
