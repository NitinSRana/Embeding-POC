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
| DubaiSel (free classifieds, "Property" category) | Direct link, bare URL, oEmbed auto-embed | No — bare link stayed plain gray text, not embedded and not even linkified | n/a | No | n/a | n/a | n/a | n/a | **Blocked (this path only)** | 2026-09-20. Built server-side oEmbed support after the iframe findings below (see app/api/oembed) specifically to test whether a WordPress-style embed pipeline would pick it up here. It didn't. Combined with the Code-tab request outright failing (row above) rather than being gracefully sanitized, this suggests the description field isn't running standard WordPress content filtering at all, so no embed mechanism applies regardless of method. Superseded by the row above — explicit hyperlinking is the one path that works. |
| vivaUAE (free classifieds, "Property for sale") | iframe, in Description | **No — silently stripped.** Saved with no error, but the tag is absent from the published page entirely: not rendered, and not even present as escaped text (verified in the DOM: no `<iframe`, no `&lt;iframe`). Worse for the poster than DubaiSel's visible-text escaping, because nothing signals that anything was dropped. | **Yes — a dedicated "Website" field**, separate from the description | n/a | *Pending* | n/a | n/a | n/a | **Blocked** | 2026-09-20. Description field sanitises HTML away rather than escaping it. |
| vivaUAE (free classifieds, "Property for sale") | Direct link, in the dedicated **Website** field | n/a | **Yes** — a real URL field, the closest analogue yet to Property Finder/Bayut's tour-URL field | **Yes**, confirmed clickable, opens the tour | *Pending: desktop only* | **No — "Direct / unknown".** vivaUAE renders the outbound link with `rel="noopener noreferrer nofollow"`, so the browser sends no referrer at all. Not a beacon failure: the view *is* recorded, it just arrives unattributable. | **No** — real URL used as-is, unshortened | n/a | **Works with limitations** | 2026-09-20. No moderation queue (live immediately) and lightweight signup, no phone needed. The link renders under the "Contact" heading rather than getting its own "Website:" label — cosmetic. Quirk: the site 403s automated/scripted requests but works normally in a real browser. A dedicated "Video / Link to YouTube" field also exists but is YouTube-only, so not applicable. **This row is what motivated source tagging** (`?s=vivauae`) — see the note below. |
| Homenly (free property listing) | iframe + direct link | *Pending*: listing submitted, awaiting manual moderation approval | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending — in moderation* | 2026-09-19. Unlike DubaiSel, Homenly holds new listings for manual review before publishing; requires phone number at signup (DubaiSel and vivaUAE do not). **Still "Pending" as of 2026-09-20, 24+ hours after submission** — moderation turnaround itself is a finding: a free site with a slow, human-reviewed queue isn't viable for a property owner who needs their listing (and tour link) live same-day. |

**DubaiSel: fully closed out.** Iframe blocked four separate ways (Visual-editor escaping, Code-tab hard rejection, bare-URL auto-linkify, bare-URL oEmbed) — no embed mechanism works on this platform by any method. Direct link is the only path that works, and it's fully confirmed end to end (explicit hyperlink → click-through → correct referrer attribution). No further testing needed on DubaiSel.

---

## The two conclusions that matter for the main build

### 1. The iframe does not survive user-generated content fields. Anywhere.

Three platforms, six distinct attempts, zero successes:

| Attempt | Result |
|---|---|
| LinkedIn post | Shown as plain text — posts render no HTML, for any provider |
| DubaiSel, Visual editor | Escaped to visible text |
| DubaiSel, raw Code tab | Request hard-rejected server-side (WAF-shaped) |
| DubaiSel, bare URL auto-linkify | Not linkified |
| DubaiSel, bare URL via oEmbed | Not picked up |
| vivaUAE, Description | Silently stripped, no error |

This is not a DeepVue limitation — it's standard XSS hardening that applies to Matterport and every other provider equally. **The iframe is only viable where the poster controls the HTML** (their own site, a website builder's dedicated Embed/Custom-HTML widget) or where a portal wraps a whitelisted link in an iframe itself (Property Finder, Bayut, Zoopla, Rightmove — all still untested, blocked on agent access).

Product implication: **the direct link is the primary method, not the fallback.** The embed generator should lead with it. The scope doc anticipated exactly this ("If it establishes that they do not, the finding is equally valuable").

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
