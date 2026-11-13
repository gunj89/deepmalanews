import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const root = dirname(fileURLToPath(import.meta.url));

// Replaces <!--@include name--> with src/partials/name.html so the
// header, footer and tab bar live in ONE place for every page.
const htmlInclude = () => ({
    name: "html-include",
    transformIndexHtml: {
        order: "pre",
        handler(html) {
            return html.replace(/<!--@include (\w+)-->/g, (_, name) =>
                readFileSync(resolve(root, `src/partials/${name}.html`), "utf8")
            );
        }
    }
});

// Article links look like /a/<id> (Vercel rewrites them in production,
// see vercel.json). This makes the same URL work in dev / preview.
const articleRoute = () => {
    const mw = (req, _res, next) => {
        if (req.url && req.url.startsWith("/a/")) req.url = "/article.html";
        next();
    };
    return {
        name: "article-route",
        configureServer(server) { server.middlewares.use(mw); },
        configurePreviewServer(server) { server.middlewares.use(mw); }
    };
};

export default defineConfig({
    plugins: [htmlInclude(), articleRoute()],
    build: {
        rollupOptions: {
            input: {
                main: resolve(root, "index.html"),
                newspaper: resolve(root, "newspaper.html"),
                videos: resolve(root, "videos.html"),
                articles: resolve(root, "articles.html"),
                article: resolve(root, "article.html"),
                about: resolve(root, "about.html"),
                contact: resolve(root, "contact.html"),
                admin: resolve(root, "admin.html")
            }
        }
    }
});
