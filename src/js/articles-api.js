import { Query, ID, Permission, Role } from "appwrite";
import { tablesDB, storage } from "./appwrite.js";
import { getLang } from "./i18n.js";
import { DATABASE_ID, ARTICLES_TABLE_ID as T, MEDIA_BUCKET_ID } from "./config.js";

export const mediaUrl = (fileId) => storage.getFileView({ bucketId: MEDIA_BUCKET_ID, fileId });

export const articleHref = (row) => `/a/${row.$id}`;
export const articleDate = (row) => row.publishedAt || row.$createdAt;

export function formatDate(iso, withTime = false) {
    const opts = withTime
        ? { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }
        : { day: "numeric", month: "long", year: "numeric" };
    return new Date(iso).toLocaleString(getLang() === "en" ? "en-IN" : "gu-IN", opts);
}

/* ---------- public ---------- */

export async function listPublished({ cursor = null, limit = 12 } = {}) {
    const queries = [
        Query.equal("status", ["published"]),
        Query.orderDesc("publishedAt"),
        Query.limit(limit)
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    return tablesDB.listRows({ databaseId: DATABASE_ID, tableId: T, queries });
}

export const getArticle = (id) =>
    tablesDB.getRow({ databaseId: DATABASE_ID, tableId: T, rowId: id });

/* ---------- admin ---------- */

export async function listAll({ cursor = null, limit = 25 } = {}) {
    const queries = [Query.orderDesc("$updatedAt"), Query.limit(limit)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    return tablesDB.listRows({ databaseId: DATABASE_ID, tableId: T, queries });
}

// Published rows are readable by everyone; drafts only by admins (table-level label).
const permsFor = (status) => (status === "published" ? [Permission.read(Role.any())] : []);

export function saveArticle(existing, data) {
    const payload = { ...data };
    if (data.status === "published") payload.publishedAt = existing?.publishedAt || new Date().toISOString();
    const permissions = permsFor(data.status);
    return existing
        ? tablesDB.updateRow({ databaseId: DATABASE_ID, tableId: T, rowId: existing.$id, data: payload, permissions })
        : tablesDB.createRow({ databaseId: DATABASE_ID, tableId: T, rowId: ID.unique(), data: payload, permissions });
}

export const setStatus = (row, status) => saveArticle(row, { status });
