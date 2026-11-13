// Gujarati (default) <-> English switch.
//
// How it works: the pages are written in Gujarati. When the visitor picks
// English, every Gujarati text on the page (and anything the scripts add later)
// is swapped for the English line in the dictionary below. Switching language
// reloads the page, so dates and lists are rebuilt in the right language.
//
// To change an English sentence, edit it in EN below. To add a new sentence,
// add a line:   "ગુજરાતી લખાણ": "English text",
// Names, article titles and article text written by the editors are NOT here:
// they stay in the language they were written in.

const KEY = "dm_lang";

export function getLang() {
    try { return localStorage.getItem(KEY) === "en" ? "en" : "gu"; } catch { return "gu"; }
}
export const isEnglish = () => getLang() === "en";

export function setLang(lang) {
    try { localStorage.setItem(KEY, lang); } catch { /* private mode: stays Gujarati */ }
    location.reload();
}

/* ---------------- dictionary ---------------- */

const EN = {
    // navigation / header / footer
    "મુખ્ય સામગ્રી પર જાઓ": "Skip to main content",
    "હોમ": "Home",
    "સમાચાર": "News",
    "અખબાર": "Newspaper",
    "વીડિયો": "Videos",
    "અમારા વિશે": "About us",
    "પરિચય": "About",
    "સંપર્ક": "Contact",
    "એડમિન": "Admin",
    "સાઇન ઇન": "Sign in",
    "લોગ-આઉટ": "Log out",
    "તમે સફળતાપૂર્વક સાઇન ઇન થયા છો.": "You have signed in successfully.",
    "તમારું ખાતું બન્યું છે અને તમે સાઇન ઇન થયા છો.": "Your account has been created and you are signed in.",
    "તમે લોગ-આઉટ થઈ ગયા છો.": "You have been logged out.",
    "શું તમે લોગ-આઉટ કરવા માંગો છો?": "Do you want to log out?",
    "ઓકે": "OK",
    "કન્ફર્મ": "Confirm",
    "રદ કરો": "Cancel",
    "ઉપર જાઓ ↑": "Back to top ↑",

    // home
    "ગુજરાત તેમજ યુ.એસ.એ. માં સૌથી વધુ ફેલાવો ધરાવતું અખબાર": "The most widely circulated newspaper in Gujarat and the USA",
    "ન્યૂઝ-પેપર વાંચો": "Read the Newspaper",
    "વીડિયો જુઓ": "Watch Videos",
    "સમાચાર વાંચો": "Read News",
    "લેટેસ્ટ અંક (PDF) વાંચો": "Read Latest Issue (PDF)",
    "દીપમાળા — પ્રકાશ, પ્રગતિ, પવિત્રતા": "Deepmala — Light, Progress, Purity",
    "લેટેસ્ટ અખબાર": "Latest Newspaper",
    "દિપમાલા સપ્તાહિકની નવીનતમ આવૃત્તિ ઓનલાઈન વાંચો.": "Read the latest edition of Deepmala Weekly online.",
    "દિપમાલા સપ્તાહિક": "Deepmala Weekly",
    "પ્રકાશિત": "Published",
    "PDF નવી ટેબમાં ખુલશે": "The PDF opens in a new tab",
    "જૂના અંકો જુઓ": "View past issues",
    "તાજા સમાચાર": "Latest News",
    "વિશેષ અહેવાલો અને વાંચવા લાયક સમાચાર.": "Special reports and news worth reading.",
    "બધા સમાચાર જુઓ": "View all news",
    "પૂરા સમાચાર વાંચો": "Read full news",
    "તાજા વીડિયો": "Latest Videos",
    "સમાચાર કવરેજ, રિપોર્ટ્સ, ઇન્ટરવ્યૂ અને વિશેષ અહેવાલો.": "News coverage, reports, interviews and special reports.",
    "બધા વીડિયો જુઓ": "View all videos",
    "દિપમાલા ન્યૂઝ વિષે": "About Deepmala News",
    "છેલ્લા 30 વર્ષથી દિપમાલા ન્યૂઝ કલોલ અને ગાંધીનગર વિસ્તારમાં વિશ્વસનીય સમાચાર અને માહિતીનું માધ્યમ બનીને પોતાની આગવી ઓળખ બનાવી રહ્યું છે. વર્ષોથી લોકોનો વિશ્વાસ અને પ્રેમ પ્રાપ્ત કરનાર દિપમાલા ન્યૂઝ આજે કલોલ, ગાંધીનગર, સમગ્ર ગુજરાત અને અમેરિકામાં ખૂબ જ જાણીતું અને લોકપ્રિય અખબાર છે.":
        "For the past 30 years, Deepmala News has been building its own identity as a trusted source of news and information in the Kalol and Gandhinagar area. Having earned the trust and love of people over the years, Deepmala News is today a well-known and popular newspaper in Kalol, Gandhinagar, across Gujarat and in America.",
    "વધુ જાણો": "Learn more",
    "વર્ષની વિશ્વસનીય પત્રકારત્વ યાત્રા": "years of trusted journalism",
    "કલોલ": "Kalol",
    "ગાંધીનગર વિસ્તારમાં મજબૂત પકડ": "Strong presence across the Gandhinagar area",
    "ગુજરાત • USA": "Gujarat • USA",
    "વાચકો દેશ અને વિદેશમાં": "Readers in India and abroad",
    "સમાચાર કે જાહેરાત માટે?": "For news or advertising?",
    "અમારી ટીમનો સીધો સંપર્ક કરો.": "Contact our team directly.",
    "કૉલ કરો": "Call us",
    "બધી વિગતો": "All details",

    // about / contact
    "સ્થાનિક સમાચાર, મહત્વપૂર્ણ ઘટનાઓ અને જનસમાજ સાથે જોડાયેલા મુદ્દાઓને લોકો સુધી પહોંચાડવાની તેની સતત પરંપરા તેને વિશિષ્ટ બનાવે છે.":
        "Its steady tradition of bringing local news, important events and issues connected with the community to the people makes it distinctive.",
    "અખબાર વાંચો": "Read the Newspaper",
    "સંપર્ક કરો": "Contact us",
    "અમને સંપર્ક કરો": "Contact Us",
    "સમાચાર, જાહેરાતો, વ્યવસાયિક સંપર્ક અથવા સામાન્ય માહિતી માટે દિપમાલા ન્યૂઝ ટીમનો સંપર્ક કરો.":
        "Contact the Deepmala News team for news, advertisements, business enquiries or general information.",
    "Phone • કૉલ કરો": "Phone • Call",
    "Email • ઈ-મેઇલ": "Email • Write to us",
    "Office • નકશામાં જુઓ": "Office • View on map",

    // articles list
    "Deepmala News | સમાચાર અને વિશેષ અહેવાલ": "Deepmala News | News & Special Reports",
    "સમાચાર વિશ્લેષણ, વિશેષ અહેવાલો અને વાંચવા લાયક સમાચાર.": "News analysis, special reports and news worth reading.",
    "વધુ સમાચાર બતાવો": "Show more news",
    "Deepmala News ના સમાચાર, વિશ્લેષણ અને વિશેષ અહેવાલો ગુજરાતીમાં વાંચો.": "Read Deepmala News stories, analysis and special reports.",
    "હજી કોઈ સમાચાર પ્રકાશિત થયા નથી.": "No news has been published yet.",
    "સમાચાર લોડ થઈ શક્યા નથી. થોડી વાર પછી ફરી પ્રયાસ કરો.": "Could not load news. Please try again in a while.",

    // newspaper
    "દિપમાલા સપ્તાહિકનો લેટેસ્ટ અંક અને જૂના બધા અંકો PDF માં વાંચો કે ડાઉનલોડ કરો.": "Read or download the latest issue of Deepmala Weekly and all past issues as PDF.",
    "લેટેસ્ટ અંક": "Latest Issue",
    "PDF ડાઉનલોડ": "Download PDF",
    "જૂના અંકો": "Past Issues",
    "અંકો લોડ થઈ રહ્યા છે…": "Loading issues…",
    "વધુ અંકો બતાવો": "Show more issues",
    "વાંચો": "Read",
    "બધા": "All",
    "આ વર્ષનો કોઈ અંક ઉપલબ્ધ નથી.": "No issue available for this year.",
    "હજી કોઈ અંક પ્રકાશિત થયો નથી.": "No issue has been published yet.",
    "જૂના અંકો ટૂંક સમયમાં ઉમેરાશે.": "Past issues will be added soon.",
    "અંકો લોડ થઈ શક્યા નથી. થોડી વાર પછી ફરી પ્રયાસ કરો.": "Could not load issues. Please try again in a while.",

    // videos
    "દિપમાલા ન્યૂઝ ના બધા વીડિયો — સમાચાર કવરેજ, રિપોર્ટ્સ, ઇન્ટરવ્યૂ અને વિશેષ અહેવાલો.": "All Deepmala News videos — news coverage, reports, interviews and special reports.",
    "વીડિયો શોધો…": "Search videos…",
    "વધુ વીડિયો બતાવો": "Show more videos",
    "વીડિયો લોડ થઈ શક્યા નથી.": "Could not load videos.",
    "YouTube પર જુઓ": "Watch on YouTube",
    "કોઈ વીડિયો મળ્યો નથી.": "No videos found.",

    // single article
    "સમાચાર | Deepmala News": "News | Deepmala News",
    "Deepmala News ના સમાચાર વાંચો.": "Read the news from Deepmala News.",
    "← બધા સમાચાર": "← All news",
    "સમાચાર લોડ થઈ રહ્યા છે…": "Loading news…",
    "આ સમાચાર હજી પ્રકાશિત થયા નથી (ફક્ત એડમિન માટે પ્રીવ્યૂ).": "This news is not published yet (preview for admins only).",
    "આ સમાચાર મળ્યા નથી.": "This news was not found.",
    "સમાચાર લોડ થઈ શક્યા નથી. થોડી વાર પછી ફરી પ્રયાસ કરો.": "Could not load the news. Please try again in a while.",
    "પ્રતિભાવ": "Reactions",
    "ગમ્યું": "Like",
    "ન ગમ્યું": "Dislike",
    "શેર કરો": "Share",
    "લિંક કૉપી કરો": "Copy link",
    "લિંક કૉપી થઈ ✓": "Link copied ✓",
    "ગમ્યું / ન ગમ્યું માટે સાઇન ઇન કરો.": "Sign in to like or dislike.",
    "સાઇન ઇન કરો.": "Please sign in.",
    "હમણાં પ્રતિભાવ સાચવી શકાયો નથી. ફરી પ્રયાસ કરો.": "Couldn't save your reaction right now. Please try again.",

    // comments
    "ટિપ્પણીઓ": "Comments",
    "ટિપ્પણી લખવા માટે સાઇન ઇન કરો. વાંચવા માટે સાઇન ઇન જરૂરી નથી.": "Sign in to write a comment. You don't need to sign in to read.",
    "ટિપ્પણી લખવા માટે સાઇન ઇન કરો.": "Sign in to write a comment.",
    "ટિપ્પણી લખો": "Write a comment",
    "ટિપ્પણી લખો.": "Please write a comment.",
    "ટિપ્પણી મોકલો": "Post comment",
    "વધુ ટિપ્પણીઓ": "More comments",
    "કાઢી નાખો": "Delete",
    "હજી કોઈ ટિપ્પણી નથી. પહેલી ટિપ્પણી તમે લખો!": "No comments yet. Be the first to comment!",
    "ટિપ્પણીઓ લોડ થઈ શકી નથી.": "Could not load comments.",
    "થોડી સેકન્ડ પછી ફરી મોકલો.": "Please wait a few seconds before posting again.",
    "મોકલી રહ્યા છીએ…": "Posting…",
    "ટિપ્પણી પ્રકાશિત થઈ ✓": "Comment posted ✓",
    "ટિપ્પણી માટે સાઇન ઇન કરો.": "Please sign in to comment.",
    "હમણાં ટિપ્પણી મોકલી શકાઈ નથી. ફરી પ્રયાસ કરો.": "Couldn't post your comment right now. Please try again.",
    "આ ટિપ્પણી કાઢી નાખવી છે?": "Delete this comment?",
    "કાઢી શકાઈ નથી.": "Couldn't delete.",

    // sign-in popup
    "બંધ કરો": "Close",
    "ગમ્યું / ન ગમ્યું અને ટિપ્પણી માટે સાઇન ઇન જરૂરી છે.": "Signing in is required to like, dislike and comment.",
    "નવું ખાતું": "New account",
    "નવું ખાતું બનાવો": "Create a new account",
    "ખાતું બનાવો": "Create account",
    "તમારું નામ": "Your name",
    "ઇમેઇલ": "Email",
    "પાસવર્ડ": "Password",
    "બધી વિગતો ભરો.": "Please fill in all details.",
    "પાસવર્ડ ઓછામાં ઓછો 8 અક્ષરનો રાખો.": "Password must be at least 8 characters.",
    "ઇમેઇલ અથવા પાસવર્ડ ખોટો છે.": "Incorrect email or password.",
    "આ ઇમેઇલથી ખાતું પહેલેથી છે. સાઇન ઇન કરો.": "An account with this email already exists. Please sign in.",
    "ઘણા પ્રયાસો થયા. થોડી વાર પછી ફરી કરો.": "Too many attempts. Please try again after a while.",
    "કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.": "Something went wrong. Please try again."
};

// Sentences with numbers / names inside.
const PATTERNS = [
    [/^(\d+) અંકમાંથી (\d+) બતાવ્યા$/, "Showing $2 of $1 issues"],
    [/^(\d+) વીડિયો મળ્યા$/, "$1 videos found"],
    [/^(\d+) વીડિયો બતાવ્યા$/, "Showing $1 videos"],
    [/^(.+) તરીકે ટિપ્પણી$/, "Commenting as $1"]
];

function lookup(str) {
    const k = String(str ?? "").trim();
    if (!k) return null;
    if (EN[k]) return EN[k];
    for (const [re, out] of PATTERNS) if (re.test(k)) return k.replace(re, out);
    return null;
}

// For alert() / confirm() or any text built in JS.
export const t = (gu) => (isEnglish() ? (lookup(gu) ?? gu) : gu);

/* ---------------- applying it to the page ---------------- */

const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT"]);
const ATTRS = ["alt", "placeholder", "aria-label", "title"];

function fixText(node) {
    const v = node.nodeValue;
    if (!v || !v.trim()) return;
    const en = lookup(v);
    if (en == null) return;
    node.nodeValue = v.match(/^\s*/)[0] + en + v.match(/\s*$/)[0];
}

function fixAttrs(el) {
    for (const a of ATTRS) {
        if (!el.hasAttribute(a)) continue;
        const en = lookup(el.getAttribute(a));
        if (en != null) el.setAttribute(a, en);
    }
}

function walk(root) {
    if (root.nodeType === 3) { fixText(root); return; }
    if (root.nodeType !== 1 || SKIP.has(root.tagName)) return;
    fixAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.nodeType === 1 && SKIP.has(n.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
    });
    let n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) fixText(n); else fixAttrs(n); }
}

function translateHead() {
    const tt = lookup(document.title);
    if (tt) document.title = tt;
    document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach((m) => {
        const en = lookup(m.getAttribute("content"));
        if (en) m.setAttribute("content", en);
    });
}

function wireButton() {
    const menu = document.getElementById("langMenu");
    if (!menu) return;
    const btn = menu.querySelector("#langBtn");
    const list = menu.querySelector("#langList");
    const current = getLang();

    menu.querySelectorAll("[data-lang]").forEach((b) => {
        const on = b.dataset.lang === current;
        b.setAttribute("aria-checked", String(on));
        b.classList.toggle("on", on);
    });

    const close = () => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    const open = () => { list.hidden = false; btn.setAttribute("aria-expanded", "true"); };

    btn.addEventListener("click", (e) => { e.stopPropagation(); list.hidden ? open() : close(); });
    list.addEventListener("click", (e) => {
        const b = e.target.closest("[data-lang]");
        if (!b) return;
        if (b.dataset.lang === current) { close(); return; }   // already selected
        setLang(b.dataset.lang);                                // saves + reloads
    });
    document.addEventListener("click", (e) => { if (!menu.contains(e.target)) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

export function initI18n() {
    wireButton();
    if (!isEnglish()) return;                 // Gujarati = the pages as written
    document.documentElement.lang = "en";
    translateHead();
    walk(document.body);
    new MutationObserver((muts) => {
        for (const m of muts) {
            if (m.type === "characterData") fixText(m.target);
            else m.addedNodes.forEach(walk);
        }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
