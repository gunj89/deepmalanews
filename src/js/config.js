// One place for every Appwrite ID used by the site.
export const DATABASE_ID = "6a7e99e5002d9abd688b";

// Newspaper (existing)
export const NEWSPAPER_BUCKET_ID = "6a7e8bce001fa009b1b2";
export const NEWSPAPER_TABLE_ID = "newspapers";

// Articles (new tables in the SAME database)
export const ARTICLES_TABLE_ID = "articles";
export const REACTIONS_TABLE_ID = "article_reactions";
export const COMMENTS_TABLE_ID = "article_comments";

// Storage bucket for article images / videos
export const MEDIA_BUCKET_ID = import.meta.env.VITE_ARTICLE_BUCKET_ID || "article_media";

export const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
