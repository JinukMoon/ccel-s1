/* Publications page: every entry of CCEL.publications, newest first, grouped by year (publication_counts),
   with search + filters, plus the Selected (curation) and Covers views. Filtering toggles `hidden`, no re-render. */
(function () {
  'use strict';
  var S = window.S1, D = S.D, esc = S.esc;
  function $(id) { return document.getElementById(id); }
  var pubs = (D.publications || []).slice().sort(function (a, b) { return (b.year - a.year) || (b.no - a.no); });
  var counts = D.publication_counts || {};
  var years = Object.keys(counts).sort(function (a, b) { return b - a; });
  pubs.forEach(function (p) { if (years.indexOf(String(p.year)) < 0) years.push(String(p.year)); });
  years.sort(function (a, b) { return b - a; });

  // ---- lede: plain counts by status ----
  var byStatus = {};
  pubs.forEach(function (p) { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
  var order = ['published', 'in press', 'accepted', 'in revision', 'submitted'];
  Object.keys(byStatus).forEach(function (s) { if (order.indexOf(s) < 0) order.push(s); });
  $('pub-lede').textContent = pubs.length + ' entries, newest first: ' + order.filter(function (s) { return byStatus[s]; })
    .map(function (s) { return byStatus[s] + ' ' + s; }).join(', ') + '. Names in bold are CCEL members.';

  // ---- filter options from the data ----
  $('f-year').innerHTML += years.map(function (y) { return '<option>' + esc(y) + '</option>'; }).join('');
  $('f-status').innerHTML += order.filter(function (s) { return byStatus[s]; }).map(function (s) {
    return '<option value="' + esc(s) + '">' + esc(s.charAt(0).toUpperCase() + s.slice(1)) + '</option>';
  }).join('');
  $('f-area').innerHTML += S.areas.map(function (a) {
    return '<option value="' + esc(a.numeral) + '">' + esc(a.numeral) + ' · ' + esc(S.strip(a.title)) + '</option>';
  }).join('') + '<option value="none">Not assigned</option>';

  // ---- list, rendered once ----
  var byYear = {};
  pubs.forEach(function (p) { (byYear[p.year] = byYear[p.year] || []).push(p); });
  $('year-list').innerHTML = years.map(function (y) {
    var list = byYear[y] || [];
    return '<section class="year" id="y' + esc(y) + '" data-year="' + esc(y) + '"><h2>' + esc(y) +
      '<span class="n" data-total="' + (counts[y] != null ? counts[y] : list.length) + '"></span></h2><ol>' +
      list.map(function (p) {
        return '<li class="pub" id="p' + p.no + '" data-no="' + p.no + '"><span class="pub-no">' + p.no + '</span>' +
          S.cite(p, { area: true }).replace('<article class="cite">', '<div>').replace(/<\/article>$/, '</div>') + '</li>';
      }).join('') + '</ol></section>';
  }).join('');
  var items = pubs.map(function (p) {
    return {
      el: document.getElementById('p' + p.no), p: p,
      text: (S.strip(p.title) + ' ' + S.strip(p.authors) + ' ' + (p.journal || '') + ' ' + (p.citation_tail || '')).toLowerCase()
    };
  });
  var sections = [].slice.call(document.querySelectorAll('.year'));

  function apply() {
    var q = $('f-q').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var y = $('f-year').value, st = $('f-status').value, ar = $('f-area').value, led = $('f-led').checked, shown = 0;
    items.forEach(function (it) {
      var p = it.p, ok = (!y || String(p.year) === y) && (!st || p.status === st) &&
        (!ar || (ar === 'none' ? !p.area : p.area === ar)) && (!led || p.lab_led === true) &&
        q.every(function (w) { return it.text.indexOf(w) >= 0; });
      it.el.hidden = !ok;
      if (ok) shown++;
    });
    var filtered = q.length || y || st || ar || led;
    sections.forEach(function (s) {
      var vis = s.querySelectorAll('.pub:not([hidden])').length, n = s.querySelector('.n'), total = n.getAttribute('data-total');
      s.hidden = vis === 0;
      n.textContent = filtered ? vis + ' of ' + total + ' entries' : total + ' entries';
    });
    $('empty').hidden = shown > 0;
    $('result-line').textContent = filtered ? 'Showing ' + shown + ' of ' + pubs.length + ' entries.' : '';
  }
  var t;
  $('f-q').addEventListener('input', function () { clearTimeout(t); t = setTimeout(apply, 120); });
  ['f-year', 'f-status', 'f-area', 'f-led'].forEach(function (id) { $(id).addEventListener('change', apply); });

  // preset from the URL, e.g. publications.html?area=I (linked from the landing page's research areas)
  var qs = new URLSearchParams(location.search);
  if (qs.get('area')) $('f-area').value = qs.get('area');
  if (qs.get('year')) $('f-year').value = qs.get('year');
  if (qs.get('q')) $('f-q').value = qs.get('q');
  apply();

  // ---- selected view ----
  var cur = S.curated();
  $('sel-list').innerHTML = cur.pins.map(function (x) {
    return S.cite(Object.assign({}, x.p, { area: x.area || x.p.area }), { thumb: true, area: true });
  }).join('');
  $('hl-list').innerHTML = cur.highlights.map(function (p) { return S.cite(p, { thumb: true, area: true }); }).join('');
  $('rules').textContent = cur.rules + (cur.updated ? ' (Updated ' + cur.updated + '.)' : '');

  // ---- covers view: complete covers only, front covers first; back/inside pages only here ----
  function coverFig(c) {
    var p = S.paperForCover(c);
    var cap = p ? '<a href="' + esc(S.https(c.url)) + '" rel="noopener">' + S.rich(p.title) + '</a><br>' + esc(p.journal || '') + ' ' + esc(p.year || '')
                : '<a href="' + esc(S.https(c.url)) + '" rel="noopener">Article page</a>';
    return '<figure><a href="' + esc(S.https(c.url)) + '" rel="noopener" tabindex="-1" aria-hidden="true"><img src="' + esc(S.asset(c.image)) +
      '" alt="' + esc(p ? 'Journal cover for: ' + S.strip(p.title) : 'Journal cover') + '" loading="lazy" decoding="async" width="300" height="400"></a>' +
      '<figcaption>' + cap + '</figcaption></figure>';
  }
  var cov = D.cover_publications || [];
  $('cover-front').innerHTML = cov.filter(function (c) { return c.kind !== 'back_page'; }).map(coverFig).join('');
  $('cover-back').innerHTML = cov.filter(function (c) { return c.kind === 'back_page'; }).map(coverFig).join('');

  // ---- tabs (hash-addressable: #selected, #covers) ----
  var tabs = [].slice.call(document.querySelectorAll('[role="tab"]'));
  function show(view, focus) {
    tabs.forEach(function (b) {
      var on = b.getAttribute('data-view') === view;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      $(b.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) b.focus();
    });
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-view');
      show(v);
      history.replaceState(null, '', v === 'all' ? location.pathname + location.search : '#' + v);
    });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; n.click(); n.focus(); }
    });
  });
  function fromHash() {
    var h = location.hash.slice(1);
    if (h === 'selected' || h === 'covers') show(h);   // panels are #view-*, so the browser does not jump past the tabs
    else {
      show('all');
      var el = h && document.getElementById(h);
      if (el) el.scrollIntoView({ block: 'start' });
    }
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
