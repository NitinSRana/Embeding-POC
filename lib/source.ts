// A "source" tag identifies which portal an embed was posted on, carried in the embed link
// itself (…/t/TOKEN?s=vivauae) rather than inferred from the HTTP referrer.
//
// Why: referrer-based attribution fails in practice on real portals. Confirmed in testing —
// vivaUAE renders outbound links with rel="noreferrer" (no referrer sent at all), LinkedIn
// rewrites links through lnkd.in with an interstitial, and browsers send origin-only
// referrers by default, never the specific listing page. A tag in the link survives all of it.
//
// Shared by the client (building links) and the server (storing events), so no server-only deps.
export const MAX_SOURCE = 32

export const slugSource = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, MAX_SOURCE)
