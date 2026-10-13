/* Place Performance marketing site: motion and interactivity. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (n) { return Math.round(n).toLocaleString('en-AU'); };

  /* Opened from disk (file://): folder links would show a directory, so point them at index.html */
  if (location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#)/.test(h)) return;
      var parts = h.split('#');
      if (parts[0] === '' && h !== '') return;
      if (parts[0] === '' || /\/$/.test(parts[0])) a.setAttribute('href', parts[0] + 'index.html' + (parts[1] ? '#' + parts[1] : ''));
    });
  }

  /* ---------------- Nav ---------------- */
  var nav = document.getElementById('nav');
  var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  document.getElementById('burger').addEventListener('click', function () { nav.classList.toggle('open'); });
  nav.querySelectorAll('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });

  /* ---------------- Flowing gradient (Stripe-style) ---------------- */
  function gradient(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    canvas.width = 96; canvas.height = 48; // tiny canvas, stretched by CSS = free blur
    var blobs = [
      { c: [239, 0, 143], x: .15, y: .3, r: .55, sx: .21, sy: .17 },
      { c: [110, 195, 244], x: .55, y: .2, r: .6, sx: .13, sy: .19 },
      { c: [112, 56, 255], x: .85, y: .55, r: .65, sx: .17, sy: .11 },
      { c: [255, 186, 39], x: .35, y: .85, r: .5, sx: .11, sy: .23 },
      { c: [99, 91, 255], x: .7, y: .9, r: .55, sx: .19, sy: .13 }
    ];
    var t0 = performance.now();
    function frame(now) {
      var t = (now - t0) / 1000;
      ctx.fillStyle = '#a7b6ff'; ctx.fillRect(0, 0, 96, 48);
      blobs.forEach(function (b, i) {
        var x = (b.x + Math.sin(t * b.sx + i) * .18) * 96, y = (b.y + Math.cos(t * b.sy + i * 2) * .25) * 48, r = b.r * 96;
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(' + b.c + ',1)'); g.addColorStop(1, 'rgba(' + b.c + ',0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 96, 48);
      });
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  gradient(document.getElementById('gradient'));
  gradient(document.getElementById('gradient2'));

  /* ---------------- Ticking live numbers ---------------- */
  var tickers = [].slice.call(document.querySelectorAll('.js-tick'));
  setInterval(function () {
    tickers.forEach(function (el) {
      var base = +el.dataset.base, j = +el.dataset.jitter || 20;
      el.dataset.cur = Math.round((+el.dataset.cur || base) + (Math.random() - .45) * j);
      if (Math.abs(el.dataset.cur - base) > j * 4) el.dataset.cur = base;
      el.textContent = fmt(el.dataset.cur);
    });
  }, 2200);

  /* ---------------- Reveal on scroll ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------------- Live map of Australia ---------------- */
  // coastline (lon, lat), simplified; projected to a 1000 x 880 box
  var COAST = [[113.6,-22],[114.1,-26.4],[115,-29.5],[115.7,-31.9],[115,-33.6],[115.2,-34.3],[118,-35],[121.9,-33.9],[124,-33],[126,-32.3],[129,-31.6],[131,-31.5],[133.8,-32],[135.6,-34.8],[137.5,-33],[137.8,-34.8],[138.5,-34.9],[138.2,-35.6],[139.6,-36.5],[140.8,-38],[142,-38.4],[143.5,-38.8],[144.9,-37.9],[145.5,-38.6],[146.4,-39.1],[147.9,-37.9],[149.9,-37.5],[150.2,-35.7],[151.2,-33.9],[152.5,-32.4],[153.6,-28.6],[153.1,-25.3],[151.3,-23.9],[149.2,-21.1],[146.8,-19.3],[145.8,-16.9],[145.3,-15],[143.5,-14],[142.5,-10.7],[141.6,-12.6],[141.5,-15],[140.8,-17.5],[139.3,-17.4],[137,-15.9],[135.9,-14.6],[136.7,-12.2],[135.2,-12.2],[132.6,-11.5],[131,-12.2],[130.8,-12.4],[129.5,-14.8],[128.1,-15],[126.6,-14],[124.5,-16.2],[123,-16.4],[122.2,-18],[121,-19.6],[118.6,-20.3],[116.7,-20.6],[114.6,-21.8]];
  var TAS = [[144.6,-40.7],[148.3,-40.9],[148.3,-42.2],[147.9,-43.2],[146,-43.6],[145.2,-42.2]];
  var px = function (lon, lat) { return [(lon - 112) * 23.2, (-10 - lat) * 25.6]; };
  var inPoly = function (x, y, pts) {
    var ins = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      if (((pts[i][1] > y) !== (pts[j][1] > y)) && (x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0])) ins = !ins;
    }
    return ins;
  };
  var SITES = [
    { n: 'Harbourside Library', z: "Children's Area", lon: 151.207, lat: -33.868, v: 97 },
    { n: 'Riverside Market Hall', z: 'Food Court', lon: 153.026, lat: -27.47, v: 84 },
    { n: 'Westgate Shopping Centre', z: 'Customer Services', lon: 115.861, lat: -31.95, v: 86 },
    { n: 'Civic Tower', z: 'Level 7', lon: 144.967, lat: -37.815, v: 41 },
    { n: 'Rundle Learning Hub', z: 'Reading Room', lon: 138.605, lat: -34.922, v: 33 },
    { n: 'Capital Civic Centre', z: 'Ground Floor', lon: 149.129, lat: -35.282, v: 38 },
    { n: 'City Library', z: 'Study Rooms', lon: 147.327, lat: -42.882, v: 52 },
    { n: 'Coastal Campus', z: 'Lecture Theatre 2', lon: 146.817, lat: -19.259, v: 71 },
    { n: 'Civic Centre', z: 'Service Desk', lon: 130.846, lat: -12.463, v: 44 },
    { n: 'Foreshore Trail', z: 'Cyclists / hr', lon: 153.43, lat: -28.017, v: 64, unit: '' },
    { n: 'Town Hall', z: 'Main Hall', lon: 144.36, lat: -38.15, v: 58 },
    { n: 'Esplanade Path', z: 'Pedestrians', lon: 145.773, lat: -16.92, v: 47 },
    { n: 'Harbour Precinct', z: 'Plaza', lon: 150.893, lat: -34.425, v: 62 },
    { n: 'Visitor Centre', z: 'Entrance', lon: 133.885, lat: -23.698, v: 29 },
    { n: 'Regional Campus', z: 'Library', lon: 144.28, lat: -36.757, v: 55 },
    { n: 'Stadium Precinct', z: 'Gate C', lon: 151.78, lat: -32.928, v: 76 },
    { n: 'Town Centre', z: 'Car park entry', lon: 151.95, lat: -27.56, v: 35 },
    { n: 'Northern Library', z: 'Makerspace', lon: 147.14, lat: -41.44, v: 40 }
  ];
  var color = function (v) { return v >= 90 ? '#ef4444' : v >= 80 ? '#f97316' : v >= 60 ? '#f59e0b' : '#10b981'; };

  var mapEl = document.getElementById('live-map');
  if (mapEl) {
    var svg = mapEl.querySelector('svg.au');
    svg.setAttribute('viewBox', '0 0 1000 880');
    var main = COAST.map(function (p) { return px(p[0], p[1]); }), tas = TAS.map(function (p) { return px(p[0], p[1]); });
    var dots = '';
    for (var y = 8; y < 880; y += 17) {
      for (var x = 8; x < 1000; x += 17) {
        if (inPoly(x, y, main) || inPoly(x, y, tas)) dots += '<circle class="au-dot" cx="' + x + '" cy="' + y + '" r="4.6"/>';
      }
    }
    svg.innerHTML = dots;

    var pinsEl = document.getElementById('map-pins'), feedEl = document.getElementById('map-feed');
    var pins = SITES.map(function (s, i) {
      var el = document.createElement('div');
      el.className = 'pin' + (s.lon > 148 ? ' left' : '');
      el.style.setProperty('--d', (i * .37 % 2.4) + 's');
      el.innerHTML = '<div class="pin-dot"></div><div class="pin-label">' + s.n + '<em>' + s.v + '%</em></div>';
      pinsEl.appendChild(el);
      return { s: s, el: el };
    });
    var place = function () {
      var mr = mapEl.getBoundingClientRect(), sr = svg.getBoundingClientRect();
      pins.forEach(function (p) {
        var q = px(p.s.lon, p.s.lat);
        p.el.style.left = (sr.left - mr.left + q[0] / 1000 * sr.width) + 'px';
        p.el.style.top = (sr.top - mr.top + q[1] / 880 * sr.height) + 'px';
      });
    };
    var paint = function (p) {
      p.el.style.setProperty('--c', color(p.s.v));
      p.el.querySelector('em').textContent = p.s.unit === '' ? p.s.v + '/hr' : p.s.v + '%';
    };
    pins.forEach(paint);
    place(); window.addEventListener('resize', place); setTimeout(place, 300);

    var feed = function (p) {
      var it = document.createElement('div');
      // one row per site: replace its previous row instead of repeating it
      [].slice.call(feedEl.children).forEach(function (c) { if (c.dataset.site === p.s.n) c.remove(); });
      it.className = 'feed-item'; it.dataset.site = p.s.n; it.style.setProperty('--c', color(p.s.v));
      it.innerHTML = '<i></i><div title="' + p.s.n + ' · ' + p.s.z + '"><b>' + p.s.n + '</b><br>' + p.s.z + '</div><span>' + (p.s.unit === '' ? p.s.v + '/hr' : p.s.v + '%') + '</span>';
      feedEl.insertBefore(it, feedEl.firstChild);
      while (feedEl.children.length > 3) feedEl.removeChild(feedEl.lastChild);
    };
    // the three issues from the demo start in the feed
    [pins[2], pins[1], pins[0]].forEach(feed);
    pins[0].el.classList.add('show');

    var shown = pins[0]; // one label at a time
    setInterval(function () {
      var p = pins[Math.floor(Math.random() * pins.length)];
      var hot = p.s.v >= 80;
      p.s.v = Math.max(8, Math.min(99, Math.round(p.s.v + (Math.random() - .5) * (hot ? 6 : 14))));
      paint(p);
      p.el.classList.remove('pop'); void p.el.offsetWidth; p.el.classList.add('pop');
      if (shown) shown.el.classList.remove('show');
      p.el.classList.add('show'); shown = p;
      feed(p);
    }, reduce ? 99999 : 1900);
  }

  /* ---------------- Alert toasts ---------------- */
  var toasts = [
    { c: '#ef4444', bg: '#fef2f2', i: '!', t: "Children's Area at 97% capacity", s: 'Harbourside Library · over limit for 12 min', via: 'SMS · Email' },
    { c: '#f97316', bg: '#fff7ed', i: '⏱', t: 'Queue wait above 8 minutes', s: 'Westgate · Customer Services', via: 'Teams' },
    { c: '#6b7c93', bg: '#f1f5f9', i: '⚡', t: 'Sensor offline at Reading Room', s: 'Rundle Learning Hub · ITESA notified', via: 'Email' },
    { c: '#10b981', bg: '#ecfdf5', i: '✓', t: 'Weekly report delivered', s: '6 recipients · Monday 7:00am', via: 'Email' },
    { c: '#635bff', bg: '#eef0ff', i: '✦', t: 'Forecast: Saturday peak 87%', s: 'Riverside Market Hall · plan staffing', via: 'In-app' }
  ];
  var stack = document.getElementById('toast-stack');
  if (stack) {
    var ti = 0;
    var push = function () {
      var d = toasts[ti++ % toasts.length];
      var el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = '<span class="toast-ico" style="background:' + d.bg + ';color:' + d.c + '">' + d.i + '</span><div><b>' + d.t + '</b><small>' + d.s + '</small></div><span class="via">' + d.via + '</span>';
      stack.insertBefore(el, stack.firstChild);
      if (stack.children.length > 3) { var last = stack.lastChild; last.classList.add('out'); setTimeout(function () { last.remove(); }, 400); }
    };
    push(); push();
    setInterval(push, reduce ? 99999 : 3200);
  }

  /* ---------------- AI chat demo ---------------- */
  var chat = document.getElementById('chat-demo');
  if (chat) {
    var answer = 'The fullest zones right now: <b>Children\'s Area</b> at Harbourside Library is at <b>97%</b>, Customer Services at Westgate at <b>86%</b>, and the Food Court at Riverside at <b>84%</b>. I\'d open the overflow space in the Children\'s Area first.';
    var played = false;
    new IntersectionObserver(function (e, obs) {
      if (!e[0].isIntersecting || played) return;
      played = true; obs.disconnect();
      var a = chat.querySelector('.chat-a');
      setTimeout(function () {
        // type it out, keeping HTML tags intact
        var parts = answer.split(/(<[^>]+>)/), out = '', pi = 0, ci = 0;
        a.innerHTML = '';
        var step = function () {
          if (pi >= parts.length) return;
          var part = parts[pi];
          if (part.charAt(0) === '<') { out += part; pi++; ci = 0; }
          else { out += part.slice(ci, ci + 3); ci += 3; if (ci >= part.length) { pi++; ci = 0; } }
          a.innerHTML = out;
          setTimeout(step, 18);
        };
        reduce ? (a.innerHTML = answer) : step();
      }, 1100);
    }, { threshold: .5 }).observe(chat);
  }

  /* ---------------- Solution tabs ---------------- */
  var tabs = document.querySelectorAll('#sol-tabs .tab');
  var show = function (key) {
    tabs.forEach(function (t) { t.classList.toggle('on', t.dataset.tab === key); });
    document.querySelectorAll('.sol').forEach(function (p) { p.classList.toggle('on', p.dataset.panel === key); });
  };
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.tab); }); });
  document.querySelectorAll('[data-goto]').forEach(function (a) { a.addEventListener('click', function () { show(a.dataset.goto); }); });

  /* ---------------- Demo form (not connected to a backend yet) ---------------- */
  var form = document.getElementById('demo-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = document.getElementById('form-note');
    note.textContent = 'Thanks, ' + (form.name.value.split(' ')[0] || 'there') + '. We\'ll be in touch within one business day.';
    note.classList.add('ok');
    form.querySelector('button').disabled = true;
  });
})();
