import { $ } from "./common.js";
import { holdReveal } from "./reveal.js";
import { fetchVideos, videoCardHtml, enablePlayers } from "./youtube.js";

const grid = $("#videoGrid");
const moreBtn = $("#videoMore");
const statusEl = $("#videoStatus");
const search = $("#videoSearch");

let nextToken = "";
let loaded = 0;
let loading = false;
let started = false;

enablePlayers(grid);

let inflight = null;
function loadPage() {
    inflight ||= doLoad().finally(() => { inflight = null; });
    return inflight;
}

// resolves true on success, false on failure
async function doLoad() {
    loading = true;
    moreBtn.disabled = true;
    try {
        const { items, next } = await fetchVideos({ pageToken: nextToken, max: 12 });
        if (!started) { grid.innerHTML = ""; started = true; }
        grid.insertAdjacentHTML("beforeend", items.map(videoCardHtml).join(""));
        loaded += items.length;
        nextToken = next;
        moreBtn.hidden = !next;
        applySearch();
        return true;
    } catch (err) {
        console.error("Failed to load YouTube videos:", err);
        if (!started) {
            grid.innerHTML = "";
            statusEl.innerHTML = `વીડિયો લોડ થઈ શક્યા નથી. <a href="https://www.youtube.com/@deepmalanews" target="_blank" rel="noopener">YouTube પર જુઓ</a>`;
        }
        return false;
    } finally {
        loading = false;
        moreBtn.disabled = false;
    }
}

function applySearch() {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    grid.querySelectorAll(".video-card").forEach((card) => {
        const show = !q || card.dataset.title.includes(q);
        card.hidden = !show;
        if (show) visible++;
    });
    if (started) {
        statusEl.textContent = q
            ? (visible ? `${visible} વીડિયો મળ્યા` : "કોઈ વીડિયો મળ્યો નથી.")
            : `${loaded} વીડિયો બતાવ્યા`;
    }
}

// While searching, pull in every page so results cover the whole channel.
search.addEventListener("input", async () => {
    applySearch();
    if (search.value.trim() && nextToken) {
        if (inflight) await inflight;
        // stop on the first failure instead of hammering the API
        while (nextToken && search.value.trim() && (await loadPage())) { /* keep paging */ }
    }
});

moreBtn.addEventListener("click", loadPage);
holdReveal(loadPage());
