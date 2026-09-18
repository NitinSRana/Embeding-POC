# Third-party platform compatibility (Stage 4)

Live site: https://pocembeding-five.vercel.app · Verdicts: **Works** / **Works with limitations** / **Blocked** / *Pending*

| Platform | Method | Iframe accepted? | Tour URL field? | Link clickable? | Mobile | Referring site in analytics | URL rewritten? | Preview card | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn (company page post) | iframe | No: HTML shown as plain text | No | n/a | n/a | n/a | Yes: `src` link shortened to `lnkd.in` | n/a | **Blocked** | 2026-09-17. Posts don't render HTML. |
| LinkedIn (company page post) | Direct link | n/a | No | Yes, via `lnkd.in` (hover shows the full signed link) | *Pending* | **LinkedIn (lnkd.in)** — confirmed on desktop click-through | Yes: shown as an `lnkd.in` short link, with an "external link" interstitial on some paths; **token survives intact** (verified it opens the live tour) | **Yes** (when pasted first, before typing the post text): title, site name, cover photo from DeepVue's Blob store | **Works** | 2026-09-18. Desktop click-through confirmed end to end: post → lnkd.in redirect → tour opens → view recorded with referring site correctly labeled "LinkedIn (lnkd.in)" rather than a bare unrecognized domain. Remaining: mobile app click, expiry flip. |
