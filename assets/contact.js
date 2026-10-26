/* Contact page (Round v6): group photo and the contact details, all from `contact`. No map, no form. */
(function () {
  'use strict';
  var S = window.S1, D = S.D, esc = S.esc;
  function $(id) { return document.getElementById(id); }
  var c = D.contact || {}, lab = D.lab || {};

  if (c.group_photo) {
    $('group-photo').innerHTML = '<img src="' + esc(S.asset(c.group_photo)) + '" alt="' + esc(lab.short || 'CCEL') +
      ' group photo" width="6944" height="4496" decoding="async" fetchpriority="high">';
  } else {
    $('group-photo').hidden = true;
  }
  $('contact-lab').textContent = c.lab_name || lab.name || '';

  // the address prints as on the current site: department and university on one line, the street on the next
  var addr = c.address || '', a1 = '', a2 = addr;
  if (lab.affiliation && addr.indexOf(lab.affiliation) === 0) {
    a1 = lab.affiliation; a2 = addr.slice(lab.affiliation.length).replace(/^\s*,\s*/, '');
  }
  var rows = [
    ['Address', addr && ((a1 ? '<span class="line">' + esc(a1) + '</span>' : '') + '<span class="line">' + esc(a2) + '</span>')],
    ['Email', c.email && '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>'],
    ['Professor office', c.professor_office && esc(c.professor_office)],
    ['Laboratory', c.laboratory && esc(c.laboratory)],
    ['Student office', c.student_office && esc(c.student_office)]
  ];
  $('contact-list').innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
  }).join('');

  S.landOnHash();
})();
