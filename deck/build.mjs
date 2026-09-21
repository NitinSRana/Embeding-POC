import pptxgen from 'pptxgenjs'

// Palette taken from the product itself, so the deck and the live demo look like one thing.
const NAVY = '0B2545'
const NAVY_SOFT = '17375E'
const BLUE = '2A78D6'
const BLUE_TINT = 'EAF2FC'
const INK = '0E1726'
const BODY = '475467'
const MUTED = '6B7280'
const GREEN = '067647'
const GREEN_TINT = 'ECFDF3'
const RED = 'B42318'
const RED_TINT = 'FEF3F2'
const WHITE = 'FFFFFF'
const LINE = 'E4E7EC'

const HEAD = 'Cambria'
const SANS = 'Calibri'

const W = 13.33
const H = 7.5
const M = 0.7

const pres = new pptxgen()
pres.layout = 'LAYOUT_WIDE'
pres.author = 'Logic Bevers'
pres.company = 'DeepVue'
pres.title = 'DeepVue Embed POC — Findings'

// ---------- helpers (fresh option objects every call: pptxgenjs mutates them) ----------

const title = (s, text, opts = {}) =>
  s.addText(text, {
    x: M, y: 0.84, w: W - M * 2, h: 0.9,
    fontFace: HEAD, fontSize: 32, bold: true, color: opts.color ?? INK,
    align: 'left', isTextBox: true, margin: 0, ...opts,
  })

const kicker = (s, text, opts = {}) =>
  s.addText(text, {
    x: M, y: 0.52, w: W - M * 2, h: 0.28,
    fontFace: SANS, fontSize: 12, bold: true, color: opts.color ?? BLUE,
    charSpacing: 1.4, isTextBox: true, margin: 0, ...opts,
  })

const card = (s, { x, y, w, h, fill = WHITE, line = LINE }) =>
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: fill },
    line: { color: line, width: 1 },
  })

const badge = (s, { x, y, d = 0.42, fill, glyph, glyphColor = WHITE }) => {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill, width: 0 } })
  s.addText(glyph, {
    x, y, w: d, h: d, align: 'center', valign: 'middle',
    fontFace: SANS, fontSize: 15, bold: true, color: glyphColor, isTextBox: true, margin: 0,
  })
}

const foot = (s, text) =>
  s.addText(text, {
    x: M, y: H - 0.78, w: W - M * 2, h: 0.28,
    fontFace: SANS, fontSize: 10, color: MUTED, isTextBox: true, margin: 0,
  })

const darkSlide = () => {
  const s = pres.addSlide()
  s.background = { color: NAVY }
  return s
}

// ================= 1. Title =================
{
  const s = darkSlide()
  s.addShape(pres.ShapeType.ellipse, { x: 10.4, y: -1.5, w: 5.2, h: 5.2, fill: { color: NAVY_SOFT }, line: { width: 0 } })
  s.addShape(pres.ShapeType.ellipse, { x: 11.6, y: 4.6, w: 3.0, h: 3.0, fill: { color: NAVY_SOFT }, line: { width: 0 } })

  s.addText('PROOF OF CONCEPT · FINDINGS', {
    x: M, y: 2.25, w: 9, h: 0.35, fontFace: SANS, fontSize: 13, bold: true,
    color: '8FB8EA', charSpacing: 1.6, isTextBox: true, margin: 0,
  })
  s.addText('DeepVue Embed Infrastructure', {
    x: M, y: 2.7, w: 9.4, h: 1.5, fontFace: HEAD, fontSize: 44, bold: true,
    color: WHITE, isTextBox: true, margin: 0,
  })
  s.addText('Can a hosted tour live on a listing portal we don’t control — and can we switch it off?', {
    x: M, y: 4.25, w: 9.2, h: 0.9, fontFace: SANS, fontSize: 17,
    color: 'CADCFC', isTextBox: true, margin: 0,
  })
  s.addText('Logic Bevers  ·  September 2026', {
    x: M, y: 6.4, w: 8, h: 0.35, fontFace: SANS, fontSize: 12, color: '7F9BC4', isTextBox: true, margin: 0,
  })
  s.addNotes('Two-week POC. One question: does the embed mechanism actually work on portals we do not control. Answer is yes, and it changed two product decisions.')
}

// ================= 2. The verdict =================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  kicker(s, 'THE VERDICT')
  title(s, 'It works — and we know which method to build on')

  s.addText('The embed mechanism was demonstrated end to end on real third-party listings: uploaded, embedded, measured, and switched off remotely.', {
    x: M, y: 1.92, w: 11.9, h: 0.6, fontFace: SANS, fontSize: 15, color: BODY, isTextBox: true, margin: 0,
  })

  const stats = [
    ['5 / 5', 'Success criteria met', GREEN],
    ['3', 'Live platforms tested', BLUE],
    ['2', 'Findings that changed the product', NAVY],
  ]
  stats.forEach(([big, label, col], i) => {
    const x = M + i * 4.0
    card(s, { x, y: 2.68, w: 3.7, h: 1.7, fill: WHITE })
    s.addText(big, {
      x: x + 0.3, y: 2.88, w: 3.1, h: 0.75, fontFace: HEAD, fontSize: 40, bold: true, color: col, isTextBox: true, margin: 0,
    })
    s.addText(label, {
      x: x + 0.3, y: 3.68, w: 3.1, h: 0.55, fontFace: SANS, fontSize: 13, color: BODY, isTextBox: true, margin: 0,
    })
  })

  card(s, { x: M, y: 4.62, w: 11.9, h: 1.85, fill: BLUE_TINT, line: 'BCD7F5' })
  s.addText('The headline decision', {
    x: M + 0.45, y: 4.87, w: 10.9, h: 0.35, fontFace: SANS, fontSize: 12, bold: true, color: BLUE, charSpacing: 1.2, isTextBox: true, margin: 0,
  })
  s.addText('The direct link is the primary embed method — not the fallback. It worked on every platform tested, and it keeps hosting, expiry and billing under DeepVue’s control.', {
    x: M + 0.45, y: 5.27, w: 10.9, h: 1.0, fontFace: SANS, fontSize: 16, color: INK, isTextBox: true, margin: 0,
  })
  s.addNotes('Lead with this. Everything else supports it.')
}

// ================= 3. Success criteria =================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  kicker(s, 'AGAINST THE BRIEF')
  title(s, 'All five success criteria met')

  const rows = [
    ['Tour uploaded and embed generated in minutes', 'Upload, embed codes, live tour'],
    ['Renders correctly on desktop and mobile in a real listing', 'Live on DubaiSel and vivaUAE'],
    ['Expiry produces a clean renewal state on a live host page', 'Verified on DubaiSel'],
    ['Analytics arrive from a third-party page, source identified', 'Working — see finding 2'],
    ['Completed compatibility table', 'COMPAT.md, three platforms'],
  ]
  rows.forEach(([text, evidence], i) => {
    const y = 1.86 + i * 0.99
    card(s, { x: M, y, w: 11.9, h: 0.84, fill: WHITE })
    badge(s, { x: M + 0.3, y: y + 0.22, fill: GREEN, glyph: '✓' })
    s.addText(text, {
      x: M + 0.95, y: y + 0.13, w: 7.2, h: 0.32, fontFace: SANS, fontSize: 14, bold: true, color: INK, isTextBox: true, margin: 0,
    })
    s.addText(evidence, {
      x: M + 0.95, y: y + 0.46, w: 7.2, h: 0.3, fontFace: SANS, fontSize: 11.5, color: MUTED, isTextBox: true, margin: 0,
    })
    s.addText('MET', {
      x: M + 10.3, y: y + 0.28, w: 1.3, h: 0.32, fontFace: SANS, fontSize: 11, bold: true,
      color: GREEN, align: 'right', isTextBox: true, margin: 0,
    })
  })
  s.addNotes('Do not dwell. One line each, then move to the findings.')
}

// ================= 4. Finding 1 =================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  kicker(s, 'FINDING 1', { color: RED })
  title(s, 'The iframe never survives a description field')

  s.addText('Six attempts, three platforms, zero successes:', {
    x: M, y: 1.86, w: 6.4, h: 0.32, fontFace: SANS, fontSize: 14, color: BODY, isTextBox: true, margin: 0,
  })

  const attempts = [
    ['LinkedIn post', 'Rendered as plain text'],
    ['DubaiSel — visual editor', 'Escaped to visible text'],
    ['DubaiSel — raw HTML tab', 'Request rejected outright'],
    ['DubaiSel — bare URL', 'Not turned into a link'],
    ['DubaiSel — oEmbed', 'Not picked up'],
    ['vivaUAE — description', 'Silently stripped'],
  ]
  attempts.forEach(([platform, result], i) => {
    const y = 2.28 + i * 0.7
    card(s, { x: M, y, w: 6.3, h: 0.6, fill: RED_TINT, line: 'FBD5D2' })
    badge(s, { x: M + 0.22, y: y + 0.11, d: 0.36, fill: RED, glyph: '✕' })
    s.addText(platform, {
      x: M + 0.72, y: y + 0.06, w: 2.85, h: 0.48, fontFace: SANS, fontSize: 12, bold: true,
      color: INK, valign: 'middle', isTextBox: true, margin: 0,
    })
    s.addText(result, {
      x: M + 3.55, y: y + 0.06, w: 2.6, h: 0.48, fontFace: SANS, fontSize: 11.5,
      color: BODY, valign: 'middle', align: 'right', isTextBox: true, margin: 0,
    })
  })

  card(s, { x: 7.5, y: 2.28, w: 5.1, h: 2.2, fill: WHITE })
  s.addText('Not a DeepVue weakness', {
    x: 7.85, y: 2.52, w: 4.4, h: 0.35, fontFace: SANS, fontSize: 14, bold: true, color: INK, isTextBox: true, margin: 0,
  })
  s.addText('This is standard security hardening on anything a user can type into. It blocks Matterport and every other provider in exactly the same way.', {
    x: 7.85, y: 2.94, w: 4.4, h: 1.4, fontFace: SANS, fontSize: 13, color: BODY, isTextBox: true, margin: 0,
  })

  card(s, { x: 7.5, y: 4.68, w: 5.1, h: 1.9, fill: GREEN_TINT, line: 'BBE8CD' })
  badge(s, { x: 7.85, y: 4.95, fill: GREEN, glyph: '✓' })
  s.addText('The direct link worked everywhere', {
    x: 8.42, y: 4.98, w: 3.9, h: 0.38, fontFace: SANS, fontSize: 14, bold: true, color: INK, isTextBox: true, margin: 0,
  })
  s.addText('So it becomes the primary method. Inline display stays available on a portal’s own tour field, or a page the agent controls.', {
    x: 7.85, y: 5.5, w: 4.4, h: 0.98, fontFace: SANS, fontSize: 12.5, color: BODY, isTextBox: true, margin: 0,
  })
  s.addNotes('The point is not that something failed. The point is that the POC told us which method to build, before Phase 2 was estimated.')
}

// ================= 5. Finding 2 =================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  kicker(s, 'FINDING 2', { color: RED })
  title(s, 'Referrer-based attribution does not work')

  s.addText('Each platform broke it differently — and none of it is fixable from our side.', {
    x: M, y: 1.88, w: 11.9, h: 0.32, fontFace: SANS, fontSize: 15, color: BODY, isTextBox: true, margin: 0,
  })

  const breaks = [
    ['vivaUAE', 'Marks outbound links “no referrer” — nothing is sent at all'],
    ['LinkedIn', 'Rewrites links through its own shortener, with an interstitial'],
    ['Every browser', 'Sends the domain only — never the specific listing page'],
  ]
  breaks.forEach(([name, how], i) => {
    const x = M + i * 4.0
    card(s, { x, y: 2.34, w: 3.7, h: 1.85, fill: WHITE })
    badge(s, { x: x + 0.3, y: 2.59, d: 0.36, fill: RED, glyph: '✕' })
    s.addText(name, {
      x: x + 0.78, y: 2.6, w: 2.7, h: 0.35, fontFace: SANS, fontSize: 14, bold: true, color: INK, isTextBox: true, margin: 0,
    })
    s.addText(how, {
      x: x + 0.3, y: 3.12, w: 3.1, h: 1.0, fontFace: SANS, fontSize: 12.5, color: BODY, isTextBox: true, margin: 0,
    })
  })

  card(s, { x: M, y: 4.42, w: 11.9, h: 2.15, fill: BLUE_TINT, line: 'BCD7F5' })
  s.addText('Built in response — already shipped', {
    x: M + 0.45, y: 4.68, w: 10.9, h: 0.35, fontFace: SANS, fontSize: 12, bold: true, color: BLUE, charSpacing: 1.2, isTextBox: true, margin: 0,
  })
  s.addText('The embed link now carries its own source tag, recorded when the tour loads and trusted over the referrer. It survives referrer stripping, link shorteners and interstitials — all three failures above.', {
    x: M + 0.45, y: 5.08, w: 10.9, h: 0.85, fontFace: SANS, fontSize: 15, color: INK, isTextBox: true, margin: 0,
  })
  s.addText('Caveat for the main build: a tag is self-declared, so it is sound for reporting but must not be trusted for billing — that belongs with the click-fraud work already scoped out.', {
    x: M + 0.45, y: 5.94, w: 10.9, h: 0.5, fontFace: SANS, fontSize: 12, italic: true, color: BODY, isTextBox: true, margin: 0,
  })
  s.addNotes('The brief said this was worth knowing in week one rather than month three. It was exactly that.')
}

// ================= 6. What a visitor gets =================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  kicker(s, 'THE EXPERIENCE')
  title(s, 'One link, correct in both situations')

  const cols = [
    ['Inside a listing', 'The tour and nothing else — the listing page already supplies the price, beds and description.', BLUE],
    ['Clicked directly', 'A full property page: photos, address, price, key facts, write-up and amenities, DeepVue-branded.', NAVY],
  ]
  cols.forEach(([h1, body, col], i) => {
    const x = M + i * 6.1
    card(s, { x, y: 1.92, w: 5.8, h: 2.1, fill: WHITE })
    s.addText(h1, {
      x: x + 0.4, y: 2.2, w: 5.0, h: 0.4, fontFace: HEAD, fontSize: 19, bold: true, color: col, isTextBox: true, margin: 0,
    })
    s.addText(body, {
      x: x + 0.4, y: 2.7, w: 5.0, h: 1.15, fontFace: SANS, fontSize: 13.5, color: BODY, isTextBox: true, margin: 0,
    })
  })

  card(s, { x: M, y: 4.32, w: 11.9, h: 2.2, fill: NAVY, line: NAVY })
  s.addText('And when the subscription lapses', {
    x: M + 0.45, y: 4.58, w: 10.9, h: 0.35, fontFace: SANS, fontSize: 12, bold: true, color: '8FB8EA', charSpacing: 1.2, isTextBox: true, margin: 0,
  })
  s.addText('The same URL switches itself to a renewal prompt.', {
    x: M + 0.45, y: 4.98, w: 10.9, h: 0.46, fontFace: HEAD, fontSize: 22, bold: true, color: WHITE, isTextBox: true, margin: 0,
  })
  s.addText('Nobody touches the listing. The embed code on the portal never changes — DeepVue re-checks the subscription every time the tour loads. The hosting revenue model, visible in five seconds.', {
    x: M + 0.45, y: 5.52, w: 10.9, h: 0.8, fontFace: SANS, fontSize: 13.5, color: 'CADCFC', isTextBox: true, margin: 0,
  })
  s.addNotes('This is the live demo moment. Expire, refresh the portal page, renewal panel appears. Then renew and it comes back.')
}

// ================= 7. What was built =================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  kicker(s, 'DELIVERED')
  title(s, 'What was built')

  const items = [
    ['Upload → embed → measure', 'Tours, signed links, analytics with per-portal attribution', false],
    ['Expiry enforcement', 'Flip a live tour to a renewal prompt remotely, instantly', false],
    ['Three embed methods', 'iframe, direct link, and the JS widget deferred to Phase 2', true],
    ['oEmbed support', 'Lets platforms with an embed pipeline auto-embed a pasted link', true],
    ['Source tagging', 'The answer to finding 2 — attribution that survives portals', true],
    ['56 automated checks', 'One command, runnable against any environment', false],
  ]
  items.forEach(([h1, body, extra], i) => {
    const x = M + (i % 3) * 4.0
    const y = 1.92 + Math.floor(i / 3) * 2.3
    card(s, { x, y, w: 3.7, h: 2.0, fill: extra ? BLUE_TINT : WHITE, line: extra ? 'BCD7F5' : LINE })
    s.addText(h1, {
      x: x + 0.3, y: y + 0.28, w: 3.1, h: 0.6, fontFace: SANS, fontSize: 14.5, bold: true, color: INK, isTextBox: true, margin: 0,
    })
    s.addText(body, {
      x: x + 0.3, y: y + 0.92, w: 3.1, h: 0.95, fontFace: SANS, fontSize: 12.5, color: BODY, isTextBox: true, margin: 0,
    })
  })
  foot(s, 'Shaded cards were not in the original scope — the JS widget was deferred to Phase 2, and source tagging answers a problem the testing uncovered.')
  s.addNotes('Worth noting the widget was pulled forward from Phase 2 at no extra cost.')
}

// ================= 8. Open question =================
{
  const s = darkSlide()
  s.addShape(pres.ShapeType.ellipse, { x: 10.9, y: -1.2, w: 4.4, h: 4.4, fill: { color: NAVY_SOFT }, line: { width: 0 } })

  kicker(s, 'STILL OPEN', { color: '8FB8EA' })
  title(s, 'One question we could not answer', { color: WHITE })

  s.addText('Do Property Finder and Bayut accept an arbitrary provider’s link in their tour-URL field?', {
    x: M, y: 1.98, w: 9.6, h: 0.85, fontFace: SANS, fontSize: 19, color: 'CADCFC', isTextBox: true, margin: 0,
  })

  card(s, { x: M, y: 3.05, w: 11.9, h: 1.55, fill: NAVY_SOFT, line: '2C4C78' })
  s.addText('Why it matters', {
    x: M + 0.45, y: 3.28, w: 10.9, h: 0.32, fontFace: SANS, fontSize: 12, bold: true, color: '8FB8EA', charSpacing: 1.2, isTextBox: true, margin: 0,
  })
  s.addText('Their dedicated tour field is the one route that gives inline display and full commercial control — the portal builds the embed around our link. It is the best possible outcome for the product.', {
    x: M + 0.45, y: 3.65, w: 10.9, h: 0.85, fontFace: SANS, fontSize: 14, color: WHITE, isTextBox: true, margin: 0,
  })

  card(s, { x: M, y: 4.8, w: 11.9, h: 1.5, fill: '1F4D33', line: '2C6B47' })
  s.addText('It is an access problem, not a technical one', {
    x: M + 0.45, y: 5.05, w: 10.9, h: 0.38, fontFace: SANS, fontSize: 16, bold: true, color: 'A7F0C3', isTextBox: true, margin: 0,
  })
  s.addText('Both portals require a RERA-licensed agent account to create any listing. Twenty minutes with a broker’s login would settle it.', {
    x: M + 0.45, y: 5.5, w: 10.9, h: 0.7, fontFace: SANS, fontSize: 13.5, color: 'D6F5E3', isTextBox: true, margin: 0,
  })
  s.addNotes('This is the ask. Do not bury it — we need a broker relationship to close the last question.')
}

// ================= 9. Recommendation =================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  kicker(s, 'RECOMMENDATION')
  title(s, 'What this means for the main build')

  const steps = [
    ['Build the embed generator around the direct link', 'It is the method that works everywhere. Treat inline display as the upgrade path, not the default.'],
    ['Carry source tagging into the product', 'Referrer attribution cannot be relied on. Per-portal reporting needs tags generated per listing.'],
    ['Get agent access to Property Finder and Bayut', 'The last open question, and the one with the most commercial upside.'],
    ['Keep click-fraud out of scope until billing is designed', 'Tags and analytics events are both forgeable by design at this stage.'],
  ]
  steps.forEach(([h1, body], i) => {
    const y = 1.9 + i * 1.19
    card(s, { x: M, y, w: 11.9, h: 1.05, fill: WHITE })
    s.addShape(pres.ShapeType.ellipse, { x: M + 0.3, y: y + 0.3, w: 0.46, h: 0.46, fill: { color: BLUE }, line: { width: 0 } })
    s.addText(String(i + 1), {
      x: M + 0.3, y: y + 0.3, w: 0.46, h: 0.46, align: 'center', valign: 'middle',
      fontFace: SANS, fontSize: 15, bold: true, color: WHITE, isTextBox: true, margin: 0,
    })
    s.addText(h1, {
      x: M + 1.0, y: y + 0.2, w: 10.5, h: 0.34, fontFace: SANS, fontSize: 15, bold: true, color: INK, isTextBox: true, margin: 0,
    })
    s.addText(body, {
      x: M + 1.0, y: y + 0.56, w: 10.5, h: 0.34, fontFace: SANS, fontSize: 12.5, color: BODY, isTextBox: true, margin: 0,
    })
  })
  s.addNotes('Close on the ask in step 3.')
}

// ================= 10. Close =================
{
  const s = darkSlide()
  s.addShape(pres.ShapeType.ellipse, { x: -1.6, y: 4.2, w: 4.6, h: 4.6, fill: { color: NAVY_SOFT }, line: { width: 0 } })
  s.addShape(pres.ShapeType.ellipse, { x: 11.2, y: -1.0, w: 3.6, h: 3.6, fill: { color: NAVY_SOFT }, line: { width: 0 } })

  s.addText('Throwaway code, permanent answers', {
    x: M, y: 2.8, w: 11, h: 1.0, fontFace: HEAD, fontSize: 38, bold: true, color: WHITE, isTextBox: true, margin: 0,
  })
  s.addText('The mechanism is proven on real listings. The largest estimating unknown in Phase 2 — which embed methods portals actually accept — is now answered with evidence rather than assumption.', {
    x: M, y: 3.95, w: 10.4, h: 1.1, fontFace: SANS, fontSize: 16, color: 'CADCFC', isTextBox: true, margin: 0,
  })
  s.addText('Live demo  ·  pocembeding-five.vercel.app', {
    x: M, y: 5.5, w: 10, h: 0.4, fontFace: SANS, fontSize: 14, bold: true, color: '8FB8EA', isTextBox: true, margin: 0,
  })
  s.addNotes('Hand over to the live demo here.')
}

await pres.writeFile({ fileName: 'DeepVue-Embed-POC.pptx' })
console.log('written')
