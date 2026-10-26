/* Landing page (Round v5, lean like the current Welcome.html): stage title, News + Open Position, the six pinned
   papers in short form and the Korean lab intro; address and email sit in the footer. No counts or totals.
   Everything comes from window.CCEL. Research moved to research.html (research.js), Recent Highlights to
   publications.html, People to members.html, Contact to contact.html (Round v6). */
(function () {
  'use strict';
  var S = window.S1, D = S.D, esc = S.esc, rich = S.rich;
  function $(id) { return document.getElementById(id); }
  var lab = D.lab || {}, research = D.research || {}, welcome = D.welcome || {};
  function later(html) { return html.replace(/<img([^>]*?) src="/g, '<img$1 data-src="'); }   // see S1.deferImages

  // ---- stage title block: affiliation, lab name, the lab's own one-line tagline ----
  $('lab-aff').textContent = lab.affiliation || '';
  $('lab-name').textContent = lab.name || '';
  $('lab-tagline').innerHTML = rich(welcome.tagline || research.headline || '');
  document.title = (lab.short ? lab.short + ' · ' : '') + (lab.name || document.title);

  // ---- news / open position (side by side on desktop, as on the current site) ----
  $('news-list').innerHTML = (welcome.news || []).map(function (n) {
    return '<li>' + (n.date ? '<time>' + esc(n.date) + '</time>' : '') + esc(n.text) + '</li>';
  }).join('');
  $('opening-ko').textContent = welcome.opening_ko || '';
  if (!welcome.opening_ko) $('opening').hidden = true;
  var mail = (D.professor && D.professor.email) || (D.contact && D.contact.email);
  if (mail) { $('join-mail').href = 'mailto:' + mail; $('join-mail').textContent = 'Email ' + mail; }

  // ---- selected publications: curation.selected_pins in pin order, short form (area, title, journal line, DOI) ----
  $('selected-list').innerHTML = S.curated().pins.map(function (x) {
    var p = x.p, a = S.areaBy[x.area || p.area], h = S.pubHref(p), src = S.source(p);
    return '<li class="sel-item">' +
      (a ? '<a class="sel-area" href="research.html#area-' + esc(a.numeral) + '">Area ' + esc(a.numeral) + ' · ' + rich(a.title) + '</a>' : '') +
      '<h3 class="sel-title">' + (h ? '<a href="' + esc(h) + '" rel="noopener">' + rich(p.title) + '</a>' : rich(p.title)) + '</h3>' +
      (src ? '<p class="sel-src">' + rich(src) + '</p>' : '') +
      (p.doi ? '<p class="sel-doi"><a class="doi" href="https://doi.org/' + esc(p.doi) + '" rel="noopener">doi:' + esc(p.doi) + '</a></p>' : '') +
      '</li>';
  }).join('');

  // ---- about: the Korean lab intro from the current site, beside the research-loop figure ----
  $('about-ko').textContent = welcome.about_ko || '';
  if (!welcome.about_ko) $('about-ko').hidden = true;
  if (research.image) {
    $('about-fig').innerHTML = later('<img src="' + esc(S.asset(research.image)) + '" alt="Research approach of ' + esc(lab.short || '') +
      ': AI, computational materials design, experimental validation and analysis" loading="lazy" decoding="async" width="3646" height="2240">' +
      '<figcaption><b>Research approach.</b> AI, computational materials design, experimental validation and analysis in one loop.</figcaption>');
  } else {
    $('about-fig').hidden = true;
  }

  S.deferImages(document.getElementById('main'));
  S.landOnHash();
})();
