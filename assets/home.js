/* Landing page rendering from window.CCEL. Lists, counts and picks are all computed here at runtime. */
(function () {
  'use strict';
  var S = window.S1, D = S.D, esc = S.esc, rich = S.rich;
  function $(id) { return document.getElementById(id); }
  var lab = D.lab || {}, research = D.research || {}, welcome = D.welcome || {};
  function later(html) { return html.replace(/<img([^>]*?) src="/g, '<img$1 data-src="'); }   // see S1.deferImages

  // ---- stage title block ----
  $('lab-aff').textContent = lab.affiliation || '';
  $('lab-name').textContent = lab.name || '';
  $('lab-identity').innerHTML = rich(research.headline || welcome.tagline || '');
  $('lab-intro').innerHTML = research.headline ? rich(welcome.tagline || '') : '';
  var nPub = S.published().length, nMem = S.memberCount();
  $('lab-facts').innerHTML =
    '<a href="publications.html"><b>' + nPub + '</b> published papers</a>' +
    '<a href="#research"><b>' + S.areas.length + '</b> research areas</a>' +
    '<a href="members.html"><b>' + nMem + '</b> members</a>';
  document.title = (lab.short ? lab.short + ' · ' : '') + (lab.name || document.title);

  // ---- research ----
  $('research-aside').textContent = S.areas.length + ' research areas';
  $('research-text').innerHTML = (research.intro || []).map(function (t, i) {
    return '<p' + (i === 0 ? ' class="lead"' : '') + '>' + rich(t) + '</p>';
  }).join('');
  $('about-ko').textContent = welcome.about_ko || '';   // Korean lab intro, as on the current site
  if (!welcome.about_ko) $('about-ko').hidden = true;
  if (research.image) {
    $('research-fig').innerHTML = later('<img src="' + esc(S.asset(research.image)) + '" alt="Research approach of ' + esc(lab.short || '') +
      ': AI, computational materials design, experimental validation and analysis" loading="lazy" decoding="async" width="3646" height="2240">' +
      '<figcaption><b>Research approach.</b> AI, computational materials design, experimental validation and analysis in one loop.</figcaption>');
  }

  var cur = S.curated();
  var countBy = {};
  S.published().forEach(function (p) { if (p.area) countBy[p.area] = (countBy[p.area] || 0) + 1; });
  $('areas').innerHTML = later(S.areas.map(function (a) {
    var pinned = cur.pins.filter(function (x) { return x.area === a.numeral; }).map(function (x) { return x.p; });
    var label = pinned.length ? 'Selected papers' : 'Recent highlights';
    var list = pinned.length ? pinned : cur.highlights.filter(function (p) { return p.area === a.numeral; });
    var papers = list.map(function (p) {
      var h = S.pubHref(p);
      return '<li>' + (h ? '<a href="' + esc(h) + '" rel="noopener">' + rich(p.title) + '</a>' : rich(p.title)) +
        ' <span class="src">— ' + esc(p.journal || '') + ' ' + esc(p.year || '') + '</span></li>';
    }).join('');
    var n = countBy[a.numeral] || 0;
    return '<article class="area" id="area-' + esc(a.numeral) + '">' +
      '<div class="area-fig">' + (a.image ? '<img src="' + esc(S.asset(a.image)) + '" alt="Research area ' + esc(a.numeral) + ': ' +
        esc(S.strip(a.title)) + '" loading="lazy" decoding="async" width="220" height="220">' : '') + '</div>' +
      '<div class="area-text"><div class="area-head"><p class="area-num">Area ' + esc(a.numeral) + '</p><h3>' + rich(a.title) + '</h3></div>' +
      '<div class="area-rest"><p class="area-sum">' + rich(S.areaSummary(a)) + '</p>' +
      '<ul class="kw" aria-label="Keywords">' + (a.keywords || []).map(function (k) { return '<li>' + esc(k) + '</li>'; }).join('') + '</ul>' +
      '<div class="area-papers">' + (papers ? '<h4>' + label + '</h4><ul>' + papers + '</ul>' : '') +
      '<a class="more" href="publications.html?area=' + encodeURIComponent(a.numeral) + '">All ' + n + ' published papers in Area ' + esc(a.numeral) + '</a></div>' +
      '</div></div></article>';
  }).join(''));

  // ---- selected publications / recent highlights (given by data, rendered in data order) ----
  $('selected-aside').textContent = 'Pinned by Prof. ' + ((D.professor && D.professor.name) || '').split(' ').slice(-1)[0] +
    (cur.updated ? ' · updated ' + cur.updated : '');
  $('selected').innerHTML = later(cur.pins.map(function (x) {
    var p = Object.assign({}, x.p, { area: x.area || x.p.area });
    return S.cite(p, { thumb: true, area: true });
  }).join(''));
  $('recent').innerHTML = later(cur.highlights.map(function (p) { return S.cite(p, { thumb: true, area: true }); }).join(''));
  $('rules').textContent = cur.rules;
  var nCov = (D.cover_publications || []).length;
  $('pub-links').innerHTML = '<a class="more" href="publications.html">All ' + (D.publications || []).length + ' publications</a>' +
    '<a class="more" href="publications.html#covers">' + nCov + ' journal covers</a>';

  // ---- people preview ----
  var pr = D.professor || {};
  $('prof').innerHTML = later(
    '<div class="prof-photo">' + (pr.photo ? '<img src="' + esc(S.asset(pr.photo)) + '" alt="' + esc(pr.name) + '" loading="lazy" decoding="async" width="413" height="531">' : '') + '</div>' +
    '<div><h3>' + esc(pr.name) + '</h3>' +
    '<p class="prof-title">' + esc(pr.title) + '</p>' +
    (pr.roles || []).map(function (r) { return '<p class="prof-roles">' + esc(r) + '</p>'; }).join('') +
    (pr.email ? '<p class="prof-mail"><a href="mailto:' + esc(pr.email) + '">' + esc(pr.email) + '</a></p>' : '') +
    S.links({ scholar: pr.links && pr.links.google_scholar, cv: pr.links && pr.links.cv }, pr.name) + '</div>');

  $('counts').innerHTML = (D.members || []).map(function (g) {
    return '<span><b>' + g.people.length + '</b>' + esc(g.group) + '</span>';
  }).join('') + '<span><b>' + S.alumniCount() + '</b>Alumni</span>';

  // preview = the first member group in the data (Postdoc today), as cards with link icons
  var first = (D.members || [])[0];
  if (first) {
    $('postdoc-head').textContent = first.group;
    $('people-preview').innerHTML = later(first.people.map(personCard).join(''));
  }
  function personCard(m) {
    return '<div class="person">' +
      (m.photo ? '<img class="person-photo" src="' + esc(S.asset(m.photo)) + '" alt="' + esc(m.name) + '" loading="lazy" decoding="async" width="400" height="500">'
               : '<div class="person-photo ph" aria-hidden="true">' + esc(initials(m.name)) + '</div>') +
      '<h4>' + esc(m.name) + '</h4>' +
      (m.type ? '<p class="type ' + esc(m.type) + '">' + (m.type === 'experimental' ? 'Experimental' : 'Computational') + '</p>' : '') +
      (m.research_area ? '<p class="ra">' + esc(m.research_area) + '</p>' : '') +
      S.links(m.links, m.name) + '</div>';
  }
  function initials(n) { return String(n || '').split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2); }

  // ---- news / join ----
  $('news-list').innerHTML = (welcome.news || []).map(function (n) {
    return '<li>' + (n.date ? '<time>' + esc(n.date) + '</time>' : '') + esc(n.text) + '</li>';
  }).join('');
  $('opening').textContent = welcome.opening_ko || '';
  var mail = (D.professor && D.professor.email) || (D.contact && D.contact.email);
  if (mail) { $('join-mail').href = 'mailto:' + mail; $('join-mail').textContent = 'Email ' + mail; }

  // ---- contact ----
  var c = D.contact || {};
  var rows = [['Address', c.address], ['Email', c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : null, true],
    ['Professor office', c.professor_office], ['Laboratory', c.laboratory], ['Student office', c.student_office]];
  $('contact-grid').innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<div><dt>' + r[0] + '</dt><dd>' + (r[2] ? r[1] : esc(r[1])) + '</dd></div>';
  }).join('');

  S.deferImages(document.getElementById('main'));
  S.landOnHash();
})();
