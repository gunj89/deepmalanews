// Header Sign-in / Log-out button + the sign-in popup (used on every page).
import { currentUser, isSignedIn, isAdmin, signIn, signUp, signOut } from "./auth.js";
import { showNotice, confirmDialog } from "./dialog.js";
import { t } from "./i18n.js";

const T = {
    signin: "સાઇન ઇન", signout: "લોગ-આઉટ",
    needAll: "બધી વિગતો ભરો.", pwShort: "પાસવર્ડ ઓછામાં ઓછો 8 અક્ષરનો રાખો.",
    badLogin: "ઇમેઇલ અથવા પાસવર્ડ ખોટો છે.", exists: "આ ઇમેઇલથી ખાતું પહેલેથી છે. સાઇન ઇન કરો.",
    inDone: "તમે સફળતાપૂર્વક સાઇન ઇન થયા છો.", upDone: "તમારું ખાતું બન્યું છે અને તમે સાઇન ઇન થયા છો.",
    outDone: "તમે લોગ-આઉટ થઈ ગયા છો.", outAsk: "શું તમે લોગ-આઉટ કરવા માંગો છો?",
    ok: "ઓકે", confirm: "કન્ફર્મ", cancel: "રદ કરો",
    rate: "ઘણા પ્રયાસો થયા. થોડી વાર પછી ફરી કરો.", generic: "કંઈક ખોટું થયું. ફરી પ્રયાસ કરો."
};

let user = null;
let modal = null;
let resolveWaiter = null;

const listeners = new Set();
export const onAuthChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => { try { fn(user); } catch (e) { console.error(e); } });

export const getUser = () => user;

/* ---------- header button ---------- */

function paintButton() {
    const btn = document.getElementById("authBtn");
    if (!btn) return;
    const text = document.getElementById("authBtnText");
    const signed = isSignedIn(user);
    btn.dataset.state = signed ? "in" : "out";
    text.textContent = signed ? T.signout : T.signin;
    btn.title = signed ? (user.name || user.email) : "";
    btn.hidden = false;
    document.getElementById("authSkel")?.remove();

    // Admin shortcut: only visible to users carrying the "admin" label.
    const adminBtn = document.getElementById("adminBtn");
    if (adminBtn) {
        const show = signed && isAdmin(user);
        adminBtn.hidden = !show;
        adminBtn.parentElement.classList.toggle("has-admin", show);
    }
}

/* ---------- modal ---------- */

function buildModal() {
    const el = document.createElement("div");
    el.className = "auth-modal";
    el.hidden = true;
    el.innerHTML = `
    <div class="auth-backdrop" data-close></div>
    <div class="auth-card" role="dialog" aria-modal="true" aria-labelledby="authTitle">
        <button type="button" class="auth-x" data-close aria-label="બંધ કરો">×</button>
        <h2 id="authTitle">સાઇન ઇન</h2>
        <p class="auth-sub" id="authSub">ગમ્યું / ન ગમ્યું અને ટિપ્પણી માટે સાઇન ઇન જરૂરી છે.</p>
        <div class="auth-tabs" role="tablist">
            <button type="button" role="tab" data-mode="signin" aria-selected="true">સાઇન ઇન</button>
            <button type="button" role="tab" data-mode="signup" aria-selected="false">નવું ખાતું</button>
        </div>
        <form id="authForm" novalidate>
            <label data-only="signup" for="authName">તમારું નામ</label>
            <input data-only="signup" id="authName" name="name" maxlength="60" autocomplete="name">
            <label for="authEmail">ઇમેઇલ</label>
            <input id="authEmail" name="email" type="email" autocomplete="email" required>
            <label for="authPass">પાસવર્ડ</label>
            <input id="authPass" name="password" type="password" minlength="8" autocomplete="current-password" required>
            <button type="submit" class="btn btn-primary btn-block" id="authSubmit">સાઇન ઇન</button>
            <p class="form-msg" id="authMsg" role="status"></p>
        </form>
    </div>`;
    document.body.appendChild(el);

    let mode = "signin";
    const form = el.querySelector("#authForm");
    const msg = el.querySelector("#authMsg");

    const setMode = (m) => {
        mode = m;
        el.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === m)));
        el.querySelectorAll("[data-only=signup]").forEach((n) => { n.hidden = m !== "signup"; });
        el.querySelector("#authTitle").textContent = m === "signup" ? "નવું ખાતું બનાવો" : T.signin;
        el.querySelector("#authSubmit").textContent = m === "signup" ? "ખાતું બનાવો" : T.signin;
        form.elements.password.autocomplete = m === "signup" ? "new-password" : "current-password";
        msg.textContent = "";
    };
    setMode("signin");

    el.addEventListener("click", (e) => {
        if (e.target.closest("[data-close]")) closeModal(false);
        const tab = e.target.closest("[data-mode]");
        if (tab) setMode(tab.dataset.mode);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !el.hidden) closeModal(false); });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = form.elements.name.value.trim();
        const email = form.elements.email.value.trim();
        const password = form.elements.password.value;
        if (!email || !password || (mode === "signup" && !name)) { msg.textContent = T.needAll; return; }
        if (mode === "signup" && password.length < 8) { msg.textContent = T.pwShort; return; }

        const submit = el.querySelector("#authSubmit");
        submit.disabled = true;
        msg.textContent = "…";
        try {
            const wasSignup = mode === "signup";
            user = wasSignup ? await signUp(name, email, password) : await signIn(email, password);
            form.reset();
            paintButton();
            emit();
            closeModal(true);
            await showNotice(t(wasSignup ? T.upDone : T.inDone), t(T.ok));
            location.reload();
        } catch (err) {
            console.error(err);
            msg.textContent =
                err.code === 429 ? T.rate :
                err.code === 409 ? T.exists :
                err.code === 401 || err.code === 400 ? (mode === "signin" ? T.badLogin : (err.message || T.generic)) :
                T.generic;
        } finally {
            submit.disabled = false;
        }
    });
    return el;
}

function closeModal(ok) {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("auth-open");
    if (resolveWaiter) { resolveWaiter(ok ? user : null); resolveWaiter = null; }
}

// Opens the popup. Resolves with the user after sign-in, or null if closed.
export function openSignIn(message) {
    modal ||= buildModal();
    if (message) modal.querySelector("#authSub").textContent = message;
    modal.hidden = false;
    document.body.classList.add("auth-open");
    modal.querySelector(modal.querySelector('[data-mode="signup"]').getAttribute("aria-selected") === "true" ? "#authName" : "#authEmail").focus();
    return new Promise((res) => { resolveWaiter = res; });
}

// Resolves with a signed-in user (asking to sign in if needed) or null.
export async function ensureSignedIn(message) {
    if (isSignedIn(user)) return user;
    return openSignIn(message);
}

/* ---------- boot ---------- */

export async function initAuthUi() {
    const btn = document.getElementById("authBtn");
    if (!btn) return;                       // pages without a header (admin)
    btn.addEventListener("click", async () => {
        if (isSignedIn(user)) {
            const yes = await confirmDialog(t(T.outAsk), { confirm: t(T.confirm), cancel: t(T.cancel) });
            if (!yes) return;
            btn.disabled = true;
            await signOut();
            user = null;
            btn.disabled = false;
            paintButton();
            emit();
            await showNotice(t(T.outDone), t(T.ok));
            location.reload();
        } else {
            openSignIn();
        }
    });
    user = await currentUser();
    paintButton();
    emit();
}
