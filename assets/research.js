/* Research page: research.headline and research.intro with the research-loop figure, then the five areas of
   research.areas in data order (I-V): figure, summary, keywords, the area's pinned papers (curation.selected_pins)
   and its recent highlights (curation.recent_highlights). Moved here from the landing page in Revision v5. */
(function () {
  'use strict';
  var S = window.S1, D = S.D, esc = S.esc, rich = S.rich;
  function $(id) { return document.getElementById(id); }
  var lab = D.lab || {}, research = D.research || {};

  $('research-lede').innerHTML = rich(research.headline || '');
  $('research-toc').innerHTML = S.areas.map(function (a) {
    return '<li><a href="#area-' + esc(a.numeral) + '"><span class="toc-n">' + esc(a.numeral) + '</span>' + rich(a.title) + '</a></li>';
  }).join('');

  $('research-text').innerHTML = (research.intro || []).map(function (t, i) {
    return '<p' + (i === 0 ? ' class="lead"' : '') + '>' + rich(t) + '</p>';
  }).join('');
  if (research.image) {
    $('research-fig').innerHTML = '<img src="' + esc(S.asset(research.image)) + '" alt="Research approach of ' + esc(lab.short || '') +
      ': AI, computational materials design, experimental validation and analysis" decoding="async" width="3646" height="2240">' +
      '<figcaption><b>Research approach.</b> AI, computational materials design, experimental validation and analysis in one loop.</figcaption>';
  } else {
    $('research-fig').hidden = true;
  }

  var cur = S.curated();
  function paperList(list) {
    return '<ul>' + list.map(function (p) {
      var h = S.pubHref(p), src = S.source(p);
      return '<li>' + (h ? '<a href="' + esc(h) + '" rel="noopener">' + rich(p.title) + '</a>' : rich(p.title)) +
        (src ? ' <span class="src">— ' + rich(src) + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  $('areas').innerHTML = S.areas.map(function (a) {
    var pinned = cur.pins.filter(function (x) { return (x.area || x.p.area) === a.numeral; }).map(function (x) { return x.p; });
    var recent = cur.highlights.filter(function (p) { return p.area === a.numeral && pinned.indexOf(p) < 0; });
    return '<article class="area" id="area-' + esc(a.numeral) + '" aria-labelledby="h-area-' + esc(a.numeral) + '">' +
      '<div class="area-fig">' + (a.image ? '<img src="' + esc(S.asset(a.image)) + '" alt="Research area ' + esc(a.numeral) + ': ' +
        esc(S.strip(a.title)) + '" loading="lazy" decoding="async" width="220" height="220">' : '') + '</div>' +
      '<div class="area-text"><div class="area-head"><p class="area-num">Area ' + esc(a.numeral) + '</p>' +
        '<h2 id="h-area-' + esc(a.numeral) + '">' + rich(a.title) + '</h2></div>' +
      '<div class="area-rest"><p class="area-sum">' + rich(S.areaSummary(a)) + '</p>' +
      '<ul class="kw" aria-label="Keywords">' + (a.keywords || []).map(function (k) { return '<li>' + esc(k) + '</li>'; }).join('') + '</ul>' +
      '<div class="area-papers">' +
        (pinned.length ? '<h3>Selected papers</h3>' + paperList(pinned) : '') +
        (recent.length ? '<h3>Recent highlights</h3>' + paperList(recent) : '') +
        '<a class="more" href="publications.html?area=' + encodeURIComponent(a.numeral) + '">All papers in Area ' + esc(a.numeral) + ' on the Publications page</a>' +
      '</div></div></div></article>';
  }).join('');

  S.landOnHash();
})();
