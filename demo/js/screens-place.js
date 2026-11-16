/* =========================================================
   Interface 3, Place Detail (multi-level: Site → Space → Zone)
   Shared metrics appear at every level, scoped to that level;
   each level then adds its own features.
   ========================================================= */
PP.S = PP.S || {};
PP.lastSite = null;

PP.placeRoute = function (pl) {
  if (pl.kind === 'site') return '/place/' + pl.site.id;
  if (pl.kind === 'space') return '/place/' + pl.site.id + '/' + pl.space.id;
  return '/place/' + pl.site.id + '/' + pl.space.id + '/' + pl.zone.id;
};

PP.S.place = function (siteId, spaceId, zoneId) {
  var sites = PP.sites();
  var site = sites.find(function (s) { return s.id === siteId; }) || sites.find(function (s) { return s.id === PP.lastSite; }) || sites[0];
  PP.lastSite = site.id;
  var space = spaceId ? site.spaces.find(function (s) { return s.id === spaceId; }) : null;
  var zone = space && zoneId ? space.zones.find(function (z) { return z.id === zoneId; }) : null;
  var pl = PP.place(zone ? zone.id : space ? space.id : site.id);
  var st = PP.stats(pl);
  var lay = PP.LAYOUTS[site.layout];

  PP.crumbs = [{ label: PP.CUSTOMER.short }, { label: 'Place Detail', go: '/place/' + site.id }];
  if (PP.state.multi && PP.can('ranking')) PP.crumbs.splice(1, 0, { label: 'Portfolio', go: '/portfolio' });
  PP.crumbs.push({ label: site.name, go: '/place/' + site.id });
  if (space) PP.crumbs.push({ label: space.name, go: '/place/' + site.id + '/' + space.id });
  if (zone) PP.crumbs.push({ label: zone.name });

  /* ---------- header + hierarchy stepper ---------- */
  var siteSelect = sites.length > 1 ? '<select class="select select-sm" data-input="place-site" aria-label="Switch site">' + sites.map(function (s) {
    return '<option value="' + s.id + '"' + (s.id === site.id ? ' selected' : '') + '>' + s.name + ' · ' + s.city + '</option>';
  }).join('') + '</select>' : '';

  var periodSeg = '<div class="seg">' + [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days']].map(function (p) {
    return '<button class="' + (PP.state.period === p[0] ? 'on' : '') + '" data-action="place-period" data-v="' + p[0] + '">' + p[1] + '</button>';
  }).join('') + '</div>';

  var levelKey = pl.kind;
  var hier = '<div class="hier">' +
    (PP.state.multi && PP.can('ranking') ? '<div class="hier-step k-portfolio" data-go="/portfolio"><span class="k">Portfolio</span><span class="n">' + PP.ALL_SITES.length + ' sites</span></div>' : '') +
    '<div class="hier-step k-site' + (levelKey === 'site' ? ' on' : '') + '" data-go="/place/' + site.id + '"><span class="k">Site</span><span class="n">' + PP.esc(site.name) + '</span></div>' +
    '<div class="hier-step k-space' + (levelKey === 'space' ? ' on' : '') + (space ? '' : ' hs-empty') + '"' + (space ? ' data-go="/place/' + site.id + '/' + space.id + '"' : '') + '><span class="k">Space</span><span class="n">' + (space ? PP.esc(space.name) : 'Choose a floor') + '</span></div>' +
    '<div class="hier-step k-zone' + (levelKey === 'zone' ? ' on' : '') + (zone ? '' : ' hs-empty') + '"><span class="k">Zone</span><span class="n">' + (zone ? PP.esc(zone.name) : space ? 'Choose a zone' : '—') + '</span></div>' +
    '</div>';

  var blurb = levelKey === 'site' ? '<b>Site level</b>, every metric is rolled up across all ' + site.spaces.length + ' spaces and ' + pl.zones.length + ' zones. Pick a floor to drill into a space.'
    : levelKey === 'space' ? '<b>Space level</b>, metrics are rolled up across this floor\'s ' + space.zones.length + ' zones. Pick a zone on the plan to drill in.'
    : '<b>Zone level</b>, metrics are for this single zone, measured directly by its sensors. No cross-zone comparison.';

  var children = levelKey === 'site' ? site.spaces : levelKey === 'space' ? space.zones : [];
  var drillChips = children.length ? '<div class="drill-chips">' + children.map(function (c) {
    var cp = PP.place(c.id), cs = PP.stats(cp);
    return '<span class="drill-chip" data-go="' + PP.placeRoute(cp) + '">' + PP.esc(c.name) + '<span class="occ st ' + PP.occClass(cs.occPct) + '" data-live-pct="' + c.id + '">' + PP.pct(cs.occPct * 100) + '</span></span>';
  }).join('') + '</div>' : '';

  var back = zone ? { label: space.name, go: '/place/' + site.id + '/' + space.id } : space ? { label: site.name, go: '/place/' + site.id } : null;
  var head = '<div class="place-hero"><div>' +
    (back ? '<div class="ph-back" data-go="' + back.go + '">' + PP.icon('back', 'ico') + PP.esc(back.label) + '</div>' : '') +
    '<div class="ph-title"><h1 style="font-size:28px;font-weight:600;letter-spacing:-.03em">' + PP.esc(pl.name) + '</h1><span class="chip chip-iface annot">Interface 3</span></div>' +
    '<div class="place-live"><span class="row" style="gap:7px"><span class="pulse"></span><b data-live-occ="' + pl.id + '">' + PP.fmt(st.occ) + '</b> people now</span>' +
    '<span><b data-live-pct="' + pl.id + '">' + PP.pct(st.occPct * 100) + '</b> of ' + PP.fmt(st.cap) + ' capacity</span>' +
    '<span class="muted">' + (zone ? zone.type + ' · ' + space.name + ' · ' : space ? lay.label + ' · ' : '') + site.type + ' · ' + site.city + '</span></div>' +
    '</div><div class="ph-actions">' + siteSelect + periodSeg + '</div></div>';

  /* ---------- headline KPIs ---------- */
  var period = PP.state.period;
  var visitors = period === 'today' ? st.visitors : PP.sum(PP.series.daily(pl, period === '7d' ? 7 : 30));
  var kpis = [];
  if (PP.can('visitor-count')) kpis.push('<div class="card">' + PP.kpi('Visitors ' + (period === 'today' ? 'today' : period === '7d' ? '(7 days)' : '(30 days)'), PP.fmt(visitors), { icon: 'people', delta: st.visitorsDelta, spark: PP.Charts.spark(PP.series.daily(pl, 14), { color: PP.C.blue }) }) + '</div>');
  if (PP.can('occupancy')) kpis.push('<div class="card">' + PP.kpi('Live occupancy', '<span data-live-occ="' + pl.id + '">' + PP.fmt(st.occ) + '</span><small>/ ' + PP.fmt(st.cap) + '</small>', { icon: 'gauge', extra: '<div class="mt-s" data-live-meter="' + pl.id + '">' + PP.Charts.meter(st.occPct) + '</div>' }) + '</div>');
  if (PP.can('dwell')) kpis.push('<div class="card">' + PP.kpi('Average dwell', PP.mins(st.dwell), { icon: 'clock', delta: PP.between(PP.rng('dd' + pl.id), -4, 7), deltaLabel: 'vs last week' }) + '</div>');
  if (PP.can('repeat')) kpis.push('<div class="card">' + PP.kpi('Returning visitors', PP.pct(st.repeat), { icon: 'refresh', delta: 2.1, deltaUnit: ' pts' }) + '</div>');
  if (PP.can('score')) kpis.push('<div class="card">' + PP.kpi('Performance score', st.score + '<small>/100</small>', { icon: 'star', delta: st.scoreDelta, deltaUnit: ' pts', deltaLabel: 'vs last month' }) + '</div>');
  var kpiRow = kpis.length ? '<div class="grid g-' + Math.min(5, kpis.length) + '">' + kpis.join('') + '</div>' : '';

  /* ---------- floorplan & live occupancy (priority capability) ---------- */
  var fpBody, fpActions = '', fpSub;
  if (levelKey === 'site') {
    fpSub = 'Building → floor → room. Click a floor to open its floorplan.';
    fpBody = '<div class="grid g-fp" style="align-items:center"><div>' + PP.Floorplan.stack(site) + '</div><div><div id="site-loc-map" class="map"></div><div class="row mt-s small muted">' + PP.icon('pin', 'ico') + PP.esc(site.city) + ' · ' + site.spaces.length + ' floorplans uploaded · ' + pl.zones.length + ' zones drawn</div></div></div>';
  } else if (levelKey === 'space') {
    fpSub = 'Live occupancy per room on the uploaded ' + space.name + ' plan. Click a zone to drill in.';
    fpBody = '<div class="fp">' + PP.Floorplan.occupancy(space, { go: true }) + '<div class="fp-badge"><span class="pulse"></span>Live · updates every 3s</div></div><div class="row-between mt-s">' + PP.Floorplan.legend() + '</div>';
    if (PP.can('sites-editor')) fpActions = '<button class="btn btn-sm" data-go="/org/sites/' + space.id + '">' + PP.icon('pen') + 'Edit zones</button>';
  } else {
    fpSub = 'This zone highlighted on the ' + space.name + ' plan. Click another zone to move to it.';
    fpBody = '<div class="fp">' + PP.Floorplan.occupancy(space, { go: true, highlight: zone.id }) + '<div class="fp-badge"><span class="pulse"></span>Live</div></div><div class="row-between mt-s">' + PP.Floorplan.legend() + '</div>';
  }
  var floorplanCard = PP.card('floorplan', { body: fpBody, sub: fpSub, actions: fpActions });

  var gaugeCard = PP.card('occupancy', {
    title: 'Occupancy now', sub: 'Against a capacity of ' + PP.fmt(st.cap) + ' · tick marks the 85% comfort limit',
    body: '<div data-live-gauge="' + pl.id + '">' + PP.Charts.gauge(st.occ, st.cap, { sub: PP.fmt(st.occ) + ' of ' + PP.fmt(st.cap) + ' people' }) + '</div>' +
      '<div class="grid g-2 mt-s small"><div><div class="muted">Peak today</div><b>' + PP.pct(st.peakPct * 100) + '</b> at ' + PP.hourLabel(lay === PP.LAYOUTS.retail ? 13 : 11) + '</div><div><div class="muted">Status</div>' + PP.status(st.occPct > 0.9 ? 'high' : st.occPct > 0.7 ? 'medium' : 'online').replace('Online', 'Comfortable').replace('High', 'Crowded').replace('Medium', 'Busy') + '</div></div>'
  });

  var scoreCard = PP.card('score', {
    sub: 'One headline number for how this ' + levelKey + ' is performing',
    body: '<div class="row" style="gap:20px;align-items:center">' + PP.Charts.ring(st.score) + '<div style="flex:1;min-width:150px">' + scoreFactors(pl) + '</div></div>'
  });

  /* ---------- level-specific features ---------- */
  var levelSpecific = '';
  if (levelKey === 'site') {
    levelSpecific = PP.card('site-breakdown', { sub: 'Compare each space within ' + site.name + ' side by side. Click a row to drill in.', body: breakdownTable(site.spaces.map(function (s) { return PP.place(s.id); })), flush: true });
  } else if (levelKey === 'space') {
    levelSpecific = '<div class="stack">' +
      PP.card('zone-breakdown', { sub: 'Compare each zone on ' + space.name + ' side by side. Click a row to drill in.', body: breakdownTable(space.zones.map(function (z) { return PP.place(z.id); })), flush: true }) +
      PP.card('visitor-flow', { sub: 'How people move between entry points and zones today, line weight shows volume', body: '<div class="grid g-main" style="align-items:start"><div class="fp">' + PP.Floorplan.flow(space) + '</div><div>' + topPaths(space) + '</div></div>' }) +
      '</div>';
  } else {
    var nowH = new Date().getHours();
    levelSpecific = PP.card('heatmap', {
      sub: 'Where people concentrate within ' + zone.name + ', drag the slider to replay the day',
      body: '<div class="grid g-main"><div class="fp" id="heat-fp">' + PP.Floorplan.heat(space, zone, nowH) + '</div><div class="stack">' +
        '<div class="slider-row"><span class="strong small">Time of day</span><span class="v" id="heat-hour">' + PP.hourLabel(nowH) + '</span><input type="range" class="range" min="6" max="22" value="' + PP.clamp(nowH, 6, 22) + '" data-input="heat-hour" data-space="' + space.id + '" data-zone="' + zone.id + '" style="grid-column:1/-1"></div>' +
        '<div class="c-legend"><span><i style="background:#ffd000"></i>Light</span><span><i style="background:#ff8a00"></i>Moderate</span><span><i style="background:#ff1e00"></i>Dense</span></div>' +
        '<div class="note info">Density comes from the zone\'s overhead sensors (' + PP.devicesFor(pl).length + ' devices). Hot spots usually sit near ' + (zone.queue ? 'the ' + zone.queue.toLowerCase() : 'seating and entry points') + '.</div>' +
        '</div></div>'
    });
  }

  PP.onMount(function () {
    if (levelKey === 'site') {
      var m = PP.Maps.make('site-loc-map', { center: [site.lat, site.lng], zoom: 15 });
      PP.Maps.bubble(m, site.lat, site.lng, { radius: 14, color: PP.occColor(st.occPct), label: site.name, permanent: true, halo: true });
    }
  });

  /* ---------- tabs: shared metrics grouped, plus this level's own features ---------- */
  var levelTab = { site: ['level', 'Space breakdown', 'layers'], space: ['level', 'Zones & flow', 'flow'], zone: ['level', 'Heat map', 'fire'] }[levelKey];
  var side = gaugeCard + scoreCard;
  var tabs = [
    ['overview', 'Overview', 'dash', '<div class="grid g-main">' + (floorplanCard || '<div></div>') + (side ? '<div class="stack">' + side + '</div>' : '') + '</div>' +
      '<div class="grid g-2 mt">' + [visitorCard(pl, st), occupancyHistoryCard(pl, st)].filter(Boolean).join('') + '</div>'],
    [levelTab[0], levelTab[1], levelTab[2], levelSpecific],
    ['behaviour', 'Behaviour', 'people', '<div class="grid g-2">' + [peakCard(pl), dwellCard(pl), repeatCard(pl), demographicsCard(pl)].filter(Boolean).join('') + '</div>'],
    ['operations', 'Operations', 'settings', '<div class="grid g-2">' + [commercialCard(pl, st), queueCard(pl, st), deviceHealthCard(pl)].filter(Boolean).join('') + '</div>']
  ].filter(function (t) { return t[3] && t[3].replace(/<[^>]+>/g, '').trim(); });
  if (!tabs.some(function (t) { return t[0] === PP.placeTab; })) PP.placeTab = 'overview';
  var active = tabs.find(function (t) { return t[0] === PP.placeTab; }) || tabs[0];
  var tabBar = '<div class="tabs" role="tablist">' + tabs.map(function (t) {
    return '<button class="tab' + (t === active ? ' on' : '') + '" role="tab" data-action="place-tab" data-v="' + t[0] + '">' + PP.icon(t[2]) + t[1] + (t[0] === 'level' ? '<span class="chip chip-iface" style="font-size:10.5px;padding:0 7px">' + levelKey + '-only</span>' : '') + '</button>';
  }).join('') + '</div>';

  return head +
    '<div class="row-between">' + hier + '</div>' +
    '<div class="level-banner">' + PP.icon('layers') + '<div>' + blurb + '</div></div>' +
    (drillChips ? '<div class="drill-label">' + (levelKey === 'site' ? 'Spaces in this site' : 'Zones on this floor') + '</div>' + drillChips : '') +
    '<div class="mt">' + kpiRow + '</div>' +
    tabBar + '<div class="tab-panel">' + active[3] + '</div>';
};
PP.placeTab = 'overview';
PP.actions['place-tab'] = function (el) { PP.placeTab = el.getAttribute('data-v'); PP.render(true); };

/* ---------------- Place cards ---------------- */
function scoreFactors(pl) {
  var r = PP.rng('sf-' + pl.id);
  var f = [['Utilisation', PP.between(r, 55, 95)], ['Visitor experience', PP.between(r, 60, 96)], ['Operational efficiency', PP.between(r, 50, 92)], ['Data confidence', PP.between(r, 82, 99)]];
  return f.map(function (x) { return '<div style="margin-bottom:8px"><div class="row-between small"><span>' + x[0] + '</span><b>' + Math.round(x[1]) + '</b></div>' + PP.Charts.meter(x[1] / 100, PP.scoreColor(x[1])) + '</div>'; }).join('');
}

function breakdownTable(places) {
  var rows = places.map(function (p) { return { p: p, st: PP.stats(p) }; }).sort(function (a, b) { return b.st.visitors - a.st.visitors; });
  var showScore = PP.can('score');
  return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>' + (places[0].kind === 'space' ? 'Space' : 'Zone') + '</th><th style="min-width:150px">Live occupancy</th><th class="num">Visitors today</th><th class="num">Avg dwell</th>' + (showScore ? '<th class="num">Score</th>' : '') + '</tr></thead><tbody>' +
    rows.map(function (r, i) {
      return '<tr class="click" data-go="' + PP.placeRoute(r.p) + '"><td class="muted">' + (i + 1) + '</td><td><div class="name">' + PP.esc(r.p.name) + '</div><div class="sub">' + (r.p.kind === 'zone' ? r.p.zone.type : r.p.zones.length + ' zones') + '</div></td>' +
        '<td><div class="row-between small"><span data-live-occ="' + r.p.id + '">' + PP.fmt(r.st.occ) + '</span><span class="muted">/ ' + r.st.cap + '</span></div><div data-live-meter="' + r.p.id + '">' + PP.Charts.meter(r.st.occPct) + '</div></td>' +
        '<td class="num">' + PP.fmt(r.st.visitors) + '</td><td class="num">' + PP.mins(r.st.dwell) + '</td>' + (showScore ? '<td class="num"><b style="color:' + PP.scoreColor(r.st.score) + '">' + r.st.score + '</b></td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';
}

function topPaths(space) {
  var fl = PP.Floorplan.flows(space).slice(0, 7);
  return '<div class="small strong muted">Most common paths today</div><div class="mt-s">' + PP.Charts.hbars(fl.map(function (f) { return { label: f.from.name + ' → ' + f.to.name, value: f.n }; })) + '</div>';
}

function visitorCard(pl, st) {
  var p = PP.state.period, body;
  if (p === 'today') {
    var h = PP.series.hourly(pl);
    var net = h.entries.map(function (e, i) { return e == null ? null : h.occ[i]; });
    body = '<div class="row" style="gap:26px;margin-bottom:6px"><div><div class="small muted">Entries</div><div class="strong" style="font-size:20px">' + PP.fmt(st.entries) + '</div></div><div><div class="small muted">Exits</div><div class="strong" style="font-size:20px">' + PP.fmt(st.exits) + '</div></div><div><div class="small muted">Net present</div><div class="strong" style="font-size:20px" data-live-occ="' + pl.id + '">' + PP.fmt(st.occ) + '</div></div></div>' +
      PP.Charts.bars({ labels: h.labels, series: [{ name: 'Entries', values: h.entries, color: PP.C.blue }, { name: 'Exits', values: h.exits, color: PP.C.light }], height: 200, xTicks: 8 });
    void net;
  } else {
    var n = p === '7d' ? 7 : 30;
    var vals = PP.series.daily(pl, n), labels = PP.daysBack(n).map(function (d) { return n === 7 ? PP.DAYS[d.getDay()] : PP.dateLabel(d); });
    body = '<div class="row" style="gap:26px;margin-bottom:6px"><div><div class="small muted">Total visitors</div><div class="strong" style="font-size:20px">' + PP.fmt(PP.sum(vals)) + '</div></div><div><div class="small muted">Daily average</div><div class="strong" style="font-size:20px">' + PP.fmt(PP.avg(vals)) + '</div></div></div>' +
      PP.Charts.bars({ labels: labels, series: [{ name: 'Visitors', values: vals, color: PP.C.blue }], height: 200, xTicks: 10 });
  }
  return PP.card('visitor-count', {
    sub: 'Entries, exits and net present for the selected period',
    actions: PP.opener('historical-trends', 'Historical trends', 'data-action="historical" data-id="' + pl.id + '"', { icon: 'trend' }),
    body: body
  });
}

PP.occRange = null; // null = follow the page period
var OCC_RANGES = [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['12m', '12 months']];

function occupancyHistoryCard(pl, st) {
  var range = PP.occRange || (PP.state.period === '7d' ? '7d' : PP.state.period === '30d' ? '30d' : 'today');
  var seg = '<div class="seg">' + OCC_RANGES.map(function (r) { return '<button class="' + (r[0] === range ? 'on' : '') + '" data-action="occ-range" data-v="' + r[0] + '" data-id="' + pl.id + '">' + r[1] + '</button>'; }).join('') + '</div>';
  return PP.card('occupancy', {
    title: 'Occupancy history', sub: 'Share of capacity (' + PP.fmt(st.cap) + ' people), hover for exact values',
    actions: seg,
    body: '<div id="occ-hist">' + occHistBody(pl, range) + '</div>'
  });
}

function occHistBody(pl, range) {
  var d = PP.series.occHistory(pl, range), LIMIT = 85;
  var pct = function (v) { return Math.round(v) + '%'; };
  var limitLine = function (n) { return { name: 'Comfort limit', values: PP.range(n).map(function () { return LIMIT; }), color: PP.C.red, dash: true, width: 1 }; };
  var series, peakVals, avgVals, unit, kpiOver;
  if (range === 'today' || range === '7d') {
    var vals = d.now.filter(function (v) { return v != null; });
    peakVals = d.now; avgVals = vals;
    series = [{ name: range === 'today' ? 'Today' : 'Occupancy', values: d.now, color: PP.C.blue, area: true, dots: range === 'today' }];
    if (d.lastWeek) series.push({ name: 'Same day last week', values: d.lastWeek, color: PP.C.slate, dash: true, width: 1.5 });
    unit = 'hours';
    kpiOver = vals.filter(function (v) { return v >= LIMIT; }).length;
    // average while open: ignore near-empty overnight hours
    avgVals = vals.filter(function (v) { return v >= 3; });
  } else {
    peakVals = d.peak; avgVals = d.avg;
    series = [{ name: 'Peak', values: d.peak, color: PP.C.blue, dots: false }, { name: 'Average', values: d.avg, color: '#a5b4fc', area: true }];
    unit = range === '30d' ? 'days' : 'months';
    kpiOver = d.peak.filter(function (v) { return v >= LIMIT; }).length;
  }
  var pv = peakVals.map(function (v) { return v == null ? -1 : v; }), maxV = Math.max.apply(null, pv), at = d.labels[pv.indexOf(maxV)];
  if (d.lastWeek) maxV = Math.max(maxV, Math.max.apply(null, d.lastWeek.map(function (v) { return v == null ? 0 : v; })));
  // scale to the data; only draw the comfort limit when occupancy gets near it
  var showLimit = maxV >= 60;
  if (showLimit) series.push(limitLine(d.labels.length));
  var axisMax = showLimit ? Math.max(100, PP.Charts.niceMax(maxV * 1.08)) : PP.Charts.niceMax(maxV * 1.2);
  maxV = Math.max.apply(null, pv);
  var kpis = '<div class="grid g-3" style="margin-bottom:10px">' +
    '<div><div class="small muted">Average occupancy</div><div class="strong" style="font-size:20px">' + pct(PP.avg(avgVals)) + '</div></div>' +
    '<div><div class="small muted">Highest peak</div><div class="strong" style="font-size:20px;color:' + PP.occColor(maxV / 100) + '">' + pct(maxV) + '</div><div class="tiny muted">' + PP.esc(at) + '</div></div>' +
    '<div><div class="small muted">' + unit.charAt(0).toUpperCase() + unit.slice(1) + ' over 85%</div><div class="strong" style="font-size:20px">' + kpiOver + '</div></div></div>';
  return kpis + PP.Charts.line({
    labels: d.labels, series: series, height: 230, max: axisMax,
    yFmt: function (v) { return Math.round(v) + '%'; }, xTicks: range === '7d' ? 7 : range === '30d' ? 6 : range === '12m' ? 12 : 8
  });
}

PP.actions['occ-range'] = function (el) {
  PP.occRange = el.getAttribute('data-v');
  el.closest('.seg').querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === el); });
  document.getElementById('occ-hist').innerHTML = occHistBody(PP.place(el.getAttribute('data-id')), PP.occRange);
};

function peakCard(pl) {
  var grid = PP.series.heat(pl);
  var flat = []; grid.forEach(function (r, d) { r.forEach(function (v, h) { flat.push({ v: v, d: d, h: h }); }); });
  flat.sort(function (a, b) { return b.v - a.v; });
  var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var busiest = flat[0], quiet = flat.filter(function (x) { return x.h >= 9 && x.h <= 17; }).pop();
  return PP.card('peak', {
    sub: 'Busy vs quiet periods by hour and day (last 8 weeks)',
    body: '<div class="row small" style="gap:20px;margin-bottom:8px"><span><span class="muted">Busiest:</span> <b>' + days[busiest.d] + ' ' + PP.hourLabel(busiest.h) + '</b></span><span><span class="muted">Quietest daytime:</span> <b>' + days[quiet.d] + ' ' + PP.hourLabel(quiet.h) + '</b></span></div>' + PP.Charts.heat(grid)
  });
}

function dwellCard(pl) {
  var d = PP.series.dwell(pl);
  return PP.card('dwell', {
    sub: 'How long people stay',
    body: '<div class="row" style="gap:26px;margin-bottom:6px"><div><div class="small muted">Average</div><div class="strong" style="font-size:20px">' + PP.mins(d.avg) + '</div></div><div><div class="small muted">Median</div><div class="strong" style="font-size:20px">' + PP.mins(d.median) + '</div></div></div>' +
      PP.Charts.bars({ labels: d.labels, series: [{ name: 'Visits', values: d.values, color: PP.C.purple }], height: 180, yFmt: PP.short })
  });
}

function repeatCard(pl) {
  var r = PP.series.repeat(pl);
  return PP.card('repeat', {
    sub: 'New vs returning visitors and how often they come back',
    body: '<div class="grid g-2" style="align-items:center">' + PP.Charts.donut([{ label: 'Returning', value: r.returning, color: PP.C.teal }, { label: 'New', value: r.fresh, color: PP.C.light }], { center: PP.pct(r.returning), sub: 'returning', size: 140 }) +
      '<div>' + PP.Charts.hbars(r.freqLabels.map(function (l, i) { return { label: l, value: r.freq[i], color: PP.C.teal, display: PP.pct(r.freq[i]) }; }), { max: 50 }) + '</div></div>'
  });
}

function demographicsCard(pl) {
  var d = PP.series.demographics(pl);
  var capable = PP.devicesFor(pl).some(function (x) { return x.type === 'demo' || x.type === 'counter'; });
  return PP.card('demographics', {
    sub: 'Estimated age and gender (anonymised, where hardware supports it)',
    body: capable ? '<div class="grid g-2" style="align-items:center">' + PP.Charts.donut([{ label: 'Female', value: d.female, color: PP.C.pink }, { label: 'Male', value: d.male, color: PP.C.blue }, { label: 'Not determined', value: d.other, color: PP.C.light }], { size: 130, center: PP.pct(d.female), sub: 'female' }) +
      '<div>' + PP.Charts.hbars(d.ages.map(function (a, i) { return { label: a, value: d.ageVals[i], color: PP.C.blue, display: PP.pct(d.ageVals[i]) }; }), { max: 35 }) + '</div></div>' : '<p class="muted">No demographics-capable sensor in this zone.</p>'
  });
}

function commercialCard(pl, st) {
  var n = 14, v = PP.series.daily(pl, n), r = PP.rng('sales-' + pl.id);
  var sales = v.map(function (x) { return Math.round(x * st.salesPerVisitor * PP.between(r, 0.85, 1.12)); });
  var labels = PP.daysBack(n).map(function (d) { return PP.DAYS[d.getDay()].slice(0, 2) + ' ' + d.getDate(); });
  var maxV = PP.Charts.niceMax(Math.max.apply(null, v)), maxS = PP.Charts.niceMax(Math.max.apply(null, sales));
  return PP.card('commercial', {
    sub: 'Visitation vs sales from the connected point-of-sale system',
    body: '<div class="row" style="gap:26px;margin-bottom:6px"><div><div class="small muted">Conversion</div><div class="strong" style="font-size:20px">' + PP.pct(st.conversion) + '</div></div><div><div class="small muted">Sales per visitor</div><div class="strong" style="font-size:20px">$' + PP.fmt1(st.salesPerVisitor) + '</div></div><div><div class="small muted">Source</div><div class="strong small" style="margin-top:6px">Lightspeed POS</div></div></div>' +
      PP.Charts.line({ labels: labels, series: [{ name: 'Visitors (indexed)', values: v.map(function (x) { return x / maxV * 100; }), color: PP.C.blue, area: true }, { name: 'Sales (indexed)', values: sales.map(function (x) { return x / maxS * 100; }), color: PP.C.orange }], height: 190, max: 100, yFmt: function (x) { return Math.round(x); }, xTicks: 7 })
  });
}

function queuePoints(pl) { return pl.zones.filter(function (z) { return z.queue; }); }

function queueCard(pl, st) {
  var qs = queuePoints(pl);
  var rows = qs.length ? '<div class="list" style="margin:0 -18px">' + qs.map(function (z) {
    var r = PP.rng('q-' + z.id), wait = PP.between(r, 1.2, 10.5), len = Math.round(PP.between(r, 0, 14));
    var cls = wait > 8 ? 'tint-red' : wait > 5 ? 'tint-amber' : 'tint-green';
    var open = PP.can('queue-detail') ? ' click" data-action="queue-detail" data-id="' + z.id : '';
    return '<div class="li' + open + '"><div class="li-ico ' + cls + '">' + PP.icon('queue') + '</div><div class="li-main"><div class="li-t">' + PP.esc(z.queue) + '</div><div class="li-s">' + PP.esc(z.name) + (pl.kind === 'site' ? ' · ' + PP.place(z.spaceId).name : '') + '</div></div><div class="li-r"><b style="font-size:15px;color:var(--ink)">' + PP.fmt1(wait) + ' min</b><br>' + len + ' in queue</div>' + (PP.can('queue-detail') ? '<span class="open-tag overlay annot">⧉</span>' : '') + '</div>';
  }).join('') + '</div>' : '<p class="muted small">No monitored queue point in this ' + pl.kind + '. Operational demand is still modelled from visitation.</p>';
  var r2 = PP.rng('ops-' + pl.id);
  return PP.card('queue-ops', {
    sub: 'Queues, wait times and the operational demand this ' + pl.kind + ' is generating',
    actions: PP.opener('ops-detail', 'Operational detail', 'data-action="ops-detail" data-id="' + pl.id + '"', { icon: 'people' }),
    body: '<div class="grid g-3" style="margin-bottom:12px"><div><div class="small muted">Staff needed now</div><div class="strong" style="font-size:20px">' + Math.max(1, Math.round(st.occ / 38)) + '</div></div><div><div class="small muted">Next clean due</div><div class="strong" style="font-size:20px">' + Math.round(PP.between(r2, 12, 70)) + ' min</div></div><div><div class="small muted">Service level</div><div class="strong" style="font-size:20px">' + Math.round(PP.between(r2, 78, 96)) + '%</div></div></div>' + rows
  });
}

function deviceHealthCard(pl) {
  var devs = PP.devicesFor(pl);
  var c = { online: 0, warning: 0, offline: 0 };
  devs.forEach(function (d) { c[d.status]++; });
  var issues = devs.filter(function (d) { return d.status !== 'online'; }).slice(0, 4);
  var shown = issues.length ? issues : devs.slice(0, 3);
  return PP.card('device-health', {
    sub: devs.length + ' sensors feed this ' + pl.kind + ' · confidence ' + PP.pct(100 - c.offline * 6 - c.warning * 2),
    body: '<div class="grid g-3" style="margin-bottom:12px"><div class="row"><span class="st st-ok">' + c.online + '</span><span class="small">Online</span></div><div class="row"><span class="st st-warn">' + c.warning + '</span><span class="small">Warning</span></div><div class="row"><span class="st st-bad">' + c.offline + '</span><span class="small">Offline</span></div></div>' +
      '<div class="list" style="margin:0 -18px">' + shown.map(function (d) {
        var open = PP.can('device-detail-ov');
        return '<div class="li' + (open ? ' click" data-action="device-overlay" data-id="' + d.id : '') + '"><div class="li-ico ' + (d.status === 'online' ? 'tint-green' : d.status === 'warning' ? 'tint-amber' : 'tint-red') + '">' + PP.icon('cpu') + '</div><div class="li-main"><div class="li-t mono">' + d.id + '</div><div class="li-s">' + d.typeLabel + ' · ' + PP.esc(PP.place(d.zoneId).name) + (d.issue ? ' · ' + d.issue : '') + '</div></div><div class="li-r">' + PP.status(d.status) + '<br>' + PP.ago(d.lastSeen) + '</div>' + (open ? '<span class="open-tag overlay annot">⧉</span>' : '') + '</div>';
      }).join('') + '</div>'
  });
}

/* ---------------- Place inputs / actions ---------------- */
PP.inputs['place-site'] = function (el) { PP.go('/place/' + el.value); };
PP.actions['place-period'] = function (el) { PP.state.period = el.getAttribute('data-v'); PP.render(true); };
PP.inputs['heat-hour'] = function (el) {
  var space = PP.place(el.getAttribute('data-space')).space, zone = PP.place(el.getAttribute('data-zone')).zone, h = +el.value;
  document.getElementById('heat-fp').innerHTML = PP.Floorplan.heat(space, zone, h);
  document.getElementById('heat-hour').textContent = PP.hourLabel(h);
};

/* ---------------- Overlays opened from Place Detail ---------------- */
PP.actions['historical'] = function (el) {
  var pl = PP.place(el.getAttribute('data-id'));
  function chart(range, compare) {
    var n = range === '90d' ? 90 : range === '12m' ? 365 : 30;
    var cur = PP.series.daily(pl, n), prev = PP.series.daily(pl, n, compare);
    var labels = PP.daysBack(n).map(function (d) { return PP.dateLabel(d); });
    if (n === 365) { // weekly buckets for a year
      var wk = function (a) { var o = []; for (var i = 0; i < a.length; i += 7) o.push(PP.sum(a.slice(i, i + 7))); return o; };
      cur = wk(cur); prev = wk(prev); labels = labels.filter(function (_, i) { return i % 7 === 0; });
    }
    var series = [{ name: 'This period', values: cur, color: PP.C.blue, area: true }];
    if (compare !== 'none') series.push({ name: compare === 'prev' ? 'Previous period' : 'Same period last year', values: prev.map(function (v) { return v * (compare === 'yoy' ? 0.92 : 0.97); }), color: PP.C.orange, dash: true });
    var tot = PP.sum(cur), ptot = PP.sum(prev) * (compare === 'yoy' ? 0.92 : 0.97);
    return '<div class="grid g-3" style="margin-bottom:12px"><div class="card">' + PP.kpi('Total visitors', PP.fmt(tot)) + '</div><div class="card">' + PP.kpi('Daily average', PP.fmt(tot / n)) + '</div><div class="card">' + PP.kpi('Change', (compare === 'none' ? '—' : (tot >= ptot ? '+' : '') + PP.fmt1((tot / ptot - 1) * 100) + '%'), {}) + '</div></div>' +
      PP.Charts.line({ labels: labels, series: series, height: 300, xTicks: 12, wide: true });
  }
  var months = PP.range(12).map(function (i) { var v = 0.85 + 0.2 * Math.sin((i + (pl.layout === 'retail' ? 8 : 2)) / 12 * Math.PI * 2); return v * 100; });
  var dow = PP.DOW[pl.layout];
  PP.overlay.open({
    title: 'Historical Trends · ' + pl.name, fid: 'historical-trends', size: 'lg',
    sub: 'Longer-range view of the same visitor data with comparison and seasonality.',
    body: '<div class="row" style="margin-bottom:14px"><div class="seg" id="ht-range">' + [['30d', '30 days'], ['90d', '90 days'], ['12m', '12 months']].map(function (r, i) { return '<button class="' + (i === 1 ? 'on' : '') + '" data-action="ht-set" data-k="range" data-v="' + r[0] + '">' + r[1] + '</button>'; }).join('') + '</div>' +
      '<span class="small muted">Compare with</span><select class="select select-sm" id="ht-compare" data-input="ht-compare"><option value="prev">Previous period</option><option value="yoy">Same period last year</option><option value="none">No comparison</option></select>' +
      '<span class="small muted">Custom</span><input class="input" type="date" style="width:auto;padding:6px 10px" value="2026-07-14"><span class="muted">→</span><input class="input" type="date" style="width:auto;padding:6px 10px" value="2026-10-12"></div>' +
      '<div id="ht-chart">' + chart('90d', 'prev') + '</div>' +
      '<div class="grid g-2 mt"><div><div class="strong small" style="margin-bottom:6px">Seasonality, month of year (index)</div>' + PP.Charts.bars({ labels: PP.MONTHS, series: [{ values: months, color: PP.C.purple }], height: 170, yFmt: function (x) { return Math.round(x); } }) + '</div>' +
      '<div><div class="strong small" style="margin-bottom:6px">Day-of-week profile (index)</div>' + PP.Charts.bars({ labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], series: [{ values: dow.map(function (x) { return x * 100; }), color: PP.C.teal }], height: 170, yFmt: function (x) { return Math.round(x); } }) + '</div></div>',
    onMount: function (w) {
      w._ht = { range: '90d', compare: 'prev', chart: chart };
    }
  });
};
PP.actions['ht-set'] = function (el) {
  var w = PP.overlay.top(); if (!w || !w._ht) return;
  w._ht.range = el.getAttribute('data-v');
  w.querySelectorAll('#ht-range button').forEach(function (b) { b.classList.toggle('on', b === el); });
  w.querySelector('#ht-chart').innerHTML = w._ht.chart(w._ht.range, w._ht.compare);
};
PP.inputs['ht-compare'] = function (el) {
  var w = PP.overlay.top(); if (!w || !w._ht) return;
  w._ht.compare = el.value;
  w.querySelector('#ht-chart').innerHTML = w._ht.chart(w._ht.range, w._ht.compare);
};

PP.actions['queue-detail'] = function (el) {
  var z = PP.place(el.getAttribute('data-id')).zone;
  var r = PP.rng('qd-' + z.id);
  var hours = PP.range(14).map(function (i) { return i + 8; });
  var shape = PP.SHAPES[z.siteId === 'civic' || z.siteId === 'capital' ? 'office' : PP.site(z.siteId).layout];
  var wait = hours.map(function (h) { return Math.max(0.5, shape(h + 0.5) * 9 * PP.between(r, 0.8, 1.2)); });
  var len = wait.map(function (w) { return Math.round(w * PP.between(r, 1.1, 1.6)); });
  var within = Math.round(PP.between(r, 72, 94));
  PP.overlay.open({
    title: 'Queue Detail · ' + z.queue, fid: 'queue-detail', size: 'lg',
    sub: PP.esc(z.name) + ' · ' + PP.esc(PP.place(z.spaceId).name) + ' · ' + PP.esc(PP.site(z.siteId).name),
    body: '<div class="grid g-4" style="margin-bottom:16px"><div class="card">' + PP.kpi('Current wait', PP.fmt1(wait[Math.min(wait.length - 1, Math.max(0, new Date().getHours() - 8))]) + '<small>min</small>') + '</div><div class="card">' + PP.kpi('In queue now', len[3]) + '</div><div class="card">' + PP.kpi('Served within 5 min', within + '%', { delta: 3.2, deltaUnit: ' pts' }) + '</div><div class="card">' + PP.kpi('Abandon rate', PP.fmt1(PP.between(r, 2, 9)) + '%', { delta: -1.1, deltaUnit: ' pts', invert: true }) + '</div></div>' +
      '<div class="strong small">Average wait through the day (min) vs 8-minute target</div>' +
      PP.Charts.line({ labels: hours.map(PP.hourLabel), series: [{ name: 'Wait time', values: wait, color: PP.C.orange, area: true }, { name: 'Target', values: hours.map(function () { return 8; }), color: PP.C.red, dash: true, width: 1.4 }], height: 260, yFmt: function (x) { return x.toFixed(0); }, wide: true }) +
      '<div class="strong small mt">Queue length and counters open</div>' +
      PP.Charts.bars({ labels: hours.map(PP.hourLabel), series: [{ name: 'People queuing', values: len, color: PP.C.blue }, { name: 'Counters open', values: len.map(function (l) { return Math.max(1, Math.round(l / 5)); }), color: PP.C.teal }], height: 220, wide: true })
  });
};

PP.actions['ops-detail'] = function (el) {
  var pl = PP.place(el.getAttribute('data-id'));
  var h = PP.series.hourly(pl, 1);
  var hours = PP.range(16).map(function (i) { return i + 6; });
  var demand = hours.map(function (hh) { return Math.max(1, (h.occ[hh] || 0) / 38); });
  var roster = hours.map(function (hh) { return hh < 8 || hh > 19 ? 2 : hh < 11 ? 5 : hh < 16 ? 7 : 5; });
  var r = PP.rng('ops2-' + pl.id);
  var areas = pl.zones.filter(function (z) { return ['Amenity', 'Entrance', 'Dining', 'Activity'].indexOf(z.type) >= 0; }).slice(0, 5);
  PP.overlay.open({
    title: 'Operational Performance Detail', fid: 'ops-detail', size: 'lg',
    sub: 'Staffing, cleaning and maintenance demand driven by visitation at ' + PP.esc(pl.name) + '.',
    body: '<div class="strong small">Staffing, modelled demand vs rostered staff</div>' +
      PP.Charts.line({ labels: hours.map(PP.hourLabel), series: [{ name: 'Staff demand (modelled)', values: demand, color: PP.C.purple, area: true }, { name: 'Rostered', values: roster, color: PP.C.slate, dash: true }], height: 260, yFmt: function (x) { return x.toFixed(0); }, wide: true }) +
      '<div class="note mt-s">Under-staffed from <b>12pm–2pm</b> by about 2 people; over-staffed after <b>7pm</b>.</div>' +
      '<div class="grid g-2 mt"><div><div class="strong small" style="margin-bottom:8px">Cleaning triggers (every 250 visits)</div><table class="tbl"><thead><tr><th>Area</th><th class="num">Visits since clean</th><th>Next due</th></tr></thead><tbody>' +
      areas.map(function (z) { var v = Math.round(PP.between(r, 40, 260)); return '<tr><td>' + PP.esc(z.name) + '</td><td class="num">' + v + '</td><td>' + (v > 230 ? PP.status('high').replace('High', 'Now') : PP.status('low').replace('Low', 'in ' + Math.round((250 - v) / 6) + ' min')) + '</td></tr>'; }).join('') +
      '</tbody></table></div><div><div class="strong small" style="margin-bottom:8px">Maintenance demand (wear by footfall)</div>' +
      PP.Charts.hbars([{ label: 'Restrooms', value: 82, color: PP.C.red, display: 'High' }, { label: 'Entry matting', value: 64, color: PP.C.orange, display: 'Medium' }, { label: 'Lifts / escalators', value: 41, color: PP.C.amber, display: 'Normal' }, { label: 'HVAC load', value: 57, color: PP.C.orange, display: 'Medium' }, { label: 'Waste bins', value: 74, color: PP.C.red, display: 'High' }], { max: 100 }) + '</div></div>'
  });
};

PP.deviceDetailBody = function (d, full) {
  var z = PP.place(d.zoneId), r = PP.rng('dh-' + d.id);
  var hist = PP.range(30).map(function (i) { return d.status === 'online' ? PP.between(r, 99, 100) : PP.between(r, d.status === 'offline' && i > 27 ? 0 : 86, 100); });
  var space = z.space;
  return '<div class="grid g-dev"><div><dl class="kv"><dt>Device ID</dt><dd class="mono">' + d.id + '</dd><dt>Type</dt><dd>' + d.typeLabel + '</dd><dt>Model</dt><dd>' + d.model + '</dd><dt>Status</dt><dd>' + PP.status(d.status) + '</dd><dt>Last reported</dt><dd>' + PP.ago(d.lastSeen) + '</dd><dt>Site</dt><dd>' + PP.esc(z.site.name) + '</dd><dt>Space / zone</dt><dd>' + PP.esc(space.name + ' · ' + z.name) + '</dd>' +
    (full ? '<dt>Serial</dt><dd class="mono">' + d.serial + '</dd><dt>IP address</dt><dd class="mono">' + d.ip + '</dd><dt>Installed</dt><dd>' + d.installed + '</dd>' : '') + '<dt>Firmware</dt><dd>' + d.firmware + (d.firmware !== '4.3.0' ? ' <span class="tiny muted">(4.3.0 available)</span>' : '') + '</dd></dl>' +
    (d.issue ? '<div class="note mt">' + PP.icon('alert', 'ico') + ' ' + d.issue + '</div>' : '') + '</div>' +
    '<div><div class="fp">' + PP.Floorplan.devices(space, { action: 'noop', highlight: d.id }) + '</div><div class="tiny muted mt-s">Location on the ' + PP.esc(space.name) + ' plan</div></div></div>' +
    '<div class="strong small mt">Health history, daily uptime, last 30 days</div>' +
    PP.Charts.bars({ labels: PP.daysBack(30).map(PP.dateLabel), series: [{ name: 'Uptime %', values: hist, color: PP.C.green }], height: 200, max: 100, xTicks: 10, wide: true, colorFn: function (v) { return v > 98 ? PP.C.green : v > 90 ? PP.C.amber : PP.C.red; }, yFmt: function (x) { return Math.round(x) + '%'; } }) +
    '<div class="strong small mt" style="margin-bottom:8px">Configuration</div><dl class="kv"><dt>Counting line</dt><dd>Doorway A → in, B → out</dd><dt>Report interval</dt><dd>60 seconds</dd><dt>Privacy mode</dt><dd>On, no images leave the device</dd><dt>Height</dt><dd>3.2 m ceiling mount</dd></dl>';
};
PP.actions['device-overlay'] = function (el) {
  var d = PP.device(el.getAttribute('data-id'));
  PP.overlay.open({
    title: 'Device Detail · ' + d.id, fid: 'device-detail-ov', size: 'lg', sub: 'Health history, configuration and where this sensor is installed.',
    body: PP.deviceDetailBody(d, false),
    footer: (PP.can('device-detail') ? '<button class="btn" data-go="/devices/' + d.id + '">Open full record in Devices<span class="open-tag drill annot">Drill-down ↗</span></button>' : '') + '<button class="btn btn-primary" data-action="ov-close">Close</button>'
  });
};
PP.actions['noop'] = function () { };
