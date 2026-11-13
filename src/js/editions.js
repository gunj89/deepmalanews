import { Query } from "appwrite";
import { storage, tablesDB } from "./appwrite.js";
import { DATABASE_ID, NEWSPAPER_BUCKET_ID as BUCKET_ID, NEWSPAPER_TABLE_ID as TABLE_ID } from "./config.js";

export const viewUrl = (row) =>
    storage.getFileView({ bucketId: BUCKET_ID, fileId: row.fileId });

export const downloadUrl = (row) =>
    storage.getFileDownload({ bucketId: BUCKET_ID, fileId: row.fileId });

export function formatDate(iso, opts = { day: "numeric", month: "long", year: "numeric" }) {
    return new Date(iso).toLocaleDateString("en-IN", opts);
}

// Latest edition = highest edition DATE (same rule as the newspaper page).
export async function latestEdition() {
    return (await allEditions())[0] || null;
}

// Every edition, newest edition date first.
// Fetched in batches of 100 and filtered in the browser, so no
// extra database indexes are needed for year filtering.
let cache = null;
export const refreshEditions = () => { cache = null; };
export function allEditions() {
    cache ||= fetchAll().catch((e) => { cache = null; throw e; });
    return cache;
}

async function fetchAll() {
    const rows = [];
    let cursor = null;

    for (let i = 0; i < 20; i++) {
        const queries = [Query.orderDesc("$createdAt"), Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));

        const res = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: TABLE_ID,
            queries
        });

        rows.push(...res.rows);
        if (res.rows.length < 100) break;
        cursor = res.rows[res.rows.length - 1].$id;
    }

    return rows.sort((a, b) => new Date(b.editionDate) - new Date(a.editionDate));
}
