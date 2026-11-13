// Site-themed replacements for alert() / confirm().
//   showNotice(message)            -> resolves when the user presses OK
//   confirmDialog(message, labels) -> resolves true (confirm) / false (cancel)
// Styling lives in ../css/dialog.css and uses the site's theme variables.
import "../css/dialog.css";

const HEADING = "NOTICE";

function open({ message, actions, onEscape, onBackdrop }) {
    return new Promise((resolve) => {
        const previous = document.activeElement;
        const el = document.createElement("div");
        el.className = "dm-dialog";
        el.innerHTML = `
        <div class="dm-dialog-backdrop"></div>
        <div class="dm-dialog-card" role="alertdialog" aria-modal="true" aria-labelledby="dmDialogTitle" aria-describedby="dmDialogMsg">
            <h2 id="dmDialogTitle">${HEADING}</h2>
            <p id="dmDialogMsg"></p>
            <div class="dm-dialog-actions"></div>
        </div>`;
        el.querySelector("#dmDialogMsg").textContent = message;     // textContent: never HTML
        const bar = el.querySelector(".dm-dialog-actions");

        const done = (value) => {
            document.removeEventListener("keydown", onKey, true);
            el.remove();
            if (!document.querySelector(".dm-dialog")) document.body.classList.remove("dm-dialog-open");
            previous?.focus?.();
            resolve(value);
        };

        const buttons = actions.map((a) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "dm-btn " + (a.primary ? "dm-btn-primary" : "dm-btn-ghost");
            b.textContent = a.label;
            b.addEventListener("click", () => done(a.value));
            bar.appendChild(b);
            return b;
        });

        function onKey(e) {
            if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done(onEscape); }
            else if (e.key === "Tab") {                              // keep focus inside the dialog
                const i = buttons.indexOf(document.activeElement);
                e.preventDefault();
                buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
            }
        }
        document.addEventListener("keydown", onKey, true);
        if (onBackdrop !== undefined) el.querySelector(".dm-dialog-backdrop").addEventListener("click", () => done(onBackdrop));

        document.body.appendChild(el);
        document.body.classList.add("dm-dialog-open");
        (buttons.find((b) => b.classList.contains("dm-btn-primary")) || buttons[0]).focus();
    });
}

export function showNotice(message, okLabel = "OK") {
    // Only the OK button (or Esc, which acts as OK) closes a notice.
    return open({ message, actions: [{ label: okLabel, value: true, primary: true }], onEscape: true });
}

export function confirmDialog(message, { confirm = "Confirm", cancel = "Cancel" } = {}) {
    return open({
        message,
        actions: [{ label: cancel, value: false }, { label: confirm, value: true, primary: true }],
        onEscape: false,
        onBackdrop: false
    });
}
