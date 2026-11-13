// Vercel serverless function behind /sitemap.xml (see vercel.json).
// Lists the fixed pages plus every PUBLISHED news story, so Google finds
// new stories without anyone editing a sitemap file by hand.
const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "6a7e99e5002d9abd688b";
const TABLE_ID = process.env.APPWRITE_ARTICLES_TABLE_ID || "articles";

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));

const PAGES = [
    ["/", "weekly", "1.0"],
    ["/articles.html", "daily", "0.9"],
    ["/newspaper.html", "weekly", "0.9"],
    ["/videos.html", "weekly", "0.8"],
    ["/about.html", "yearly", "0.5"],
    ["/contact.html", "yearly", "0.5"]
];

export default async function handler(req, res) {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const origin = `https://${host}`;
    const urls = PAGES.map(([path, freq, prio]) =>
        `  <url><loc>${origin}${path}</loc><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`);

    try {
        const qs = new URLSearchParams();
        qs.append("queries[]", JSON.stringify({ method: "equal", attribute: "status", values: ["published"] }));
        qs.append("queries[]", JSON.stringify({ method: "orderDesc", attribute: "publishedAt" }));
        qs.append("queries[]", JSON.stringify({ method: "limit", values: [500] }));
        const r = await fetch(`${ENDPOINT}/tablesdb/${DATABASE_ID}/tables/${TABLE_ID}/rows?${qs}`, {
            headers: { "X-Appwrite-Project": PROJECT }
        });
        if (r.ok) {
            const data = await r.json();
            for (const a of data.rows || []) {
                const last = (a.$updatedAt || a.publishedAt || "").slice(0, 10);
                urls.push(`  <url><loc>${origin}/a/${esc(a.$id)}</loc>${last ? `<lastmod>${last}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.7</priority></url>`);
            }
        }
    } catch { /* still serve the fixed pages */ }

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
    res.statusCode = 200;
    res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
}
