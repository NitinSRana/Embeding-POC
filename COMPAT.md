# Third-party platform compatibility (Stage 4)

Live site: https://pocembeding-five.vercel.app · Verdicts: **Works** / **Works with limitations** / **Blocked** / *Pending*

| Platform | Method | Iframe accepted? | Tour URL field? | Link clickable? | Mobile | Referring site in analytics | URL rewritten? | Preview card | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn (company page post) | iframe | No: HTML shown as plain text | No | n/a | n/a | n/a | Yes: `src` link shortened to `lnkd.in` | n/a | **Blocked** | 2026-09-17. Posts don't render HTML. |
| LinkedIn (company page post) | Direct link | n/a | No | Yes, via `lnkd.in` (hover shows the full signed link) | *Pending* | **LinkedIn (lnkd.in)** — confirmed on desktop click-through | Yes: shown as an `lnkd.in` short link, with an "external link" interstitial on some paths; **token survives intact** (verified it opens the live tour) | **Yes** (when pasted first, before typing the post text): title, site name, cover photo from DeepVue's Blob store | **Works** | 2026-09-18. Desktop click-through confirmed end to end: post → lnkd.in redirect → tour opens → view recorded with referring site correctly labeled "LinkedIn (lnkd.in)" rather than a bare unrecognized domain. Remaining: mobile app click, expiry flip. |
| DubaiSel (free classifieds, "Property" category) | iframe, via Visual editor | No: `<iframe>` tag shown as visible plain text in the description, not rendered, not clickable | *Pending*: no dedicated tour/video field found — only the free-text description | No — iframe tag not auto-linkified | *Pending* | *Pending* | n/a (never left the page) | *Pending* | **Blocked** | 2026-09-19. No moderation queue (listing went live within minutes, no license/RERA required — lightweight email signup). Visual (WYSIWYG) editor escapes HTML tags to plain text on display. |
| DubaiSel (free classifieds, "Property" category) | iframe, via editor's raw Code tab | No — submitting raw `<iframe>` HTML through the Code tab makes the Update/Publish request fail: the page returns blank except for a bare GMT timestamp, consistent with a server-side security filter rejecting the request outright rather than sanitizing it. Reproduced on both an edit and a fresh listing. | n/a | n/a | n/a | n/a | n/a | n/a | **Blocked (hard)** | 2026-09-19. Stronger than the Visual-tab result — looks like an active WAF/security rule against HTML-tag-shaped input, not just display-side escaping. Stopped retrying to avoid tripping rate-limits or account flags. |
| DubaiSel (free classifieds, "Property" category) | Direct link, auto-linkify (bare URL, no tags) | n/a | No separate field found — description only | **No** — not auto-linkified; renders as plain gray text, not blue/underlined | n/a | n/a | n/a | n/a | **Blocked (this path only)** | 2026-09-19. Editor does not auto-detect bare URLs. Superseded by the row below — works fine via explicit hyperlinking instead. |
| DubaiSel (free classifieds, "Property" category) | Direct link, explicit hyperlink (select text → toolbar link icon → paste URL) | n/a | n/a | **Yes**, confirmed clickable, incognito-verified | *Pending: desktop only so far* | **dubaisel.com** — confirmed, exact real domain (2/2 views) | **No** — real URL used as-is, unshortened | n/a (not that kind of platform) | **Works** | 2026-09-19. Full end-to-end confirmed: incognito click → tour opens in DeepVue's viewer (leaves the listing page, as expected for the direct-link method) → Analytics shows `dubaisel.com` as referring site for both views, 100% attributed correctly. Remaining: mobile click. |
| DubaiSel (free classifieds, "Property" category) | Direct link, bare URL, oEmbed auto-embed | No — bare link stayed plain gray text, not embedded and not even linkified | n/a | No | n/a | n/a | n/a | n/a | **Superseded — see row below** | 2026-09-20. Built server-side oEmbed support after the iframe findings below (see app/api/oembed) specifically to test whether a WordPress-style embed pipeline would pick it up here. On the day, it didn't. Combined with the Code-tab request outright failing (row above) rather than being gracefully sanitized, this suggests the description field isn't running standard WordPress content filtering at all, so no embed mechanism applies regardless of method. Superseded by the row above — explicit hyperlinking is the one path that works. |
| DubaiSel (free classifieds, "Property" category) | Direct link, bare URL in Description, oEmbed auto-embed | **Yes — and it is the only method that puts the tour inline on this platform.** DubaiSel runs WordPress; pasting the bare tour URL into the description made it fetch `/api/oembed` and build its own `<iframe>`. Measured live on the published listing: **781×439**, tour rendering, all four photos present. | No separate field found — description only | n/a (the URL is consumed by the embed, so there is no visible link to click) | *Pending* | **None — no analytics at all from this embed** (see Notes) | No | n/a | **Works with limitations** | 2026-10-05. Directly contradicts the 2026-09-20 row above, which recorded the same method as not picked up; the earlier result was not reproducible and the cause of the difference was not established (WordPress caches oEmbed results per URL, so a failed early fetch may simply have been cached). **The limitation that matters:** WordPress wraps an untrusted provider as `<iframe sandbox="allow-scripts" security="restricted">`, which gives the frame an opaque origin — our React does not hydrate and no beacon fires, so sandboxed embeds render but report nothing. Verified by network capture: a normal load POSTs `/api/e` 204, the sandboxed load makes no such request. Navigation was rebuilt as JS-free per-slide anchors (commit e126bee) and the arrows, counter and dots were then confirmed working on this live listing — clicking advanced it to `2 / 4`. |
| vivaUAE (free classifieds, "Property for sale") | iframe, in Description | **No — silently stripped.** Saved with no error, but the tag is absent from the published page entirely: not rendered, and not even present as escaped text (verified in the DOM: no `<iframe`, no `&lt;iframe`). Worse for the poster than DubaiSel's visible-text escaping, because nothing signals that anything was dropped. | **Yes — a dedicated "Website" field**, separate from the description | n/a | *Pending* | n/a | n/a | n/a | **Blocked** | 2026-09-20. Description field sanitises HTML away rather than escaping it. |
| vivaUAE (free classifieds, "Property for sale") | Direct link, in the dedicated **Website** field | n/a | **Yes** — a real URL field, the closest analogue yet to Property Finder/Bayut's tour-URL field | **Yes**, confirmed clickable, opens the tour | *Pending: desktop only* | **No — "Direct / unknown".** vivaUAE renders the outbound link with `rel="noopener noreferrer nofollow"`, so the browser sends no referrer at all. Not a beacon failure: the view *is* recorded, it just arrives unattributable. | **No** — real URL used as-is, unshortened | n/a | **Works with limitations** | 2026-09-20. No moderation queue (live immediately) and lightweight signup, no phone needed. The link renders under the "Contact" heading rather than getting its own "Website:" label — cosmetic. Quirk: the site 403s automated/scripted requests but works normally in a real browser. A dedicated "Video / Link to YouTube" field also exists but is YouTube-only, so not applicable. **This row is what motivated source tagging** (`?s=vivauae`) — see the note below. |
| Homenly (free property listing) | iframe + direct link | *Pending*: listing submitted, awaiting manual moderation approval | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending — in moderation* | 2026-09-19. Unlike DubaiSel, Homenly holds new listings for manual review before publishing; requires phone number at signup (DubaiSel and vivaUAE do not). **Still "Pending" as of 2026-09-20, 24+ hours after submission** — moderation turnaround itself is a finding: a free site with a slow, human-reviewed queue isn't viable for a property owner who needs their listing (and tour link) live same-day. |

**DubaiSel: two methods work, for different jobs.** *Pasting* iframe HTML is blocked three ways (Visual-editor escaping, Code-tab hard rejection, bare-URL auto-linkify) and that still holds. But **oEmbed works**: paste the bare URL and WordPress builds the iframe itself, putting the tour inline on the listing at 781×439 — confirmed live on 2026-10-05, which reverses the 2026-09-20 result. The trade-off decides which to use: the oEmbed embed shows the tour in place but is sandboxed, so **it reports no analytics**; the explicit hyperlink leaves the page but is **fully attributed** (`dubaisel.com`, 2/2 views). Inline display or measurement — on this platform, not both.

---

## The three conclusions that matter for the main build

### 1. Pasted iframe HTML never survives. An iframe the platform builds for itself can.

No platform accepted iframe markup typed into a field — five attempts, zero successes:

| Attempt | Result |
|---|---|
| LinkedIn post | Shown as plain text — posts render no HTML, for any provider |
| DubaiSel, Visual editor | Escaped to visible text |
| DubaiSel, raw Code tab | Request hard-rejected server-side (WAF-shaped) |
| DubaiSel, bare URL auto-linkify | Not linkified |
| vivaUAE, Description | Silently stripped, no error |

This is not a DeepVue limitation — it's standard XSS hardening that applies to Matterport and every other provider equally.

**But hardening only governs what the poster types, not what the platform chooses to embed.** On 2026-10-05 a bare tour URL in a DubaiSel description was picked up by WordPress's oEmbed pipeline, which fetched `/api/oembed` and built its own iframe — the tour rendered inline at 781×439 on the live listing. That is the inline display the pasted iframe could never buy, obtained by asking the platform rather than instructing it. It carries one cost: WordPress sandboxes an untrusted provider (`sandbox="allow-scripts"`, opaque origin), so scripts do not run and **no analytics arrive from that embed**. Anything interactive therefore has to work without JavaScript — the viewer's navigation was rebuilt on per-slide anchors for exactly this reason, and verified on the live listing afterwards.

**The iframe is also viable where the poster controls the HTML** (their own site, a website builder's dedicated Embed/Custom-HTML widget) or where a portal wraps a whitelisted link in an iframe itself (Property Finder, Bayut, Zoopla, Rightmove — all still untested, blocked on agent access).

Product implication: **the direct link is the primary method, not the fallback.** The embed generator should lead with it. The scope doc anticipated exactly this ("If it establishes that they do not, the finding is equally valuable").

### 3. Inline display is still achievable — via a landing-page bridge (built and verified)

Losing the iframe means losing inline presentation, which is most of its appeal. There is a way to get it back today, with no portal cooperation: the agent embeds the tour on **their own site** (where they control the HTML, so the iframe works), and the portal listing links to that page rather than to the tour.

The non-obvious problem this creates — and the reason it needed building rather than just describing: with a bridge in the middle, `document.referrer` inside the iframe is the *agent's own site*, so every portal collapses into one bucket and per-portal reporting dies. The bridge page must forward its own `?s=` tag into the iframe `src`.

Verified end to end in `host-test` (`/agent-page`), a view arriving via `/agent-page?s=sampleportal` records as:

| Referring site | Referrer URL |
|---|---|
| `sampleportal (tagged)` | `http://localhost:4000/` |

The raw referrer names the agent's site; the tag correctly credits the portal. Untagged bridge visits fall back to referrer detection as before.

**The options, side by side:**

| Method | Inline? | Keeps hosting / expiry / analytics? | Per-portal attribution? | Status |
|---|---|---|---|---|
| Direct link | No — click-through | **Yes** | Yes, with `?s=` tag | **Proven** on 3 platforms |
| Landing-page bridge | **Yes** | **Yes** | Yes, via tag forwarding | **Proven** in host-test |
| Portal's own tour/360 field | **Yes** (portal builds the iframe) | **Yes** | Portal-side | **Untested** — blocked on agent access |
| Video (YouTube/Vimeo) | **Yes** | **No** — view happens on YouTube | No | Not pursued |
| iframe pasted into a description | No — stripped | n/a | n/a | **Blocked** everywhere tested |
| JS widget / oEmbed | No on UGC fields | Yes where they run | Yes | Built; neither fires on a sanitising field |

Bridge caveats worth stating to the client: it's two hops (some drop-off), it needs the agent to have an editable website, and the tag is set manually per portal link today. The best outcome remains the portal's own tour field — inline, no bridge, no extra hop — which is an access problem, not a technical one.

### 2. Referrer-based attribution is not reliable. This one needed a code change.

Every portal broke it differently:

| Platform | How the referrer is lost |
|---|---|
| vivaUAE | `rel="noopener noreferrer nofollow"` on outbound links — nothing sent |
| LinkedIn | rewrites to `lnkd.in` + interstitial; attributes to the shortener, not the post |
| All browsers | default policy sends origin only, never the listing page |

None are fixable from our side. Per-listing attribution via referrer is simply not achievable, and even per-*platform* attribution fails outright wherever `rel="noreferrer"` is used — which is common on classifieds sites.

**Response, built and deployed:** the embed link now carries its own source tag (`…/t/TOKEN?s=vivauae`), recorded server-side on load and preferred over the referrer in Analytics (shown as `<tag> (tagged)`). It survives referrer stripping, link shorteners and interstitials. Untagged links still fall back to referrer detection. See `lib/source.ts` and the source picker on the embed screen.

Caveat for the main build: a tag is self-declared and trivially forgeable, so it's good for reporting but must not be trusted for billing — that belongs with the click-fraud work already scoped out of this POC.
