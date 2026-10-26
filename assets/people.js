/* Members page (Round v6): current members by the data's groups, one person per row as on the current
   members.html; alumni in a second view with their current positions. The URL hash picks the view:
   #alumni / #alumni-<group> -> alumni, #current / #<group> / no hash -> current members. Links, the back button
   and fresh loads all go through the same hash, so they stay in sync. No professor section (professor.html). */
(function () {
  'use strict';
  var S = window.S1, D = S.D, esc = S.esc;
  function $(id) { return document.getElementById(id); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function initials(n) { return String(n || '').split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2); }
  function count(gs) { return gs.reduce(function (n, g) { return n + (g.people || []).length; }, 0); }

  var groups = D.members || [], alumni = D.alumni || [], pr = D.professor || {}, root = document.documentElement;

  // experimental / computational marks: flask and monitor, as on the current site (legend = the filter below)
  var TYPES = {
    experimental: ['Experimental', '<path d="M9 3h6"/><path d="M10 3v6.2l-5.3 9.2A1.8 1.8 0 0 0 6.3 21h11.4a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3"/><path d="M7.4 15.5h9.2"/>'],
    computational: ['Computational', '<rect x="3" y="4" width="18" height="12.5" rx="1.5"/><path d="M8.5 20.5h7M12 16.5v4"/><path d="m9.6 8.2-2 2 2 2M14.4 8.2l2 2-2 2"/>']
  };
  function ticon(type, decorative) {
    var t = TYPES[type];
    if (!t) return '';
    return '<span class="ticon ticon--' + type + '"' + (decorative ? ' aria-hidden="true"' : ' role="img" aria-label="' + t[0] + '" title="' + t[0] + '"') +
      '><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + t[1] + '</svg></span>';
  }

  // ---- head: counts, link to the professor's page, view switch + group jump buttons ----
  $('people-lede').innerHTML = esc(count(groups)) + ' current members in ' + groups.length + ' groups and ' + esc(count(alumni)) +
    ' alumni.' + (pr.name ? ' Led by <a href="professor.html">Prof. ' + esc(pr.name) + '</a>.' : '');
  function gbtns(gs, prefix) {
    return gs.map(function (g) {
      return '<a class="gbtn" href="#' + prefix + slug(g.group) + '" data-group="' + prefix + slug(g.group) + '">' + esc(g.group) + '</a>';
    }).join('');
  }
  $('people-subnav').innerHTML =
    '<div class="vswitch"><a href="#current" data-view="current">Current members</a><a href="#alumni" data-view="alumni">Alumni</a></div>' +
    '<div class="gbtns v-current">' + gbtns(groups, '') + '</div>' +
    '<div class="gbtns v-alumni">' + gbtns(alumni, 'alumni-') + '</div>';

  // ---- one row per person: photo | name + type mark, research area (or current position), degrees, contact, links ----
  var DEG = /^(Postdoc \/ Research Professor|Research Professor|Postdoc|MS\/PhD Integrated Course|MS\/PhD Course|MS\/PhD|PhD Course|PhD|MS Course|MS|BS)(?=\s|$)/;
  function row(m, alum) {
    var nm = String(m.name || ''), note = '', nmm = nm.match(/^(.*?)\s*\((.+)\)\s*$/);
    if (nmm) { nm = nmm[1]; note = nmm[2]; }      // "Miyeon Kim (Chief of Lab)" -> name + small note
    var photo = m.photo
      ? '<img class="mrow-photo" src="' + esc(S.asset(m.photo)) + '" alt="' + esc(m.name) + '" loading="lazy" decoding="async" width="400" height="500">'
      : '<div class="mrow-photo ph" aria-hidden="true">' + esc(initials(nm)) + '</div>';
    var role = alum ? ['Current position', m.current_position] : ['Research area', m.research_area];
    var deg = (m.degrees || []).length ? '<ul class="mrow-deg">' + m.degrees.map(function (d) {
      var t = String(d), k = t.match(DEG);
      return '<li>' + (k ? '<b>' + esc(k[1]) + '</b>' + esc(t.slice(k[1].length)) : esc(t)) + '</li>';
    }).join('') + '</ul>' : '';
    var info = [];
    if (m.email) info.push(['Email', '<a href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>']);
    if (m.office) {
      var om = String(m.office).match(/^(.*?)\s*\/\s*Phone:\s*(.+)$/i);   // "Building 31, 306 / Phone: 02-880-1610"
      if (om) { info.push(['Office', esc(om[1])]); info.push(['Phone', esc(om[2])]); } else info.push(['Office', esc(m.office)]);
    }
    var dl = info.length ? '<dl class="mrow-info">' + info.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' : '';
    return '<article class="mrow" data-type="' + esc(m.type || '') + '">' + photo +
      '<div class="mrow-head"><h4 class="mrow-name">' + ticon(m.type) + '<span class="nm">' + esc(nm) + '</span>' +
      (note ? '<span class="mrow-note">' + esc(note) + '</span>' : '') + '</h4>' +
      (role[1] ? '<p class="mrow-role"><span class="k">' + role[0] + '</span>' + esc(role[1]) + '</p>' : '') + '</div>' +
      ((deg || dl) ? '<div class="mrow-detail' + (deg && dl ? ' two' : '') + '">' + deg + dl + '</div>' : '') +
      S.links(m.links, nm) + '</article>';
  }
  function view(gs, prefix, alum) {
    return gs.map(function (g) {
      return '<section class="group" id="' + prefix + slug(g.group) + '" aria-labelledby="h-' + prefix + slug(g.group) + '">' +
        '<h3 class="ghead" id="h-' + prefix + slug(g.group) + '">' + esc(g.group) + '<span class="n">' + g.people.length + '</span></h3>' +
        '<div class="mrows">' + g.people.map(function (m) { return row(m, alum); }).join('') + '</div></section>';
    }).join('');
  }
  $('current').innerHTML = '<h2 class="vhead">Current members<span class="n">' + count(groups) + '</span></h2>' + view(groups, '', false);
  $('alumni').innerHTML = '<h2 class="vhead" id="h-alumni">Alumni<span class="n">' + count(alumni) + '</span></h2>' +
    '<p class="vnote">Former members with their current positions.</p>' + view(alumni, 'alumni-', true);

  // ---- research-type filter (also the legend for the marks beside each name) ----
  $('type-filter').innerHTML = [['all', 'All'], ['experimental', TYPES.experimental[0]], ['computational', TYPES.computational[0]]]
    .map(function (t, i) {
      return '<label><input type="radio" name="type" value="' + t[0] + '"' + (i ? '' : ' checked') + '><span>' +
        ticon(t[0], true) + t[1] + '</span></label>';
    }).join('');
  $('type-filter').addEventListener('change', function (e) {
    var v = e.target.value;
    document.querySelectorAll('.mrow[data-type]').forEach(function (el) {
      el.hidden = v !== 'all' && el.getAttribute('data-type') !== v;
    });
    document.querySelectorAll('.view .group').forEach(function (g) {
      g.hidden = !g.querySelector('.mrow:not([hidden])');
      var b = document.querySelector('.gbtn[data-group="' + g.id + '"]');
      if (b) b.hidden = g.hidden;
    });
  });

  // ---- view <-> hash ----
  var VIEW = { current: 'current', alumni: 'alumni' };
  groups.forEach(function (g) { VIEW[slug(g.group)] = 'current'; });
  alumni.forEach(function (g) { VIEW['alumni-' + slug(g.group)] = 'alumni'; });
  function hashId() { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ''; } }
  function setView(v) {
    var was = root.classList.contains('view-alumni') ? 'alumni' : 'current';
    root.classList.toggle('view-alumni', v === 'alumni');
    document.querySelectorAll('.vswitch a').forEach(function (a) {
      if (a.getAttribute('data-view') === v) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    document.title = (v === 'alumni' ? 'Alumni' : 'Members') + ' · ' + ((D.lab && D.lab.short) || 'CCEL');
    return was !== v;
  }
  function sync(byNav) {
    var id = hashId(), v = id ? VIEW[id] : 'current';
    if (!v) return;                                   // other in-page targets (#main) keep the view
    var changed = setView(v);
    if (!byNav) return;
    var target = VIEW[id] && id !== 'current' && id !== 'alumni' ? $(id) : null;
    if (target) { target.scrollIntoView({ block: 'start' }); return; }   // group jump: it was hidden a moment ago
    // view switch: stay put when the switch is on screen (tab-like); from further down, go to the top of the new view
    var hdr = document.querySelector('.site-hdr').getBoundingClientRect().bottom;
    if (changed && $('people-subnav').getBoundingClientRect().top < hdr) $(v).scrollIntoView({ block: 'start' });
  }
  window.addEventListener('hashchange', function () { sync(true); });
  sync(false);
  S.landOnHash();
})();
