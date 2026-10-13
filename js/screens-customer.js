/* =========================================================
   Customer Application, interfaces 1, 2 and 4–12
   (Place Detail, interface 3, lives in screens-place.js)
   ========================================================= */
PP.S = PP.S || {};

/* =========================================================
   1 · Login Screen
   ========================================================= */
PP.loginMode = 'signin';
PP.S.login = function () {
  var art = '<svg class="bg" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="#fff" stroke-width="1.2">' +
    PP.range(9).map(function (i) { return '<rect x="' + (60 + i * 18) + '" y="' + (80 + i * 22) + '" width="' + (420 - i * 36) + '" height="' + (360 - i * 44) + '" rx="6"/>'; }).join('') +
    '</g><g fill="#fff">' + PP.range(26).map(function (i) { var r = PP.rng('la' + i); return '<circle cx="' + PP.between(r, 40, 560) + '" cy="' + PP.between(r, 40, 560) + '" r="' + PP.between(r, 2, 5) + '"/>'; }).join('') + '</g></svg>';
  var form;
  if (PP.loginMode === 'forgot') {
    form = '<h2>Reset your password</h2><p class="muted">Enter your work email and we\'ll send a reset link.</p>' +
      '<div class="form mt"><label class="field"><span>Work email</span><input class="input" type="email" placeholder="name@meridianpg.com.au"></label>' +
      '<button class="btn btn-brand" data-action="login-mode" data-v="sent">Send reset link</button>' +
      '<button class="btn btn-ghost" data-action="login-mode" data-v="signin">' + PP.icon('back') + 'Back to sign in</button></div>';
  } else if (PP.loginMode === 'sent') {
    form = '<div class="li-ico tint-green" style="width:48px;height:48px;margin-bottom:14px">' + PP.icon('mail') + '</div><h2>Check your inbox</h2><p class="muted">If that address has an account, a reset link is on its way. It expires in 30 minutes.</p>' +
      '<button class="btn btn-brand mt" data-action="login-mode" data-v="signin">Back to sign in</button>';
  } else {
    form = '<h2>Sign in</h2><p class="muted">Welcome back to Meridian Place Insights.</p>' +
      '<div class="form mt"><label class="field"><span>Username or email</span><input class="input" type="text" id="login-email" value="enter@placePerformance.com.au" autocomplete="off"></label>' +
      '<label class="field"><span class="row-between"><span>Password</span><a class="small" data-action="login-mode" data-v="forgot" href="#">Forgot password?</a></span><input class="input" type="password" id="login-pw" placeholder="Enter your password" autocomplete="off"></label>' +
      '<div class="login-err" id="login-err" role="alert" hidden>Incorrect password. Please try again.</div>' +
      '<label class="switch small"><input type="checkbox" checked><span class="track"></span>Keep me signed in</label>' +
      '<button class="btn btn-brand" data-action="login-submit">Sign in</button>' +
      (PP.state.level >= 3 ? '<div class="divider">or</div><button class="btn" data-action="login-sso">' + PP.icon('shield') + 'Sign in with Meridian SSO</button><div class="tiny muted">SSO is configured by your administrator in User Profile (Level 3+).</div>' : '') +
      '</div>';
  }
  return '<div class="login-wrap"><div class="login-art">' + art +
    '<div class="cust"><div class="cust-logo">' + PP.CUSTOMER.initials + '</div>' + PP.CUSTOMER.name + '</div>' +
    '<div><h1>Know how every place is performing.</h1><p>Live visitation, occupancy and insight across the Meridian portfolio.</p></div>' +
    '<div class="powered">Powered by Place Performance · Rayven × ITESA</div></div>' +
    '<div class="login-form"><div class="login-card"><div class="row annot" style="margin-bottom:14px"><span class="chip chip-iface">Interface 1</span>' + PP.featureChips('branded-login') + '</div>' + form +
    '</div></div></div>';
};
PP.actions['login-mode'] = function (el) { PP.loginMode = el.getAttribute('data-v'); PP.render(true); };
/* Demo gate only: the password is checked in the browser, so this is not real security. */
PP.DEMO_PASSWORD = 'qwerty';
PP.authed = function () { try { return sessionStorage.getItem('pp_authed') === '1'; } catch (e) { return !!PP._authed; } };
PP.setAuthed = function (v) { PP._authed = v; try { v ? sessionStorage.setItem('pp_authed', '1') : sessionStorage.removeItem('pp_authed'); } catch (e) { /* storage blocked */ } };
PP.actions['login-submit'] = function () {
  var pw = document.getElementById('login-pw'), err = document.getElementById('login-err');
  if (pw && pw.value === PP.DEMO_PASSWORD) { PP.setAuthed(true); PP.loginMode = 'signin'; PP.go(PP.defaultRoute()); return; }
  if (err) err.hidden = false;
  if (pw) { pw.classList.add('input-err'); pw.value = ''; pw.focus(); }
};
PP.actions['login-sso'] = function () { PP.toast('SSO is not available in this demo. Sign in with your password.'); };
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && (e.target.id === 'login-pw' || e.target.id === 'login-email')) { e.preventDefault(); PP.actions['login-submit'](); }
});

/* =========================================================
   2 · Home Dashboard
   ========================================================= */
PP.homeTiles = { visitors: true, occupancy: true, busiest: true, dwell: true, alerts: true, report: true, score: true, insight: true, map: true, trend: true };

PP.S.home = function () {
  var sites = PP.sites();
  var places = sites.map(function (s) { return PP.place(s.id); });
  var stats = places.map(PP.stats);
  var tv = PP.sum(stats.map(function (s) { return s.visitors; }));
  var occ = PP.sum(stats.map(function (s) { return s.occ; })), cap = PP.sum(stats.map(function (s) { return s.cap; }));
  var busiest = places.slice().sort(function (a, b) { return PP.stats(b).occPct - PP.stats(a).occPct; })[0];
  var bst = PP.stats(busiest);
  var trend = PP.range(14).map(function (i) { return PP.sum(places.map(function (p) { return PP.series.daily(p, 14)[i]; })); });
  var linkable = PP.can('open-linked');
  var role = PP.ROLES[PP.state.role];
  var openAlerts = PP.visibleAlerts().filter(function (a) { return a.status === 'open'; });
  var T = PP.homeTiles;

  function tile(key, go, inner, cls) {
    if (!T[key]) return '';
    return '<div class="card' + (linkable && go ? ' clickable' : '') + ' ' + (cls || '') + '"' + (linkable && go ? ' data-go="' + go + '" title="Open the detail screen behind this tile"' : '') + '>' + inner + '</div>';
  }
  var placeGo = '/place/' + (sites.length === 1 ? sites[0].id : busiest.id);
  var primary = [
    tile('visitors', placeGo, PP.kpi('Visitors today', PP.fmt(tv), { icon: 'people', delta: 6.4, spark: PP.Charts.spark(trend) })),
    tile('occupancy', placeGo, PP.kpi(sites.length > 1 ? 'People across all sites now' : 'People on site now', '<span>' + PP.fmt(occ) + '</span><small>/ ' + PP.fmt(cap) + '</small>', { icon: 'gauge', extra: '<div class="mt-s">' + PP.Charts.meter(occ / cap) + '</div><div class="tiny muted mt-s">' + PP.pct(occ / cap * 100) + (sites.length > 1 ? ' of combined capacity · ' + sites.length + ' sites' : ' of capacity') + '</div>' })),
    tile('busiest', '/place/' + busiest.id, PP.kpi(sites.length > 1 ? 'Busiest site right now' : 'Busiest floor right now', '<span style="font-size:20px">' + PP.esc(sites.length > 1 ? busiest.name : PP.site(busiest.id).spaces[2 % PP.site(busiest.id).spaces.length].name) + '</span>', { icon: 'fire', extra: '<div class="row mt-s"><span class="st ' + PP.occClass(bst.occPct) + '" data-live-pct="' + busiest.id + '">' + PP.pct(bst.occPct * 100) + '</span><span class="small muted">full</span></div>' })),
    tile('dwell', placeGo, PP.kpi('Average dwell', PP.mins(PP.avg(stats.map(function (s) { return s.dwell; }))), { icon: 'clock', delta: -2.1 }))
  ];
  var tiles = [];
  if (PP.can('notif-feed')) tiles.push(tile('alerts', '/alerts', PP.kpi('Open alerts', String(openAlerts.length), { icon: 'bell', extra: '<div class="tiny muted mt-s">' + (openAlerts[0] ? PP.esc(openAlerts[0].title) : 'All clear') + '</div>' })));
  if (PP.can('reports-lib')) tiles.push(tile('report', '/reports/weekly', PP.kpi('Latest report', '<span style="font-size:18px">Weekly Visitation Summary</span>', { icon: 'file', extra: '<div class="tiny muted mt-s">Generated Mon 7:00am · 6 recipients</div>' })));
  if (PP.can('ranking') && PP.state.multi) tiles.push(tile('score', '/portfolio', PP.kpi('Avg site score', Math.round(PP.avg(stats.map(function (s) { return s.score; }))) + '<small>/100</small>', { icon: 'star', delta: 1.8, deltaUnit: ' pts' })));
  else if (PP.can('score')) tiles.push(tile('score', placeGo, PP.kpi('Performance score', stats[0].score + '<small>/100</small>', { icon: 'star', delta: stats[0].scoreDelta, deltaUnit: ' pts' })));
  if (PP.can('ai-feed')) tiles.push(tile('insight', '/intelligence', '<div class="kpi"><div class="kpi-l">' + PP.icon('sparkle', 'ico') + 'AI insight of the day</div><div class="strong mt-s" style="font-size:14px">' + PP.esc(PP.INSIGHTS[0].title) + '</div><div class="tiny muted mt-s">' + PP.INSIGHTS[0].confidence + '% confidence · ' + PP.INSIGHTS[0].impact + '</div></div>'));

  var mapCard = T.map ? PP.card(null, {
    title: sites.length > 1 ? 'Live occupancy by site' : sites[0].name + ' · live by floor', icon: 'map',
    sub: sites.length > 1 ? 'Colour shows the busiest zone at each site: green fine, amber/orange busy, red over capacity. Click a site to zoom in.' : 'Click a floor to open its floorplan.',
    actions: linkable ? '<span class="open-tag drill annot">Drill-down ↗</span>' : '',
    body: sites.length > 1 ? '<div id="home-map" class="map tall"></div>' : PP.Floorplan.stack(sites[0])
  }) : '';
  var trendCard = T.trend ? '<div class="card' + (linkable ? ' clickable' : '') + '"' + (linkable ? ' data-go="' + placeGo + '"' : '') + '><div class="card-h"><div><div class="card-t">Visitation over the last 14 days</div><div class="card-s">All sites combined</div></div></div><div class="card-b">' +
    PP.Charts.line({ labels: PP.daysBack(14).map(function (d) { return PP.DAYS[d.getDay()]; }), series: [{ name: 'Visitors', values: trend, color: PP.C.blue, area: true, dots: true }], height: 220, xTicks: 14, wide: true }) + '</div></div>' : '';

  var quick = !PP.roleOk('quick-links') ? '' : !PP.levelOk('quick-links') ? '' : '<div class="row" style="margin:-6px 0 22px;gap:8px">' + PP.featureChips('quick-links') + '<div class="qlinks">' +
      (PP.can('notif-feed') ? '<span class="qlink" data-go="/alerts">' + PP.icon('bell') + 'Recent alerts' + (openAlerts.length ? '<span class="badge">' + openAlerts.length + '</span>' : '') + '</span>' : '') +
      '<span class="qlink" data-go="/reports/weekly">' + PP.icon('file') + 'Latest report</span>' +
      '<span class="qlink" data-go="/place">' + PP.icon('building') + 'Place detail</span>' +
      (PP.can('device-list') ? '<span class="qlink" data-go="/devices">' + PP.icon('cpu') + 'Device health</span>' : '') +
      (PP.can('user-mgmt') ? '<span class="qlink" data-go="/org/users">' + PP.icon('users') + 'Invite a user</span>' : '') +
      '</div></div>';

  PP.onMount(function () {
    if (!(T.map && sites.length > 1)) return;
    var m = PP.Maps.make('home-map');
    var pts = [];
    sites.forEach(function (s) {
      var stx = PP.stats(PP.place(s.id)), ss = PP.siteStatus(s);
      pts.push([s.lat, s.lng]);
      PP.Maps.bubble(m, s.lat, s.lng, {
        key: s.id, radius: 6 + Math.sqrt(stx.occ) * 0.3, color: ss.color, label: s.name, value: ss.note || PP.pct(stx.occPct * 100) + ' full', halo: ss.level >= 2,
        popup: '<b>' + s.name + '</b><div class="muted">' + s.city + ' · ' + s.type + '</div><div class="mt-s">' + PP.fmt(stx.occ) + ' people now · ' + PP.pct(stx.occPct * 100) + ' of capacity</div>' +
          (ss.hot.length ? '<div class="small mt-s" style="color:' + ss.color + '">⚠ ' + ss.hot.slice(0, 3).map(function (h) { return PP.esc(h.z.name) + ' ' + PP.pct(h.p * 100); }).join(' · ') + '</div>' : '') +
          (linkable ? '<button class="btn btn-sm btn-primary" data-go="/place/' + s.id + '">Open place detail</button>' : '')
      });
    });
    PP.Maps.panel(m, 'Live status', sites.map(function (s) { var x = PP.stats(PP.place(s.id)), ss = PP.siteStatus(s); return { key: s.id, name: s.name, sub: ss.note || s.city + ' · all zones OK', value: PP.pct(x.occPct * 100), color: ss.color, rank: ss.level * 1000 + x.occPct * 100, go: linkable ? '/place/' + s.id : null }; }).sort(function (a, b) { return b.rank - a.rank; }));
    PP.Maps.fit(m, pts, 50);
  });

  var hr = new Date().getHours();
  var greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  return PP.pageHead({
    title: greet + ', ' + role.who.split(' ')[0], screen: 'home',
    sub: 'Here\'s how ' + (sites.length > 1 ? 'your ' + sites.length + ' sites are' : sites[0].name + ' is') + ' performing today.' + (linkable ? ' Click any tile to open the screen behind it.' : ''),
    actions: PP.can('overview') ? '<button class="btn" data-action="home-customise">' + PP.icon('grid') + 'Customise</button>' : ''
  }) +
    quick +
    (PP.can('overview') ? '<div class="row annot" style="margin-bottom:10px">' + PP.featureChips('overview') + '<span class="tiny muted">Configurable Overview</span>' + PP.featureChips('open-linked') + '<span class="tiny muted">Open Linked Screen</span></div>' +
      '<div class="grid g-4">' + primary.join('') + '</div>' +
      '<div class="grid g-main mt">' + (mapCard || '<div></div>') + (tiles.join('') ? '<div class="stack">' + tiles.join('') + '</div>' : '') + '</div>' +
      (trendCard ? '<div class="mt">' + trendCard + '</div>' : '') : PP.locked('overview', {}));
};
PP.actions['home-customise'] = function () {
  var labels = { visitors: 'Visitors today', occupancy: 'People across all sites now', busiest: 'Busiest site', dwell: 'Average dwell', alerts: 'Open alerts', report: 'Latest report', score: 'Performance score', insight: 'AI insight of the day', map: 'Live occupancy map', trend: 'Visitation trend' };
  PP.overlay.open({
    title: 'Customise your overview', size: 'sm', chips: PP.featureChips('overview'), sub: 'Choose which tiles appear on your home dashboard.',
    body: '<div class="form">' + Object.keys(labels).map(function (k) { return PP.switchHtml(labels[k], PP.homeTiles[k], 'data-input="home-tile" data-k="' + k + '"'); }).join('') + '</div>',
    footer: '<button class="btn btn-primary" data-action="home-customise-done">Done</button>'
  });
};
PP.inputs['home-tile'] = function (el) { PP.homeTiles[el.getAttribute('data-k')] = el.checked; };
PP.actions['home-customise-done'] = function () { PP.overlay.close(); PP.render(true); };

/* =========================================================
   4 · Portfolio Overview (+ Benchmarking drill-down)
   ========================================================= */
PP.rankSort = { k: 'score', dir: -1 };
PP.siteFlags = function (s, st) {
  var f = [];
  if (st.visitorsDelta < -5) f.push('Visitation down ' + PP.fmt1(-st.visitorsDelta) + '% week on week');
  if (st.peakPct > 0.95) f.push('Peaks above 95% of capacity');
  if (st.score < 65) f.push('Score in bottom quartile (' + st.score + ')');
  var off = PP.DEVICES.filter(function (d) { return d.siteId === s.id && d.status === 'offline'; }).length;
  if (off >= 2) f.push(off + ' sensors offline, data gaps likely');
  return f;
};

PP.S.portfolio = function () {
  var sites = PP.sites();
  var rows = sites.map(function (s) {
    var pl = PP.place(s.id), st = PP.stats(pl);
    return { s: s, pl: pl, st: st, v7: PP.sum(PP.series.daily(pl, 7)), trend: PP.series.daily(pl, 28), flags: PP.siteFlags(s, st) };
  });
  var key = PP.rankSort.k, dir = PP.rankSort.dir;
  var val = function (r) { return key === 'name' ? r.s.name : key === 'v7' ? r.v7 : key === 'occ' ? r.st.occPct : key === 'dwell' ? r.st.dwell : key === 'delta' ? r.st.visitorsDelta : r.st.score; };
  rows.sort(function (a, b) { var x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; });
  var ppi = Math.round(PP.avg(rows.map(function (r) { return r.st.score; })) * 0.6 + 30);
  var ppiTrend = PP.range(12).map(function (i) { return ppi - 9 + i * 0.8 + Math.sin(i) * 1.5; });
  var showFlags = PP.can('outliers');

  function th(k, label, cls) {
    var arrow = PP.rankSort.k === k ? (PP.rankSort.dir < 0 ? ' ▼' : ' ▲') : '';
    return '<th class="sortable ' + (cls || '') + '" data-action="rank-sort" data-k="' + k + '">' + label + arrow + '</th>';
  }
  var drill = PP.can('site-drill');
  var table = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Rank</th>' + th('name', 'Site') + th('score', 'Score', 'num') + th('v7', 'Visitors (7d)', 'num') + th('delta', 'Change', 'num') + th('occ', 'Occupancy now') + th('dwell', 'Avg dwell', 'num') + '<th>28-day trend</th>' + (showFlags ? '<th>Flags</th>' : '') + '</tr></thead><tbody>' +
    rows.map(function (r, i) {
      var flagged = showFlags && r.flags.length;
      return '<tr class="' + (drill ? 'click ' : '') + (flagged ? 'flagged' : '') + '"' + (drill ? ' data-go="/place/' + r.s.id + '"' : '') + '><td class="muted strong">' + (i + 1) + '</td><td><div class="name">' + r.s.name + '</div><div class="sub">' + r.s.city + ' · ' + r.s.type + '</div></td>' +
        '<td class="num"><b style="font-size:15px;color:' + PP.scoreColor(r.st.score) + '">' + r.st.score + '</b></td><td class="num">' + PP.fmt(r.v7) + '</td>' +
        '<td class="num ' + (r.st.visitorsDelta >= 0 ? 'up' : 'down') + '">' + (r.st.visitorsDelta >= 0 ? '+' : '') + PP.fmt1(r.st.visitorsDelta) + '%</td>' +
        '<td style="min-width:130px"><div class="row-between small"><span data-live-pct="' + r.s.id + '">' + PP.pct(r.st.occPct * 100) + '</span></div><div data-live-meter="' + r.s.id + '">' + PP.Charts.meter(r.st.occPct) + '</div></td>' +
        '<td class="num">' + PP.mins(r.st.dwell) + '</td><td style="width:130px">' + PP.Charts.spark(r.trend, { color: r.st.visitorsDelta >= 0 ? PP.C.green : PP.C.red, height: 30, width: 120 }) + '</td>' +
        (showFlags ? '<td>' + (flagged ? '<span class="st st-warn" title="' + PP.esc(r.flags.join('; ')) + '">' + PP.icon('alert', 'ico') + r.flags.length + '</span>' : '<span class="muted small">—</span>') + '</td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';

  var flagged = rows.filter(function (r) { return r.flags.length; });
  var outliers = PP.card('outliers', {
    sub: 'Sites behaving unusually, detected automatically',
    body: flagged.length ? '<div class="list" style="margin:0 -18px">' + flagged.map(function (r) {
      return '<div class="li' + (drill ? ' click" data-go="/place/' + r.s.id : '') + '"><div class="li-ico tint-amber">' + PP.icon('alert') + '</div><div class="li-main"><div class="li-t">' + r.s.name + '</div><div class="li-s">' + r.flags.join(' · ') + '</div></div></div>';
    }).join('') + '</div>' : '<p class="muted">No outliers this week.</p>'
  });

  var ppiCard = PP.card('ppi', {
    cls: 'hero', sub: 'One portfolio-wide score rolling up every site',
    actions: PP.opener('benchmarking', 'Benchmarking', 'data-go="/portfolio/benchmarking"', { cls: 'btn-sm btn-primary', icon: 'trend' }),
    body: '<div class="row" style="gap:24px;align-items:center">' + PP.Charts.ring(ppi, { label: 'index' }) +
      '<div style="flex:1;min-width:200px"><div class="row" style="gap:20px"><div><div class="small muted">vs last quarter</div><div style="font-size:20px;font-weight:600;color:var(--ok)">+3.4</div></div><div><div class="small muted">Cohort percentile</div><div style="font-size:20px;font-weight:600">72nd</div></div></div>' +
      '<div class="mt-s">' + PP.Charts.spark(ppiTrend, { color: PP.C.blue, height: 50, width: 320 }) + '</div><div class="tiny muted">Last 12 months</div></div></div>'
  });

  PP.onMount(function () {
    var m = PP.Maps.make('portfolio-map');
    var pts = [];
    rows.forEach(function (r) {
      pts.push([r.s.lat, r.s.lng]);
      PP.Maps.bubble(m, r.s.lat, r.s.lng, {
        key: r.s.id, radius: 6 + Math.sqrt(r.v7) / 22, color: PP.scoreColor(r.st.score), label: r.s.name, value: 'Score ' + r.st.score + ' · ' + PP.fmt(r.v7) + ' visits / wk', halo: showFlags && r.flags.length > 0,
        popup: '<b>' + r.s.name + '</b><div class="muted">Score ' + r.st.score + ' · ' + PP.fmt(r.v7) + ' visitors this week</div>' + (showFlags && r.flags.length ? '<div class="small mt-s" style="color:var(--warn)">⚠ ' + r.flags[0] + '</div>' : '') + (drill ? '<button class="btn btn-sm btn-primary" data-go="/place/' + r.s.id + '">Open site</button>' : '')
      });
    });
    PP.Maps.panel(m, 'Sites by score', rows.slice().sort(function (a, b) { return b.st.score - a.st.score; }).map(function (r) { return { key: r.s.id, name: r.s.name, sub: r.s.city + (showFlags && r.flags.length ? ' · ⚠ flagged' : ''), value: String(r.st.score), color: PP.scoreColor(r.st.score), go: drill ? '/place/' + r.s.id : null }; }));
    PP.Maps.fit(m, pts, 50);
  });

  return PP.pageHead({ title: 'Portfolio Overview', screen: 'portfolio', sub: 'All ' + sites.length + ' Meridian sites side by side. Select a site to open its Place Detail.' }) +
    '<div class="grid g-main">' + PP.card(null, { title: 'Portfolio map', icon: 'map', sub: 'Colour = site score · size = weekly visitors · halo = outlier flag', body: '<div id="portfolio-map" class="map tall"></div>' }) +
    '<div class="stack">' + (ppiCard || '') + (outliers || '') + '</div></div>' +
    '<div class="mt">' + PP.card('ranking', { sub: 'Click a column to sort · click a site to drill through to its Place Detail', actions: PP.can('site-drill') ? PP.featureChips('site-drill') : '', body: table, flush: true }) + '</div>';
};
PP.actions['rank-sort'] = function (el) {
  var k = el.getAttribute('data-k');
  PP.rankSort = { k: k, dir: PP.rankSort.k === k ? -PP.rankSort.dir : (k === 'name' ? 1 : -1) };
  PP.render(true);
};

PP.benchCohort = 'internal';
PP.S.benchmarking = function () {
  var internal = PP.benchCohort === 'internal';
  var metrics = ['Utilisation', 'Visitor growth', 'Dwell time', 'Conversion', 'Repeat visits', 'Data confidence'];
  var you = [64, 71, 58, 66, 62, 94];
  var med = internal ? [58, 60, 61, 57, 55, 90] : [55, 52, 63, 54, 51, 86];
  var top = internal ? [74, 79, 72, 70, 68, 97] : [76, 81, 78, 73, 70, 96];
  var pct = you.map(function (v, i) { return PP.clamp(Math.round(50 + (v - med[i]) / Math.max(1, top[i] - med[i]) * 25), 5, 98); });
  var sites = PP.sites();
  PP.crumbs = [{ label: PP.CUSTOMER.short }, { label: 'Portfolio Overview', go: '/portfolio' }, { label: 'Benchmarking' }];
  return PP.pageHead({
    title: 'Benchmarking', screen: 'portfolio', fid: 'benchmarking', back: { label: 'Back to Portfolio Overview', go: '/portfolio' },
    sub: 'How the Meridian portfolio compares with ' + (internal ? 'its internal peer groups' : 'an anonymised cohort of 142 comparable Australian sites') + '.',
    actions: '<div class="seg"><button class="' + (internal ? 'on' : '') + '" data-action="bench-cohort" data-v="internal">Internal peers</button><button class="' + (!internal ? 'on' : '') + '" data-action="bench-cohort" data-v="external">Anonymised external cohort</button></div>'
  }) +
    '<div class="grid g-4">' + ['Portfolio index', 'Cohort median', 'Top quartile', 'Your percentile'].map(function (l, i) {
      return '<div class="card">' + PP.kpi(l, [72, internal ? 66 : 61, internal ? 78 : 80, (internal ? 68 : 72) + 'th'][i]) + '</div>';
    }).join('') + '</div>' +
    '<div class="grid g-main mt">' + PP.card(null, { title: 'Metric comparison', sub: 'Meridian vs cohort median vs top quartile (index, 0–100)', body: PP.Charts.bars({ labels: metrics, series: [{ name: 'Meridian', values: you, color: PP.C.blue }, { name: 'Cohort median', values: med, color: PP.C.light }, { name: 'Top quartile', values: top, color: PP.C.teal }], height: 320, max: 100, wide: true }) }) +
    PP.card(null, { title: 'Percentile position', sub: 'Where Meridian sits within the cohort', body: metrics.map(function (m, i) { return '<div style="margin-bottom:12px"><div class="row-between small"><span>' + m + '</span><b>' + pct[i] + 'th</b></div>' + PP.Charts.meter(pct[i] / 100, pct[i] >= 60 ? PP.C.green : pct[i] >= 40 ? PP.C.amber : PP.C.red) + '</div>'; }).join('') }) + '</div>' +
    '<div class="mt">' + PP.card(null, {
      title: 'Sites against the cohort', flush: true, body: '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Site</th><th>Peer group</th><th class="num">Score</th><th class="num">Cohort median</th><th class="num">Gap</th><th style="width:200px">Position</th></tr></thead><tbody>' + sites.map(function (s) {
        var st = PP.stats(PP.place(s.id)), m = internal ? 66 : 63, gap = st.score - m;
        return '<tr><td class="name">' + s.name + '</td><td class="muted">' + s.type + '</td><td class="num"><b>' + st.score + '</b></td><td class="num">' + m + '</td><td class="num ' + (gap >= 0 ? 'up' : 'down') + '">' + (gap >= 0 ? '+' : '') + gap + '</td><td>' + PP.Charts.meter(st.score / 100, PP.scoreColor(st.score)) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    }) + '</div>';
};
PP.actions['bench-cohort'] = function (el) { PP.benchCohort = el.getAttribute('data-v'); PP.render(true); };

/* =========================================================
   5 · Executive Intelligence (+ Investment Analysis drill-down)
   ========================================================= */
PP.insightFilter = 'All';
PP.S.intel = function () {
  var sites = PP.sites();
  var ids = sites.map(function (s) { return s.id; });
  var insights = PP.INSIGHTS.filter(function (i) { return ids.indexOf(i.site) >= 0 && (PP.insightFilter === 'All' || i.cat === PP.insightFilter); });
  var places = sites.map(function (s) { return PP.place(s.id); });
  var hist = PP.range(21).map(function (i) { return PP.sum(places.map(function (p) { return PP.series.daily(p, 21)[i]; })); });
  var r = PP.rng('fc');
  var fut = PP.daysAhead(14).map(function (d, i) { return Math.round(hist[hist.length - 7 + (i % 7)] * PP.between(r, 0.97, 1.09) * (1 + i * 0.004)); });
  var labels = PP.daysBack(21).map(PP.dateLabel).concat(PP.daysAhead(14).map(PP.dateLabel));
  var actual = hist.concat(PP.range(14).map(function () { return null; }));
  var fc = PP.range(20).map(function () { return null; }).concat([hist[20]]).concat(fut);
  var hi = fc.map(function (v, i) { return v == null || i === 20 ? (i === 20 ? v : null) : v * (1.04 + (i - 20) * 0.006); });
  var lo = fc.map(function (v, i) { return v == null || i === 20 ? (i === 20 ? v : null) : v * (0.96 - (i - 20) * 0.006); });
  var nextWeek = PP.sum(fut.slice(0, 7)), lastWeek = PP.sum(hist.slice(14));

  var feed = PP.card('ai-feed', {
    sub: 'Plain-language observations and recommendations, refreshed every morning',
    actions: '<div class="seg">' + ['All', 'Opportunity', 'Risk', 'Efficiency'].map(function (c) { return '<button class="' + (PP.insightFilter === c ? 'on' : '') + '" data-action="insight-filter" data-v="' + c + '">' + c + '</button>'; }).join('') + '</div>',
    body: '<div class="feed">' + (insights.length ? insights.map(function (i) {
      var can = PP.can('insight-detail');
      return '<div class="feed-card"' + (can ? ' data-action="insight-detail" data-id="' + i.id + '"' : '') + '><div class="feed-ico ' + i.tint + '">' + PP.icon(i.icon) + '</div><div style="flex:1"><div class="feed-t">' + PP.esc(i.title) + '</div><div class="feed-p">' + PP.esc(i.text) + '</div>' +
        '<div class="feed-m"><span class="st ' + (i.cat === 'Risk' ? 'st-bad' : i.cat === 'Opportunity' ? 'st-ok' : 'st-warn') + '">' + i.cat + '</span><span>' + PP.site(i.site).name + '</span><span>·</span><span>' + i.confidence + '% confidence</span><span>·</span><b style="color:var(--ink)">' + i.impact + '</b>' + (can ? '<span class="feed-cta">View evidence' + PP.icon('chev', 'ico') + '</span>' : '') + '</div></div></div>';
    }).join('') : '<p class="muted">No insights in this category for the sites in view.</p>') + '</div>'
  });

  var forecast = PP.card('forecast', {
    sub: 'Predicted visitation for the next 14 days across ' + (sites.length > 1 ? 'all sites' : sites[0].name),
    actions: PP.opener('forecast-detail', 'Per-site forecast', 'data-action="forecast-detail"', { icon: 'layers' }) + PP.opener('investment', 'Investment analysis', 'data-go="/intelligence/investment"', { icon: 'dollar' }),
    body: '<div class="row" style="gap:28px;margin-bottom:8px"><div><div class="small muted">Next 7 days</div><div class="strong" style="font-size:22px">' + PP.fmt(nextWeek) + '</div></div><div><div class="small muted">vs last 7 days</div><div class="strong ' + (nextWeek >= lastWeek ? 'up' : 'down') + '" style="font-size:22px">' + (nextWeek >= lastWeek ? '+' : '') + PP.fmt1((nextWeek / lastWeek - 1) * 100) + '%</div></div><div><div class="small muted">Predicted peak occupancy</div><div class="strong" style="font-size:22px">87% <span class="small muted">Sat</span></div></div></div>' +
      PP.Charts.line({ labels: labels, series: [{ name: 'Actual', values: actual, color: PP.C.blue, area: true }, { name: 'Forecast', values: fc, color: PP.C.purple, dash: true }], band: { hi: hi, lo: lo, color: PP.C.purple }, marker: 20, markerLabel: 'Today', height: 260, xTicks: 12, wide: true })
  });

  return PP.pageHead({ title: 'Executive Intelligence', screen: 'intel', sub: 'So what should we do about it? Insights, predictions and recommendations in plain language.' }) +
    (forecast || '') + '<div class="mt">' + (feed || '') + '</div>';
};
PP.actions['insight-filter'] = function (el) { PP.insightFilter = el.getAttribute('data-v'); PP.render(true); };
PP.actions['insight-detail'] = function (el) {
  var i = PP.INSIGHTS.find(function (x) { return x.id === el.getAttribute('data-id'); });
  var s = PP.site(i.site), pl = PP.place(s.id);
  var v = PP.series.daily(pl, 56, i.id);
  var weekly = []; for (var k = 0; k < 56; k += 7) weekly.push(PP.sum(v.slice(k, k + 7)));
  var reasons = {
    i1: ['Saturday 5–6pm visitation averaged 74% of the daily peak over 8 weeks.', 'Exits in the final 30 minutes are 2.3× the normal rate, people are being moved on, not leaving naturally.', 'Comparable markets in the cohort trading until 6pm see 9% higher Saturday sales.'],
    i2: ['Occupancy above 95% on 9 of 14 Saturdays, 10am–12pm.', 'Queue at the entry desk exceeds 6 people during the same window.', 'Dwell time drops 22% when the zone is over capacity, a sign of crowding.'],
    i3: ['Level 12 Monday/Friday utilisation is 27% vs 68% mid-week.', 'Cleaning and HVAC run on a fixed schedule regardless of occupancy.', 'Levels 3 and 7 have spare capacity of 210 desks on those days.'],
    i4: ['Sales per visitor up from $21.40 to $23.30 since the May refit.', 'Average dwell in the Food Court up 7 minutes.', 'Footfall growth (3%) is in line with the centre, the uplift is conversion-driven.'],
    i5: ['School holidays begin Friday; last holidays saw a 31% Saturday surge.', 'Forecast queue arrivals peak at 46 per 15 minutes at 12:30pm.', 'One counter serves about 32 people per 15 minutes at current service times.'],
    i6: ['Average 14 visits after 7pm over the last 6 weeks.', '3–5pm is 18% busier than staffing assumes.', 'No bookings or events are scheduled after 7pm this term.']
  }[i.id];
  PP.overlay.open({
    title: i.title, fid: 'insight-detail', size: 'lg', side: true,
    sub: i.cat + ' · ' + s.name + ' · generated today 6:00am',
    body: '<div class="grid g-2" style="margin-bottom:14px"><div class="card">' + PP.kpi('Confidence', i.confidence + '%') + '</div><div class="card">' + PP.kpi('Estimated impact', '<span style="font-size:18px">' + i.impact + '</span>') + '</div></div>' +
      '<div class="strong small">Supporting data, weekly visitors, last 8 weeks</div>' + PP.Charts.bars({ labels: PP.range(8).map(function (k) { return 'Wk ' + (k + 1); }), series: [{ values: weekly, color: i.cat === 'Risk' ? PP.C.red : i.cat === 'Opportunity' ? PP.C.green : PP.C.amber }], height: 170 }) +
      '<div class="strong small mt">Why the model recommends this</div><ol style="padding-left:18px;margin:8px 0;color:var(--ink-2)">' + reasons.map(function (x) { return '<li style="margin-bottom:6px">' + x + '</li>'; }).join('') + '</ol>' +
      '<div class="strong small mt">Data used</div><div class="pills mt-s"><span class="pill">People counters</span><span class="pill">Occupancy</span><span class="pill">Queue sensors</span><span class="pill">Lightspeed POS</span><span class="pill">Public holidays calendar</span></div>' +
      '<div class="note info mt">Generated by the Place Performance insight model. Recommendations are advisory and should be checked against local knowledge.</div>',
    footer: (PP.can('what-if') ? '<button class="btn" data-go="/scenarios">' + PP.icon('sliders') + 'Model this in Scenario Modelling</button>' : '') + '<button class="btn btn-primary" data-action="save-close" data-msg="Insight shared with your team">Share with team</button>'
  });
};
PP.actions['forecast-detail'] = function () {
  var sites = PP.sites();
  function body(siteId) {
    var pl = PP.place(siteId), base = PP.series.daily(pl, 7), r = PP.rng('fd' + siteId);
    var days = PP.daysAhead(28);
    var f = days.map(function (d, i) { return Math.round(base[d.getDay() % 7] * PP.between(r, 0.95, 1.1) * (1 + i * 0.003)); });
    var hi = f.map(function (v, i) { return v * (1.05 + i * 0.006); }), lo = f.map(function (v, i) { return v * (0.95 - i * 0.006); });
    var peakIdx = f.indexOf(Math.max.apply(null, f));
    return '<div class="grid g-3" style="margin-bottom:12px"><div class="card">' + PP.kpi('Next 28 days', PP.fmt(PP.sum(f))) + '</div><div class="card">' + PP.kpi('Busiest day', PP.DAYS[days[peakIdx].getDay()] + ' ' + PP.dateLabel(days[peakIdx])) + '</div><div class="card">' + PP.kpi('Confidence (80% band)', '±' + Math.round(8 + PP.between(r, 0, 5)) + '%') + '</div></div>' +
      PP.Charts.line({ labels: days.map(PP.dateLabel), series: [{ name: 'Forecast visitors', values: f, color: PP.C.purple, dots: true }], band: { hi: hi, lo: lo, color: PP.C.purple }, height: 280, xTicks: 10, wide: true }) +
      '<div class="c-legend"><span><i style="background:rgba(139,63,232,.25)"></i>80% confidence range, widens further out</span></div>';
  }
  var w = PP.overlay.open({
    title: 'Forecast Detail', fid: 'forecast-detail', size: 'lg', sub: 'Per-site forecast with confidence ranges.',
    body: '<div class="row" style="margin-bottom:14px"><span class="small strong">Site</span><select class="select select-sm" data-input="fd-site">' + sites.map(function (s) { return '<option value="' + s.id + '">' + s.name + '</option>'; }).join('') + '</select></div><div id="fd-body">' + body(sites[0].id) + '</div>'
  });
  w._fd = body;
};
PP.inputs['fd-site'] = function (el) { var w = PP.overlay.top(); w.querySelector('#fd-body').innerHTML = w._fd(el.value); };

PP.S.investment = function (id) {
  var list = PP.INTERVENTIONS.filter(function (x) { return PP.sites().some(function (s) { return s.id === x.site; }); });
  if (!list.length) list = PP.INTERVENTIONS.slice(0, 1);
  var it = list.find(function (x) { return x.id === id; }) || list[0];
  var r = PP.rng('inv-' + it.id);
  var weeks = PP.range(26).map(function (i) { return i < 13 ? it.visitsBefore * PP.between(r, 0.94, 1.05) : it.visitsAfter * PP.between(r, 0.95, 1.06); });
  PP.crumbs = [{ label: PP.CUSTOMER.short }, { label: 'Executive Intelligence', go: '/intelligence' }, { label: 'Investment Analysis' }];
  function delta(a, b) { var d = (b / a - 1) * 100; return '<span class="' + (d >= 0 ? 'up' : 'down') + ' strong">' + (d >= 0 ? '+' : '') + PP.fmt1(d) + '%</span>'; }
  return PP.pageHead({ title: 'Investment Analysis', screen: 'intel', fid: 'investment', back: { label: 'Back to Executive Intelligence', go: '/intelligence' }, sub: 'Before-and-after view of an intervention or capital works, did it pay off?' }) +
    '<div class="grid g-side">' +
    '<div class="card"><div class="card-h"><div class="card-t">Interventions</div></div><div class="list">' + list.map(function (x) {
      return '<div class="li click" data-go="/intelligence/investment/' + x.id + '" style="' + (x.id === it.id ? 'background:var(--accent-soft)' : '') + '"><div class="li-main"><div class="li-t">' + x.name + '</div><div class="li-s">' + PP.site(x.site).name + ' · ' + x.date + ' · ' + PP.money(x.cost) + '</div></div></div>';
    }).join('') + '</div></div>' +
    '<div class="stack"><div class="grid g-4">' +
    '<div class="card">' + PP.kpi(it.metric, (it.metric === 'Sales per visitor' ? '$' + it.after.toFixed(2) : it.metric === 'Utilisation' ? it.after + '%' : PP.fmt(it.after)), { extra: '<div class="small mt-s">was ' + (it.metric === 'Sales per visitor' ? '$' + it.before.toFixed(2) : it.metric === 'Utilisation' ? it.before + '%' : PP.fmt(it.before)) + ' · ' + delta(it.before, it.after) + '</div>' }) + '</div>' +
    '<div class="card">' + PP.kpi('Weekly visits', PP.fmt(it.visitsAfter), { extra: '<div class="small mt-s">was ' + PP.fmt(it.visitsBefore) + ' · ' + delta(it.visitsBefore, it.visitsAfter) + '</div>' }) + '</div>' +
    '<div class="card">' + PP.kpi('Average dwell', PP.mins(it.dwellAfter), { extra: '<div class="small mt-s">was ' + PP.mins(it.dwellBefore) + ' · ' + delta(it.dwellBefore, it.dwellAfter) + '</div>' }) + '</div>' +
    '<div class="card">' + PP.kpi('Payback to date', it.payback + '%', { extra: '<div class="mt-s">' + PP.Charts.meter(Math.min(1, it.payback / 100), it.payback >= 100 ? PP.C.green : PP.C.blue) + '</div><div class="tiny muted mt-s">of ' + PP.money(it.cost) + '</div>' }) + '</div></div>' +
    PP.card(null, { title: 'Weekly visits, 13 weeks before and after', sub: 'Intervention completed ' + it.date, body: PP.Charts.line({ labels: PP.range(26).map(function (i) { return i < 13 ? 'W-' + (13 - i) : 'W+' + (i - 12); }), series: [{ name: 'Weekly visits', values: weeks, color: PP.C.blue, area: true }, { name: 'Before average', values: weeks.map(function (_, i) { return i < 13 ? it.visitsBefore : null; }), color: PP.C.slate, dash: true }, { name: 'After average', values: weeks.map(function (_, i) { return i >= 13 ? it.visitsAfter : null; }), color: PP.C.green, dash: true }], marker: 13, markerLabel: 'Works complete', height: 280, xTicks: 13, wide: true }) }) +
    PP.card(null, { title: 'Verdict', body: '<p style="margin:0">' + (it.payback >= 100 ? '<b class="up">Paid off.</b> The intervention has returned more than its cost.' : '<b>On track.</b> At the current rate the investment pays back in about ' + Math.round((100 - it.payback) / it.payback * 5 + 1) + ' more months.') + ' The change in ' + it.metric.toLowerCase() + ' is outside the normal week-to-week range, so the uplift is very likely caused by the intervention rather than seasonality.</p>' }) +
    '</div></div>';
};

/* =========================================================
   6 · Scenario Modelling (+ Scenario Comparison drill-down)
   ========================================================= */
PP.scn = { site: null, open: 9, close: 18, capacity: 0, layout: 'current', staff: 100 };
PP.savedScenarios = [
  { name: 'Extend Saturday to 6pm', site: 'riverside', open: 8, close: 18, capacity: 0, layout: 'current', staff: 100 },
  { name: 'Add 60 Food Court seats', site: 'riverside', open: 8, close: 17, capacity: 15, layout: 'seating', staff: 100 }
];
PP.scenarioModel = function (sc) {
  var site = PP.site(sc.site) || PP.sites()[0], pl = PP.place(site.id), st = PP.stats(pl);
  var shape = PP.SHAPES[site.layout];
  var baseOpen = site.layout === 'retail' ? 9 : site.layout === 'library' ? 9 : 7, baseClose = site.layout === 'retail' ? 17 : site.layout === 'library' ? 20 : 19;
  var dayTotal = PP.sum(PP.series.daily(pl, 7)) / 7;
  var hours = PP.range(18).map(function (i) { return i + 5; });
  function curve(o, c, mult) {
    var w = hours.map(function (h) { return h >= o && h < c ? shape(h + 0.5) : 0; });
    var ws = PP.sum(hours.map(function (h) { return h >= baseOpen && h < baseClose ? shape(h + 0.5) : 0; }));
    return w.map(function (x) { return dayTotal * x / ws * mult; });
  }
  var layoutMult = { current: 1, seating: 1.05, openplan: 1.03, counter: 1.01 }[sc.layout];
  var base = curve(baseOpen, baseClose, 1);
  var scen = curve(sc.open, sc.close, layoutMult);
  var capNew = st.cap * (1 + sc.capacity / 100);
  var peakBase = Math.max.apply(null, base) * 1.6 / st.cap * 100;
  var peakScen = Math.max.apply(null, scen) * 1.6 / capNew * 100;
  var waitBase = 6.2, waitScen = waitBase * (100 / sc.staff) * (sc.layout === 'counter' ? 0.6 : 1) * (peakScen / peakBase);
  var visits = PP.sum(scen) * 7, visitsBase = PP.sum(base) * 7;
  var cost = (sc.close - sc.open) * 7 * 410 * (sc.staff / 100) + (sc.layout !== 'current' ? 2600 : 0);
  var costBase = (baseClose - baseOpen) * 7 * 410;
  return { site: site, hours: hours, base: base, scen: scen, visits: visits, visitsBase: visitsBase, peak: peakScen, peakBase: peakBase, wait: waitScen, waitBase: waitBase, cpv: cost / visits, cpvBase: costBase / visitsBase, baseOpen: baseOpen, baseClose: baseClose };
};
PP.S.scenarios = function () {
  var sites = PP.sites();
  if (!PP.scn.site || !sites.some(function (s) { return s.id === PP.scn.site; })) {
    PP.scn.site = sites[0].id;
    var m0 = PP.scenarioModel(PP.scn); PP.scn.open = m0.baseOpen; PP.scn.close = m0.baseClose;
  }
  var sc = PP.scn;
  function slider(label, key, min, max, step, fmt) {
    return '<div class="slider-row"><span class="small strong">' + label + '</span><span class="v" id="sv-' + key + '">' + fmt(sc[key]) + '</span><input class="range" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + sc[key] + '" data-input="scn" data-k="' + key + '" style="grid-column:1/-1"></div>';
  }
  var controls = '<div class="form">' +
    '<label class="field"><span>Site</span><select class="select" data-input="scn-site">' + sites.map(function (s) { return '<option value="' + s.id + '"' + (s.id === sc.site ? ' selected' : '') + '>' + s.name + '</option>'; }).join('') + '</select></label>' +
    slider('Opening time', 'open', 5, 12, 1, PP.hourLabel) + slider('Closing time', 'close', 14, 23, 1, PP.hourLabel) +
    slider('Capacity change', 'capacity', -30, 50, 5, function (v) { return (v > 0 ? '+' : '') + v + '%'; }) +
    slider('Staffing level', 'staff', 60, 150, 10, function (v) { return v + '%'; }) +
    '<label class="field"><span>Layout</span><select class="select" data-input="scn-layout">' + [['current', 'Current layout'], ['seating', 'Add seating & dwell space'], ['openplan', 'Open-plan reconfiguration'], ['counter', 'Add a second service counter']].map(function (o) { return '<option value="' + o[0] + '"' + (sc.layout === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
    '<label class="field"><span>Scenario name</span><input class="input" id="scn-name" placeholder="e.g. Extend weekday hours"></label>' +
    '<div class="row"><button class="btn btn-primary" data-action="scn-save">' + PP.icon('plus') + 'Save scenario</button><button class="btn btn-ghost" data-action="scn-reset">Reset</button></div></div>';

  var body = '<div class="grid g-side" style="align-items:start"><div>' + controls + '</div><div id="scn-out">' + PP.scenarioOut() + '</div></div>';
  var saved = '<div class="mt">' + PP.card(null, {
    title: 'Saved scenarios', sub: PP.savedScenarios.length + ' saved',
    actions: PP.opener('scenario-compare', 'Compare scenarios', 'data-go="/scenarios/compare"', { cls: 'btn-sm btn-primary', icon: 'layers' }),
    body: '<div class="pills">' + PP.savedScenarios.map(function (s) { return '<span class="pill">' + PP.esc(s.name) + ' · ' + PP.site(s.site).name + '</span>'; }).join('') + '</div>'
  }) + '</div>';
  return PP.pageHead({ title: 'Scenario Modelling', screen: 'scenarios', sub: 'Change opening hours, layout or capacity and see the projected impact before committing to anything.' }) +
    PP.card('what-if', { sub: 'Move the controls, the projection updates live', body: body }) + saved;
};
PP.scenarioOut = function () {
  var m = PP.scenarioModel(PP.scn);
  function d(a, b, inv, unit) { var x = (a / b - 1) * 100; var good = inv ? x < 0 : x > 0; return '<div class="kpi-d ' + (Math.abs(x) < 0.5 ? 'flat' : good ? 'up' : 'down') + '">' + (x >= 0 ? '+' : '') + PP.fmt1(x) + '% vs today</div>'; }
  return '<div class="grid g-4" style="margin-bottom:14px">' +
    '<div class="card"><div class="kpi"><div class="kpi-l">Weekly visits</div><div class="kpi-v">' + PP.fmt(m.visits) + '</div>' + d(m.visits, m.visitsBase) + '</div></div>' +
    '<div class="card"><div class="kpi"><div class="kpi-l">Peak occupancy</div><div class="kpi-v">' + PP.pct(m.peak) + '</div>' + d(m.peak, m.peakBase, true) + '</div></div>' +
    '<div class="card"><div class="kpi"><div class="kpi-l">Avg queue wait</div><div class="kpi-v">' + PP.fmt1(m.wait) + '<small>min</small></div>' + d(m.wait, m.waitBase, true) + '</div></div>' +
    '<div class="card"><div class="kpi"><div class="kpi-l">Cost per visit</div><div class="kpi-v">$' + m.cpv.toFixed(2) + '</div>' + d(m.cpv, m.cpvBase, true) + '</div></div></div>' +
    '<div class="strong small">Projected visitors by hour, typical day at ' + m.site.name + '</div>' +
    PP.Charts.line({ labels: m.hours.map(PP.hourLabel), series: [{ name: 'Current', values: m.base, color: PP.C.slate, dash: true }, { name: 'Scenario', values: m.scen, color: PP.C.pink, area: true }], height: 300, xTicks: 12, wide: true }) +
    (m.peak > 90 ? '<div class="note mt-s">⚠ Projected peak exceeds 90% of capacity, consider more capacity or a second counter.</div>' : '');
};
PP.inputs['scn'] = function (el) {
  var k = el.getAttribute('data-k'); PP.scn[k] = +el.value;
  if (k === 'open' && PP.scn.open >= PP.scn.close) PP.scn.close = PP.scn.open + 1;
  var fmt = k === 'open' || k === 'close' ? PP.hourLabel : k === 'capacity' ? function (v) { return (v > 0 ? '+' : '') + v + '%'; } : function (v) { return v + '%'; };
  document.getElementById('sv-' + k).textContent = fmt(PP.scn[k]);
  document.getElementById('scn-out').innerHTML = PP.scenarioOut();
};
PP.inputs['scn-site'] = function (el) { PP.scn.site = el.value; var m = PP.scenarioModel(PP.scn); PP.scn.open = m.baseOpen; PP.scn.close = m.baseClose; PP.render(true); };
PP.inputs['scn-layout'] = function (el) { PP.scn.layout = el.value; document.getElementById('scn-out').innerHTML = PP.scenarioOut(); };
PP.actions['scn-reset'] = function () { PP.scn = { site: PP.scn.site, open: 9, close: 18, capacity: 0, layout: 'current', staff: 100 }; var m = PP.scenarioModel(PP.scn); PP.scn.open = m.baseOpen; PP.scn.close = m.baseClose; PP.render(true); };
PP.actions['scn-save'] = function () {
  var name = (document.getElementById('scn-name').value || '').trim() || 'Scenario ' + (PP.savedScenarios.length + 1);
  PP.savedScenarios.push(Object.assign({ name: name }, PP.scn));
  PP.toast('Saved "' + name + '"');
  PP.render(true);
};
PP.S.scenarioCompare = function () {
  var list = PP.savedScenarios.slice(-4);
  var models = list.map(PP.scenarioModel);
  var colors = [PP.C.pink, PP.C.blue, PP.C.teal, PP.C.orange];
  PP.crumbs = [{ label: PP.CUSTOMER.short }, { label: 'Scenario Modelling', go: '/scenarios' }, { label: 'Scenario Comparison' }];
  var hours = models[0].hours;
  return PP.pageHead({ title: 'Scenario Comparison', screen: 'scenarios', fid: 'scenario-compare', back: { label: 'Back to Scenario Modelling', go: '/scenarios' }, sub: 'Saved scenarios side by side.' }) +
    '<div class="grid g-' + Math.min(4, list.length) + '">' + list.map(function (s, i) {
      var m = models[i];
      return '<div class="card" style="border-top:4px solid ' + colors[i] + '"><div class="card-h"><div><div class="card-t">' + PP.esc(s.name) + '</div><div class="card-s">' + m.site.name + '</div></div></div><div class="card-b"><dl class="kv" style="grid-template-columns:1fr auto">' +
        '<dt>Hours</dt><dd>' + PP.hourLabel(s.open) + '–' + PP.hourLabel(s.close) + '</dd><dt>Capacity</dt><dd>' + (s.capacity > 0 ? '+' : '') + s.capacity + '%</dd><dt>Staffing</dt><dd>' + s.staff + '%</dd><dt>Layout</dt><dd>' + s.layout + '</dd></dl><div class="divide"></div>' +
        '<dl class="kv" style="grid-template-columns:1fr auto"><dt>Weekly visits</dt><dd>' + PP.fmt(m.visits) + '</dd><dt>Peak occupancy</dt><dd>' + PP.pct(m.peak) + '</dd><dt>Avg wait</dt><dd>' + PP.fmt1(m.wait) + ' min</dd><dt>Cost per visit</dt><dd>$' + m.cpv.toFixed(2) + '</dd></dl></div></div>';
    }).join('') + '</div>' +
    '<div class="mt">' + PP.card(null, { title: 'Projected visitors by hour', body: PP.Charts.line({ labels: hours.map(PP.hourLabel), series: [{ name: 'Current', values: models[0].base, color: PP.C.slate, dash: true }].concat(models.map(function (m, i) { return { name: list[i].name, values: m.scen, color: colors[i] }; })), height: 300, xTicks: 12, wide: true }) }) + '</div>';
};

/* =========================================================
   7 · Reports (+ Report Detail drill-down, Schedule Editor overlay)
   ========================================================= */
PP.S.reports = function () {
  var lib = PP.REPORTS.filter(function (r) { return !r.pack; });
  var canDetail = PP.can('report-detail');
  var list = '<div class="list" style="margin:0 -18px">' + lib.map(function (r) {
    var ok = PP.state.level >= r.level;
    if (!ok && !PP.state.showLocked) return '';
    return '<div class="li' + (ok && canDetail ? ' click" data-go="/reports/' + r.id : '') + '" style="' + (ok ? '' : 'opacity:.55') + '"><div class="li-ico tint-blue">' + PP.icon(ok ? 'file' : 'lock') + '</div><div class="li-main"><div class="li-t">' + r.name + ' ' + PP.levelChip(r.level) + '</div><div class="li-s">' + r.desc + '</div><div class="li-s" style="margin-top:3px">' + PP.icon('calendar', 'ico') + ' ' + r.cadence + ' · ' + r.scope + ' · ' + (r.recipients ? r.recipients + ' recipients' : 'no schedule') + '</div></div>' +
      '<div class="li-r row" style="gap:6px">' + (ok ? '<span class="small muted">Last: ' + r.last + '</span>' +
        '<button class="btn btn-sm" data-action="toast" data-msg="' + r.name + ' downloaded (' + r.fmt + ')">' + PP.icon('download') + r.fmt + '</button>' +
        PP.opener('schedule-editor', 'Schedule', 'data-action="schedule-editor" data-id="' + r.id + '"', { icon: 'calendar' }) +
        (canDetail ? '<button class="btn btn-sm btn-primary" data-go="/reports/' + r.id + '">Open<span class="open-tag drill annot">↗</span></button>' : '') : '<button class="btn btn-sm" data-action="set-level" data-level="' + r.level + '">Level ' + r.level + '</button>') + '</div></div>';
  }).join('') + '</div>';

  var pack = PP.REPORTS.find(function (r) { return r.pack; });
  var packCard = PP.card('exec-pack', {
    sub: 'Presentation-ready pack for board and executive use',
    actions: '<button class="btn btn-sm" data-action="toast" data-msg="Board pack exported to PowerPoint">' + PP.icon('download') + 'PPTX</button><button class="btn btn-sm" data-action="toast" data-msg="Board pack exported to PDF">' + PP.icon('download') + 'PDF</button>' + (canDetail ? '<button class="btn btn-sm btn-primary" data-go="/reports/board">Open pack</button>' : ''),
    body: '<div class="grid g-3">' + PP.packSlides().slice(0, 3).map(function (s) { return '<div style="aspect-ratio:16/9;overflow:hidden;border-radius:10px;pointer-events:none;border:1px solid var(--line)"><div style="width:960px;zoom:.3">' + s + '</div></div>'; }).join('') + '</div><div class="small muted mt-s">' + pack.name + ' · generated ' + pack.last + ' · ' + pack.recipients + ' recipients</div>'
  });

  return PP.pageHead({ title: 'Reports', screen: 'reports', sub: 'Find, generate and download reports, and set up automatic delivery so the right people get the numbers without logging in.', actions: '<button class="btn btn-primary" data-action="toast" data-msg="Report generation started, you\'ll be notified when ready">' + PP.icon('plus') + 'Generate report</button>' }) +
    PP.card('reports-lib', { sub: 'Scheduled and previously generated reports', body: list }) +
    (packCard ? '<div class="mt">' + packCard + '</div>' : '');
};

PP.actions['schedule-editor'] = function (el) {
  var r = PP.REPORTS.find(function (x) { return x.id === el.getAttribute('data-id'); });
  var people = ['Priya Nair', 'David Chen', 'Tom Okafor', 'Facilities team', 'site-managers@meridianpg.com.au', 'board@meridianpg.com.au'].slice(0, Math.max(2, r.recipients));
  PP.overlay.open({
    title: 'Schedule · ' + r.name, fid: 'schedule-editor', sub: 'How often this report runs and who receives it.',
    body: '<div class="form g-2"><label class="field"><span>Frequency</span><select class="select"><option>Daily</option><option' + (r.cadence.indexOf('Weekly') === 0 ? ' selected' : '') + '>Weekly</option><option>Fortnightly</option><option' + (r.cadence.indexOf('Monthly') === 0 ? ' selected' : '') + '>Monthly</option><option' + (r.cadence.indexOf('Quarterly') === 0 ? ' selected' : '') + '>Quarterly</option></select></label>' +
      '<label class="field"><span>Day</span><select class="select"><option>Monday</option><option>Tuesday</option><option>Friday</option><option>1st of month</option></select></label>' +
      '<label class="field"><span>Time</span><input class="input" type="time" value="07:00"></label>' +
      '<label class="field"><span>Format</span><select class="select"><option>PDF</option><option>PDF + CSV</option><option>Excel</option></select></label>' +
      '<label class="field span-all"><span>Sites included</span><div class="pills">' + PP.sites().map(function (s) { return '<span class="pill on click">' + s.name + '</span>'; }).join('') + '</div></label>' +
      '<label class="field span-all"><span>Recipients</span><div class="pills">' + people.map(function (p) { return '<span class="pill on">' + p + ' ✕</span>'; }).join('') + '</div><input class="input mt-s" placeholder="Add a name or email address"></label>' +
      '<div class="span-all">' + PP.switchHtml('Schedule active', true) + '</div></div>',
    footer: '<button class="btn" data-action="ov-close">Cancel</button><button class="btn btn-primary" data-action="save-close" data-msg="Schedule saved">Save schedule</button>'
  });
};

PP.packSlides = function () {
  var sites = PP.sites();
  var places = sites.map(function (s) { return PP.place(s.id); });
  var stats = places.map(PP.stats);
  var trend = PP.range(13).map(function (i) { return PP.sum(places.map(function (p) { return PP.sum(PP.series.daily(p, 91).slice(i * 7, i * 7 + 7)); })); });
  return [
    '<div class="slide dark"><div class="eyebrow">Meridian Property Group · Board Pack</div><h2 style="font-size:2.6em">Q3 FY26 Place Performance</h2><p style="color:#b9c3ea;margin-top:auto">Prepared ' + PP.dateLabel(new Date()) + ' · Place Performance Executive</p><span class="pg" style="color:#8fa0e8">1</span></div>',
    '<div class="slide"><div class="eyebrow" style="color:var(--accent)">Headline</div><h2>Portfolio index up 3.4 points to 72</h2><div class="grid g-3" style="margin-top:auto"><div><div class="muted small">Quarterly visits</div><div style="font-size:2.2em;font-weight:600">' + PP.short(PP.sum(trend)) + '</div></div><div><div class="muted small">Avg occupancy</div><div style="font-size:2.2em;font-weight:600">' + PP.pct(PP.avg(stats.map(function (s) { return s.occPct; })) * 100) + '</div></div><div><div class="muted small">Cohort percentile</div><div style="font-size:2.2em;font-weight:600">72nd</div></div></div><span class="pg">2</span></div>',
    '<div class="slide"><div class="eyebrow" style="color:var(--accent)">Visitation trend</div><h2>Weekly visits across the quarter</h2><div style="margin-top:auto">' + PP.Charts.line({ labels: PP.range(13).map(function (i) { return 'Wk ' + (i + 1); }), series: [{ values: trend, color: PP.C.blue, area: true }], height: 190, xTicks: 7 }) + '</div><span class="pg">3</span></div>',
    '<div class="slide"><div class="eyebrow" style="color:var(--accent)">Site ranking</div><h2>Best and worst performers</h2><div style="margin-top:auto">' + PP.Charts.hbars(sites.map(function (s, i) { return { label: s.name, value: stats[i].score, color: PP.scoreColor(stats[i].score) }; }).sort(function (a, b) { return b.value - a.value; }), { max: 100 }) + '</div><span class="pg">4</span></div>',
    '<div class="slide"><div class="eyebrow" style="color:var(--accent)">AI recommendations</div><h2>Three decisions for the board</h2><ol style="margin-top:auto;font-size:1.15em;line-height:1.7">' + PP.INSIGHTS.slice(0, 3).map(function (i) { return '<li><b>' + i.title + '</b> · ' + i.impact + '</li>'; }).join('') + '</ol><span class="pg">5</span></div>',
    '<div class="slide"><div class="eyebrow" style="color:var(--accent)">Investment outcomes</div><h2>Capital works are paying back</h2><div class="grid g-3" style="margin-top:auto">' + PP.INTERVENTIONS.map(function (x) { return '<div><div class="small muted">' + x.name + '</div><div style="font-size:2em;font-weight:600">' + x.payback + '%</div><div class="small muted">payback · ' + PP.money(x.cost) + '</div></div>'; }).join('') + '</div><span class="pg">6</span></div>'
  ];
};
PP.packIdx = 0;
PP.actions['pack-go'] = function (el) {
  var slides = PP.packSlides();
  var v = el.getAttribute('data-v');
  PP.packIdx = v === 'next' ? Math.min(slides.length - 1, PP.packIdx + 1) : v === 'prev' ? Math.max(0, PP.packIdx - 1) : +v;
  document.getElementById('pack-stage').innerHTML = slides[PP.packIdx];
  document.querySelectorAll('.slide-thumbs button').forEach(function (b, i) { b.classList.toggle('on', i === PP.packIdx); });
};

PP.S.reportDetail = function (id) {
  var rep = PP.REPORTS.find(function (r) { return r.id === id; }) || PP.REPORTS[0];
  PP.crumbs = [{ label: PP.CUSTOMER.short }, { label: 'Reports', go: '/reports' }, { label: rep.name }];
  var back = { label: 'Back to Reports', go: '/reports' };
  var exportBtns = '<button class="btn" data-action="toast" data-msg="Exported ' + rep.name + ' to PDF">' + PP.icon('download') + 'Export PDF</button><button class="btn" data-action="toast" data-msg="Exported data to CSV">' + PP.icon('download') + 'CSV</button>' + PP.opener('schedule-editor', 'Schedule', 'data-action="schedule-editor" data-id="' + rep.id + '"', { cls: '', icon: 'calendar' });
  if (PP.state.level < rep.level) return PP.pageHead({ title: rep.name, screen: 'reports', back: back }) + PP.empty('lock', 'This report is part of ' + PP.levelName(rep.level), rep.desc, '<button class="btn btn-primary" data-action="set-level" data-level="' + rep.level + '">Preview at Level ' + rep.level + '</button>');

  if (rep.pack) {
    if (!PP.can('exec-pack')) return PP.pageHead({ title: rep.name, screen: 'reports', back: back }) + PP.locked('exec-pack', {});
    var slides = PP.packSlides();
    PP.packIdx = 0;
    return PP.pageHead({ title: rep.name, screen: 'reports', fid: 'exec-pack', back: back, sub: 'Executive Reporting Pack · ' + slides.length + ' slides, ready to present or export.', actions: '<button class="btn" data-action="toast" data-msg="Exported to PowerPoint">' + PP.icon('download') + 'PPTX</button><button class="btn" data-action="toast" data-msg="Exported to PDF">' + PP.icon('download') + 'PDF</button><button class="btn btn-primary" data-action="toast" data-msg="Presenting full screen">' + PP.icon('eye') + 'Present</button>' }) +
      '<div style="max-width:980px;margin:0 auto"><div id="pack-stage">' + slides[0] + '</div><div class="slide-nav"><button class="btn btn-sm" data-action="pack-go" data-v="prev">' + PP.icon('back') + '</button><div class="slide-thumbs">' + slides.map(function (_, i) { return '<button class="' + (i ? '' : 'on') + '" data-action="pack-go" data-v="' + i + '" aria-label="Slide ' + (i + 1) + '"></button>'; }).join('') + '</div><button class="btn btn-sm" data-action="pack-go" data-v="next">' + PP.icon('chev') + '</button></div></div>';
  }

  var sites = rep.scope === 'Civic Tower' ? [PP.site('civic')] : PP.sites();
  var places = sites.map(function (s) { return PP.place(s.id); });
  var stats = places.map(PP.stats);
  var days = rep.cadence.indexOf('Monthly') === 0 ? 30 : rep.cadence.indexOf('Quarterly') === 0 ? 90 : 7;
  var series = PP.range(days).map(function (i) { return PP.sum(places.map(function (p) { return PP.series.daily(p, days)[i]; })); });
  var tot = PP.sum(series);
  var devs = PP.DEVICES.filter(function (d) { return sites.some(function (s) { return s.id === d.siteId; }); });
  var on = devs.filter(function (d) { return d.status === 'online'; }).length;
  var alerts = PP.ALERTS.filter(function (a) { return sites.some(function (s) { return s.id === a.siteId; }); });
  var hot = [];
  sites.forEach(function (s) { PP.flatZones(s).forEach(function (z) { if (z.base > 0.72) hot.push({ s: s, z: z }); }); });

  var sec = {};
  sec.summary = '<h3>Summary</h3><div class="grid g-4"><div>' + PP.kpi('Visitors', PP.fmt(tot), { delta: 4.8, deltaLabel: 'vs prior period' }) + '</div><div>' + PP.kpi('Daily average', PP.fmt(tot / days)) + '</div><div>' + PP.kpi('Avg occupancy', PP.pct(PP.avg(stats.map(function (s) { return s.occPct; })) * 100)) + '</div><div>' + PP.kpi('Avg dwell', PP.mins(PP.avg(stats.map(function (s) { return s.dwell; })))) + '</div></div>' +
    '<p>' + (rep.id === 'devices' ? 'Device uptime held at ' + PP.fmt1(PP.avg(devs.map(function (d) { return d.uptime; }))) + '% across ' + devs.length + ' sensors. ' + (devs.length - on) + ' devices need attention.' : 'Visitation rose 4.8% on the prior period, led by ' + sites[0].name + '. Peaks remain concentrated around late morning and lunchtime; ' + hot.length + ' zones regularly ran above 85% of capacity.') + '</p>';
  sec.trend = '<h3>Visitation trend</h3>' + PP.Charts.bars({ labels: PP.daysBack(days).map(function (d) { return days === 7 ? PP.DAYS[d.getDay()] : PP.dateLabel(d); }), series: [{ name: 'Visitors', values: series, color: PP.C.blue }], height: 240, xTicks: 15, wide: true });
  sec.sites = '<h3>By site</h3><table class="tbl"><thead><tr><th>Site</th><th class="num">Visitors</th><th class="num">Change</th><th class="num">Peak occupancy</th><th class="num">Avg dwell</th>' + (PP.state.level >= 3 ? '<th class="num">Score</th>' : '') + '</tr></thead><tbody>' + sites.map(function (s, i) {
    var v = PP.sum(PP.series.daily(places[i], days));
    return '<tr><td class="name">' + s.name + '</td><td class="num">' + PP.fmt(v) + '</td><td class="num ' + (stats[i].visitorsDelta >= 0 ? 'up' : 'down') + '">' + (stats[i].visitorsDelta >= 0 ? '+' : '') + PP.fmt1(stats[i].visitorsDelta) + '%</td><td class="num">' + PP.pct(stats[i].peakPct * 100) + '</td><td class="num">' + PP.mins(stats[i].dwell) + '</td>' + (PP.state.level >= 3 ? '<td class="num">' + stats[i].score + '</td>' : '') + '</tr>';
  }).join('') + '</tbody></table>';
  sec.peaks = '<h3>Peak periods</h3>' + PP.Charts.heat(PP.series.heat(places[0]), { wide: true }) + '<p>Busiest window: <b>' + (sites[0].layout === 'retail' ? 'Saturday 12–2pm' : 'Tuesday–Thursday 10am–12pm') + '</b>. Quietest staffed hours: <b>' + (sites[0].layout === 'office' ? 'Friday after 3pm' : 'weekdays after 7pm') + '</b>.</p>';
  sec.dwell = '<h3>Dwell time</h3>' + PP.Charts.bars({ labels: PP.series.dwell(places[0]).labels, series: [{ values: PP.series.dwell(places[0]).values, color: PP.C.purple }], height: 220, wide: true });
  sec.capacity = '<h3>Zones regularly above 85% capacity</h3>' + (hot.length ? '<table class="tbl"><thead><tr><th>Zone</th><th>Site · floor</th><th class="num">Capacity</th><th class="num">Avg peak</th></tr></thead><tbody>' + hot.slice(0, 8).map(function (h) { return '<tr><td class="name">' + h.z.name + '</td><td>' + h.s.name + ' · ' + PP.place(h.z.spaceId).name + '</td><td class="num">' + h.z.capacity + '</td><td class="num">' + PP.pct(PP.clamp(h.z.base * 118, 0, 109)) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p>None this period.</p>');
  sec.devices = '<h3>Device health</h3><div class="grid g-3"><div>' + PP.kpi('Sensors', devs.length) + '</div><div>' + PP.kpi('Online', on) + '</div><div>' + PP.kpi('Avg uptime', PP.fmt1(PP.avg(devs.map(function (d) { return d.uptime; }))) + '%') + '</div></div>' +
    '<table class="tbl mt-s"><thead><tr><th>Device</th><th>Location</th><th>Status</th><th>Issue</th></tr></thead><tbody>' + devs.filter(function (d) { return d.status !== 'online'; }).slice(0, 8).map(function (d) { return '<tr><td class="mono">' + d.id + '</td><td>' + PP.place(d.zoneId).name + ', ' + PP.site(d.siteId).name + '</td><td>' + PP.status(d.status) + '</td><td class="small">' + (d.issue || '') + '</td></tr>'; }).join('') + '</tbody></table>';
  sec.alerts = '<h3>Alerts this period</h3><p>' + alerts.length + ' alerts raised · ' + alerts.filter(function (a) { return a.status === 'resolved'; }).length + ' resolved · median time to acknowledge 14 min.</p>' + PP.Charts.hbars([['Occupancy', 'occupancy'], ['Device', 'device'], ['Queue', 'queue'], ['Integration', 'integration']].map(function (k) { return { label: k[0], value: alerts.filter(function (a) { return a.kind === k[1]; }).length, color: PP.C.orange }; }));
  sec.flow = '<h3>Zone performance & visitor flow</h3>' + PP.Charts.hbars(PP.flatZones(sites[0]).slice(0, 8).map(function (z) { return { label: z.name + ' (' + PP.place(z.spaceId).name + ')', value: PP.stats(PP.place(z.id)).visitors, color: PP.C.teal }; }).sort(function (a, b) { return b.value - a.value; })) + '<p>Most common path: <b>Main entry → ' + PP.flatZones(sites[0])[1].name + '</b>. Returning visitors make up ' + PP.pct(PP.avg(stats.map(function (s) { return s.repeat; }))) + ' of traffic.</p>';
  sec.queues = '<h3>Queues & utilisation</h3><p>Average wait across monitored queue points was <b>4.6 minutes</b>; 86% of customers were served within the 5-minute target. Utilisation averaged ' + PP.pct(PP.avg(stats.map(function (s) { return s.occPct; })) * 100) + ' of capacity.</p>';
  sec.commentary = '<h3>Commentary & recommended actions</h3><ul style="color:var(--ink-2);line-height:1.7"><li>Roster one additional staff member at ' + sites[0].name + ' between 12pm and 2pm on peak days.</li><li>Review capacity in the ' + (hot[0] ? hot[0].z.name : 'busiest zone') + ', which exceeded 85% on most days.</li><li>Replace or clean the ' + (devs.length - on) + ' sensors flagged in device health to keep data confidence above 95%.</li></ul>';
  var order = {
    weekly: ['summary', 'trend', 'sites', 'peaks', 'dwell', 'alerts', 'commentary'],
    occupancy: ['summary', 'sites', 'capacity', 'peaks', 'commentary'],
    devices: ['summary', 'devices', 'alerts'],
    peaks: ['summary', 'peaks', 'trend', 'commentary'],
    behaviour: ['summary', 'flow', 'dwell', 'sites', 'commentary'],
    utilisation: ['summary', 'queues', 'capacity', 'sites', 'commentary'],
    portfolio: ['summary', 'sites', 'trend', 'capacity', 'commentary']
  }[rep.id] || ['summary', 'trend', 'sites'];

  return PP.pageHead({ title: rep.name, screen: 'reports', fid: 'report-detail', back: back, sub: rep.desc, actions: exportBtns }) +
    '<div class="report"><div class="report-head"><div><div class="small strong" style="color:var(--accent)">MERIDIAN PROPERTY GROUP · PLACE PERFORMANCE</div><h2>' + rep.name + '</h2><div class="muted">' + rep.scope + ' · period ending ' + PP.dateLabel(new Date()) + ' · ' + days + ' days</div></div><div class="cust-logo" style="width:54px;height:54px;font-size:20px;border-radius:14px">' + PP.CUSTOMER.initials + '</div></div>' +
    order.map(function (k) { return sec[k]; }).join('') + '<div class="divide"></div><div class="tiny muted">Generated automatically by Place Performance · ' + rep.cadence + ' · Data from ' + devs.length + ' sensors</div></div>';
};

/* =========================================================
   8 · Alerts (+ Alert Detail drill-down, Rule Editor overlay)
   ========================================================= */
PP.alertFilter = 'all';
PP.S.alerts = function () {
  var list = PP.visibleAlerts().filter(function (a) { return PP.alertFilter === 'all' || a.status === PP.alertFilter; });
  var icon = { occupancy: 'people', device: 'cpu', queue: 'queue', system: 'mail', integration: 'plug' };
  var tint = { high: 'tint-red', medium: 'tint-amber', low: 'tint-blue' };
  var feed = PP.card('notif-feed', {
    sub: 'Triggered alerts and system messages, newest first',
    actions: '<div class="seg">' + [['all', 'All'], ['open', 'Open'], ['acknowledged', 'Acknowledged'], ['resolved', 'Resolved']].map(function (f) { return '<button class="' + (PP.alertFilter === f[0] ? 'on' : '') + '" data-action="alert-filter" data-v="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>',
    body: '<div class="list" style="margin:0 -18px">' + (list.length ? list.map(function (a) {
      return '<div class="li click" data-go="/alerts/' + a.id + '"><div class="li-ico ' + tint[a.sev] + '">' + PP.icon(icon[a.kind]) + '</div><div class="li-main"><div class="li-t">' + a.title + '</div><div class="li-s">' + PP.site(a.siteId).name + ' · ' + PP.place(a.zoneId).name + ' · ' + a.text + '</div></div><div class="li-r">' + PP.status(a.status) + '<br>' + PP.ago(a.mins) + '</div><span class="open-tag drill annot">↗</span></div>';
    }).join('') : '<div class="li"><span class="muted">Nothing here.</span></div>') + '</div>'
  });
  var rules = PP.card('alert-rules', {
    sub: 'The rules that decide when an alert fires',
    actions: PP.opener('rule-editor', 'New rule', 'data-action="rule-editor"', { cls: 'btn-sm btn-primary', icon: 'plus' }),
    body: '<div class="list" style="margin:0 -18px">' + PP.RULES.map(function (r) {
      return '<div class="li click" data-action="rule-editor" data-id="' + r.id + '"><div class="li-main"><div class="li-t">' + r.name + '</div><div class="li-s">' + r.metric + ' ' + r.op + ' ' + r.value + ' · ' + r.scope + ' · ' + r.recipients.length + ' recipients</div></div><div class="li-r">' + PP.status(r.sev) + '<br>' + (r.on ? '<span class="up strong">On</span>' : '<span class="muted">Off</span>') + '</div><span class="open-tag overlay annot">⧉</span></div>';
    }).join('') + '</div>'
  });
  return PP.pageHead({ title: 'Alerts', screen: 'alerts', sub: 'What has been triggered and why, and the rules that decide when you get alerted.' }) +
    '<div class="grid g-main">' + feed + (rules || '<div></div>') + '</div>';
};
PP.actions['alert-filter'] = function (el) { PP.alertFilter = el.getAttribute('data-v'); PP.render(true); };
PP.actions['rule-editor'] = function (el) {
  var r = PP.RULES.find(function (x) { return x.id === el.getAttribute('data-id'); }) || { name: '', metric: 'Occupancy % of capacity', op: '>', value: 85, duration: '10 min', scope: 'All zones', sev: 'medium', recipients: ['Priya Nair'], escalate: 'None', on: true };
  var metrics = ['Occupancy % of capacity', 'Visitors per hour', 'Average queue wait (min)', 'Device heartbeat', 'Entry/exit imbalance %', 'Visitors vs expected %', 'Integration last sync (h)'];
  PP.overlay.open({
    title: r.name ? 'Edit rule · ' + r.name : 'New alert rule', fid: 'rule-editor', size: 'lg', sub: 'Threshold or condition-based rule, its recipients and escalation.',
    body: '<div class="form g-2"><label class="field span-all"><span>Rule name</span><input class="input" value="' + PP.esc(r.name) + '" placeholder="e.g. Café queue too long"></label>' +
      '<div class="span-all"><div class="small strong" style="margin-bottom:6px">When</div><div class="row" style="background:var(--paper-2);padding:12px;border-radius:10px;border:1px solid var(--line)">' +
      '<select class="select select-sm">' + metrics.map(function (m) { return '<option' + (m === r.metric ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select>' +
      '<select class="select select-sm"><option' + (r.op === '>' ? ' selected' : '') + '>is above</option><option' + (r.op === '<' ? ' selected' : '') + '>is below</option><option>is missing for</option></select>' +
      '<input class="input" style="width:90px" value="' + r.value + '"><span class="small">for at least</span><select class="select select-sm"><option>5 min</option><option selected>' + r.duration + '</option><option>1 hour</option></select></div>' +
      '<button class="btn btn-sm btn-ghost mt-s">' + PP.icon('plus') + 'Add condition (AND)</button></div>' +
      '<label class="field"><span>Applies to</span><select class="select"><option>' + r.scope + '</option><option>All sites</option>' + PP.sites().map(function (s) { return '<option>' + s.name + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span>Severity</span><select class="select"><option' + (r.sev === 'high' ? ' selected' : '') + '>High</option><option' + (r.sev === 'medium' ? ' selected' : '') + '>Medium</option><option' + (r.sev === 'low' ? ' selected' : '') + '>Low</option></select></label>' +
      '<label class="field span-all"><span>Recipients</span><div class="pills">' + r.recipients.map(function (p) { return '<span class="pill on">' + p + ' ✕</span>'; }).join('') + '</div><input class="input mt-s" placeholder="Add a person, team or email"></label>' +
      '<label class="field"><span>Notify by</span><div class="pills"><span class="pill on click">Email</span><span class="pill on click">In-app</span><span class="pill click">SMS</span><span class="pill click">Teams</span></div></label>' +
      '<label class="field"><span>Escalation</span><select class="select"><option>' + r.escalate + '</option><option>Escalate to Operations Manager after 20 min</option><option>None</option></select></label>' +
      '<div class="span-all">' + PP.switchHtml('Rule active', r.on) + '</div></div>',
    footer: '<button class="btn" data-action="ov-close">Cancel</button><button class="btn btn-primary" data-action="save-close" data-msg="Rule saved">Save rule</button>'
  });
};
PP.S.alertDetail = function (id) {
  var a = PP.ALERTS.find(function (x) { return x.id === id; }) || PP.ALERTS[0];
  var z = PP.place(a.zoneId), space = z.space;
  PP.crumbs = [{ label: PP.CUSTOMER.short }, { label: 'Alerts', go: '/alerts' }, { label: a.id }];
  var r = PP.rng('ad' + a.id);
  var pts = PP.range(24).map(function (i) { return i < 14 ? PP.between(r, 55, 82) : i < 20 ? PP.between(r, 90, 104) : PP.between(r, 70, 88); });
  var thr = a.kind === 'queue' ? 8 : 90;
  if (a.kind === 'queue') pts = pts.map(function (v) { return v / 10; });
  var t0 = a.mins;
  var showChart = a.kind === 'occupancy' || a.kind === 'queue';
  return PP.pageHead({ title: a.title, screen: 'alerts', fid: 'alert-detail', back: { label: 'Back to Alerts', go: '/alerts' }, sub: a.id + ' · ' + PP.site(a.siteId).name + ' · ' + z.name + ' · triggered ' + PP.ago(a.mins), chips: PP.status(a.sev) + PP.status(a.status),
    actions: '<button class="btn" data-action="toast" data-msg="Alert acknowledged">' + PP.icon('check') + 'Acknowledge</button><button class="btn btn-primary" data-action="toast" data-msg="Alert resolved">Resolve</button>' }) +
    '<div class="grid g-main"><div class="stack">' +
    PP.card(null, { title: 'What happened', body: '<p style="margin-top:0">' + a.text + '</p>' + (showChart ? PP.Charts.line({ labels: PP.range(24).map(function (i) { return '-' + (24 - i) * 5 + 'm'; }), series: [{ name: a.kind === 'queue' ? 'Wait (min)' : 'Occupancy %', values: pts, color: PP.C.orange, area: true }, { name: 'Threshold', values: pts.map(function () { return thr; }), color: PP.C.red, dash: true }], marker: 14, markerLabel: 'Triggered', height: 260, xTicks: 12, wide: true }) : '') }) +
    PP.card(null, { title: 'Where', sub: z.name + ' on the ' + space.name + ' plan', icon: 'map', body: '<div class="fp">' + PP.Floorplan.occupancy(space, { highlight: z.id, go: PP.can('visitor-count') }) + '</div>', actions: '<button class="btn btn-sm" data-go="' + PP.placeRoute(z) + '">Open place detail</button>' }) +
    '</div><div class="stack">' +
    PP.card(null, { title: 'Timeline', body: '<div class="list" style="margin:0 -18px">' + [['bolt', 'tint-red', 'Triggered', 'Rule: ' + (a.rule || 'System message'), t0], ['mail', 'tint-blue', 'Notified', 'Email + in-app to Priya Nair, Facilities team', t0 - 0.2], ['user', 'tint-amber', a.status === 'open' ? 'Awaiting acknowledgement' : 'Acknowledged by Tom Okafor', a.status === 'open' ? 'Escalates after 20 minutes' : 'Via mobile', Math.max(0, t0 - 6)], ['check', 'tint-green', a.status === 'resolved' ? 'Resolved' : 'Not yet resolved', a.status === 'resolved' ? 'Condition cleared' : '—', Math.max(0, t0 - 25)]].map(function (s) { return '<div class="li"><div class="li-ico ' + s[1] + '">' + PP.icon(s[0]) + '</div><div class="li-main"><div class="li-t">' + s[2] + '</div><div class="li-s">' + s[3] + '</div></div><div class="li-r">' + PP.stamp(s[4]) + '</div></div>'; }).join('') + '</div>' }) +
    PP.card(null, { title: 'Context', body: '<dl class="kv"><dt>Site</dt><dd>' + PP.site(a.siteId).name + '</dd><dt>Zone</dt><dd>' + z.name + '</dd><dt>Rule</dt><dd>' + (a.rule || '—') + '</dd>' + (a.deviceId ? '<dt>Device</dt><dd>' + (PP.can('device-detail') ? '<a href="#/devices/' + a.deviceId + '" class="mono">' + a.deviceId + '</a>' : a.deviceId) + '</dd>' : '') + '<dt>Severity</dt><dd>' + PP.status(a.sev) + '</dd></dl>' + (PP.can('alert-rules') && a.rule ? '<button class="btn btn-sm mt" data-action="rule-editor" data-id="' + (PP.RULES.find(function (x) { return x.name === a.rule; }) || {}).id + '">Edit rule<span class="open-tag overlay annot">⧉</span></button>' : '') }) +
    '<div class="card"><div class="card-b"><label class="field"><span>Add a note</span><textarea class="input" rows="3" placeholder="e.g. Story-time moved to Level 1 to reduce crowding"></textarea></label><button class="btn btn-sm mt-s" data-action="toast" data-msg="Note added">Add note</button></div></div>' +
    '</div></div>';
};

/* =========================================================
   9 · Devices (+ Device Detail drill-down, Remote Device Access)
   ========================================================= */
PP.devFilter = { status: 'all', q: '', site: 'all' };
PP.devMapSpace = null;
PP.S.devices = function () {
  var all = PP.visibleDevices();
  var c = { online: 0, warning: 0, offline: 0 };
  all.forEach(function (d) { c[d.status]++; });
  var f = PP.devFilter;
  var list = all.filter(function (d) {
    return (f.status === 'all' || d.status === f.status) && (f.site === 'all' || d.siteId === f.site) && (!f.q || (d.id + ' ' + d.typeLabel + ' ' + PP.place(d.zoneId).name).toLowerCase().indexOf(f.q.toLowerCase()) >= 0);
  }).sort(function (a, b) { var o = { offline: 0, warning: 1, online: 2 }; return o[a.status] - o[b.status]; });
  var canDetail = PP.can('device-detail');
  var sites = PP.sites();
  if (!PP.devMapSpace || !PP.place(PP.devMapSpace) || !sites.some(function (s) { return s.id === PP.place(PP.devMapSpace).site.id; })) PP.devMapSpace = sites[0].spaces[0].id;
  var mspace = PP.place(PP.devMapSpace).space;

  var table = PP.card('device-list', {
    sub: list.length + ' of ' + all.length + ' devices',
    actions: '<input class="input" style="width:180px;padding:6px 10px" placeholder="Search devices…" value="' + PP.esc(f.q) + '" data-input="dev-q">' +
      (sites.length > 1 ? '<select class="select select-sm" data-input="dev-site"><option value="all">All sites</option>' + sites.map(function (s) { return '<option value="' + s.id + '"' + (f.site === s.id ? ' selected' : '') + '>' + s.name + '</option>'; }).join('') + '</select>' : '') +
      '<div class="seg">' + [['all', 'All'], ['online', 'Online'], ['warning', 'Warning'], ['offline', 'Offline']].map(function (s) { return '<button class="' + (f.status === s[0] ? 'on' : '') + '" data-action="dev-status" data-v="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div>',
    flush: true,
    body: '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Device</th><th>Type</th><th>Location</th><th>Status</th><th>Health (30d)</th><th class="num">Last reported</th></tr></thead><tbody>' + list.slice(0, 40).map(function (d) {
      var z = PP.place(d.zoneId);
      return '<tr' + (canDetail ? ' class="click" data-go="/devices/' + d.id + '"' : '') + '><td><div class="name mono">' + d.id + '</div><div class="sub">' + d.model + '</div></td><td>' + d.typeLabel + '</td><td><div>' + z.site.name + '</div><div class="sub">' + z.space.name + ' · ' + z.name + '</div></td><td>' + PP.status(d.status) + (d.issue ? '<div class="sub" style="margin-top:3px">' + d.issue + '</div>' : '') + '</td><td style="width:120px">' + PP.Charts.meter(d.uptime / 100, d.uptime > 99 ? PP.C.green : d.uptime > 93 ? PP.C.amber : PP.C.red) + '<div class="sub">' + PP.fmt1(d.uptime) + '% uptime</div></td><td class="num">' + PP.ago(d.lastSeen) + '</td></tr>';
    }).join('') + '</tbody></table></div>' + (list.length > 40 ? '<div class="pager"><span>Showing 40 of ' + list.length + '</span><span>Page 1</span></div>' : '')
  });

  var spaceOpts = sites.map(function (s) { return '<optgroup label="' + s.name + '">' + s.spaces.map(function (sp) { return '<option value="' + sp.id + '"' + (sp.id === mspace.id ? ' selected' : '') + '>' + sp.name + '</option>'; }).join('') + '</optgroup>'; }).join('');
  var mapCard = PP.card('device-map', {
    sub: 'Where every device is physically located, sites on the map, then devices on each floorplan',
    body: '<div class="grid g-2"><div id="dev-map" class="map"></div><div><div class="row-between" style="margin-bottom:8px"><span class="small strong">Floorplan</span><select class="select select-sm" data-input="dev-space">' + spaceOpts + '</select></div><div class="fp">' + PP.Floorplan.devices(mspace, { action: canDetail ? 'dev-open' : 'device-overlay' }) + '</div><div class="fp-legend mt-s"><span><i style="background:#17915b;border-radius:50%"></i>Online</span><span><i style="background:#d4a20b;border-radius:50%"></i>Warning</span><span><i style="background:#d13a3a;border-radius:50%"></i>Offline</span></div></div></div>'
  });

  PP.onMount(function () {
    if (!PP.can('device-map')) return;
    var m = PP.Maps.make('dev-map');
    var pts = [];
    sites.forEach(function (s) {
      var ds = all.filter(function (d) { return d.siteId === s.id; });
      var bad = ds.filter(function (d) { return d.status === 'offline'; }).length, warn = ds.filter(function (d) { return d.status === 'warning'; }).length;
      pts.push([s.lat, s.lng]);
      PP.Maps.bubble(m, s.lat, s.lng, {
        key: s.id, radius: 6 + ds.length / 14, color: bad / ds.length > 0.06 ? PP.C.red : bad || warn ? PP.C.amber : PP.C.green, label: s.name, value: ds.length + ' devices · ' + bad + ' offline', halo: bad / ds.length > 0.06,
        popup: '<b>' + s.name + '</b><div class="muted">' + ds.length + ' devices · ' + bad + ' offline · ' + warn + ' warning</div>' + s.spaces.map(function (sp) { return '<button class="btn btn-sm" style="margin-right:4px" data-action="dev-space-btn" data-id="' + sp.id + '">' + sp.name + '</button>'; }).join('')
      });
    });
    PP.Maps.panel(m, 'Device health by site', sites.map(function (s) {
      var ds = all.filter(function (d) { return d.siteId === s.id; }), bad = ds.filter(function (d) { return d.status === 'offline'; }).length, warn = ds.filter(function (d) { return d.status === 'warning'; }).length;
      return { key: s.id, name: s.name, sub: bad + ' offline · ' + warn + ' warning', value: String(ds.length), color: bad / ds.length > 0.06 ? PP.C.red : bad || warn ? PP.C.amber : PP.C.green };
    }));
    PP.Maps.fit(m, pts, 40);
  });

  return PP.pageHead({ title: 'Devices', screen: 'devices', sub: 'The hardware feeding your data, where it is and whether it\'s healthy.' }) +
    '<div class="grid g-4"><div class="card">' + PP.kpi('Total devices', all.length, { icon: 'cpu' }) + '</div><div class="card">' + PP.kpi('Online', '<span class="up">' + c.online + '</span>', { icon: 'check' }) + '</div><div class="card">' + PP.kpi('Warning', '<span style="color:var(--warn)">' + c.warning + '</span>', { icon: 'alert' }) + '</div><div class="card">' + PP.kpi('Offline', '<span class="down">' + c.offline + '</span>', { icon: 'close' }) + '</div></div>' +
    (mapCard ? '<div class="mt">' + mapCard + '</div>' : '') + '<div class="mt">' + table + '</div>';
};
PP.actions['dev-status'] = function (el) { PP.devFilter.status = el.getAttribute('data-v'); PP.render(true); };
PP.inputs['dev-site'] = function (el) { PP.devFilter.site = el.value; PP.render(true); };
PP.inputs['dev-space'] = function (el) { PP.devMapSpace = el.value; PP.render(true); };
PP.actions['dev-space-btn'] = function (el) { PP.devMapSpace = el.getAttribute('data-id'); PP.render(true); };
PP.actions['dev-open'] = function (el) { PP.go('/devices/' + el.getAttribute('data-id')); };
PP._devQTimer = null;
PP.inputs['dev-q'] = function (el) {
  PP.devFilter.q = el.value;
  clearTimeout(PP._devQTimer);
  PP._devQTimer = setTimeout(function () { PP.render(true); var i = document.querySelector('[data-input="dev-q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250);
};

PP.S.deviceDetail = function (id) {
  var d = PP.device(id) || PP.DEVICES[0];
  PP.crumbs = [{ label: PP.CUSTOMER.short }, { label: 'Devices', go: '/devices' }, { label: d.id }];
  var remote = PP.card('remote-access', {
    sub: 'Connect into this device for diagnostics and support. Password-protected.',
    body: '<div class="row"><button class="btn btn-primary" data-action="remote-start" data-id="' + d.id + '">' + PP.icon('terminal') + 'Remote into device</button><span class="small muted">Sessions are recorded in the audit log.</span></div>'
  });
  return PP.pageHead({ title: d.id, screen: 'devices', fid: 'device-detail', back: { label: 'Back to Devices', go: '/devices' }, sub: d.typeLabel + ' · ' + d.model, chips: PP.status(d.status),
    actions: '<button class="btn" data-action="toast" data-msg="Restart command sent">' + PP.icon('refresh') + 'Restart</button><button class="btn" data-action="toast" data-msg="Firmware update scheduled for 2:00am">Update firmware</button>' }) +
    '<div class="grid g-main"><div>' + PP.card(null, { title: 'Device record', body: PP.deviceDetailBody(d, true) }) + '</div><div class="stack">' + (remote || '') +
    PP.card(null, { title: 'Recent events', body: '<div class="list" style="margin:0 -18px">' + [['Heartbeat received', d.lastSeen], ['Count batch uploaded (412 events)', d.lastSeen + 1], ['Firmware check, up to date', 600], ['Configuration changed by Priya Nair', 4320]].map(function (e) { return '<div class="li"><div class="li-main"><div class="li-t" style="font-weight:600">' + e[0] + '</div></div><div class="li-r">' + PP.ago(e[1]) + '</div></div>'; }).join('') + '</div>' }) +
    '</div></div>';
};
PP.actions['remote-start'] = function (el) {
  var id = el.getAttribute('data-id');
  PP.overlay.open({
    title: 'Confirm remote access', size: 'sm', fid: 'remote-access', sub: 'Enter your password to open a remote diagnostics session on ' + id + '.',
    body: '<div class="form"><label class="field"><span>Password</span><input class="input" type="password" placeholder="Your Place Performance password" autocomplete="off"></label><div class="note">Remote sessions are time-limited to 30 minutes and recorded for audit.</div></div>',
    footer: '<button class="btn" data-action="ov-close">Cancel</button><button class="btn btn-primary" data-action="remote-open" data-id="' + id + '">Confirm & connect</button>'
  });
};
PP.actions['remote-open'] = function (el) {
  var id = el.getAttribute('data-id'), d = PP.device(id);
  PP.overlay.close();
  PP.overlay.open({
    title: 'Remote session · ' + id, size: 'lg', fid: 'remote-access', sub: 'Connected via secure tunnel · session expires in 30:00',
    body: '<pre style="background:#18181b;color:#b6f5c9;border-radius:10px;padding:16px;font-size:12.5px;line-height:1.6;margin:0;overflow:auto">' +
      'Connecting to ' + d.ip + ' … ok\n' + d.model + ' · firmware ' + d.firmware + ' · uptime 14d 06:12\n\n$ status\n  sensor ........ ' + (d.status === 'offline' ? 'NO SIGNAL' : 'OK') + '\n  network ....... ' + (d.status === 'warning' ? 'packet loss 4.1%' : 'OK') + '\n  temperature ... 41.2°C\n  counts (1h) ... in 212 / out 198\n\n$ selftest --quick\n  optics ........ ' + (d.issue && d.issue.indexOf('Lens') === 0 ? 'WARN (contrast low, check for obstruction)' : 'PASS') + '\n  clock sync .... PASS\n  storage ....... PASS\n\n$ _</pre>',
    footer: '<button class="btn" data-action="toast" data-msg="Diagnostics bundle downloaded">Download diagnostics</button><button class="btn btn-danger" data-action="save-close" data-msg="Remote session ended">End session</button>'
  });
};

/* =========================================================
   10 · Data Integrations
   ========================================================= */
PP.S.integrations = function () {
  var cards = PP.INTEGRATIONS.map(function (i) {
    var sites = i.sites[0] === 'all' ? 'All sites' : i.sites.map(function (s) { return PP.site(s).name; }).join(', ');
    return '<div class="card"><div class="card-b"><div class="row" style="gap:12px;align-items:flex-start"><div class="li-ico tint-blue" style="width:42px;height:42px">' + PP.icon(i.icon) + '</div><div style="flex:1;min-width:0"><div class="row-between"><div class="strong">' + i.name + '</div>' + PP.status(i.status) + '</div><div class="small muted">' + i.cat + '</div></div></div>' +
      '<dl class="kv mt" style="grid-template-columns:90px 1fr;font-size:12.5px"><dt>Sites</dt><dd>' + sites + '</dd><dt>Last sync</dt><dd>' + (i.last == null ? '—' : PP.ago(i.last)) + '</dd><dt>Data</dt><dd>' + i.records + '</dd></dl></div>' +
      '<div class="card-f">' + (i.status === 'requested' ? '<span class="small muted" style="margin-right:auto">Set-up in progress with ITESA</span>' : '') + PP.opener('integration-config', i.status === 'requested' ? 'View request' : 'Configure', 'data-action="integration-config" data-id="' + i.id + '"', { icon: 'settings' }) + '</div></div>';
  }).join('');
  return PP.pageHead({ title: 'Data Integrations', screen: 'integrations', sub: 'Connect point-of-sale, Wi-Fi, building management and other systems. Integrations are set up by the ITESA team; you can request new ones and adjust the settings that are yours to change.',
    actions: '<button class="btn btn-primary" data-action="integration-request">' + PP.icon('plus') + 'Request an integration</button>' }) +
    '<div class="note info" style="margin-bottom:16px">' + PP.icon('info', 'ico') + ' Most connections need credentials and field mapping that ITESA configures for you. Use <b>Request an integration</b> to start one, you\'ll be notified when it\'s live.</div>' +
    PP.card('connected-systems', { sub: PP.INTEGRATIONS.length + ' systems · ' + PP.INTEGRATIONS.filter(function (i) { return i.status === 'synced'; }).length + ' syncing normally', body: '<div class="grid g-3">' + cards + '</div>' });
};
PP.actions['integration-request'] = function () {
  PP.overlay.open({
    title: 'Request an integration', sub: 'Tell us what you want to connect. ITESA will confirm scope and timing within 2 business days.',
    body: '<div class="form g-2"><label class="field"><span>System type</span><select class="select"><option>Point of sale</option><option>Wi-Fi analytics</option><option>Building management (BMS)</option><option>Parking</option><option>Ticketing</option><option>GIS</option><option>Other</option></select></label>' +
      '<label class="field"><span>Vendor / product</span><input class="input" placeholder="e.g. Square, Aruba, Siemens Desigo"></label>' +
      '<label class="field span-all"><span>Sites</span><div class="pills">' + PP.sites().map(function (s, i) { return '<span class="pill click' + (i < 2 ? ' on' : '') + '">' + s.name + '</span>'; }).join('') + '</div></label>' +
      '<label class="field"><span>Technical contact</span><input class="input" placeholder="Name and email"></label><label class="field"><span>Target date</span><input class="input" type="date"></label>' +
      '<label class="field span-all"><span>What do you want to achieve?</span><textarea class="input" rows="3" placeholder="e.g. Correlate weekend footfall with parking occupancy"></textarea></label></div>',
    footer: '<button class="btn" data-action="ov-close">Cancel</button><button class="btn btn-primary" data-action="save-close" data-msg="Request sent to ITESA">Send request</button>'
  });
};
PP.actions['integration-config'] = function (el) {
  var i = PP.INTEGRATIONS.find(function (x) { return x.id === el.getAttribute('data-id'); });
  var body;
  if (i.status === 'requested') {
    body = '<div class="steps"><div class="step done"><span class="n">✓</span>Requested</div><div class="step on"><span class="n">2</span>ITESA scoping</div><div class="step"><span class="n">3</span>Credentials</div><div class="step"><span class="n">4</span>Live</div></div><p class="muted">Requested by Priya Nair on 2 Oct. ITESA is confirming API access with the vendor. Expected live date: 24 Oct.</p>';
  } else {
    body = '<div class="small strong" style="margin-bottom:8px">Your settings</div><div class="form g-2">' +
      '<label class="field"><span>Sync frequency</span><select class="select"><option>Every 15 minutes</option><option selected>Hourly</option><option>Daily</option></select></label>' +
      '<label class="field"><span>Notify on failure</span><select class="select"><option>Priya Nair</option><option>Facilities team</option><option>Nobody</option></select></label>' +
      '<label class="field span-all"><span>Site mapping</span><table class="tbl"><thead><tr><th>' + i.name + ' location</th><th>Place Performance site</th></tr></thead><tbody>' + (i.sites[0] === 'all' ? PP.sites() : i.sites.map(PP.site)).map(function (s) { return '<tr><td class="mono">' + s.id.toUpperCase() + '-' + (i.id === 'pos' ? 'STORE' : 'LOC') + '-01</td><td>' + s.name + '</td></tr>'; }).join('') + '</tbody></table></label>' +
      '<div class="span-all">' + PP.switchHtml('Use this data in Commercial Correlation and reports', true) + '</div><div class="span-all">' + PP.switchHtml('Pause syncing', false) + '</div></div>' +
      '<div class="divide"></div><div class="small strong" style="margin-bottom:8px">Managed by ITESA</div><dl class="kv"><dt>Connection</dt><dd>OAuth 2.0 · ' + i.name + ' API</dd><dt>Credentials</dt><dd>•••••••• (stored securely)</dd><dt>Status</dt><dd>' + PP.status(i.status) + (i.status === 'error' ? ' <span class="small muted">Token expired, ITESA has been notified</span>' : '') + '</dd></dl>';
  }
  PP.overlay.open({
    title: i.name, fid: 'integration-config', sub: i.cat + ' · settings you can change yourself',
    body: body,
    footer: '<button class="btn" data-action="save-close" data-msg="Support request sent to ITESA">Contact ITESA</button>' + (i.status === 'requested' ? '' : '<button class="btn btn-primary" data-action="save-close" data-msg="Integration settings saved">Save</button>')
  });
};

/* =========================================================
   11 · Organisation Administration
   (+ Sites & Zones Editor and User Management drill-downs)
   ========================================================= */
PP.S.org = function () {
  var hours = [['Monday', '7:00', '19:00'], ['Tuesday', '7:00', '19:00'], ['Wednesday', '7:00', '19:00'], ['Thursday', '7:00', '21:00'], ['Friday', '7:00', '19:00'], ['Saturday', '9:00', '17:00'], ['Sunday', '10:00', '16:00']];
  var profile = PP.card('org-profile', {
    sub: 'Branding, timezone and trading hours for your organisation',
    actions: PP.opener('sites-editor', 'Sites & zones', 'data-go="/org/sites"', { icon: 'layers' }) + PP.opener('user-mgmt', 'Users', 'data-go="/org/users"', { icon: 'users' }),
    body: '<div class="grid g-2"><div class="form">' +
      '<label class="field"><span>Organisation name</span><input class="input" value="' + PP.CUSTOMER.name + '"></label>' +
      '<div class="field"><span>Logo</span><div class="row"><div class="cust-logo" style="width:48px;height:48px;font-size:18px;border-radius:12px">' + PP.CUSTOMER.initials + '</div><button class="btn btn-sm" data-action="toast" data-msg="Logo uploaded">' + PP.icon('upload') + 'Upload new logo</button></div><small>Shown on the login screen and in reports.</small></div>' +
      '<div class="field"><span>Brand colour</span><div class="row">' + ['#18181b', '#4f46e5', '#0f766e', '#db2777', '#f59e0b'].map(function (c, i) { return '<span style="width:30px;height:30px;border-radius:8px;background:' + c + ';cursor:pointer;' + (i === 0 ? 'box-shadow:0 0 0 3px #fff,0 0 0 5px ' + c : '') + '"></span>'; }).join('') + '<input class="input" style="width:110px" value="#18181B"></div></div>' +
      '<label class="field"><span>Timezone</span><select class="select"><option>' + PP.CUSTOMER.timezone + '</option><option>Australia/Sydney (AEDT)</option><option>Australia/Perth (AWST)</option><option>Australia/Brisbane (AEST)</option></select></label>' +
      '</div><div><div class="small strong" style="margin-bottom:8px">Trading hours (default, can be overridden per site)</div><div class="tbl-wrap"><table class="tbl"><tbody>' + hours.map(function (h) { return '<tr><td class="strong">' + h[0] + '</td><td><input class="input" style="width:84px;padding:5px 8px" value="' + h[1] + '"></td><td class="muted">to</td><td><input class="input" style="width:84px;padding:5px 8px" value="' + h[2] + '"></td></tr>'; }).join('') + '</tbody></table></div></div></div>',
    footer: '<button class="btn btn-primary" data-action="toast" data-msg="Organisation profile saved">Save changes</button>'
  });
  var lv = PP.state.level;
  var featsBy = function (n) { return Object.keys(PP.FEATURES).map(function (k) { return PP.FEATURES[k]; }).filter(function (f) { return f.level === n && f.roles.indexOf('admin') < 0 && !f.type; }); };
  var sub = PP.card('subscription', {
    sub: 'Your current plan and the features it includes (read-only)',
    body: '<div class="plan-grid">' + PP.LEVELS.map(function (l) {
      var fs = featsBy(l.n);
      return '<div class="plan' + (l.n === lv ? ' cur' : '') + '" style="' + (l.n > lv ? 'opacity:.6' : '') + '"><div class="row-between"><h4 style="color:' + l.color + '">Level ' + l.n + ' · ' + l.name + '</h4>' + (l.n === lv ? '<span class="chip chip-l' + l.n + '">Current</span>' : l.n < lv ? '<span class="up small strong">✓ Included</span>' : '') + '</div><div class="small muted">' + l.verb + ' · ' + l.tagline + '</div><ul>' + fs.slice(0, 7).map(function (f) { return '<li>' + f.name + '</li>'; }).join('') + (fs.length > 7 ? '<li>+' + (fs.length - 7) + ' more</li>' : '') + '</ul></div>';
    }).join('') + '</div><div class="row mt"><span class="small muted">' + PP.sites().length + ' sites · ' + PP.visibleDevices().length + ' devices · ' + PP.ORG_USERS.length + ' users · renews 1 Mar 2027</span><button class="btn btn-sm" style="margin-left:auto" data-action="toast" data-msg="Your ITESA account manager will be in touch">Talk to us about upgrading</button></div>'
  });
  return PP.pageHead({ title: 'Organisation Administration', screen: 'org', sub: 'Set up the business: branding, trading hours, the site and zone structure, and who has access.' }) +
    '<div class="stack">' + profile + sub + '</div>';
};

PP.editor = { spaceId: null, drawing: false, draft: [], selected: null };
PP.S.orgSites = function (spaceId) {
  var sites = PP.sites();
  var sp = spaceId && PP.place(spaceId) && PP.place(spaceId).kind === 'space' ? PP.place(spaceId).space : sites[0].spaces[0];
  if (PP.editor.spaceId !== sp.id) PP.editor = { spaceId: sp.id, drawing: false, draft: [], selected: null };
  var ed = PP.editor;
  PP.crumbs = [{ label: PP.CUSTOMER.short }, { label: 'Organisation Administration', go: '/org' }, { label: 'Sites & Zones' }];
  var tree = '<div class="tree">' + sites.map(function (s) {
    return '<div class="tree-node"><span class="tree-kind tk-site">Site</span><b>' + s.name + '</b><span class="cap">' + PP.fmt(PP.sum(PP.flatZones(s).map(function (z) { return z.capacity; }))) + '</span></div><div class="tree-children">' + s.spaces.map(function (x) {
      return '<div class="tree-node' + (x.id === sp.id ? ' on' : '') + '" data-go="/org/sites/' + x.id + '"><span class="tree-kind tk-space">Space</span>' + x.name + '<span class="cap">' + x.zones.length + ' zones</span></div>' + (x.id === sp.id ? '<div class="tree-children">' + x.zones.map(function (z) { return '<div class="tree-node' + (z.id === ed.selected ? ' on' : '') + '" data-action="editor-select-zone" data-id="' + z.id + '"><span class="tree-kind tk-zone">Zone</span>' + z.name + '<span class="cap">cap ' + z.capacity + '</span></div>'; }).join('') + '</div>' : '');
    }).join('') + '<div class="tree-node muted" data-action="toast" data-msg="New space added to ' + s.name + '">' + PP.icon('plus', 'ico') + 'Add space</div></div>';
  }).join('') + '<div class="tree-node muted" data-action="toast" data-msg="New site created">' + PP.icon('plus', 'ico') + 'Add site</div></div>';

  var sel = ed.selected ? PP.place(ed.selected) : null;
  var zoneForm = sel ? '<div class="card mt"><div class="card-h"><div class="card-t">Zone · ' + PP.esc(sel.zone.name) + '</div><button class="btn btn-sm btn-danger" data-action="editor-delete">Delete</button></div><div class="card-b"><div class="form g-2"><label class="field"><span>Name</span><input class="input" value="' + PP.esc(sel.zone.name) + '" data-input="editor-name"></label><label class="field"><span>Type</span><select class="select"><option>' + sel.zone.type + '</option><option>Meeting room</option><option>Entrance</option><option>Workspace</option><option>Amenity</option><option>Retail</option></select></label><label class="field"><span>Capacity</span><input class="input" type="number" value="' + sel.zone.capacity + '" data-input="editor-cap"></label><label class="field"><span>Queue point</span><input class="input" value="' + PP.esc(sel.zone.queue || '') + '" placeholder="None"></label></div><div class="small muted mt-s">' + sel.zone.poly.length + '-point polygon · ' + PP.devicesFor(sel).length + ' devices assigned</div></div></div>' : '';

  var toolbar = '<div class="row">' +
    '<button class="btn btn-sm" data-action="editor-upload">' + PP.icon('upload') + 'Upload floorplan</button>' +
    (ed.drawing ? '<button class="btn btn-sm btn-primary" data-action="editor-finish"' + (ed.draft.length < 3 ? ' disabled' : '') + '>' + PP.icon('check') + 'Finish zone (' + ed.draft.length + ' points)</button><button class="btn btn-sm btn-ghost" data-action="editor-cancel">Cancel</button>' : '<button class="btn btn-sm btn-primary" data-action="editor-draw">' + PP.icon('pen') + 'Draw new zone</button>') +
    '</div>';

  PP.onMount(function () {
    var wrap = document.getElementById('editor-fp');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      if (!PP.editor.drawing) return;
      var svg = wrap.querySelector('svg');
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
      var d = PP.editor.draft;
      if (d.length >= 3 && Math.hypot(p.x - d[0][0], p.y - d[0][1]) < 18) { PP.actions['editor-finish'](); return; }
      d.push([Math.round(p.x), Math.round(p.y)]);
      e.stopPropagation();
      PP.render(true);
    }, true);
  });

  return PP.pageHead({ title: 'Sites & Zones Editor', screen: 'org', fid: 'sites-editor', back: { label: 'Back to Organisation Administration', go: '/org' }, sub: 'Build the site → space → zone hierarchy, upload floorplans and draw each zone as a polygon over the plan.' }) +
    '<div class="grid g-side" style="align-items:start">' +
    '<div class="card"><div class="card-h"><div class="card-t">Hierarchy</div></div><div class="card-b">' + tree + '</div></div>' +
    '<div><div class="card"><div class="card-h"><div><div class="card-t">' + PP.esc(PP.site(sp.siteId).name + ' · ' + sp.name) + '</div><div class="card-s">' + (ed.drawing ? 'Click on the plan to place points. Click the first point (or Finish) to close the polygon.' : 'Click a zone to edit it, or draw a new one.') + '</div></div>' + toolbar + '</div>' +
    '<div class="card-b"><div class="fp' + (ed.drawing ? ' drawing' : '') + '" id="editor-fp">' + PP.Floorplan.edit(sp, ed.draft, ed.selected) + '<div class="fp-badge">' + PP.icon('file', 'ico') + 'floorplan-' + sp.id + '.pdf · uploaded 14 Aug</div></div></div></div>' + zoneForm + '</div></div>';
};
PP.actions['editor-draw'] = function () { PP.editor.drawing = true; PP.editor.draft = []; PP.editor.selected = null; PP.render(true); };
PP.actions['editor-cancel'] = function () { PP.editor.drawing = false; PP.editor.draft = []; PP.render(true); };
PP.actions['editor-finish'] = function () {
  var ed = PP.editor, sp = PP.place(ed.spaceId).space;
  if (ed.draft.length < 3) return;
  var id = sp.id + '-new' + Date.now().toString(36);
  var cap = Math.max(5, Math.round(PP.polyArea(ed.draft) / PP.LAYOUTS[sp.layout].perPerson / 5) * 5);
  sp.zones.push({ kind: 'zone', id: id, key: 'new', siteId: sp.siteId, spaceId: sp.id, name: 'New zone ' + (sp.zones.length + 1), type: 'Custom', poly: ed.draft.slice(), label: null, queue: null, capacity: cap, occ: Math.round(cap * 0.3), base: 0.3 });
  PP.editor = { spaceId: sp.id, drawing: false, draft: [], selected: id };
  PP.toast('Zone created, it now shows live occupancy on Place Detail');
  PP.render(true);
};
PP.actions['editor-select-zone'] = function (el) { if (PP.editor.drawing) return; PP.editor.selected = el.getAttribute('data-id'); PP.render(true); };
PP.actions['editor-delete'] = function () {
  var sp = PP.place(PP.editor.spaceId).space;
  sp.zones = sp.zones.filter(function (z) { return z.id !== PP.editor.selected; });
  PP.editor.selected = null; PP.toast('Zone deleted'); PP.render(true);
};
PP.inputs['editor-name'] = function (el) { var z = PP.place(PP.editor.selected); if (z) z.zone.name = el.value; };
PP.inputs['editor-cap'] = function (el) { var z = PP.place(PP.editor.selected); if (z && +el.value > 0) z.zone.capacity = +el.value; };
PP.actions['editor-upload'] = function () {
  PP.overlay.open({
    title: 'Upload floorplan', size: 'sm', chips: PP.featureChips('sites-editor'), sub: 'PDF, PNG, JPG or DWG. Each floor (space) has its own plan.',
    body: '<div class="dropzone">' + PP.icon('upload', 'ico') + '<div class="strong mt-s">Drop a floorplan here</div><div class="small">or click to browse · max 25 MB</div></div><label class="field mt"><span>Scale</span><select class="select"><option>Detect from drawing</option><option>1:100</option><option>1:200</option></select></label>',
    footer: '<button class="btn" data-action="ov-close">Cancel</button><button class="btn btn-primary" data-action="save-close" data-msg="Floorplan uploaded, draw zones over it next">Upload</button>'
  });
};

PP.S.orgUsers = function () {
  PP.crumbs = [{ label: PP.CUSTOMER.short }, { label: 'Organisation Administration', go: '/org' }, { label: 'User Management' }];
  var sites = PP.sites();
  return PP.pageHead({ title: 'User Management', screen: 'org', fid: 'user-mgmt', back: { label: 'Back to Organisation Administration', go: '/org' }, sub: 'Invite users, set their role and choose which sites they can see.', actions: '<button class="btn btn-primary" data-action="user-invite">' + PP.icon('plus') + 'Invite user</button>' }) +
    '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>User</th><th>Role</th><th>Site access</th><th>Status</th><th>Last active</th><th></th></tr></thead><tbody>' + PP.ORG_USERS.map(function (u) {
      return '<tr><td><div class="row"><span class="avatar" style="width:32px;height:32px;font-size:11px;background:' + PP.ROLES[u.role].color + '">' + PP.initials(u.name) + '</span><div><div class="name">' + u.name + '</div><div class="sub">' + u.email + '</div></div></div></td>' +
        '<td><select class="select select-sm" data-input="user-role"><option value="pm"' + (u.role === 'pm' ? ' selected' : '') + '>Portfolio Manager</option><option value="exec"' + (u.role === 'exec' ? ' selected' : '') + '>Executive</option></select></td>' +
        '<td><div class="pills">' + (u.sites[0] === 'all' ? '<span class="pill on">All sites</span>' : u.sites.filter(function (s) { return sites.some(function (x) { return x.id === s; }); }).map(function (s) { return '<span class="pill">' + PP.site(s).name + '</span>'; }).join('') || '<span class="pill">—</span>') + '</div></td>' +
        '<td>' + PP.status(u.status) + '</td><td class="small muted">' + u.last + '</td><td><button class="btn btn-sm btn-ghost" data-action="toast" data-msg="' + (u.status === 'Invited' ? 'Invitation re-sent' : 'Password reset email sent') + '">' + (u.status === 'Invited' ? 'Resend' : 'Reset password') + '</button></td></tr>';
    }).join('') + '</tbody></table></div></div>' +
    '<div class="grid g-2 mt">' + ['pm', 'exec'].map(function (r) { return '<div class="card"><div class="card-b"><div class="row">' + PP.roleChip(r) + '<b>' + PP.ROLES[r].label + '</b></div><p class="small muted" style="margin-bottom:0">' + (r === 'pm' ? 'Runs the platform day to day: all analytics for their sites plus users, sites, zones, alerts and integrations.' : 'Senior, largely read-only: dashboards, portfolio views and executive intelligence without operational configuration.') + '</p></div></div>'; }).join('') + '</div>';
};
PP.inputs['user-role'] = function () { PP.toast('Role updated'); };
PP.actions['user-invite'] = function () {
  PP.overlay.open({
    title: 'Invite user', size: 'sm', chips: PP.featureChips('user-mgmt'),
    body: '<div class="form"><label class="field"><span>Email</span><input class="input" type="email" placeholder="name@meridianpg.com.au"></label><label class="field"><span>Role</span><select class="select"><option>Portfolio Manager</option><option>Executive</option></select></label><label class="field"><span>Site access</span><div class="pills"><span class="pill on click">All sites</span>' + PP.sites().map(function (s) { return '<span class="pill click">' + s.name + '</span>'; }).join('') + '</div></label></div>',
    footer: '<button class="btn" data-action="ov-close">Cancel</button><button class="btn btn-primary" data-action="save-close" data-msg="Invitation sent">Send invitation</button>'
  });
};

/* =========================================================
   12 · User Profile
   ========================================================= */
PP.S.profile = function () {
  var me = PP.ROLES[PP.state.role];
  var personal = PP.card('personal', {
    sub: 'Your own details, password and notification preferences',
    body: '<div class="grid g-2"><div class="form"><div class="row"><span class="avatar" style="width:56px;height:56px;font-size:18px;background:' + me.color + '">' + PP.initials(me.who) + '</span><button class="btn btn-sm">' + PP.icon('upload') + 'Change photo</button></div>' +
      '<label class="field"><span>Full name</span><input class="input" value="' + me.who + '"></label><label class="field"><span>Email</span><input class="input" value="' + me.email + '"></label><label class="field"><span>Mobile</span><input class="input" value="+61 4•• ••• 218"></label>' +
      '<button class="btn" style="justify-self:start" data-action="toast" data-msg="Password change email sent">' + PP.icon('key') + 'Change password</button></div>' +
      '<div><div class="small strong" style="margin-bottom:8px">Notifications</div><table class="tbl"><thead><tr><th>Alert type</th><th>Email</th><th>SMS</th><th>In-app</th></tr></thead><tbody>' +
      [['High severity', 1, 1, 1], ['Medium severity', 1, 0, 1], ['Low severity', 0, 0, 1], ['Device offline', 1, 0, 1], ['Scheduled reports', 1, 0, 0]].map(function (r) { return '<tr><td>' + r[0] + '</td>' + [1, 2, 3].map(function (i) { return '<td><input type="checkbox"' + (r[i] ? ' checked' : '') + ' style="accent-color:var(--accent)"></td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table><div class="mt">' + PP.switchHtml('Weekly digest email', true) + '</div><div class="mt-s">' + PP.switchHtml('Quiet hours 10pm–7am', true) + '</div></div></div>',
    footer: '<button class="btn btn-primary" data-action="toast" data-msg="Profile saved">Save</button>'
  });
  var sso = PP.card('sso', {
    sub: 'Let users sign in through your organisation\'s identity provider, common for universities and councils',
    body: '<div class="grid g-2"><div class="form"><label class="field"><span>Identity provider</span><select class="select"><option>Microsoft Entra ID (Azure AD)</option><option>Okta</option><option>Google Workspace</option><option>Generic SAML 2.0</option><option>Generic OIDC</option></select></label>' +
      '<label class="field"><span>Metadata URL</span><input class="input mono" value="https://login.microsoftonline.com/meridianpg/federationmetadata.xml"></label>' +
      '<label class="field"><span>Entity ID</span><input class="input mono" value="urn:placeperformance:meridian"></label>' +
      '<label class="field"><span>Signing certificate</span><div class="row"><span class="pill">meridian-sso-2026.cer · expires 14 Mar 2027</span><button class="btn btn-sm">' + PP.icon('upload') + 'Replace</button></div></label></div>' +
      '<div class="form"><div class="field"><span>Status</span>' + PP.switchHtml('Enable single sign-on', true) + '</div><div class="field">' + PP.switchHtml('Require SSO for all users (disable passwords)', false) + '<small>Keep at least one password admin until SSO is tested.</small></div>' +
      '<label class="field"><span>Default role for new SSO users</span><select class="select"><option>Executive (read-only)</option><option>Portfolio Manager</option></select></label>' +
      '<label class="field"><span>Allowed email domains</span><input class="input" value="meridianpg.com.au"></label></div></div>',
    footer: '<button class="btn" data-action="toast" data-msg="Test sign-in succeeded">Test connection</button><button class="btn btn-primary" data-action="toast" data-msg="SSO settings saved">Save SSO settings</button>'
  });
  return PP.pageHead({ title: 'User Profile', screen: 'profile', sub: 'Your personal settings, separate from organisation-wide administration.' }) + '<div class="stack">' + personal + sso + '</div>';
};
