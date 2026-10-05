# DeepVue Embed POC — what it established

Live: **https://pocembeding-five.vercel.app** · Code: this repo · Raw test data: [`COMPAT.md`](COMPAT.md)

The POC existed to answer one question the requirements couldn't: **can a property owner put a
hosted tour on a listing portal we don't control, keep serving it, measure it, and switch it off
when the subscription lapses?**

**Yes — and we now know exactly which method to build the product around.**

---

## The five success criteria

| # | Criterion | Result |
|---|---|---|
| 1 | Tour uploaded and embed generated in minutes | **Met** |
| 2 | Renders correctly, desktop and mobile, inside a real third-party listing | **Met** — live on DubaiSel and vivaUAE |
| 3 | Expiry produces a clean renewal state on a live host page | **Met** — verified on DubaiSel |
| 4 | Analytics arrive from a third-party page with the source identified | **Met** — with an important caveat (below) |
| 5 | Completed compatibility table | **Met** — `COMPAT.md` |

---

## The two findings that change the product

### 1. Pasted iframe HTML never survives. An iframe the portal builds for itself does.

Nothing we *typed* was ever accepted — five attempts, zero successes:

| Attempt | Result |
|---|---|
| LinkedIn post | Rendered as plain text |
| DubaiSel, visual editor | Escaped to visible text |
| DubaiSel, raw HTML tab | Request rejected outright |
| DubaiSel, bare URL | Not linkified |
| vivaUAE, description | Silently stripped |

This is standard security hardening on user-submitted content — it applies to Matterport and
every other provider equally, so it is not a DeepVue weakness.

**But it only governs what the poster types, not what the portal chooses to embed.** DubaiSel
runs WordPress. Pasting the bare tour URL into the description made it fetch our oEmbed
endpoint and build its own iframe: the tour now renders inline on the live listing at
781×439, all four photos, navigable. That is the inline display the pasted iframe could never
buy — obtained by asking the platform rather than instructing it, and it is why the POC
shipped oEmbed support.

It carries one real cost. WordPress wraps an untrusted provider in
`sandbox="allow-scripts"`, which gives the frame an opaque origin: our scripts don't run, so
**an oEmbed embed reports no analytics at all.** Confirmed by network capture — an ordinary
load posts its view, the sandboxed one makes no request. It also meant anything interactive
had to work without JavaScript, so the viewer's navigation was rebuilt on per-slide anchors
and re-verified on the live listing.

**So the choice is per-listing, and it is a real trade-off:**

| Method | Inline on the listing | Analytics | Use when |
|---|---|---|---|
| Bare URL → oEmbed | **Yes** | **None** | Presentation matters more than measurement |
| Explicit hyperlink | No — opens our page | **Full**, correctly attributed | Measurement matters, or billing depends on it |

The direct link remains the method to **build on**: it worked on every platform tested, and it
keeps hosting, expiry and billing under DeepVue's control. Inline display is a bonus where the
portal's own pipeline offers it.

### 2. Referrer-based attribution does not work. We had to replace it.

Each platform broke it differently, and none of it is fixable from our side:

| Platform | How the referrer is lost |
|---|---|
| vivaUAE | `rel="noreferrer"` on outbound links — nothing is sent |
| LinkedIn | Rewrites links through `lnkd.in` with an interstitial |
| All browsers | Send the domain only, never the specific listing page |

The scope document flagged this as worth knowing in week one rather than month three. It was.

**The replacement, built and shipped:** the embed link carries its own source tag
(`…/t/TOKEN?s=propertyfinder`), recorded when the tour loads and preferred over the referrer.
It survives referrer stripping, link shorteners and interstitials. There's a picker on the embed
screen; untagged links still fall back to referrer detection.

*Caveat for the main build:* a tag is self-declared and forgeable. Fine for reporting, not for
billing — that belongs with the click-fraud work already scoped out of this POC.

---

## What a visitor actually gets

The same signed link behaves correctly in both situations:

- **Inside a listing** (iframe) — just the tour, since the listing supplies the context.
- **Clicked directly** — a full property page: photos, address, price, beds/baths/size, the
  write-up and amenities, DeepVue-branded.

And in both, when the subscription lapses, the same URL switches itself to a renewal panel
without anyone touching the host page. That is the commercial model, working.

---

## How to demonstrate it (about four minutes)

1. **Upload** a property with photos and details → embed codes appear.
2. **Copy the direct link**, paste it into a listing on a portal (or the sample portal at
   `npm run host`). Show it clicking through to the full tour page.
3. **Open Analytics** — the view appears live, attributed to that portal.
4. **Click Expire now**, reload the listing → it shows the renewal prompt. *The listing was never
   touched.* This is the moment worth rehearsing.
5. **Click Renew** → the tour is back.

---

## Open questions

| Question | Status |
|---|---|
| Do Property Finder / Bayut accept an arbitrary provider's link in their tour-URL field? | **Untested — needs a RERA-licensed agent account.** The only remaining test that changes the answer, and it's an access problem, not a technical one. |
| Mobile portal apps | Desktop verified; app behaviour untested |
| Click-fraud resistance | Deliberately out of scope |

---

## What was built beyond the original scope

- **The JavaScript widget** (deferred to Phase 2 in the scope doc) — lazy-loads on scroll, falls
  back to a plain link without JavaScript.
- **oEmbed support** — lets platforms with an embed pipeline auto-embed a pasted link.
- **Source tagging** — the answer to finding 2.
- **A landing-page bridge** — inline display on any portal, with portal attribution preserved.
- **56 automated end-to-end checks** (`npm run smoke`), runnable against any environment.

---

## Honest limits

- Hosted on Vercel's free tier — fine for a demo, needs a paid plan before client-facing use.
- Analytics events can be forged by anyone holding a tour link.
- Unique-viewer counts may overcount where a portal blocks browser storage inside embeds.
- The code was written to be discarded once these questions were answered, as intended.
