/* Professor page (Round v6): the professor only, as on the current prof.html. Profile from `professor`
   (+ the street address from `contact`), then Education and Experience from the structured `professor.education` /
   `.experience`, with the `.service` lines closing Experience as on the legacy page (not the old `sections` lines).
   User rule 2026-10-26: nothing the current page does not show (no office/phone, bio, interests, awards, counts).
   Nothing about students here. */
(function () {
  'use strict';
  var S = window.S1, D = S.D, esc = S.esc;
  function $(id) { return document.getElementById(id); }
  var pr = D.professor || {}, c = D.contact || {}, lab = D.lab || {};

  // ---- profile ----
  $('prof-photo').innerHTML = pr.photo
    ? '<img src="' + esc(S.asset(pr.photo)) + '" alt="' + esc(pr.name) + '" width="413" height="531" fetchpriority="high">' : '';
  // "Jeong Woo Han, Ph.D." as on the current page; the degree comes from professor.education
  var doc = (pr.education || []).filter(function (e) { return /^Ph\.?\s?D\.?$/i.test(e.degree || ''); })[0];
  $('prof-name').textContent = (pr.name || '') + (pr.name && doc ? ', ' + doc.degree : '');
  document.title = (pr.name ? pr.name + ' · ' : '') + (lab.short || 'CCEL');

  // "Professor, Department of ..., Seoul National University" -> rank on its own line, roles, then the department lines
  var parts = String(pr.title || '').split(/,\s*/).filter(Boolean);
  $('prof-title').innerHTML =
    (parts.length ? '<p class="rank">' + esc(parts[0]) + '</p>' : '') +
    (pr.roles || []).map(function (r) { return '<p class="role">' + esc(r) + '</p>'; }).join('') +
    parts.slice(1).map(function (p) { return '<p class="dept">' + esc(p) + '</p>'; }).join('');

  // street address = contact.address without the department/university prefix that the title already shows
  var addr = c.address || '';
  if (lab.affiliation && addr.indexOf(lab.affiliation) === 0) addr = addr.slice(lab.affiliation.length).replace(/^\s*,\s*/, '');
  // only what the current prof.html shows: the address line and the email (no office or phone)
  var rows = [['Address', addr && esc(addr)], ['Email', pr.email && '<a href="mailto:' + esc(pr.email) + '">' + esc(pr.email) + '</a>']];
  $('prof-info').innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
  }).join('');

  // labelled link buttons, only for links that are set
  var L = pr.links || {};
  $('prof-links').innerHTML = [['scholar', L.google_scholar, 'Google Citation'], ['cv', L.cv, 'Curriculum Vitae']]
    .filter(function (x) { return x[1]; }).map(function (x) {
      return '<li><a href="' + esc(S.linkHref(x[1])) + '" target="_blank" rel="noopener">' + S.icon(x[0]) +
        '<span>' + x[2] + '</span></a></li>';
    }).join('');
  if (!$('prof-links').innerHTML) $('prof-links').hidden = true;

  // ---- Education / Experience / Service: structured fields professor.education, .experience, .service ----
  function period(t) { return String(t || '').replace(/\s+-\s+/g, ' – '); }
  function place(i, l) { return [i, l].filter(Boolean).join(', '); }
  function entry(org, rows) {
    return '<li class="cv-entry">' + (org ? '<p class="cv-org">' + esc(org) + '</p>' : '') + rows.map(function (r) {
      if (r.note) return '<p class="cv-note">' + r.html + '</p>';
      return '<div class="cv-row"><span class="cv-what">' + r.html + '</span>' +
        (r.date ? '<span class="cv-date">' + esc(r.date) + '</span>' : '') + '</div>';
    }).join('') + '</li>';
  }
  var edu = pr.education || [], exp = pr.experience || [], svc = pr.service || [];
  $('edu-list').innerHTML = edu.map(function (e) {
    var rows = [{ html: esc([e.degree, e.field].filter(Boolean).join(', ')) + (e.honors ? ' <span class="cv-hon">(' + esc(e.honors) + ')</span>' : ''), date: e.date }];
    if (e.thesis) rows.push({ note: true, html: '“' + esc(e.thesis) + '”' });
    if (e.advisor) rows.push({ note: true, html: 'Advisor: ' + esc(e.advisor) });
    return entry(place(e.institution, e.location), rows);
  }).join('');
  $('exp-list').innerHTML = exp.map(function (e) {
    return entry(place(e.institution, e.location), (e.roles || []).map(function (r) {
      return { html: '<span class="cv-title">' + esc(r.title) + '</span>' + (r.unit ? ', ' + esc(r.unit) : ''), date: period(r.period) };
    }));
  }).join('');
  $('svc-list').innerHTML = svc.map(function (v) {
    return entry('', [{ html: '<span class="cv-title">' + esc(v.title) + '</span>' + (v.organization ? ', ' + esc(v.organization) : ''), date: period(v.period) }]);
  }).join('');
  if (!edu.length) $('education').hidden = true;
  if (!exp.length) $('experience').hidden = true;
  if (!svc.length) $('svc-list').hidden = true;

  S.landOnHash();
})();
