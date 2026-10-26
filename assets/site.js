/* Shared helpers for every page: data access, citation and link-icon markup, header nav, footer.
   All facts come from window.CCEL (_shared/content.js). */
(function () {
  'use strict';
  var D = window.CCEL || {};
  var SHARED = '_shared/';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // title / authors / summaries carry only <sub>, <sup>: escape everything, then re-allow those two
  function rich(s) { return esc(s).replace(/&lt;(\/?)(sub|sup)&gt;/g, '<$1$2>'); }
  function strip(s) { return String(s || '').replace(/<[^>]+>/g, ''); }
  function asset(p) { return p ? SHARED + p : ''; }
  function https(u) { return String(u).replace(/^http:\/\//i, 'https://'); }
  function linkHref(u) { return /^https?:\/\//i.test(u) ? https(u) : SHARED + u; }

  var pubs = D.publications || [];
  var byNo = {};
  pubs.forEach(function (p) { byNo[p.no] = p; });
  var areas = (D.research && D.research.areas) || [];
  var areaBy = {};
  areas.forEach(function (a) { areaBy[a.numeral] = a; });

  function pubHref(p) { return p.doi ? 'https://doi.org/' + p.doi : (p.url ? https(p.url) : null); }

  // "Journal vol (year) pages" = citation_tail minus the author list and the "(IF=...)" suffix
  function source(p) {
    var t = p.citation_tail || '', a = strip(p.authors);
    if (a && t.indexOf(a) === 0) t = t.slice(a.length).replace(/^\s*,\s*/, '');
    return t.replace(/\s*\(IF\s*=?[^)]*\)\s*\.?\s*$/i, '').replace(/\.\s*$/, '');
  }

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function authors(p) {
    var h = rich(p.authors), names = (p.ccel_authors || []).filter(Boolean).map(esc)
      .sort(function (x, y) { return y.length - x.length; });
    if (!names.length) return h;
    return h.replace(new RegExp('(' + names.map(escRe).join('|') + ')', 'g'), '<b>$1</b>');
  }

  // a cover belongs to a paper only when DOI or URL match (never by index)
  function normUrl(u) { return String(u || '').toLowerCase().replace(/^https?:\/\//, '').replace(/[#?].*$/, '').replace(/\/+$/, ''); }
  function coverFor(p, kinds) {
    var covers = D.cover_publications || [], doi = (p.doi || '').toLowerCase(), url = normUrl(p.url);
    for (var i = 0; i < covers.length; i++) {
      var c = covers[i];
      if (kinds && kinds.indexOf(c.kind) < 0) continue;
      var cu = normUrl(c.url);
      if ((doi && c.doi && c.doi.toLowerCase() === doi) || (doi && cu.indexOf(doi) >= 0) || (url && cu && cu === url)) return c;
    }
    return null;
  }
  function paperForCover(c) {
    var cd = (c.doi || '').toLowerCase(), cu = normUrl(c.url);
    for (var i = 0; i < pubs.length; i++) {
      var p = pubs[i], doi = (p.doi || '').toLowerCase();
      if ((cd && doi === cd) || (doi && cu.indexOf(doi) >= 0) || (p.url && cu && normUrl(p.url) === cu)) return p;
    }
    return null;
  }

  function impact(p) {
    if (p.impact_factor == null) return '';
    if (p.if_provisional === true) {
      return '<span class="if is-prov" title="Provisional: the publication-year JCR value is not out yet">IF ' +
        esc(p.impact_factor) + ' (provisional)</span>';
    }
    return '<span class="if">IF ' + esc(p.impact_factor) + '</span>';
  }

  // full citation card; opts: {thumb: true, area: true}
  function cite(p, opts) {
    opts = opts || {};
    var href = pubHref(p), cover = opts.thumb ? coverFor(p, ['front']) : null, a = areaBy[p.area];
    var title = href ? '<a href="' + esc(href) + '" rel="noopener">' + rich(p.title) + '</a>' : rich(p.title);
    var thumb = '';
    if (opts.thumb) {
      thumb = cover
        ? '<a class="cite-thumb" href="' + esc(https(cover.url)) + '" rel="noopener"><img src="' + esc(asset(cover.image)) +
          '" alt="Journal cover for: ' + esc(strip(p.title)) + '" loading="lazy" decoding="async" width="84" height="112"></a>'
        : '<div class="cite-tile" aria-hidden="true">' + esc(p.area || '–') + '</div>';
    }
    var meta = [];
    var src = source(p), ifs = impact(p);
    // non-published status as a badge, unless the citation line already says it ("submitted (2026)")
    if (p.status && p.status !== 'published' && src.toLowerCase().indexOf(p.status) < 0) meta.push('<span class="badge st">' + esc(p.status) + '</span>');
    if (p.highlight) meta.push('<span class="badge hl">' + esc(p.highlight) + '</span>');
    if (!opts.thumb && coverFor(p)) meta.push('<span class="badge cov">Journal cover</span>');
    if (p.doi) meta.push('<a class="doi" href="https://doi.org/' + esc(p.doi) + '" rel="noopener">doi:' + esc(p.doi) + '</a>');
    else if (href) meta.push('<a class="doi" href="' + esc(href) + '" rel="noopener">Publisher page</a>');
    return '<article class="cite">' + thumb + '<div class="cite-body">' +
      (opts.area && a ? '<p class="cite-area">Area ' + esc(a.numeral) + ' · ' + rich(a.title) + '</p>' : '') +
      '<h3 class="cite-title">' + title + '</h3>' +
      '<p class="cite-authors">' + authors(p) + '</p>' +
      '<p class="cite-src">' + esc(src) + (src && ifs ? ' · ' : '') + ifs + '</p>' +
      (meta.length ? '<div class="cite-meta">' + meta.join('') + '</div>' : '') +
      '</div></article>';
  }

  // personal links as small inline-SVG icons; only links that are set are rendered (none -> no row at all)
  var FILL = ' fill="currentColor"', LINE = ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var LINKS = [
    ['github', 'GitHub', '0 0 16 16', '<path' + FILL + ' d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>'],
    ['linkedin', 'LinkedIn', '0 0 24 24', '<path' + FILL + ' d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/>'],
    ['cv', 'CV', '0 0 24 24', '<path' + LINE + ' d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path' + LINE + ' d="M14 3v5h5M9 13h6M9 17h6"/>'],
    ['scholar', 'Google Scholar', '0 0 24 24', '<path' + FILL + ' d="M5.24 13.77 0 9.5 12 0l12 9.5-5.24 4.27C17.55 11.25 14.98 9.5 12 9.5s-5.55 1.75-6.76 4.27zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>'],
    ['homepage', 'Homepage', '0 0 24 24', '<circle' + LINE + ' cx="12" cy="12" r="9"/><path' + LINE + ' d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>']
  ];
  function icon(kind) {
    var l = LINKS.filter(function (x) { return x[0] === kind; })[0];
    return l ? '<svg viewBox="' + l[2] + '" aria-hidden="true" focusable="false">' + l[3] + '</svg>' : '';
  }
  function links(set, name) {
    set = set || {};
    var items = LINKS.filter(function (l) { return set[l[0]]; }).map(function (l) {
      var label = esc(name) + ' — ' + l[1];
      return '<li><a href="' + esc(linkHref(set[l[0]])) + '" target="_blank" rel="noopener" aria-label="' + label + '" title="' + label + '">' +
        icon(l[0]) + '</a></li>';
    });
    return items.length ? '<ul class="links">' + items.join('') + '</ul>' : '';
  }

  function published() { return pubs.filter(function (p) { return p.status === 'published'; }); }
  function memberCount() {
    return (D.members || []).reduce(function (n, g) { return n + (g.people || []).length; }, 0);
  }
  function alumniCount() {
    return (D.alumni || []).reduce(function (n, g) { return n + (g.people || []).length; }, 0);
  }
  function curated() {
    var c = D.curation || {};
    return {
      pins: (c.selected_pins || []).map(function (s) { return byNo[s.no] ? { p: byNo[s.no], area: s.area } : null; }).filter(Boolean),
      highlights: (c.recent_highlights || []).map(function (n) { return byNo[n]; }).filter(Boolean),
      rules: c.rules || '', updated: c.updated_at || ''
    };
  }
  // research.areas[].summary repeats "I. <title>" in front of the text; show the summary without it
  function areaSummary(a) {
    var s = a.summary || '', pre = a.numeral + '. ' + a.title;
    return s.indexOf(pre) === 0 ? s.slice(pre.length).trim() : s;
  }

  // ---- header: logo from data, mobile menu, current page ----
  function header() {
    var lab = D.lab || {};
    document.querySelectorAll('img[data-logo]').forEach(function (img) {
      if (lab.logo && img.getAttribute('src') !== asset(lab.logo)) img.src = asset(lab.logo);
      img.alt = (lab.short ? lab.short + ' — ' : '') + (lab.name || '');
    });
    var btn = document.querySelector('.nav-toggle'), nav = document.getElementById('site-nav');
    if (btn && nav) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); btn.focus(); }
      });
    }
  }

  // the six tabs, same order as the header nav on every page (Round v6)
  var PAGES = [['index.html', 'Welcome'], ['professor.html', 'Professor'], ['members.html', 'Members'],
    ['research.html', 'Research'], ['publications.html', 'Publications'], ['contact.html', 'Contact']];

  function footer() {
    var el = document.getElementById('site-ftr');
    if (!el) return;
    var lab = D.lab || {}, c = D.contact || {};
    el.innerHTML = '<div class="wrap ftr-in">' +
      '<span class="ccel-logo-plate"><img class="ccel-logo" src="' + esc(asset(lab.logo)) + '" alt="' + esc(lab.short || '') + ' logo" loading="lazy" width="160" height="81"></span>' +
      '<div><p class="ftr-name">' + esc(lab.name) + '</p>' +
      '<p>' + esc(c.address) + '</p><p><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></p></div>' +
      '<ul class="ftr-nav">' + PAGES.map(function (pg) { return '<li><a href="' + pg[0] + '">' + pg[1] + '</a></li>'; }).join('') +
      '</ul></div>';
  }

  // after client rendering, land on the requested anchor (the sticky stage above makes early jumps unreliable)
  function landOnHash() {
    if (!location.hash) return;
    var id = decodeURIComponent(location.hash.slice(1)), el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  // landing images below the pinned stage: no requests until the visitor scrolls (or arrives on an #anchor);
  // from then on native loading=lazy fetches them ahead of the viewport
  function deferImages(root) {
    var imgs = [].slice.call((root || document).querySelectorAll('img[data-src]'));
    function go() {
      window.removeEventListener('scroll', go);
      imgs.forEach(function (img) { img.loading = 'lazy'; img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); });
    }
    if (window.scrollY > 0 || location.hash) go();
    else window.addEventListener('scroll', go, { passive: true });
  }

  window.S1 = {
    D: D, esc: esc, rich: rich, strip: strip, asset: asset, https: https, linkHref: linkHref,
    byNo: byNo, areas: areas, areaBy: areaBy, pubHref: pubHref, source: source, authors: authors,
    coverFor: coverFor, paperForCover: paperForCover, impact: impact, cite: cite, links: links, icon: icon,
    published: published, memberCount: memberCount, alumniCount: alumniCount, curated: curated,
    areaSummary: areaSummary, landOnHash: landOnHash, deferImages: deferImages
  };
  header();
  footer();
})();
