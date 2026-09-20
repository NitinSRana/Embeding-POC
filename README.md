# DeepVue Embed POC

Throwaway proof of concept for the iframe and direct-link embed. Scope: `DeepVue_Embed_POC_Scoped.docx`.

## Run locally

```
npm install
npm run keys > .env.local    # once: ES256 key pair + ACCESS_CODE=deepvue
npm run dev                  # http://localhost:3000 (any username, password = ACCESS_CODE)
npm run check                # token checks: valid / expired / tampered
npm run smoke -- [baseUrl]   # ~37 HTTP end-to-end checks; set ACCESS_CODE=... if the site has one; cleans up after itself
```

Stand-in third-party portal on a different origin (pages: `/listing`, `/strict-csp`, `/no-referrer`, `/widget`, and `/agent-page` — the landing-page bridge):

```
npm run host -- "http://localhost:3000/t/<token>"   # http://localhost:4000/listing, /strict-csp, /no-referrer
```

Reset local data: delete `.pglite/` and `public/uploads/`.

## Pages

- `/`: upload form and list of tours
- `/tours/<id>`: iframe, direct link and JS widget snippets, Expire now / Renew, analytics
- `/t/<token>`: public viewer (gallery, expired panel or invalid-link panel)
- `/widget.js`: JS widget loader — lazy-mounts `.deepvue-tour[data-src]` embeds on scroll, falls back to a plain link if JS never runs
- `POST /api/e`: beacon collection endpoint
- `GET /api/oembed`: oEmbed endpoint so WordPress-style platforms can auto-embed a bare pasted link past a filter that would otherwise strip a manually typed `<iframe>`
- `POST /api/uploads`: short-lived Vercel Blob upload tokens (deployed)
- `DELETE /api/tours/<id>`: delete a tour, its analytics and photos

## Going to the cloud

- `DATABASE_URL` → managed Postgres (tables are created on first query).
- `PUBLIC_BASE_URL` → the deployed origin, e.g. `https://poc.deepvue.app`.
- S3/CloudFront: implement the S3 branch in `lib/storage.ts`. On Vercel, switch uploads to presigned PUTs, because function request bodies are capped at 4.5 MB.
- Real portals can't reach localhost. Deploy, or tunnel with `cloudflared tunnel --url http://localhost:3000`.
