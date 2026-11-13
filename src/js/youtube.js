import { escapeHtml } from "./common.js";

const KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const HANDLE = "@deepmalanews";
const API = "https://www.googleapis.com/youtube/v3";

let uploadsIdPromise = null;

function getUploadsId() {
    if (!KEY) return Promise.reject(new Error("VITE_YOUTUBE_API_KEY is not set"));
    uploadsIdPromise ||= (async () => {
        try {
            const cached = sessionStorage.getItem("dm_uploads");
            if (cached) return cached;
        } catch { /* storage blocked — ignore */ }

        const res = await fetch(`${API}/channels?part=contentDetails&forHandle=${encodeURIComponent(HANDLE)}&key=${KEY}`);
        const data = await res.json();
        const id = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!id) throw new Error("YouTube channel not found / quota exceeded");
        try { sessionStorage.setItem("dm_uploads", id); } catch { /* ignore */ }
        return id;
    })().catch((e) => { uploadsIdPromise = null; throw e; }); // don't cache a failure
    return uploadsIdPromise;
}

// One page of videos, newest first.
export async function fetchVideos({ pageToken = "", max = 12 } = {}) {
    const playlistId = await getUploadsId();
    const url =
        `${API}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${max}` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "") +
        `&key=${KEY}`;

    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) throw new Error("YouTube API error");

    const items = data.items
        .filter((v) => v.snippet && v.snippet.resourceId && !/^(Private|Deleted) video$/i.test(v.snippet.title))
        .map((v) => {
            const t = v.snippet.thumbnails || {};
            const id = v.snippet.resourceId.videoId;
            return {
                id,
                title: v.snippet.title,
                date: v.snippet.publishedAt,
                thumb: (t.high || t.medium || t.default || {}).url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
            };
        });

    return { items, next: data.nextPageToken || "" };
}

export function videoCardHtml(v) {
    const title = escapeHtml(v.title);
    const date = new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `
    <article class="video-card" data-title="${title.toLowerCase()}">
        <button type="button" class="video-media" data-video="${v.id}" aria-label="Play: ${title}">
            <img src="${escapeHtml(v.thumb)}" alt="" loading="lazy">
            <span class="play"><span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor"/></svg>
            </span></span>
        </button>
        <div class="video-info">
            <span>${date}</span>
            <h3>${title}</h3>
        </div>
    </article>`;
}

// Tap a thumbnail → swap in the real player (loads nothing until tapped).
export function enablePlayers(container) {
    container.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-video]");
        if (!btn) return;
        const wrap = document.createElement("div");
        wrap.className = "video-media";
        const frame = document.createElement("iframe");
        frame.src = `https://www.youtube.com/embed/${encodeURIComponent(btn.dataset.video)}?autoplay=1&rel=0&playsinline=1`;
        frame.title = (btn.getAttribute("aria-label") || "").replace("Play: ", "");
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.allowFullscreen = true;
        wrap.appendChild(frame);
        btn.replaceWith(wrap);
    });
}
