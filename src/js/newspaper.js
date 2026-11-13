import { $, $$, escapeHtml } from "./common.js";
import { holdReveal } from "./reveal.js";
import { allEditions, viewUrl, downloadUrl, formatDate } from "./editions.js";

const PAGE_SIZE = 12;

const listEl = $("#archiveList");
const moreBtn = $("#archiveMore");
const statusEl = $("#archiveStatus");
const yearsEl = $("#yearChips");

let editions = [];
let filtered = [];
let shown = 0;
let year = "all";

const dlIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function cardHtml(row) {
    const d = new Date(row.editionDate);
    const day = d.toLocaleDateString("en-IN", { day: "2-digit" });
    const mon = d.toLocaleDateString("en-IN", { month: "short" });
    const yr = d.getFullYear();
    const full = escapeHtml(formatDate(row.editionDate));
    return `
    <li class="paper-card">
        <div class="paper-date" aria-hidden="true"><strong>${day}</strong><span>${mon} ${yr}</span></div>
        <div class="paper-meta">
            <h3>દિપમાલા સપ્તાહિક</h3>
            <p>${full}</p>
        </div>
        <div class="paper-actions">
            <a class="btn btn-primary btn-sm" href="${viewUrl(row)}" target="_blank" rel="noopener" aria-label="Read edition ${full}">વાંચો</a>
            <a class="btn btn-ghost btn-sm btn-icon" href="${downloadUrl(row)}" aria-label="Download PDF ${full}">${dlIcon}</a>
        </div>
    </li>`;
}

function renderMore(reset = false) {
    if (reset) { listEl.innerHTML = ""; shown = 0; }
    const next = filtered.slice(shown, shown + PAGE_SIZE);
    listEl.insertAdjacentHTML("beforeend", next.map(cardHtml).join(""));
    shown += next.length;

    moreBtn.hidden = shown >= filtered.length;
    statusEl.textContent = filtered.length
        ? `${filtered.length} અંકમાંથી ${shown} બતાવ્યા`
        : "આ વર્ષનો કોઈ અંક ઉપલબ્ધ નથી.";
}

function applyFilter() {
    filtered = year === "all"
        ? editions
        : editions.filter((e) => String(new Date(e.editionDate).getFullYear()) === year);
    renderMore(true);
}

function buildYearChips() {
    const years = [...new Set(editions.map((e) => new Date(e.editionDate).getFullYear()))].sort((a, b) => b - a);
    yearsEl.innerHTML = ["all", ...years]
        .map((y) => `<button type="button" class="chip${y === "all" ? " on" : ""}" data-year="${y}">${y === "all" ? "બધા" : y}</button>`)
        .join("");
    yearsEl.hidden = years.length < 2;
}

yearsEl.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    year = chip.dataset.year;
    $$(".chip", yearsEl).forEach((c) => c.classList.toggle("on", c === chip));
    applyFilter();
});

moreBtn.addEventListener("click", () => renderMore());

/* ---- Featured (latest) edition ---- */
function showLatest(row) {
    $("#coverEditionDate").textContent = formatDate(row.editionDate).toUpperCase();
    $("#coverEditionDate").classList.remove("skeleton-text");
    const date = $("#editionDate");
    date.textContent = formatDate(row.editionDate);
    date.classList.remove("skeleton-text");

    const read = $("#readNewspaper");
    read.href = viewUrl(row);
    read.target = "_blank";
    read.rel = "noopener";

    const dl = $("#downloadNewspaper");
    dl.href = downloadUrl(row);
    dl.hidden = false;
}

async function init() {
    try {
        editions = await allEditions();
        if (!editions.length) {
            $("#editionDate").textContent = "No edition yet";
            $("#coverEditionDate").textContent = "NO EDITION";
            $("#readNewspaper").classList.add("is-disabled");
            statusEl.textContent = "હજી કોઈ અંક પ્રકાશિત થયો નથી.";
            return;
        }
        showLatest(editions[0]);
        // Latest is already featured above, so the archive starts from the one before it
        editions = editions.slice(1);
        buildYearChips();
        applyFilter();
        if (!editions.length) statusEl.textContent = "જૂના અંકો ટૂંક સમયમાં ઉમેરાશે.";
    } catch (err) {
        console.error("Could not load newspapers:", err);
        $("#editionDate").textContent = "Please try again later.";
        $("#readNewspaper").classList.add("is-disabled");
        statusEl.textContent = "અંકો લોડ થઈ શક્યા નથી. થોડી વાર પછી ફરી પ્રયાસ કરો.";
    }
}

holdReveal(init());
