// Allow-list HTML sanitizer for article bodies. Used when saving (admin),
// when pasting, and again when rendering (defence in depth).
import { EMBED_SRC_RE } from "./embed.js";
import { ENDPOINT } from "./config.js";

const TEXT_TAGS = new Set([
    "P", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "U", "S",
    "BLOCKQUOTE", "UL", "OL", "LI", "BR", "HR", "A", "FIGURE", "FIGCAPTION", "DIV"
]);
const DROP_WITH_CONTENT = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "OBJECT", "EMBED", "FORM",
    "INPUT", "BUTTON", "TEXTAREA", "SELECT", "SVG", "MATH", "LINK", "META", "TITLE"
]);

const isHttps = (v) => /^https:\/\//i.test(v);
const isStorageUrl = (v) => !!ENDPOINT && v.startsWith(ENDPOINT + "/storage/buckets/");

function safeHref(v) {
    v = (v || "").trim();
    return /^(https?:|mailto:|tel:)/i.test(v) ? v : "";
}

function clean(node, out) {
    for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) { out.appendChild(document.createTextNode(child.nodeValue)); continue; }
        if (child.nodeType !== 1) continue;
        const tag = child.tagName;
        if (DROP_WITH_CONTENT.has(tag)) continue;

        if (tag === "IMG") {
            const src = child.getAttribute("src") || "";
            if (!isHttps(src) && !isStorageUrl(src)) continue;
            const img = document.createElement("img");
            img.src = src;
            img.alt = child.getAttribute("alt") || "";
            img.loading = "lazy";
            out.appendChild(img);
            continue;
        }
        if (tag === "VIDEO") {
            const src = child.getAttribute("src") || "";
            if (!isStorageUrl(src)) continue;
            const v = document.createElement("video");
            v.src = src; v.controls = true; v.preload = "metadata"; v.playsInline = true;
            out.appendChild(v);
            continue;
        }
        if (tag === "IFRAME") {
            const src = child.getAttribute("src") || "";
            if (!EMBED_SRC_RE.test(src)) continue;
            const f = document.createElement("iframe");
            f.src = src;
            f.title = child.getAttribute("title") || "Video";
            f.loading = "lazy";
            f.referrerPolicy = "strict-origin-when-cross-origin";
            f.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
            f.allowFullscreen = true;
            out.appendChild(f);
            continue;
        }

        if (!TEXT_TAGS.has(tag)) { clean(child, out); continue; } // unwrap unknown tags (span, font, …)

        // <div> only survives as the video wrapper / <figure> as the media wrapper
        const cls = child.classList;
        if (tag === "DIV" && !cls.contains("embed")) { clean(child, out); continue; }

        const el = document.createElement(tag.toLowerCase());
        if (tag === "DIV") el.className = "embed";
        if (tag === "FIGURE") el.className = "media";
        if (tag === "A") {
            const href = safeHref(child.getAttribute("href"));
            if (!href) { clean(child, out); continue; }
            el.href = href;
            el.target = "_blank";
            el.rel = "noopener noreferrer";
        }
        clean(child, el);
        out.appendChild(el);
    }
}

export function sanitizeHtml(html) {
    const doc = new DOMParser().parseFromString(`<body>${html || ""}</body>`, "text/html");
    const box = document.createElement("div");
    clean(doc.body, box);
    return box.innerHTML;
}

// Plain-text preview (for excerpts / meta descriptions)
export function htmlToText(html, max = 200) {
    const doc = new DOMParser().parseFromString(`<body>${html || ""}</body>`, "text/html");
    doc.querySelectorAll("figure, .embed, script, style").forEach((n) => n.remove());
    const t = (doc.body.textContent || "").replace(/\s+/g, " ").trim();
    return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}
