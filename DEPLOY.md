# Pre-deployment checklist

Goal: a public HTTPS copy of the POC that third-party platforms (LinkedIn, listing portals) can link to or embed.

Target setup: **Vercel** (app) · **Neon Postgres** via Vercel Marketplace (database) · **Vercel Blob** (photos, served from Vercel's CDN). All three have free tiers. Vercel Blob replaces the S3 + CloudFront from the scope doc; it still serves photos through a CDN, so the load test stays valid.

Owner key: **You** = needs your accounts, payment or DNS · **Claude** = code changes and testing.

---

## Phase 1: Accounts and decisions (You)

| # | Task | Steps | Output to give Claude |
|---|------|-------|------------------------|
| 1.1 | Pick a region | Choose one region close to the client's users and use it for the Vercel functions, Neon and Blob. Keeping them together keeps the tour fast. | Region name |
| 1.2 | GitHub repo | Create a **private** empty repo (for example `deepvue-embed-poc`). | Repo URL |
| 1.3 | Vercel plan | **Hobby is free but for non-commercial personal use only.** Vercel counts work done for a client, or by a paid consultant, as commercial, so this project needs **Pro**. Options: start the Pro trial for the POC, or use Hobby only for private internal testing and move to Pro before the client sees it. | Plan chosen |
| 1.4 | Postgres (Neon, free) | Vercel dashboard → **Storage** → Create → **Neon** → Free plan → pick region 1.1 → name it `deepvue-poc-db`. Connect it to the project in step 3.2. That adds `DATABASE_URL` to the project automatically. | Store name (no connection string) |
| 1.5 | Photo storage (Vercel Blob, free) | Vercel dashboard → **Storage** → Create → **Blob** → name `deepvue-poc-media` → access **Public** → region 1.1. Connect it to the project in step 3.2. That adds `BLOB_READ_WRITE_TOKEN` automatically. Hobby includes 1 GB of storage, 2,000 uploads and 10 GB of transfer a month. **Going over blocks Blob for 30 days instead of charging you.** | Store name (no token) |
| 1.6 | Domain (optional) | If you own `deepvue.app`, you'll add a DNS record for `poc.deepvue.app` in step 3.5. Otherwise use the free `*.vercel.app` URL. | Domain or "use vercel.app" |
| 1.7 | Access code | Pick a strong shared access code for the admin pages (not `deepvue`). | Keep it private; enter it in Vercel only |

---

## Phase 2: Code changes (Claude)

| # | Task | Why | Done when |
|---|------|-----|-----------|
| 2.1 | Upload photos straight to Vercel Blob | Browser gets a short-lived token from `/api/uploads` (access code required, JPG/PNG/WebP/GIF/AVIF only, 25 MB per photo), uploads to Blob, then `/api/tours` accepts only URLs that exist in **this** store. | Done |
| 2.2 | Keep local dev working | Blob when `BLOB_READ_WRITE_TOKEN` is set, local disk otherwise. | Done |
| 2.3 | Keep the embedded database out of Vercel | PGlite loaded only without `DATABASE_URL` and excluded from Vercel bundles; schema creation tolerates simultaneous cold starts. | Done |
| 2.4 | Keys pasted into Vercel | `
` typed as two characters is converted back to line breaks (covered by `npm run check`). | Done |
| 2.5 | Photo content types | Only raster types can be uploaded (enforced by the Blob token and re-checked on the server). | Done |
| 2.6 | Access code | Required on admin pages and upload/delete APIs. **On Vercel a missing `ACCESS_CODE` returns 503 instead of opening the admin.** | Done |
| 2.7 | Proxy body limit | Kept at 50 MB for local multipart uploads; on Vercel photos bypass the app, so it no longer matters there. | Done |
| 2.8 | Link previews | `og:title`, `og:description`, `og:image` (cover photo) on live tours; generic card for expired or invalid ones. | Done |
| 2.9 | Smoke test for production | Sends `ACCESS_CODE`, detects Blob mode, tests direct-to-Blob upload (12 MB) and the SVG block, and deletes its test tours at the end (`--keep` to skip). | Done |
| 2.10 | Delete tour | New **Delete tour** button and `DELETE /api/tours/<id>`: removes the tour, analytics and photos. | Done |
| 2.11 | Generate production signing keys | Run `npm run keys` and copy `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` into Vercel (never reuse local keys, never commit them). | **You**, at step 3.3 |
| 2.12 | Local run-through | `npm run check`, `npm run smoke` (37/37 open, 39/39 with access code), `next build`. **Not yet run: the Blob upload path**, which needs the Blob token; it gets tested in 4.1. | Done |

---

## Phase 3: Deploy (You + Claude)

| # | Task | Owner | Steps |
|---|------|-------|-------|
| 3.1 | Push code | Claude, then You | Claude commits. You add the GitHub remote, or give Claude the repo URL and approve the push. |
| 3.2 | Import project and connect storage | You | Vercel → Add New → Project → pick the repo. Framework: Next.js (auto-detected). Then Project → Settings → Functions → set region 1.1. Project → Storage → connect `deepvue-poc-db` and `deepvue-poc-media`. |
| 3.3 | Environment variables (Production) | You | Added by connecting the stores: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`. **If the Blob connection only adds `BLOB_STORE_ID`, copy the read-write token from the Blob store's settings into `BLOB_READ_WRITE_TOKEN`.** Add yourself: `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (from `npm run keys`), `ACCESS_CODE`, `PUBLIC_BASE_URL`. |
| 3.4 | First deploy | You | Click Deploy. Copy the URL (`https://<project>.vercel.app`), set it as `PUBLIC_BASE_URL`, then Redeploy. **Embed codes contain this URL, so set it before creating real tours.** |
| 3.5 | Custom domain (optional) | You | Vercel → Project → Domains → add `poc.deepvue.app` → create the DNS record it shows. Then update `PUBLIC_BASE_URL` and redeploy. |

---

## Phase 4: Post-deploy verification (Claude, You for devices)

| # | Check | How |
|---|-------|-----|
| 4.1 | Automated end-to-end | `ACCESS_CODE=… npm run smoke -- https://<url>` → all pass; its test tours are deleted automatically |
| 4.2 | Login | Admin pages prompt for the code. Viewer links open without it. |
| 4.3 | Real upload | Create a tour with 5+ real phone photos (20 MB+) and check they load from `*.public.blob.vercel-storage.com` |
| 4.4 | Embed on a third-party origin | Run the local demo portal (`npm run host`), paste the **live** iframe code and confirm it renders, counts views and shows the referring site |
| 4.5 | Expiry flip | Expire now → reload portal shows the renewal prompt → Renew → the tour comes back |
| 4.6 | Mobile | Open the direct link on a real phone (iOS Safari and Android Chrome): swipe, fullscreen, view counted as Mobile |
| 4.7 | Link preview | Check the direct link in LinkedIn Post Inspector (linkedin.com/post-inspector) without posting |
| 4.8 | Security headers | Viewer: `frame-ancestors *`. Admin: `frame-ancestors 'self'`. Photos: correct image content type. |
| 4.9 | Clean slate for the client | Use **Delete tour** on test tours and create the demo tour you'll present |

---

## Phase 5: Third-party platform testing (Stage 4 of the scope)

For each platform, create a trial listing or post and try **iframe**, **dedicated tour/video URL field** and **raw link in the description**. Record:

1. Does the editor accept an iframe?
2. Is there a dedicated virtual tour or video URL field?
3. Does a raw URL in the description stay clickable?
4. Does it work in the platform's mobile app or mobile web?
5. Does the referring site show up in DeepVue analytics?
6. Does the platform rewrite, proxy or clean up the URL (which could break the token)?
7. Link preview card: title / photo shown?

Verdict per method: **works** / **works with limitations** / **blocked**.

Starting list: LinkedIn (post, article, profile Featured), plus the client's target listing portals. **You to confirm the list.**

---

## Known limits carried into the deployed POC

- Anyone with a tour link can send fake analytics events. Fraud detection is out of scope.
- Unique viewers may overcount where third-party embeds block browser storage.
- The referring site is captured as a domain only (browser default), not the listing page.
- One database connection per server instance; fine for POC traffic.
- Photo URLs are public (random, unguessable names). Expiry hides the tour viewer, but someone who saved a direct photo URL can still open that photo.
