/* =====================================================================
   Seamless page-transition controller
   =====================================================================
   The overlay markup (.page-curtain-stage) is rendered directly in every
   HTML file, and a tiny primer script in <head> adds .pc-incoming to
   <html> BEFORE paint when the URL hash carries a transition flag.
   That guarantees the overlay is already opaque the moment the new page
   paints — no flash of content. This file only handles:
     1. Labels (which destination name to show)
     2. Outgoing: set hash, fade overlay in, navigate
     3. Incoming: populate label (already visible), hold, fade out
===================================================================== */

(function () {
  // Disable automatic scroll restoration + always start at top.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (window.scrollY !== 0) window.scrollTo(0, 0);

  const pages = {
    'index.html':        { section: 'I',   kicker: 'Frontispiece',         name: '<em>Mewni</em> Alahakoon',   meta: 'Academic portfolio' },
    '':                  { section: 'I',   kicker: 'Frontispiece',         name: '<em>Mewni</em> Alahakoon',   meta: 'Academic portfolio' },
    'about.html':        { section: 'II',  kicker: 'Biographical',         name: 'About the <em>researcher</em>', meta: 'A portrait in route-finding' },
    'research.html':     { section: 'III', kicker: 'Programme of inquiry', name: 'On <em>research</em>',       meta: 'Three areas · one thread' },
    'publications.html': { section: 'IV',  kicker: 'Peer-reviewed work',   name: 'The <em>record</em>',        meta: 'Bibliography · 2023 — 2026' },
    'cv.html':           { section: 'V',   kicker: 'A formal record',      name: 'Curriculum <em>vitae</em>',  meta: 'Last revised · Apr 2026' },
    'contact.html':      { section: 'VI',  kicker: 'Correspondence',       name: 'To <em>write</em>',          meta: 'Channels · PGP · mail' },
  };

  function pageKeyFromHref(href) {
    try {
      const u = new URL(href, window.location.href);
      const parts = u.pathname.split('/');
      return parts[parts.length - 1] || 'index.html';
    } catch (_) {
      return '';
    }
  }

  const stage = document.querySelector('.page-curtain-stage');
  if (!stage) return;

  const pcSection = stage.querySelector('.pc-section');
  const pcName    = stage.querySelector('.pc-name');
  const pcMeta    = stage.querySelector('.pc-meta');

  function fillLabel(key) {
    const p = pages[key] || pages['index.html'];
    pcSection.textContent = '§ ' + p.section + '  ·  ' + p.kicker;
    pcName.innerHTML = p.name;
    pcMeta.innerHTML = p.meta;
  }

  const html = document.documentElement;

  // --- INCOMING: the primer in <head> has already set .pc-incoming.
  if (html.classList.contains('pc-incoming')) {
    const incomingKey = window.__pcIncomingKey || '';
    fillLabel(incomingKey);
    // Clean the hash from the URL (no flicker, no scroll).
    try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (_) {}
    // Hold the label readable, then trigger the fade-out.
    setTimeout(function () {
      html.classList.remove('pc-incoming');
      html.classList.add('pc-fading');
      setTimeout(function () { html.classList.remove('pc-fading'); }, 650);
    }, 400);
  }

  // Enable smooth scroll after settle.
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { html.classList.add('ready'); });
  });

  // --- OUTGOING: intercept same-origin nav clicks.
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (href.startsWith('#')) return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
    } catch (_) { return; }

    e.preventDefault();
    const destKey = pageKeyFromHref(href);
    fillLabel(destKey);
    stage.classList.add('active');

    // Wait for the overlay to reach full opacity, THEN navigate with
    // the transition hash so the incoming page opens under an already-
    // opaque overlay.
    setTimeout(function () {
      // Strip any existing hash from href before appending ours.
      const cleanHref = href.split('#')[0];
      window.location.href = cleanHref + '#__pc=' + destKey;
    }, 480);
  });

  // --- In-view reveal for scroll-triggered fade-ups.
  function setupReveals() {
    const els = document.querySelectorAll('.in-view-anim');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function autoTagForReveal() {
    const selectors = [
      '.section > .wrap > *',
      '.news-feed > *',
      '.research-cards > *',
      '.stats-grid > *',
      '.area-block',
      '.pub',
      '.timeline-item',
      '.values-grid > *',
      '.skills-grid > *',
      '.contact-row',
      '.faq-item',
      '.collaborator',
      '.cta-inner > *',
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.classList.contains('reveal')) return;
        if (el.closest('.hero')) return;
        el.classList.add('in-view-anim');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      autoTagForReveal();
      setupReveals();
    });
  } else {
    autoTagForReveal();
    setupReveals();
  }

  window.addEventListener('pageshow', function () {
    stage.classList.remove('active');
    html.classList.remove('pc-incoming', 'pc-fading');
  });
})();
