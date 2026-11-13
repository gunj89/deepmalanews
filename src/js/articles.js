import { $ } from "./common.js";
import { holdReveal } from "./reveal.js";
import { listPublished } from "./articles-api.js";
import { articleCardHtml } from "./article-ui.js";

const grid = $("#articleGrid");
const moreBtn = $("#articleMore");
const statusEl = $("#articleStatus");

let cursor = null;
let started = false;
let busy = false;

async function load() {
    if (busy) return;
    busy = true;
    moreBtn.disabled = true;
    try {
        const res = await listPublished({ cursor, limit: 12 });
        if (!started) { grid.innerHTML = ""; started = true; }
        grid.insertAdjacentHTML("beforeend", res.rows.map(articleCardHtml).join(""));
        cursor = res.rows.length ? res.rows[res.rows.length - 1].$id : cursor;
        moreBtn.hidden = res.rows.length < 12;
        statusEl.textContent = grid.children.length ? "" : "હજી કોઈ સમાચાર પ્રકાશિત થયા નથી.";
    } catch (err) {
        console.error("Could not load articles:", err);
        if (!started) grid.innerHTML = "";
        statusEl.textContent = "સમાચાર લોડ થઈ શક્યા નથી. થોડી વાર પછી ફરી પ્રયાસ કરો.";
    } finally {
        busy = false;
        moreBtn.disabled = false;
    }
}

moreBtn.addEventListener("click", load);
holdReveal(load());
