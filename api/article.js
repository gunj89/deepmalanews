// Vercel serverless function behind /a/:id (see vercel.json).
// Social apps (WhatsApp, Facebook, Telegram…) don't run JavaScript, so this
// injects the article's title / summary / cover image into the page's
// <head> so shared links get a proper preview. The page itself still
// renders the article in the browser exactly as before.
const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "6a7e99e5002d9abd688b";
const TABLE_ID = process.env.APPWRITE_ARTICLES_TABLE_ID || "articles";
const BUCKET_ID = process.env.VITE_ARTICLE_BUCKET_ID || "article_media";

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function plain(html = "", max = 180) {
    const t = String(html)
        .replace(/<(figure|script|style)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\s+/g, " ").trim();
    return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

export default async function handler(req, res) {
    const id = String(req.query.id || "").replace(/[^\w.-]/g, "").slice(0, 36);
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const origin = `https://${host}`;

    let html;
    try {
        const r = await fetch(`${origin}/article.html`);
        if (!r.ok) throw new Error("template " + r.status);
        html = await r.text();
    } catch {
        res.statusCode = 302;
        res.setHeader("Location", `/article.html?id=${encodeURIComponent(id)}`);
        return res.end();
    }

    try {
        const r = await fetch(`${ENDPOINT}/tablesdb/${DATABASE_ID}/tables/${TABLE_ID}/rows/${id}`, {
            headers: { "X-Appwrite-Project": PROJECT }
        });
        if (r.ok) {
            const a = await r.json();
            const title = `${a.title} | Deepmala News`;
            const desc = a.excerpt || plain(a.content);
            const url = `${origin}/a/${id}`;
            const img = a.coverImageId
                ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${a.coverImageId}/view?project=${PROJECT}`
                : `${origin}/images/DEEPMALA_PAPER%20LOGO.png`;

            const ld = {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                mainEntityOfPage: { "@type": "WebPage", "@id": url },
                headline: String(a.title || "").slice(0, 110),
                description: desc,
                image: [img],
                datePublished: a.publishedAt || a.$createdAt,
                dateModified: a.$updatedAt || a.publishedAt || a.$createdAt,
                inLanguage: "gu",
                author: { "@type": "Organization", name: a.author || "Deepmala News" },
                publisher: { "@type": "NewsMediaOrganization", name: "Deepmala News", logo: { "@type": "ImageObject", url: `${origin}/images/DEEPMALA_PAPER%20LOGO.png` } }
            };
            const ldTag = `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;

            const tags = [
                `<meta name="description" content="${esc(desc)}">`,
                `<link rel="canonical" href="${esc(url)}">`,
                `<meta property="og:type" content="article">`,
                `<meta property="og:title" content="${esc(title)}">`,
                `<meta property="og:description" content="${esc(desc)}">`,
                `<meta property="og:url" content="${esc(url)}">`,
                `<meta property="og:image" content="${esc(img)}">`,
                `<meta name="twitter:title" content="${esc(title)}">`,
                `<meta name="twitter:description" content="${esc(desc)}">`,
                `<meta name="twitter:image" content="${esc(img)}">`,
                ldTag
            ].join("\n    ");

            html = html
                .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
                .replace(/<!--OG_START-->[\s\S]*?<!--OG_END-->/, tags);
        }
    } catch { /* fall back to the generic tags already in the page */ }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.statusCode = 200;
    res.end(html);
}
