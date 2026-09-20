'use client'
import { useState } from 'react'
import CopyButton from './CopyButton'
import { slugSource, MAX_SOURCE } from '@/lib/source'

// Common destinations, plus whatever the user types. Tagging is what makes per-portal
// reporting work at all — portals strip the referrer (rel="noreferrer", link shorteners,
// interstitials), so without a tag every view lands in "Direct / unknown".
const SUGGESTIONS = ['propertyfinder', 'bayut', 'dubizzle', 'dubaisel', 'vivauae', 'linkedin', 'whatsapp', 'website']

export default function EmbedCodes({ link, widgetSrc }: { link: string; widgetSrc: string }) {
  const [source, setSource] = useState('')
  const tag = slugSource(source)
  // The direct link opens as a full page (title, description, branding); the iframe and widget
  // carry e=1 so the tour renders bare inside a listing that already provides that context.
  // The widget's fallback <a> is a real click-through, so it gets the page treatment too.
  const tagged = tag ? `${link}?s=${tag}` : link
  const embedSrc = `${link}?${tag ? `s=${tag}&` : ''}e=1`

  const iframe = `<iframe src="${embedSrc}"\n  width="100%" height="480" frameborder="0"\n  allowfullscreen loading="lazy"></iframe>`
  const widget = `<div class="deepvue-tour" data-src="${embedSrc}" style="width:100%;height:480px">\n  <a href="${tagged}" target="_blank" rel="noopener">View virtual tour</a>\n</div>\n<script src="${widgetSrc}" async></script>`

  return (
    <>
      <div className="card source-picker">
        <label htmlFor="source"><b>Where are you posting this?</b> <span className="muted small">Tags the link so views are attributed to that portal — portals often strip the referrer, and untagged views show as &ldquo;Direct / unknown&rdquo;.</span></label>
        <div className="source-row">
          <input
            id="source"
            className="input"
            value={source}
            maxLength={MAX_SOURCE}
            placeholder="e.g. propertyfinder"
            onChange={(e) => setSource(e.target.value)}
          />
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className={`pill pill-${tag === s ? 'accent' : 'neutral'} source-chip`} onClick={() => setSource(tag === s ? '' : s)}>{s}</button>
          ))}
        </div>
        <p className="note">{tag ? <>Tagged as <b>{tag}</b> — these views will show as &ldquo;{tag}&rdquo; in Analytics.</> : 'No tag — views will be attributed by referrer where the portal allows it.'}</p>
      </div>

      <div className="grid-third">
        <div className="card method">
          <div className="method-head"><h3>Option A · iframe</h3><span className="pill pill-accent">Recommended</span></div>
          <p>Shows the tour inline in the listing. Paste into any editor that accepts HTML.</p>
          <pre className="code">{iframe}<CopyButton text={iframe} label="Copy code" /></pre>
        </div>
        <div className="card method">
          <div className="method-head"><h3>Option B · Direct link</h3><span className="pill pill-neutral">Fallback</span></div>
          <p>For portals that block embeds. Paste into a virtual-tour field or the description. Still tracked and billable.</p>
          <pre className="code">{tagged}<CopyButton text={tagged} label="Copy link" /></pre>
        </div>
        <div className="card method">
          <div className="method-head"><h3>Option C · JS widget</h3><span className="pill pill-neutral">Advanced</span></div>
          <p>Loads only once scrolled into view — lighter on listing pages with many tours. Falls back to a plain link if JavaScript is blocked.</p>
          <pre className="code">{widget}<CopyButton text={widget} label="Copy code" /></pre>
        </div>
      </div>
    </>
  )
}
