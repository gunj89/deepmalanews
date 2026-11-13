# Articles feature — Appwrite setup (free tier, existing database)

You do NOT need a new database. Everything below goes inside your existing
database (ID `6a7e99e5002d9abd688b`). The code expects these exact IDs, so copy them.

| What | ID to use |
|---|---|
| Table 1 | `articles` |
| Table 2 | `article_reactions` |
| Table 3 | `article_comments` |
| Storage bucket (images/videos) | `article_media` |

Console: https://cloud.appwrite.io → your project.

---

## Step 1 — Auth (2 small things)

1. **Auth → Settings → Auth methods → turn ON "Anonymous".**
   (Readers get a silent anonymous session when they like/comment, so each like belongs to one visitor.)
2. **Auth → Users → click YOUR admin user → Labels → add `admin` → Update.**
   (Without this label the admin panel will refuse your login — that is intentional, so random visitors can never write articles.)

## Step 2 — Table `articles`

Databases → your database → **Create table** → Name `Articles`, **ID `articles`**.

**Columns**

| Key | Type | Size | Required |
|---|---|---|---|
| `title` | String | 255 | yes |
| `excerpt` | String | 600 | no |
| `content` | String — pick the biggest option (Longtext/Mediumtext). If you only see "String", size `500000` | | yes |
| `coverImageId` | String | 64 | no |
| `author` | String | 100 | no |
| `status` | Enum — elements: `draft`, `published` | | yes |
| `publishedAt` | Datetime | | no |

**Indexes** (Indexes tab)

| Key | Type | Columns |
|---|---|---|
| `idx_status` | Key | `status` |
| `idx_published` | Key | `publishedAt` |

**Settings tab → Permissions**
- **Add role → Label → `admin`** → tick **Create, Read, Update, Delete**.
- Do NOT add "Any" here (drafts must stay private).
- Turn **Row security ON**. (Published articles get `read(any)` per row automatically from the site code.)

## Step 3 — Table `article_reactions` (likes / dislikes)

**Create table** → Name `Article reactions`, **ID `article_reactions`**.

| Key | Type | Size | Required |
|---|---|---|---|
| `articleId` | String | 36 | yes |
| `userId` | String | 36 | yes |
| `type` | Enum — `like`, `dislike` | | yes |

**Indexes**

| Key | Type | Columns |
|---|---|---|
| `idx_article_type` | Key | `articleId`, `type` |
| `uniq_article_user` | **Unique** | `articleId`, `userId` |

**Permissions:** 
- Role **Any** → **Read**
- Role **Users** → **Create**
- Role **Label `admin`** → **Delete**
- **Row security ON** (so each visitor can change/remove only their own reaction).

## Step 4 — Table `article_comments`

**Create table** → Name `Article comments`, **ID `article_comments`**.

| Key | Type | Size | Required |
|---|---|---|---|
| `articleId` | String | 36 | yes |
| `userId` | String | 36 | yes |
| `authorName` | String | 60 | yes |
| `text` | String | 1000 | yes |

**Indexes**

| Key | Type | Columns |
|---|---|---|
| `idx_article` | Key | `articleId` |

**Permissions:**
- Role **Any** → **Read**
- Role **Users** → **Create**
- Role **Label `admin`** → **Update, Delete** (moderation)
- **Row security ON** (visitor can delete their own comment).

## Step 5 — Storage bucket for article images/videos

Storage → **Create bucket** → Name `Article media`, **ID `article_media`**.

Settings:
- Permissions: **Any → Read**; **Label `admin` → Create, Update, Delete**
- **File security: OFF**
- Maximum file size: `50 MB` (free-tier max)
- Allowed extensions: `jpg, jpeg, png, webp, gif, mp4, webm`
- Compression: None (or Gzip) — Encryption/Antivirus: your choice

> Prefer not to create a bucket? Put your existing newspaper bucket ID in
> `VITE_ARTICLE_BUCKET_ID` and add the extensions above + `Label admin → Create` to that bucket.
> A separate bucket is cleaner, so I recommend it.

## Step 6 — Deploy

1. Replace your project files with this folder, run `npm install` (nothing new to install).
2. Env vars stay the same (`VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_YOUTUBE_API_KEY`) — see `.env.example`.
   The Vercel function `api/article.js` reuses the same two Appwrite variables.
3. Push to GitHub → Vercel redeploys. `vercel.json` makes `/a/<id>` links work and gives WhatsApp/Facebook a proper preview (title + cover image).
4. Local testing: `npm run dev`.

## Step 7 — Test checklist (2 minutes)

1. Open `/admin.html` → log in → **Articles → New article** → write, add cover, add an image, a YouTube link → **Publish**.
2. Open `/articles.html` → your article is listed → open it.
3. Like, dislike, post a comment, hit Share.
4. Admin → **Comments** tab → delete the test comment.
5. Save an article as **Draft** → confirm it does NOT show on `/articles.html` while logged out.

## Recommended hardening (optional, 2 minutes)

- Table `newspapers` and the newspaper bucket: set Create/Update/Delete to **Label `admin`** only (not "Users"),
  because anonymous visitor sessions now exist.
- Google Cloud → your YouTube API key → restrict to HTTP referrer `deepmala-news.vercel.app/*`.
- Appwrite project → Platforms: make sure `deepmala-news.vercel.app` (and `localhost` for dev) are added as Web platforms.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Admin login says "not an admin" | Step 1.2 — add label `admin` to the user |
| "Anonymous"/401 when liking or commenting | Step 1.1 — enable Anonymous auth |
| Publish fails with "not authorized" | Step 2 — label `admin` needs Create/Update on table `articles` + Row security ON |
| Article list empty for visitors but admin sees it | Row security must be ON; re-publish the article |
| Image upload fails | Step 5 — bucket permissions / allowed extensions / file size |
| "Index not found" error | Re-check the indexes in Steps 2–4 |


---

## Sign-in required for like / dislike / comment (new)

Everyone can still READ articles and see all likes and comments without logging in.
Only like, dislike and comment need an account (email + password, created from the site's
**Sign in** button in the header, which becomes **Log-out** when signed in).

Appwrite Console changes (2 minutes):

1. **Auth → Settings → Auth methods:** make sure **Email/Password** is ON.
2. **Auth → Settings → Auth methods → Anonymous: turn OFF.**
   (The site no longer creates anonymous sessions. Turning it off also stops anyone from
   bypassing the sign-in by calling the API directly as an anonymous user.)
3. Optional: Auth → Security → set a **Password dictionary / minimum length** and session limits.
4. Appwrite → Platforms: your site domain (and `localhost`) must be added as Web platforms
   (already needed before).

Table permissions stay the same (`Users → Create`, `Any → Read`). With anonymous login off,
"Users" now means real signed-in readers only.
