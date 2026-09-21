"""Geometry + text-fit QA for a generated deck.

Stands in for visual QA when no renderer (LibreOffice/PowerPoint) is available: it catches the
defect classes that actually bite — shapes off-slide, too-small margins, overlapping text frames,
and text that won't fit its box — by measuring the XML rather than eyeballing a picture.
"""
import sys
from pptx import Presentation
from pptx.util import Emu

EMU = 914400.0
# Rough average glyph width as a fraction of font size, for the fonts used here. Deliberately
# pessimistic so "fits" means fits.
AVG_CHAR_W = 0.50
LINE_H = 1.22

deck = sys.argv[1] if len(sys.argv) > 1 else "DeepVue-Embed-POC.pptx"
prs = Presentation(deck)
SW, SH = prs.slide_width / EMU, prs.slide_height / EMU
print(f"{deck}: {len(prs.slides.__iter__.__self__._sldIdLst)} slides, {SW:.2f}in x {SH:.2f}in\n")

MARGIN = 0.5
issues = []


def text_boxes(slide):
    out = []
    for sh in slide.shapes:
        if not sh.has_text_frame:
            continue
        t = sh.text_frame.text.strip()
        if not t:
            continue
        out.append((sh, t))
    return out


for idx, slide in enumerate(prs.slides, 1):
    for sh in slide.shapes:
        try:
            x, y = sh.left / EMU, sh.top / EMU
            w, h = sh.width / EMU, sh.height / EMU
        except TypeError:
            continue
        name = (sh.text_frame.text.strip()[:34] if sh.has_text_frame and sh.text_frame.text.strip() else sh.shape_type)

        # Off-slide / bleeding past the edge. Full-bleed decoration is intentional, so only
        # flag shapes that carry text.
        if sh.has_text_frame and sh.text_frame.text.strip():
            if x < MARGIN - 0.01 or y < MARGIN - 0.01 or x + w > SW - MARGIN + 0.01 or y + h > SH - MARGIN + 0.01:
                issues.append(f"slide {idx}: text outside {MARGIN}\" margin — '{name}' at "
                              f"({x:.2f},{y:.2f}) {w:.2f}x{h:.2f}")

        # Text fit: estimate wrapped line count against the box height.
        if sh.has_text_frame and sh.text_frame.text.strip():
            for para in sh.text_frame.paragraphs:
                runs = [r for r in para.runs if r.text.strip()]
                if not runs:
                    continue
                size = max((r.font.size.pt if r.font.size else 14) for r in runs)
                chars = sum(len(r.text) for r in para.runs)
                char_w_in = size * AVG_CHAR_W / 72.0
                per_line = max(1, int(w / char_w_in))
                lines = max(1, -(-chars // per_line))
                need = lines * size * LINE_H / 72.0
                if need > h + 0.06:
                    issues.append(f"slide {idx}: text may overflow — '{name}' needs ~{need:.2f}\" "
                                  f"in {h:.2f}\" box ({chars} chars @ {size:.0f}pt, w={w:.2f}\")")
                break  # first paragraph is representative for these layouts

    # Overlapping text frames
    tbs = text_boxes(slide)
    for i in range(len(tbs)):
        for j in range(i + 1, len(tbs)):
            a, ta = tbs[i]
            b, tb = tbs[j]
            ax, ay, aw, ah = a.left / EMU, a.top / EMU, a.width / EMU, a.height / EMU
            bx, by, bw, bh = b.left / EMU, b.top / EMU, b.width / EMU, b.height / EMU
            ox = min(ax + aw, bx + bw) - max(ax, bx)
            oy = min(ay + ah, by + bh) - max(ay, by)
            if ox > 0.05 and oy > 0.05:
                issues.append(f"slide {idx}: text frames overlap {ox:.2f}x{oy:.2f}\" — "
                              f"'{ta[:24]}' / '{tb[:24]}'")

if issues:
    print(f"{len(issues)} issue(s):\n")
    for i in issues:
        print("  " + i)
    sys.exit(1)
print("No geometry or text-fit issues found.")
