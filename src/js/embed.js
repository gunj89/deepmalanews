// Turn a pasted video link into a safe embed URL.
// Supports YouTube (watch, youtu.be, shorts, live, embed) and Vimeo.
export function parseVideoUrl(input) {
    let u;
    try { u = new URL(String(input).trim()); } catch { return null; }
    const host = u.hostname.replace(/^(www|m|music)\./, "");

    if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
        let id = "";
        if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
        else if (u.pathname === "/watch") id = u.searchParams.get("v") || "";
        else {
            const m = u.pathname.match(/^\/(?:shorts|live|embed|v)\/([\w-]{11})/);
            if (m) id = m[1];
        }
        if (!/^[\w-]{11}$/.test(id)) return null;
        let src = `https://www.youtube.com/embed/${id}`;
        const t = u.searchParams.get("t") || u.searchParams.get("start");
        const secs = t && parseInt(t, 10);
        if (secs > 0) src += `?start=${secs}`;
        return { kind: "youtube", src };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
        const m = u.pathname.match(/(\d{6,})/);
        if (m) return { kind: "vimeo", src: `https://player.vimeo.com/video/${m[1]}` };
    }
    return null;
}

export const EMBED_SRC_RE =
    /^https:\/\/(www\.youtube\.com\/embed\/[\w-]{11}(\?start=\d+)?|player\.vimeo\.com\/video\/\d{6,})$/;
