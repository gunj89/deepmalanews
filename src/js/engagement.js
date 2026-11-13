// Likes / dislikes / comments. Counts come from Appwrite's `total`, so no
// counter columns can drift and no server function is needed.
import { Query, ID, Permission, Role } from "appwrite";
import { tablesDB } from "./appwrite.js";
import { requireUser, currentUser } from "./auth.js";
import { DATABASE_ID, REACTIONS_TABLE_ID as R, COMMENTS_TABLE_ID as C } from "./config.js";

const list = (tableId, queries) => tablesDB.listRows({ databaseId: DATABASE_ID, tableId, queries });

/* ---------- reactions ---------- */

async function count(articleId, type) {
    const res = await list(R, [Query.equal("articleId", [articleId]), Query.equal("type", [type]), Query.limit(1)]);
    return res.total;
}

export async function getCounts(articleId) {
    const [like, dislike] = await Promise.all([count(articleId, "like"), count(articleId, "dislike")]);
    return { like, dislike };
}

// The visitor's own reaction (null if none or no session yet).
export async function getMine(articleId) {
    const user = await currentUser();
    if (!user || !user.email) return null;
    const res = await list(R, [Query.equal("articleId", [articleId]), Query.equal("userId", [user.$id]), Query.limit(1)]);
    return res.rows[0] || null;
}

// Toggle: same button again removes it, other button switches it.
// Returns the visitor's reaction row after the change (or null).
export async function react(articleId, type, mine) {
    const user = await requireUser();
    if (!user) throw new Error("AUTH_REQUIRED");
    const row = (id) => ({ databaseId: DATABASE_ID, tableId: R, rowId: id });

    if (mine && mine.type === type) {
        await tablesDB.deleteRow(row(mine.$id));
        return null;
    }
    if (mine) {
        return tablesDB.updateRow({ ...row(mine.$id), data: { type } });
    }
    try {
        return await tablesDB.createRow({
            ...row(ID.unique()),
            data: { articleId, userId: user.$id, type },
            permissions: [Permission.update(Role.user(user.$id)), Permission.delete(Role.user(user.$id))]
        });
    } catch (e) {
        if (e.code !== 409) throw e;               // unique index: reaction already exists
        const existing = await getMine(articleId);
        return existing ? react(articleId, type, existing) : null;
    }
}

/* ---------- comments ---------- */

export function listComments(articleId, { cursor = null, limit = 20 } = {}) {
    const q = [Query.equal("articleId", [articleId]), Query.orderDesc("$createdAt"), Query.limit(limit)];
    if (cursor) q.push(Query.cursorAfter(cursor));
    return list(C, q);
}

export async function addComment(articleId, authorName, text) {
    const user = await requireUser();
    if (!user) throw new Error("AUTH_REQUIRED");
    return tablesDB.createRow({
        databaseId: DATABASE_ID, tableId: C, rowId: ID.unique(),
        data: { articleId, userId: user.$id, authorName, text },
        permissions: [Permission.update(Role.user(user.$id)), Permission.delete(Role.user(user.$id))]
    });
}

export const deleteComment = (id) =>
    tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: C, rowId: id });

// admin: latest comments across the site
export const listRecentComments = (limit = 50) => list(C, [Query.orderDesc("$createdAt"), Query.limit(limit)]);
