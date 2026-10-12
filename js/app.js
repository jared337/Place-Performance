/* =========================================================
   Place Performance prototype, router, shell, preview controls.
   ========================================================= */
PP.S = PP.S || {};

/* Drill-down routes name the feature they belong to so access is checked per feature. */
PP.ROUTES = [
  { re: /^\/login$/, fn: 'login', screen: 'login', bare: true },
  { re: /^\/home$/, fn: 'home', screen: 'home' },
  { re: /^\/place(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?$/, fn: 'place', screen: 'place' },
  { re: /^\/portfolio$/, fn: 'portfolio', screen: 'portfolio' },
  { re: /^\/portfolio\/benchmarking$/, fn: 'benchmarking', screen: 'portfolio', feature: 'benchmarking' },
  { re: /^\/intelligence$/, fn: 'intel', screen: 'intel' },
  { re: /^\/intelligence\/investment(?:\/([^/]+))?$/, fn: 'investment', screen: 'intel', feature: 'investment' },
  { re: /^\/scenarios$/, fn: 'scenarios', screen: 'scenarios' },
  { re: /^\/scenarios\/compare$/, fn: 'scenarioCompare', screen: 'scenarios', feature: 'scenario-compare' },
  { re: /^\/reports$/, fn: 'reports', screen: 'reports' },
  { re: /^\/reports\/([^/]+)$/, fn: 'reportDetail', screen: 'reports', feature: 'report-detail' },
  { re: /^\/alerts$/, fn: 'alerts', screen: 'alerts' },
  { re: /^\/alerts\/([^/]+)$/, fn: 'alertDetail', screen: 'alerts', feature: 'alert-detail' },
  { re: /^\/devices$/, fn: 'devices', screen: 'devices' },
  { re: /^\/devices\/([^/]+)$/, fn: 'deviceDetail', screen: 'devices', feature: 'device-detail' },
  { re: /^\/integrations$/, fn: 'integrations', screen: 'integrations' },
  { re: /^\/org$/, fn: 'org', screen: 'org' },
  { re: /^\/org\/sites(?:\/([^/]+))?$/, fn: 'orgSites', screen: 'org', feature: 'sites-editor' },
  { re: /^\/org\/users$/, fn: 'orgUsers', screen: 'org', feature: 'user-mgmt' },
  { re: /^\/profile$/, fn: 'profile', screen: 'profile' },
  { re: /^\/admin$/, fn: 'adminDash', screen: 'admin-dash' },
  { re: /^\/admin\/issues\/([^/]+)$/, fn: 'issueDetail', screen: 'admin-dash', feature: 'issue-detail' },
  { re: /^\/admin\/customers$/, fn: 'customers', screen: 'customers' },
  { re: /^\/admin\/customers\/new$/, fn: 'onboarding', screen: 'customers', feature: 'onboarding' },
  { re: /^\/admin\/customers\/([^/]+)$/, fn: 'customerProfile', screen: 'customers', feature: 'customer-profile' },
  { re: /^\/admin\/fleet$/, fn: 'fleet', screen: 'fleet' },
  { re: /^\/admin\/fleet\/provision$/, fn: 'provision', screen: 'fleet', feature: 'provisioning' },
  { re: /^\/admin\/fleet\/([^/]+)$/, fn: 'fleetDevice', screen: 'fleet', feature: 'device-detail-admin' },
  { re: /^\/admin\/users$/, fn: 'globalUsers', screen: 'users' },
  { re: /^\/admin\/users\/([^/]+)$/, fn: 'globalUser', screen: 'users', feature: 'user-detail-admin' },
  { re: /^\/admin\/audit$/, fn: 'audit', screen: 'audit' },
  { re: /^\/admin\/billing$/, fn: 'billing', screen: 'billing' },
  { re: /^\/admin\/billing\/([^/]+)$/, fn: 'billingDetail', screen: 'billing', feature: 'billing-detail' }
];

PP.defaultRoute = function () { return PP.state.role === 'admin' ? '/admin' : '/home'; };
PP.go = function (path) { if (location.hash === '#' + path) PP.render(); else location.hash = path; };

/* ---------------- State ---------------- */
var STORE_KEY = 'pp_prototype_state_v2';
(function loadState() {
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved) ['level', 'role', 'multi', 'showLocked', 'annot'].forEach(function (k) { if (saved[k] != null) PP.state[k] = saved[k]; });
  } catch (e) { /* storage unavailable, defaults are fine */ }
})();

PP.setState = function (patch) {
  var roleChanged = patch.role && patch.role !== PP.state.role;
  Object.assign(PP.state, patch);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ level: PP.state.level, role: PP.state.role, multi: PP.state.multi, showLocked: PP.state.showLocked, annot: PP.state.annot }));
  } catch (e) { /* ignore */ }
  PP.renderPreviewBar();
  if (PP.ai) PP.ai.render();
  if (roleChanged && !(PP.current && PP.current.route.bare)) PP.go(PP.defaultRoute());
  else PP.render(true);
};

/* ---------------- Guards ---------------- */
PP.guard = function (route) {
  var sc = PP.screen(route.screen);
  var acc = sc.id === 'login' ? 'ok' : PP.screenAccess(sc);
  var role = PP.ROLES[PP.state.role];
  if (acc === 'hidden') {
    if (sc.section === 'admin') {
      return PP.empty('shield', 'Platform Administration is internal', 'This area is only for ITESA / Rayven staff. Customers never see it.', '<button class="btn btn-primary" data-action="pv" data-k="role" data-v="admin">Preview as Platform Administrator</button>');
    }
    if (sc.multi && !PP.state.multi) {
      return PP.empty('globe', 'Portfolio Overview is for multi-site customers', 'This customer is previewed as single-site, so the portfolio level and its interface are not shown.', '<button class="btn btn-primary" data-action="pv" data-k="multi" data-v="1">Preview as multi-site customer</button>');
    }
    return PP.empty('lock', sc.name + ' is not available to the ' + role.short + ' role', 'None of the features on this interface are nominated for this role in the spec.', '<button class="btn" data-go="' + PP.defaultRoute() + '">Go to home</button>');
  }
  if (acc === 'locked') return PP.lockedScreen(sc);
  if (route.feature) {
    var f = PP.FEATURES[route.feature];
    if (!PP.roleOk(f.id)) return PP.empty('lock', f.name + ' is not available to the ' + role.short + ' role', 'This drill-down is nominated for other roles only.', '<button class="btn" data-go="' + sc.route + '">Back to ' + sc.name + '</button>');
    if (!PP.levelOk(f.id)) return PP.empty('lock', f.name + ' is part of ' + PP.levelName(f.level), PP.LEVELS[f.level - 1].tagline, '<button class="btn btn-primary" data-action="set-level" data-level="' + f.level + '">Preview at Level ' + f.level + '</button>');
  }
  return null;
};

PP.lockedScreen = function (sc) {
  var min = PP.screenMinLevel(sc);
  var feats = sc.features.filter(PP.roleOk).map(function (id) { return PP.FEATURES[id]; });
  var lv = PP.LEVELS[min - 1];
  return PP.pageHead({ title: sc.name, screen: sc.id }) +
    '<div class="card locked" style="max-width:760px"><div class="locked-b"><div class="locked-ico">' + PP.icon('lock') + '</div><div>' +
    '<h4 style="font-size:17px;color:var(--ink)">Unlock ' + PP.esc(sc.name) + ' with ' + PP.levelName(min) + '</h4>' +
    '<p style="font-size:13.5px">' + lv.verb + ', "' + lv.tagline + '" This customer is on ' + PP.levelName(PP.state.level) + '.</p>' +
    '<div class="pills" style="margin-bottom:14px">' + feats.map(function (f) { return '<span class="pill">' + f.name + ' · L' + f.level + '</span>'; }).join('') + '</div>' +
    '<button class="btn btn-primary" data-action="set-level" data-level="' + min + '">Preview at Level ' + min + '</button></div></div></div>';
};

/* ---------------- Rendering ---------------- */
PP.crumbs = null;

PP.render = function (keepScroll) {
  PP.runUnmounts();
  PP.overlay.closeAll();
  var path = location.hash.replace(/^#/, '') || PP.defaultRoute();
  var route = null, m = null;
  for (var i = 0; i < PP.ROUTES.length; i++) { m = path.match(PP.ROUTES[i].re); if (m) { route = PP.ROUTES[i]; break; } }
  if (!route) { location.hash = PP.defaultRoute(); return; }
  var prev = PP.current ? PP.current.path : null;
  PP.current = { path: path, route: route };
  PP.crumbs = null;
  var html = PP.guard(route);
  if (!html) html = PP.S[route.fn].apply(null, m.slice(1));
  var app = document.getElementById('app');
  app.innerHTML = route.bare ? html : PP.shell(route, html);
  document.body.classList.toggle('annot-off', !PP.state.annot);
  PP.runMounts();
  if (!keepScroll) PP.countUp(app);
  if (!keepScroll && prev !== path) window.scrollTo(0, 0);
};

PP.shell = function (route, content) {
  var st = PP.state, role = PP.ROLES[st.role];
  function navItems(section) {
    return PP.SCREENS.filter(function (s) { return s.section === section && s.nav !== false; }).map(function (sc) {
      var acc = PP.screenAccess(sc);
      if (acc === 'hidden' || (acc === 'locked' && !st.showLocked)) return '';
      var on = route.screen === sc.id ? ' on' : '';
      return '<div class="nav-item' + on + (acc === 'locked' ? ' nav-locked' : '') + '" data-go="' + sc.route + '">' + PP.icon(sc.icon) + '<span>' + sc.name + '</span>' +
        (acc === 'locked' ? PP.icon('lock', 'lock') : '<span class="nav-num annot">' + sc.num + '</span>') + '</div>';
    }).join('');
  }
  var lv = PP.LEVELS[st.level - 1];
  var side = '<aside class="side" id="side">' +
    '<div class="brand"><div class="cust-logo">' + PP.CUSTOMER.initials + '</div><div style="min-width:0"><div class="brand-name">' + PP.CUSTOMER.name + '</div><div class="brand-sub">Level ' + lv.n + ' ' + lv.name + ' · ' + (st.multi ? PP.ALL_SITES.length + ' sites' : '1 site') + '</div></div></div>' +
    '<div class="nav-sec">Customer Application</div>' + navItems('customer') +
    (st.role === 'admin' ? '<div class="nav-sec admin">Platform Administration</div>' + navItems('admin') : '') +
    '<div class="side-foot"><div class="powered"><span class="brand-mark">PP</span>Powered by <b>Place Performance</b></div>Rayven × ITESA · prototype with sample data</div>' +
    '</aside>';

  var sc = PP.screen(route.screen);
  var crumbs = PP.crumbs || [{ label: sc.section === 'admin' ? 'Platform Administration' : PP.CUSTOMER.short }, { label: sc.name }];
  var crumbHtml = crumbs.map(function (c, i) {
    var last = i === crumbs.length - 1;
    return (i ? '<span class="sep">/</span>' : '') + (last ? '<span class="cur">' + PP.esc(c.label) + '</span>' : c.go ? '<a href="#' + c.go + '">' + PP.esc(c.label) + '</a>' : '<span>' + PP.esc(c.label) + '</span>');
  }).join('');

  var openAlerts = PP.visibleAlerts().filter(function (a) { return a.status === 'open'; }).length;
  var menuItems = '';
  if (PP.can('personal')) menuItems += '<div class="menu-item" data-go="/profile">' + PP.icon('user') + 'My profile</div>';
  if (PP.can('org-profile')) menuItems += '<div class="menu-item" data-go="/org">' + PP.icon('settings') + 'Organisation settings</div>';
  menuItems += '<div class="menu-item" data-action="screen-map">' + PP.icon('map') + 'Screen map</div>';
  menuItems += '<div class="menu-item" data-go="/login">' + PP.icon('logout') + 'Sign out</div>';

  var top = '<header class="top"><button class="top-burger" data-action="nav-toggle" aria-label="Menu">' + PP.icon('menu') + '</button>' +
    '<nav class="top-crumbs">' + crumbHtml + '</nav>' +
    '<div class="top-right">' +
    (PP.roleOk('ask-ai') ? '<button class="ai-btn' + (PP.can('ask-ai') ? '' : ' locked-btn') + '" data-action="ai-toggle" title="Ask Place Assistant (Ctrl+J)">' + PP.icon('sparkle') + 'Ask AI' + (PP.can('ask-ai') ? '' : PP.icon('lock', 'ico lk')) + '</button>' : '') +
    (sc.section === 'customer' ? '<span class="live-pill"><span class="pulse"></span>Live</span>' : '<span class="chip chip-admin">Internal · ITESA / Rayven</span>') +
    (PP.can('notif-feed') ? '<button class="icon-btn" data-go="/alerts" title="Alerts">' + PP.icon('bell') + (openAlerts ? '<span class="dot"></span>' : '') + '</button>' : '') +
    '<div class="menu" id="user-menu"><button class="avatar" data-action="menu-toggle">' + PP.initials(role.who) + '</button>' +
    '<div class="menu-pop"><div class="menu-head"><b>' + role.who + '</b><span>' + role.label + '<br>' + role.org + '</span></div>' + menuItems + '</div></div>' +
    '</div></header>';

  return '<div class="shell">' + side + '<div class="main">' + top + '<main class="content">' + content + '</main></div></div>';
};

/* ---------------- Preview bar ---------------- */
PP.renderPreviewBar = function () {
  var st = PP.state;
  function seg(k, opts) {
    return '<div class="seg">' + opts.map(function (o) {
      var on = String(st[k]) === String(o[0]) || (k === 'multi' && (st.multi ? '1' : '0') === o[0]);
      return '<button class="' + (on ? 'on' : '') + '" data-action="pv" data-k="' + k + '" data-v="' + o[0] + '" title="' + (o[2] || '') + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }
  var lv = PP.LEVELS[st.level - 1];
  var bar = document.getElementById('preview-bar');
  bar.classList.toggle('open', !!st.pvOpen);
  bar.innerHTML =
    '<div class="pv-panel" role="dialog" aria-label="Prototype preview controls">' +
    '<div class="pv-head"><b>Prototype preview</b><span>Sample data</span></div>' +
    '<div class="pv-row"><div class="pv-label">Maturity level · ' + lv.verb + '</div>' + seg('level', PP.LEVELS.map(function (l) { return [String(l.n), 'L' + l.n + ' ' + l.name, l.verb + ': ' + l.tagline]; })).replace('class="seg"', 'class="seg seg-grid"') + '</div>' +
    '<div class="pv-row"><div class="pv-label">Role</div>' + seg('role', [['admin', 'Platform Admin'], ['pm', 'Portfolio Mgr'], ['exec', 'Executive']]) + '</div>' +
    '<div class="pv-row"><div class="pv-label">Customer</div>' + seg('multi', [['1', 'Multi-site'], ['0', 'Single site']]) + '</div>' +
    '<div class="pv-toggles">' + PP.switchHtml('Show locked features', st.showLocked, 'data-input="pv-toggle" data-k="showLocked"') + PP.switchHtml('Show spec tags', st.annot, 'data-input="pv-toggle" data-k="annot"') + '</div>' +
    '<div class="pv-foot"><button class="btn btn-sm" data-action="screen-map">' + PP.icon('map') + 'Screen map</button><button class="btn btn-sm" data-action="pv-toggle-panel">Done</button></div>' +
    '</div>' +
    '<button class="pv-pill" data-action="pv-toggle-panel" title="Change preview level, role and customer"><span class="pv-dot"></span>Preview<span class="sep">·</span><b>L' + lv.n + ' ' + lv.name + '</b><span class="sep">·</span>' + PP.ROLES[st.role].short + '</button>';
};
PP.actions['pv-toggle-panel'] = function () {
  PP.state.pvOpen = !PP.state.pvOpen;
  document.getElementById('preview-bar').classList.toggle('open', PP.state.pvOpen);
};

PP.actions['pv'] = function (el) {
  var k = el.getAttribute('data-k'), v = el.getAttribute('data-v');
  var patch = {};
  patch[k] = k === 'level' ? +v : k === 'multi' ? v === '1' : v;
  PP.setState(patch);
};
PP.inputs['pv-toggle'] = function (el) {
  var patch = {}; patch[el.getAttribute('data-k')] = el.checked; PP.setState(patch);
};
PP.actions['menu-toggle'] = function (el) { el.closest('.menu').classList.toggle('open'); };
PP.actions['nav-toggle'] = function () { var s = document.getElementById('side'); if (s) s.classList.toggle('open'); };

/* ---------------- Motion helpers ---------------- */
/* Count headline numbers up from zero when a screen first appears. */
PP.countUp = function (root) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  root.querySelectorAll('.kpi-v').forEach(function (el) {
    var node = Array.prototype.find.call(el.childNodes, function (n) { return n.nodeType === 3 && /\d/.test(n.nodeValue); }) ||
      (el.firstElementChild && el.firstElementChild.childNodes[0] && el.firstElementChild.childNodes[0].nodeType === 3 ? el.firstElementChild.childNodes[0] : null);
    if (!node) return;
    var m = node.nodeValue.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    var target = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, commas = m[2].indexOf(',') >= 0 || target >= 1000;
    if (!(target > 0)) return;
    var t0 = performance.now(), dur = 900;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = target * e;
      var s = dec ? v.toFixed(dec) : String(Math.round(v));
      if (commas) s = Number(s).toLocaleString('en-AU', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      node.nodeValue = m[1] + s + m[3];
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });
};
/* Set text and flash it briefly when a live value changes. */
PP.setLive = function (el, text) {
  if (el.textContent === text) return;
  el.textContent = text;
  el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
};

/* Shared hover tooltip for anything with data-tip. */
(function () {
  var tip = document.createElement('div');
  tip.className = 'tip';
  document.body.appendChild(tip);
  var cur = null;
  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (el === cur) return;
    cur = el;
    if (!el) { tip.classList.remove('on'); return; }
    tip.innerHTML = el.getAttribute('data-tip');
    tip.classList.add('on');
  });
  document.addEventListener('mousemove', function (e) {
    if (!cur) return;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var x = e.clientX + 14, y = e.clientY - h - 12;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
    if (y < 8) y = e.clientY + 18;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });
  window.addEventListener('scroll', function () { cur = null; tip.classList.remove('on'); }, true);
  window.addEventListener('hashchange', function () { cur = null; tip.classList.remove('on'); });
})();

/* ---------------- Live occupancy ticker ---------------- */
PP.liveRefresh = function () {
  PP.Floorplan.refresh(document);
  document.querySelectorAll('[data-live-occ]').forEach(function (el) {
    var pl = PP.place(el.getAttribute('data-live-occ')); if (pl) PP.setLive(el, PP.fmt(PP.sum(pl.zones.map(function (z) { return z.occ; }))));
  });
  document.querySelectorAll('[data-live-pct]').forEach(function (el) {
    var pl = PP.place(el.getAttribute('data-live-pct')); if (!pl) return;
    var st = PP.stats(pl); PP.setLive(el, PP.pct(st.occPct * 100));
  });
  document.querySelectorAll('[data-live-gauge]').forEach(function (el) {
    var pl = PP.place(el.getAttribute('data-live-gauge')); if (!pl) return;
    var st = PP.stats(pl), arc = el.querySelectorAll('path')[1], txt = el.querySelectorAll('text');
    if (!arc || txt.length < 2) { el.innerHTML = PP.Charts.gauge(st.occ, st.cap, { sub: PP.fmt(st.occ) + ' of ' + PP.fmt(st.cap) + ' people' }); return; }
    // update in place so the arc animates smoothly
    arc.setAttribute('stroke-dasharray', (PP.clamp(st.occPct, 0, 1) * 100) + ' 100');
    arc.setAttribute('stroke', PP.occColor(st.occPct));
    txt[0].textContent = Math.round(PP.clamp(st.occPct, 0, 1) * 100) + '%';
    txt[1].textContent = PP.fmt(st.occ) + ' of ' + PP.fmt(st.cap) + ' people';
  });
  document.querySelectorAll('[data-live-meter]').forEach(function (el) {
    var pl = PP.place(el.getAttribute('data-live-meter')); if (!pl) return;
    var st = PP.stats(pl); el.innerHTML = PP.Charts.meter(st.occPct);
  });
};
setInterval(function () { PP.tickOccupancy(); PP.liveRefresh(); }, 3000);

/* ---------------- Delegated events ---------------- */
document.addEventListener('click', function (e) {
  if (!e.target.closest('.menu')) document.querySelectorAll('.menu.open').forEach(function (m) { m.classList.remove('open'); });
  var el = e.target.closest('[data-action], [data-go]');
  if (!el) return;
  var action = el.getAttribute('data-action');
  if (action) {
    if (PP.actions[action]) { e.preventDefault(); PP.actions[action](el, e); }
    return;
  }
  e.preventDefault();
  var side = document.getElementById('side'); if (side) side.classList.remove('open');
  PP.go(el.getAttribute('data-go'));
});
document.addEventListener('input', function (e) {
  var el = e.target.closest('[data-input]');
  if (el && PP.inputs[el.getAttribute('data-input')]) PP.inputs[el.getAttribute('data-input')](el, e);
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') PP.overlay.close();
});
window.addEventListener('hashchange', function () { PP.render(); });

PP.renderPreviewBar();
if (!location.hash) history.replaceState(null, '', '#/login');
PP.render();
PP.ai.render();
