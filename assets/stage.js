/* Landing scroll stage (S1 "Pinned hero").
   A sticky 100vh pin inside a tall container; a <canvas> draws the `hero` frame of _shared/scroll/manifest.json
   chosen from scroll progress (native scroll, no smoothing). Desktop: frames over 0..80 % of the scroll, then the
   media wipes to white while the title block rises to just under the header and the next section (News) slides up
   into the stage's last segment, so the resolved title page is never an empty screen. Mobile: frames over the
   whole stage, no overlap.
   Loading: poster in the HTML paints first; after window load, every 8th frame (+ last); the remaining frames only
   once the visitor scrolls into the stage (never with Save-Data). 4 requests at a time; the nearest loaded frame
   is drawn. Counts, sizes, folders and poster come from the manifest. Reduced motion: no scrub, poster only. */
(function () {
  'use strict';
  var root = document.documentElement;
  var stage = document.getElementById('stage');
  if (!stage || !root.classList.contains('scrub')) return;

  var BASE = '_shared/scroll/';
  var VIDEO_END = 0.8, KEY_STEP = 8, PARALLEL = 4;
  var pin = stage.querySelector('.stage-pin');
  var media = stage.querySelector('.stage-media');
  var poster = stage.querySelector('.stage-poster');
  var canvas = stage.querySelector('.stage-canvas');
  var panel = stage.querySelector('.stage-panel');
  var main = document.getElementById('main');
  var ctx = canvas.getContext('2d');
  var mqMobile = window.matchMedia('(max-width: 767.98px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  var man, seq, set, frames, loaded, queue, keyLen, qi, active, gen = 0;
  var target = 0, drawn = -1, ticking = false, filling = false, pageLoaded = document.readyState === 'complete';

  function off() {
    root.classList.remove('scrub');
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('resize', geometry);
    main.style.setProperty('--overlap', '0');
    gen++;
    if (window.S1 && location.hash) window.S1.landOnHash();   // layout just got 200vh shorter
  }

  function fileName(i) {
    var n = i + (man.index_base || 0);
    return String(man.pattern || 'f_{index:03d}.webp').replace(/\{index(?::0?(\d+)d)?\}/, function (_, w) {
      var s = String(n);
      while (w && s.length < +w) s = '0' + s;
      return s;
    });
  }

  // coarse-to-fine: every 8th frame and the last one first, then every 4th, 2nd, the rest
  function order(n) {
    var out = [], seen = {}, steps = [KEY_STEP, KEY_STEP / 2, KEY_STEP / 4, 1];
    steps.forEach(function (s, k) {
      for (var i = 0; i < n; i += s) if (!seen[i]) { seen[i] = 1; out.push(i); }
      if (k === 0) { if (!seen[n - 1]) { seen[n - 1] = 1; out.push(n - 1); } keyLen = out.length; }
    });
    return out;
  }

  function pickSet() {
    var m = mqMobile.matches && seq.mobile ? seq.mobile : seq;
    return { dir: m.dir, count: m.count, w: m.width, h: m.height, poster: m.poster || seq.poster };
  }

  function start() {
    gen++;
    set = pickSet();
    frames = new Array(set.count); loaded = new Array(set.count);
    queue = order(set.count); qi = 0; active = 0; drawn = -1;
    canvas.classList.remove('is-ready');
    if (set.poster && poster.getAttribute('src') !== BASE + set.poster) poster.src = BASE + set.poster;
    resize(); update();
    if (pageLoaded) pump();
  }

  function pump() {
    while (active < PARALLEL && qi < queue.length && (qi < keyLen || (filling && !saveData))) load(queue[qi++]);
  }

  function load(i) {
    var g = gen, img = new Image();
    active++;
    img.decoding = 'async';
    img.onload = function () {
      var ready = img.decode ? img.decode() : Promise.resolve();
      ready.catch(function () {}).then(function () {
        if (g !== gen) return;
        frames[i] = img; loaded[i] = true; active--;
        if (drawn < 0 || Math.abs(i - target) < Math.abs(drawn - target)) draw();
        pump();
      });
    };
    img.onerror = function () { if (g !== gen) return; active--; pump(); };
    img.src = BASE + set.dir + '/' + fileName(i);
  }

  function nearest(t) {
    if (loaded[t]) return t;
    for (var d = 1; d < set.count; d++) {
      if (t - d >= 0 && loaded[t - d]) return t - d;
      if (t + d < set.count && loaded[t + d]) return t + d;
    }
    return -1;
  }

  function draw() {
    var i = nearest(target);
    if (i < 0 || i === drawn || !canvas.width) return;
    var img = frames[i], cw = canvas.width, ch = canvas.height;
    var s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);     // cover-fit, centred
    var w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = i;
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }

  function resize() {
    var r = media.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w === canvas.width && h === canvas.height) return;
    canvas.width = w; canvas.height = h; drawn = -1;
    draw();
  }

  function update() {
    ticking = false;
    var r = stage.getBoundingClientRect(), span = stage.offsetHeight - pin.offsetHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    var end = mqMobile.matches ? 1 : VIDEO_END;     // mobile: no white wipe, the frame band just scrolls away
    target = Math.round(Math.min(1, p / end) * (set.count - 1));
    stage.style.setProperty('--p', p.toFixed(4));
    stage.style.setProperty('--res', end < 1 ? Math.max(0, (p - end) / (1 - end)).toFixed(4) : '0');
    if (!filling && p > 0) { filling = true; if (pageLoaded) pump(); }
    if (r.bottom > 0) draw();
  }

  // Desktop tail: during the wipe the card rises by --shift px to sit just under the header, and the next section is
  // pulled up by --overlap px so it ends 8px below the risen card when the pin releases. Both are measured, because
  // the card height depends on the viewport, fonts and data. The section's top only enters while the card is rising,
  // and the gap between them shrinks linearly to those 8px, so the two never overlap.
  function geometry() {
    var shift = 0, overlap = 0;
    if (!mqMobile.matches && root.classList.contains('scrub')) {
      var body = panel.offsetParent, V = pin.offsetHeight, P = panel.offsetHeight;
      var T0 = body.offsetTop + panel.offsetTop, T1 = parseFloat(getComputedStyle(pin).paddingTop) + 32;
      var G = V - (T0 + P);
      shift = Math.max(0, T0 - T1);
      overlap = Math.max(0, Math.min(V - (T1 + P) - 8, 0.4 * V + G - 24));
    }
    stage.style.setProperty('--shift', Math.round(shift));
    main.style.setProperty('--overlap', Math.round(overlap));
  }
  geometry();
  window.addEventListener('resize', geometry);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(geometry);
  if (location.hash && window.S1) window.S1.landOnHash();   // the overlap just moved everything below the stage

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function onResize() { resize(); onScroll(); }

  // frames wait for the page's own load (poster, fonts, data) so they never compete with first paint
  if (!pageLoaded) window.addEventListener('load', function () { pageLoaded = true; if (set) pump(); }, { once: true });

  function listen(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }

  fetch(BASE + 'manifest.json')
    .then(function (r) { if (!r.ok) throw new Error('manifest ' + r.status); return r.json(); })
    .then(function (m) {
      man = m; seq = m.sequences && m.sequences.hero;
      if (!seq || !seq.count || !seq.dir) throw new Error('no hero sequence');
      if (!root.classList.contains('scrub')) return;
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      listen(mqMobile, function () { if (root.classList.contains('scrub')) { geometry(); start(); } });
      listen(mqReduce, function (e) { if (e.matches) off(); });
      start();
    })
    .catch(function () { off(); });   // no manifest (or file://): stay a static poster hero
})();
