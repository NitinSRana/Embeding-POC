/*
 * DeepVue tour widget. Finds every <div class="deepvue-tour" data-src="...">,
 * lazily mounts a tour iframe once it's scrolled near the viewport, and leaves
 * whatever's inside the div (a plain link) as the fallback if JS never runs.
 * ES5 on purpose: this runs on host pages we don't control and can't assume support anything newer.
 */
;(function () {
  if (window.__deepvueWidget) return
  window.__deepvueWidget = true

  function mount(el) {
    var src = el.getAttribute('data-src')
    if (!src) return
    var iframe = document.createElement('iframe')
    iframe.src = src
    iframe.width = '100%'
    iframe.height = '100%'
    iframe.style.cssText = 'border:0;display:block'
    iframe.loading = 'lazy'
    iframe.allowFullscreen = true
    el.textContent = '' // drop the fallback link now that the real tour is mounting
    el.appendChild(iframe)
  }

  function scan() {
    var els = document.querySelectorAll('.deepvue-tour[data-src]')
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) mount(els[i])
      return
    }
    // ponytail: one scan on load, no MutationObserver for tours inserted later (e.g. infinite
    // scroll) — add one if a listing page starts lazy-inserting widgets after the initial load.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return
        io.unobserve(entry.target)
        mount(entry.target)
      })
    }, { rootMargin: '200px' })
    for (var j = 0; j < els.length; j++) io.observe(els[j])
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan)
  else scan()
})()
