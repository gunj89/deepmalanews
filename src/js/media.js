import { ID } from "appwrite";
import { storage } from "./appwrite.js";
import { MEDIA_BUCKET_ID } from "./config.js";
import { mediaUrl } from "./articles-api.js";

const MAX_BYTES = 50 * 1024 * 1024;   // Appwrite free-tier file limit

// Shrink big photos before upload (saves free-tier storage + bandwidth).
export async function compressImage(file, maxSide = 1600) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;   // gif/svg stay untouched
    try {
        const bmp = await createImageBitmap(file);
        const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
        const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(bmp, 0, 0, w, h);
        const blob = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.85));
        if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
    } catch { return file; }
}

// Uploads to the article bucket and returns { fileId, url }.
export async function uploadMedia(file) {
    if (file.size > MAX_BYTES) throw new Error("File is larger than 50 MB.");
    const f = file.type.startsWith("image/") ? await compressImage(file) : file;
    const up = await storage.createFile({ bucketId: MEDIA_BUCKET_ID, fileId: ID.unique(), file: f });
    return { fileId: up.$id, url: mediaUrl(up.$id) };
}
