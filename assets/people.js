/* People page: professor, current members by the data's groups, alumni with current positions. */
(function () {
  'use strict';
  var S = window.S1, D = S.D, esc = S.esc;
  function $(id) { return document.getElementById(id); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function initials(n) { return String(n || '').split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2); }

  var groups = D.members || [], alumni = D.alumni || [];
  $('people-lede').textContent = S.memberCount() + ' current members in ' + groups.length + ' groups and ' + S.alumniCount() +
    ' alumni.';
  $('people-subnav').innerHTML = '<a href="#professor">Professor</a>' + groups.map(function (g) {
    return '<a href="#' + slug(g.group) + '">' + esc(g.group) + '</a>';
  }).join('') + '<a href="#alumni">Alumni</a>';

  // ---- professor ----
  var pr = D.professor || {};
  $('prof').innerHTML =
    '<div class="prof-photo">' + (pr.photo ? '<img src="' + esc(S.asset(pr.photo)) + '" alt="' + esc(pr.name) + '" width="413" height="531">' : '') + '</div>' +
    '<div><h3>' + esc(pr.name) + '</h3>' +
    '<p class="prof-title">' + esc(pr.title) + '</p>' +
    (pr.roles || []).map(function (r) { return '<p class="prof-roles">' + esc(r) + '</p>'; }).join('') +
    (pr.email ? '<p class="prof-mail"><a href="mailto:' + esc(pr.email) + '">' + esc(pr.email) + '</a></p>' : '') +
    S.links({ scholar: pr.links && pr.links.google_scholar, cv: pr.links && pr.links.cv }, pr.name) + '</div>';

  // verbatim lines from the legacy page; the first line of each list repeats the heading, date lines are set small
  var DATE = /^((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}(\s*[–-]\s*(current|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}))?$/i;
  var sec = pr.sections || {};
  $('prof-cv').innerHTML = ['Education', 'Experience'].filter(function (k) { return sec[k]; }).map(function (k) {
    var lines = sec[k].filter(function (l, i) { return !(i === 0 && l.trim() === k); });
    var items = lines.map(function (l) {
      var t = l.replace(/^✔\s*/, '').replace(/\s+,/g, ',').trim();
      return '<li' + (DATE.test(t) ? ' class="date"' : '') + '>' + esc(t) + '</li>';
    }).join('');
    return '<div><details' + (k === 'Education' ? ' open' : '') + '><summary>' + k + '</summary><ul>' + items + '</ul></details></div>';
  }).join('');

  // ---- members ----
  function card(m, alum) {
    var deg = (m.degrees || []).length ? '<ul class="deg">' + m.degrees.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '';
    return '<div class="person" data-type="' + esc(m.type || '') + '">' +
      (m.photo ? '<img class="person-photo" src="' + esc(S.asset(m.photo)) + '" alt="' + esc(m.name) + '" loading="lazy" decoding="async" width="400" height="500">'
               : '<div class="person-photo ph" aria-hidden="true">' + esc(initials(m.name)) + '</div>') +
      '<h4>' + esc(m.name) + '</h4>' +
      (m.type ? '<p class="type ' + esc(m.type) + '">' + (m.type === 'experimental' ? 'Experimental' : 'Computational') + '</p>' : '') +
      (alum && m.current_position ? '<p class="pos">' + esc(m.current_position) + '</p>' : '') +
      (!alum && m.research_area ? '<p class="ra">' + esc(m.research_area) + '</p>' : '') +
      deg +
      (!alum && (m.email || m.office) ? '<p class="contact">' + (m.email ? '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>' : '') +
        (m.email && m.office ? '<br>' : '') + esc(m.office || '') + '</p>' : '') +
      S.links(m.links, m.name) + '</div>';
  }
  $('groups').innerHTML = groups.map(function (g) {
    return '<section class="group" id="' + slug(g.group) + '" aria-label="' + esc(g.group) + '"><h2>' + esc(g.group) +
      '<span class="n">' + g.people.length + '</span></h2><div class="people">' +
      g.people.map(function (m) { return card(m, false); }).join('') + '</div></section>';
  }).join('');
  $('alumni-n').textContent = S.alumniCount();
  $('alumni-groups').innerHTML = alumni.map(function (g) {
    return '<div class="alumni-group"><h3>' + esc(g.group) + ' <span class="n">(' + g.people.length + ')</span></h3>' +
      '<div class="people alumni">' + g.people.map(function (m) { return card(m, true); }).join('') + '</div></div>';
  }).join('');

  // ---- computational / experimental filter ----
  $('type-filter').addEventListener('change', function (e) {
    var v = e.target.value;
    document.querySelectorAll('.person[data-type]').forEach(function (el) {
      el.hidden = v !== 'all' && el.getAttribute('data-type') !== v;
    });
    document.querySelectorAll('#groups .group, .alumni-group').forEach(function (g) {
      g.hidden = !g.querySelector('.person:not([hidden])');
    });
  });

  S.landOnHash();
})();
