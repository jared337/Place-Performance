/* =========================================================
   Place Performance prototype, shared helpers.
   Plain browser scripts (no build step) sharing the PP namespace.
   ========================================================= */
var PP = window.PP = window.PP || {};

/* ---------- Seeded randomness so mock data is stable between reloads ---------- */
PP.hash = function (str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

PP.rng = function (seed) {
  var a = typeof seed === 'string' ? PP.hash(seed) : seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

PP.between = function (r, lo, hi) { return lo + r() * (hi - lo); };
PP.pick = function (r, arr) { return arr[Math.floor(r() * arr.length)]; };

/* ---------- Formatting ---------- */
PP.fmt = function (n) { return Math.round(n).toLocaleString('en-AU'); };
PP.fmt1 = function (n) { return (Math.round(n * 10) / 10).toLocaleString('en-AU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };
PP.money = function (n) { return '$' + Math.round(n).toLocaleString('en-AU'); };
PP.pct = function (n) { return Math.round(n) + '%'; };
PP.short = function (v) {
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(Math.abs(v) >= 10000 ? 0 : 1) + 'k';
  return String(Math.round(v));
};
PP.mins = function (m) {
  if (m < 60) return Math.round(m) + ' min';
  var h = Math.floor(m / 60), r = Math.round(m % 60);
  return h + 'h ' + (r ? r + 'm' : '');
};
PP.ago = function (mins) {
  if (mins < 1) return 'just now';
  if (mins < 60) return Math.round(mins) + ' min ago';
  if (mins < 1440) return Math.round(mins / 60) + ' h ago';
  return Math.round(mins / 1440) + ' d ago';
};
PP.hourLabel = function (h) {
  h = ((h % 24) + 24) % 24;
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? h + 'am' : (h - 12) + 'pm';
};
PP.DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
PP.MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
PP.dateLabel = function (d) { return d.getDate() + ' ' + PP.MONTHS[d.getMonth()]; };
PP.daysBack = function (n) {
  var out = [], now = new Date();
  for (var i = n - 1; i >= 0; i--) { var d = new Date(now); d.setDate(now.getDate() - i); out.push(d); }
  return out;
};
PP.daysAhead = function (n) {
  var out = [], now = new Date();
  for (var i = 1; i <= n; i++) { var d = new Date(now); d.setDate(now.getDate() + i); out.push(d); }
  return out;
};
PP.stamp = function (minsAgo) {
  var d = new Date(Date.now() - minsAgo * 60000);
  return PP.dateLabel(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

PP.esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};
PP.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
PP.sum = function (arr) { return arr.reduce(function (a, b) { return a + b; }, 0); };
PP.avg = function (arr) { return arr.length ? PP.sum(arr) / arr.length : 0; };
PP.range = function (n) { return Array.from({ length: n }, function (_, i) { return i; }); };
PP.initials = function (name) { return name.split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase(); };

/* ---------- Occupancy colour scale ---------- */
/* Traffic-light status for occupancy: green is fine, amber/orange are busy, red needs action.
   (Charts stay indigo/grey so these colours only ever mean status.) */
PP.occColor = function (p) {
  if (p >= 0.9) return '#ef4444';
  if (p >= 0.8) return '#f97316';
  if (p >= 0.6) return '#f59e0b';
  return '#10b981';
};
PP.occClass = function (p) { return p >= 0.9 ? 'st-bad' : p >= 0.6 ? 'st-warn' : 'st-ok'; };
/* A site's status is set by its worst zone, so one over-capacity room flags the whole site. */
PP.siteStatus = function (site) {
  var zones = site.spaces.reduce(function (a, sp) { return a.concat(sp.zones); }, []);
  var hot = zones.map(function (z) { return { z: z, p: z.occ / z.capacity }; }).filter(function (h) { return h.p >= 0.8; }).sort(function (a, b) { return b.p - a.p; });
  var over = hot.filter(function (h) { return h.p >= 0.9; }).length;
  var occ = PP.sum(zones.map(function (z) { return z.occ; })) / PP.sum(zones.map(function (z) { return z.capacity; }));
  var level = over ? 3 : hot.length ? 2 : occ >= 0.6 ? 1 : 0;
  return {
    level: level, hot: hot,
    color: ['#10b981', '#f59e0b', '#f97316', '#ef4444'][level],
    note: over ? over + (over === 1 ? ' zone' : ' zones') + ' over 90%' : hot.length ? hot.length + (hot.length === 1 ? ' zone' : ' zones') + ' over 80%' : ''
  };
};
PP.scoreColor = function (s) { return s >= 75 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'; };

/* ---------- Geometry ---------- */
PP.polyArea = function (pts) {
  var a = 0;
  for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(a / 2);
};
PP.polyBox = function (pts) {
  var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
  return { x: Math.min.apply(null, xs), y: Math.min.apply(null, ys), x2: Math.max.apply(null, xs), y2: Math.max.apply(null, ys) };
};
PP.polyCenter = function (pts) {
  var b = PP.polyBox(pts);
  return [(b.x + b.x2) / 2, (b.y + b.y2) / 2];
};
PP.inPoly = function (x, y, pts) {
  var inside = false;
  for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
};
PP.polyPoints = function (pts) { return pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '); };

/* ---------- Mount / unmount lifecycle for each rendered screen ---------- */
PP._mounts = [];
PP._unmounts = [];
PP.onMount = function (fn) { PP._mounts.push(fn); };
PP.onUnmount = function (fn) { PP._unmounts.push(fn); };
PP.runMounts = function () { var m = PP._mounts; PP._mounts = []; m.forEach(function (fn) { fn(); }); };
PP.runUnmounts = function () { var u = PP._unmounts; PP._unmounts = []; u.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } }); };
PP.uid = function (p) { return (p || 'u') + Math.random().toString(36).slice(2, 8); };

/* ---------- Delegated actions: data-action="name" calls PP.actions[name](el, event) ---------- */
PP.actions = {};
PP.inputs = {};

/* ---------- Icons (inline SVG, stroke style) ---------- */
PP.ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  dash: '<rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  chev: '<path d="M9 18l6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 17v3h16v-3"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 18v2h16v-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  layers: '<path d="M12 3 2 8l10 5 10-5z"/><path d="M2 13l10 5 10-5"/>',
  flow: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6 8l5 8M18 8l-5 8"/>',
  fire: '<path d="M12 21c-4 0-7-2.7-7-6.5 0-3.5 3-5.5 3.5-9 2 1.5 3 3.5 3 5.5 1-1 1.5-2.5 1.5-4 3 2 6 5.2 6 8C19 18.3 16 21 12 21z"/>',
  queue: '<circle cx="5" cy="7" r="2"/><circle cx="12" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><path d="M3 17h18M3 13h18"/>',
  dollar: '<path d="M12 3v18M16.5 7.5c-.8-1.3-2.4-2-4.5-2-2.6 0-4.5 1.3-4.5 3.2 0 4.3 9 2.3 9 6.6 0 1.9-1.9 3.2-4.5 3.2-2.2 0-3.9-.8-4.7-2.2"/>',
  people: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3"/><path d="M4 4v4h4M20 20v-4h-4"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3M16 7l3 3M14 9l2 2"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h12L22 7H6"/>',
  car: '<path d="M5 17h14M4 17v-5l2-5h12l2 5v5M7 17v2M17 17v2"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
  ticket: '<path d="M3 8V6h18v2a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4v2H3v-2a2 2 0 0 0 0-4v-2a2 2 0 0 0 0-4z"/>',
  thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>'
};
PP.icon = function (name, cls) {
  return '<svg class="' + (cls || 'ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PP.ICONS[name] || '') + '</svg>';
};
