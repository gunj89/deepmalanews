import { ID } from "appwrite";
import { account } from "./appwrite.js";

// Current user, or null when there is no session.
export async function currentUser() {
    try { return await account.get(); } catch { return null; }
}

// A "real" reader = signed in with an email account (anonymous sessions don't count).
export const isSignedIn = (u) => !!u && !!u.email;

// Returns the signed-in user or null. Never creates a session by itself.
export async function requireUser() {
    const u = await currentUser();
    return isSignedIn(u) ? u : null;
}

export async function signIn(email, password) {
    // an old anonymous session would block a new login -> drop it first
    const existing = await currentUser();
    if (existing && !existing.email) { try { await account.deleteSession({ sessionId: "current" }); } catch { /* ignore */ } }
    await account.createEmailPasswordSession({ email, password });
    return account.get();
}

export async function signUp(name, email, password) {
    await account.create({ userId: ID.unique(), email, password, name });
    return signIn(email, password);
}

export async function signOut() {
    try { await account.deleteSession({ sessionId: "current" }); } catch { /* already gone */ }
}

export const isAdmin = (u) => !!u && Array.isArray(u.labels) && u.labels.includes("admin");
