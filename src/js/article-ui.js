import { escapeHtml } from "./common.js";
import { mediaUrl, articleHref, articleDate, formatDate } from "./articles-api.js";
import { htmlToText } from "./sanitize.js";

export function articleCardHtml(row, opts) {
    const withButton = opts?.button === true;
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
                ${withButton ? `<span class="btn btn-primary btn-sm article-read-btn">પૂરા સમાચાર વાંચો <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>` : ""}
            </div>
        </a>
    </article>`;
}
