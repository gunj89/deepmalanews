import { $, $$ } from "./common.js";
import { holdReveal } from "./reveal.js";
import { latestEdition, viewUrl, formatDate } from "./editions.js";
import { listPublished } from "./articles-api.js";
import { articleCardHtml } from "./article-ui.js";
import { fetchVideos, videoCardHtml, enablePlayers } from "./youtube.js";

/* ---- Latest edition ---- */
async function loadLatest() {
    const dateEl = $("#editionDate");
    const coverDate = $("#coverEditionDate");
    const buttons = $$(".js-read");

    const setDate = (t) => {
        dateEl.textContent = t;
        coverDate.textContent = t.toUpperCase();
        dateEl.classList.remove("skeleton-text");
        coverDate.classList.remove("skeleton-text");
    };
    const disable = () => buttons.filter((b) => b.getAttribute("href") === "#").forEach((b) => {
        b.classList.add("is-disabled");
        b.setAttribute("aria-disabled", "true");
        b.removeAttribute("target");
    });

    try {
        const row = await latestEdition();
        if (!row) { setDate("No edition yet"); disable(); return; }

        setDate(formatDate(row.editionDate));
        buttons.forEach((b) => { b.href = viewUrl(row); b.target = "_blank"; b.rel = "noopener"; });
    } catch (err) {
        console.error("Could not load newspaper:", err);
        setDate("Please try again later.");
        disable();
    }
}

/* ---- Latest 3 videos ---- */
async function loadVideos() {
    const track = $("#videoTrack");
    try {
        const { items } = await fetchVideos({ max: 3 });
        if (!items.length) return;
        track.innerHTML = items.map(videoCardHtml).join("");
        enablePlayers(track);
        initDots();
    } catch (err) {
        console.error("Failed to load YouTube videos:", err);
        initDots();
    }
}

function initDots() {
    const track = $("#videoTrack");
    const dotsEl = $("#videoDots");
    const cards = $$(".video-card", track);
    dotsEl.innerHTML = cards.map(() => "<i></i>").join("");
    const dots = $$("i", dotsEl);

    const update = () => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let best = 0, bestD = Infinity;
        cards.forEach((c, i) => {
            const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
            if (d < bestD) { best = i; bestD = d; }
        });
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = cards.length - 1;
        dots.forEach((d, i) => d.classList.toggle("on", i === best));
    };
    track.addEventListener("scroll", update, { passive: true });
    update();
}

/* ---- Latest 3 articles (section stays hidden until there is one) ---- */
async function loadArticles() {
    try {
        const res = await listPublished({ limit: 3 });
        if (!res.rows.length) return;
        $("#homeArticles").innerHTML = res.rows.map((r) => articleCardHtml(r, { button: true })).join("");
        $("#articles").hidden = false;
    } catch (err) {
        console.error("Could not load articles:", err);
    }
}

holdReveal(Promise.allSettled([loadLatest(), loadArticles(), loadVideos()]));
