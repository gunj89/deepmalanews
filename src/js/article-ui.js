import { escapeHtml } from "./common.js";
import { mediaUrl, articleHref, articleDate, formatDate } from "./articles-api.js";
import { htmlToText } from "./sanitize.js";

export function articleCardHtml(row) {
    const title = escapeHtml(row.title);
    const excerpt = escapeHtml(row.excerpt || htmlToText(row.content, 140));
    const thumb = row.coverImageId
        ? `<img src="${escapeHtml(mediaUrl(row.coverImageId))}" alt="" loading="lazy">`
        : `<img class="ph" src="/images/depmala logo.png" alt="" loading="lazy">`;
    return `
    <article class="article-card">
        <a href="${articleHref(row)}" class="article-card-link">
            <div class="article-thumb${row.coverImageId ? "" : " is-empty"}">${thumb}</div>
            <div class="article-card-body">
                <span class="article-date">${escapeHtml(formatDate(articleDate(row)))}</span>
                <h3>${title}</h3>
                ${excerpt ? `<p>${excerpt}</p>` : ""}
            </div>
        </a>
    </article>`;
}
