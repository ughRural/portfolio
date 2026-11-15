(function () {
  'use strict';

  var NAME = 'aavid mathrawala';
  var PAGES = ['home', 'experience', 'projects', 'contact'];
  var DURATION = 280; // matches the .page transition in styles.css
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var nav = document.getElementById('site-nav');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.nav-btn'));

  function pageFromHash() {
    var p = location.hash.replace('#', '');
    return PAGES.indexOf(p) >= 0 ? p : 'home';
  }

  var current = pageFromHash();

  function pageEl(name) { return document.getElementById('page-' + name); }

  function markActive(name) {
    buttons.forEach(function (b) {
      var on = b.dataset.page === name;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }

  function staggerIn(el) {
    var items = el.querySelectorAll('.fade-item');
    items.forEach(function (it) { it.classList.remove('visible'); });
    items.forEach(function (it, i) {
      setTimeout(function () { it.classList.add('visible'); }, 60 + i * 80);
    });
  }

  function switchPage(to) {
    if (to === current) return;
    var out = pageEl(current), inn = pageEl(to);
    current = to;
    markActive(to);
    out.classList.add('page-exit');
    setTimeout(function () {
      PAGES.forEach(function (p) {
        pageEl(p).classList.add('page-hidden');
        pageEl(p).classList.remove('page-exit');
      });
      // a faster second click may have changed the target while we waited
      inn = pageEl(current);
      inn.classList.remove('page-hidden');
      inn.classList.add('page-enter');
      void inn.offsetHeight;
      inn.classList.remove('page-enter');
      window.scrollTo(0, 0);
      staggerIn(inn);
    }, reduced ? 0 : DURATION);
  }

  // every [data-page] element (nav buttons and the logo) switches pages
  document.querySelectorAll('[data-page]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var page = el.dataset.page;
      if (page === current) return;
      history.pushState(null, '', page === 'home' ? location.pathname : '#' + page);
      switchPage(page);
    });
  });
  window.addEventListener('popstate', function () { switchPage(pageFromHash()); });
  window.addEventListener('hashchange', function () { switchPage(pageFromHash()); });

  // show the page named in the url on first load
  PAGES.forEach(function (p) { pageEl(p).classList.toggle('page-hidden', p !== current); });
  markActive(current);

  // ── typewriter intro ──
  var text = document.getElementById('tw-text');
  var cursor = document.getElementById('tw-cursor');

  function reveal() {
    cursor.classList.add('done');
    // split the name into letters so one of them can misbehave like a tired tube
    text.textContent = '';
    NAME.split('').forEach(function (ch, n) {
      var s = document.createElement('span');
      s.textContent = ch;
      if (n === 9) s.className = 'dud';
      text.appendChild(s);
    });
    document.getElementById('site-sub').classList.add('show');
    document.querySelector('.sign').classList.add('lit');
    nav.classList.add('show');
    setTimeout(function () {
      document.getElementById('site-divider').classList.add('show');
      document.getElementById('site-content').classList.add('show');
      setTimeout(function () { staggerIn(pageEl(current)); }, reduced ? 0 : 300);
    }, reduced ? 0 : 550);
  }

  if (reduced) {
    text.textContent = NAME;
    reveal();
  } else {
    var i = 0;
    (function type() {
      if (i <= NAME.length) {
        text.textContent = NAME.slice(0, i++);
        setTimeout(type, 70);
      } else {
        setTimeout(reveal, 450);
      }
    })();
  }

  // ── experience: click a role to open it ──
  document.querySelectorAll('.xp-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var open = head.parentElement.classList.toggle('open');
      head.setAttribute('aria-expanded', String(open));
    });
  });

  // ── live stats on the home page ──
  // Each value drifts as a random walk inside its range.
  function drift(el, range, step, every) {
    var v = null;
    function tick() {
      var r = range();
      if (v === null || v < r[0] || v > r[1]) v = r[0] + Math.random() * (r[1] - r[0]);
      v += (Math.random() - 0.5) * 2 * step(r);
      v = Math.min(r[1], Math.max(r[0], v));
      el.textContent = Math.round(v);
    }
    tick();
    setInterval(tick, every);
  }

  // 6:30 pm to 8:00 pm eastern, every day
  var easternClock = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
  });
  function isTrainingTime() {
    var h = 0, m = 0;
    easternClock.formatToParts(new Date()).forEach(function (p) {
      if (p.type === 'hour') h = Number(p.value);
      if (p.type === 'minute') m = Number(p.value);
    });
    var mins = h * 60 + m;
    return mins >= 18 * 60 + 30 && mins < 20 * 60;
  }

  var hr = document.getElementById('stat-hr'), emg = document.getElementById('stat-emg');
  if (hr && emg) {
    if (reduced) {
      hr.textContent = '60–85';
      emg.textContent = isTrainingTime() ? '500–1000' : '200–350';
    } else {
      drift(hr, function () { return [60, 85]; }, function () { return 2; }, 1100);
      drift(emg, function () { return isTrainingTime() ? [500, 1000] : [200, 350]; },
        function (r) { return (r[1] - r[0]) * 0.18; }, 220);
    }
  }

  // ── signal traces for the project cards ──
  // Each path is drawn two periods wide (2 x 400 units) so the css scroll loops seamlessly.
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var W = 400;

  function eegPoints(rand, y, amp) {
    var freqs = [3, 5, 8, 11, 17, 23].map(function (f) {
      return { f: f, a: 0.25 + rand() * 0.75, p: rand() * Math.PI * 2 };
    });
    var total = freqs.reduce(function (s, c) { return s + c.a; }, 0);
    var pts = [];
    for (var x = 0; x < W; x += 2) {
      var v = 0;
      freqs.forEach(function (c) { v += c.a * Math.sin(2 * Math.PI * c.f * x / W + c.p); });
      pts.push(y + amp * v / total * 1.8);
    }
    return pts;
  }

  function emgPoints(rand, y, amp) {
    var pts = [];
    for (var x = 0; x < W; x += 1.5) {
      var burst = Math.max(0, Math.sin(2 * Math.PI * 2 * x / W - 1));
      var env = 0.06 + 0.94 * burst * burst;
      pts.push(y + amp * env * (rand() * 2 - 1));
    }
    return pts;
  }

  document.querySelectorAll('path[data-trace]').forEach(function (path) {
    var rand = rng(Number(path.dataset.seed));
    var y = Number(path.dataset.y), amp = Number(path.dataset.amp);
    var pts = path.dataset.trace === 'emg' ? emgPoints(rand, y, amp) : eegPoints(rand, y, amp);
    var step = W / pts.length;
    var d = '';
    for (var k = 0; k <= pts.length * 2; k++) {
      d += (k ? 'L' : 'M') + (k * step).toFixed(1) + ' ' + pts[k % pts.length].toFixed(1);
    }
    path.setAttribute('d', d);
  });
})();
