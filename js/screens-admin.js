/* =========================================================
   Platform Administration, interfaces 13–18 (ITESA / Rayven only)
   ========================================================= */
PP.S = PP.S || {};
PP.adminCrumbs = function (items) { PP.crumbs = [{ label: 'Platform Administration' }].concat(items); };
PP.tierChip = function (n) { return '<span class="chip chip-l' + n + '">L' + n + ' ' + PP.LEVELS[n - 1].name + '</span>'; };
PP.custDevices = function (cid) { return PP.FLEET.filter(function (d) { return d.customer === cid; }); };
PP.mrr = function (c) { var t = PP.customerTier(c); return c.sites * PP.PRICING[t] + PP.custDevices(c.id).length * PP.DEVICE_FEE + (t >= 3 ? 400 : 0); };

/* =========================================================
   13 · Platform Dashboard (+ Issue Detail drill-down)
   ========================================================= */
PP.S.adminDash = function () {
  var fleet = PP.FLEET;
  var online = fleet.filter(function (d) { return d.status === 'online'; }).length;
  var offline = fleet.filter(function (d) { return d.status === 'offline'; }).length;
  var health = PP.card('platform-health', {
    sub: 'Every customer and every device on the platform',
    body: '<div class="grid g-5">' +
      '<div>' + PP.kpi('Customers', PP.CUSTOMERS.length, { icon: 'users', extra: '<div class="tiny muted mt-s">' + PP.CUSTOMERS.filter(function (c) { return c.status !== 'Active'; }).length + ' onboarding / trial</div>' }) + '</div>' +
      '<div>' + PP.kpi('Devices online', PP.fmt1(online / fleet.length * 100) + '%', { icon: 'server', extra: '<div class="mt-s">' + PP.Charts.meter(online / fleet.length, PP.C.green) + '</div><div class="tiny muted mt-s">' + PP.fmt(online) + ' of ' + PP.fmt(fleet.length) + '</div>' }) + '</div>' +
      '<div>' + PP.kpi('Data freshness', '98.6%', { icon: 'clock', extra: '<div class="tiny muted mt-s">Sites reporting within 5 min</div>' }) + '</div>' +
      '<div>' + PP.kpi('Ingest rate', '41.2k<small>events/min</small>', { icon: 'bolt', spark: PP.Charts.spark(PP.range(24).map(function (i) { return 30 + PP.SHAPES.retail(i) * 12; }), { color: PP.C.teal, height: 30 }) }) + '</div>' +
      '<div>' + PP.kpi('Open issues', PP.ISSUES.length, { icon: 'alert', extra: '<div class="tiny muted mt-s">' + PP.ISSUES.filter(function (i) { return i.pri === 'P1'; }).length + ' P1 · ' + offline + ' devices offline</div>' }) + '</div></div>'
  });
  var byCustomer = PP.CUSTOMERS.map(function (c) {
    var ds = PP.custDevices(c.id), on = ds.filter(function (d) { return d.status === 'online'; }).length;
    return { c: c, n: ds.length, p: ds.length ? on / ds.length : 1 };
  }).sort(function (a, b) { return a.p - b.p; });
  var custHealth = PP.card(null, {
    title: 'Health by customer', sub: 'Share of devices online, worst first',
    body: PP.Charts.hbars(byCustomer.map(function (x) { return { label: x.c.name, value: x.p * 100, color: x.p > 0.95 ? PP.C.green : x.p > 0.9 ? PP.C.amber : PP.C.red, display: PP.fmt1(x.p * 100) + '%', go: '/admin/customers/' + x.c.id }; }), { max: 100 })
  });
  var queue = PP.card('support-queue', {
    sub: 'Data-quality issues and support items, highest priority first',
    flush: true,
    body: '<div class="list">' + PP.ISSUES.map(function (i) {
      var c = PP.customer(i.customer);
      return '<div class="li click" data-go="/admin/issues/' + i.id + '"><div style="width:42px">' + PP.status(i.pri) + '</div><div class="li-main"><div class="li-t">' + i.title + '</div><div class="li-s">' + i.id + ' · ' + c.name + ' · ' + i.kind + ' · ' + i.owner + '</div></div><div class="li-r">' + i.status + '<br>' + PP.ago(i.age) + '</div><span class="open-tag drill annot">↗</span></div>';
    }).join('') + '</div>'
  });

  PP.onMount(function () {
    var m = PP.Maps.make('admin-map', { center: [-30, 140], zoom: 4 });
    var bySite = {};
    PP.FLEET.forEach(function (d) {
      var k = d.customer + '|' + d.site;
      if (!bySite[k]) bySite[k] = { lat: d.lat, lng: d.lng, n: 0, off: 0, site: d.site, customer: d.customer };
      bySite[k].n++; if (d.status === 'offline') bySite[k].off++;
    });
    PP.Maps.fit(m, Object.keys(bySite).map(function (k) { return [bySite[k].lat, bySite[k].lng]; }), 30);
    Object.keys(bySite).forEach(function (k) {
      var s = bySite[k], c = PP.customer(s.customer);
      PP.Maps.bubble(m, s.lat, s.lng, { radius: 4 + Math.sqrt(s.n) * 1.3, color: s.off / s.n > 0.05 ? PP.C.red : s.off ? PP.C.amber : PP.C.green, popup: '<b>' + s.site + '</b><div class="muted">' + c.name + '</div><div class="mt-s">' + s.n + ' devices · ' + s.off + ' offline</div><button class="btn btn-sm btn-primary" data-go="/admin/customers/' + c.id + '">Open customer</button>' });
    });
  });

  return PP.pageHead({ title: 'Platform Dashboard', screen: 'admin-dash', sub: 'Internal ITESA / Rayven control view across every customer and device.' }) +
    health + '<div class="grid g-main mt">' + PP.card(null, { title: 'Deployments', icon: 'map', sub: 'Every customer site · colour shows device health', body: '<div id="admin-map" class="map tall"></div>' }) + custHealth + '</div>' +
    '<div class="mt">' + queue + '</div>';
};

PP.S.issueDetail = function (id) {
  var i = PP.ISSUES.find(function (x) { return x.id === id; }) || PP.ISSUES[0];
  var c = PP.customer(i.customer);
  var devs = PP.custDevices(c.id).filter(function (d) { return d.status !== 'online'; }).slice(0, 6);
  PP.adminCrumbs([{ label: 'Platform Dashboard', go: '/admin' }, { label: i.id }]);
  return PP.pageHead({ title: i.title, screen: 'admin-dash', fid: 'issue-detail', back: { label: 'Back to Platform Dashboard', go: '/admin' }, sub: i.id + ' · ' + c.name + ' · ' + i.kind + ' · opened ' + PP.ago(i.age), chips: PP.status(i.pri),
    actions: '<button class="btn" data-action="toast" data-msg="Assigned to you">Assign to me</button><select class="select select-sm" data-input="noop-input"><option>' + i.status + '</option><option>In progress</option><option>Waiting on customer</option><option>Resolved</option></select><button class="btn btn-primary" data-action="toast" data-msg="Issue resolved">Resolve</button>' }) +
    '<div class="grid g-main"><div class="stack">' +
    PP.card(null, { title: 'Description', body: '<p style="margin-top:0">' + {
      Device: 'Multiple counters stopped sending heartbeats within a 4-minute window, which points to a shared network or power fault rather than individual device failures.',
      'Data quality': 'Entries exceed exits by 7.4% across the floor for three consecutive days. Net occupancy never returns to zero overnight, so one or more counting lines are likely misaligned.',
      Integration: 'The POS feed stopped including two store IDs after the customer changed their Lightspeed account structure.',
      Onboarding: 'Three of five sites are waiting on floorplans before zones can be drawn and devices assigned.',
      Access: 'The customer\'s identity provider rotated its signing certificate; the platform still trusts the old one.',
      Configuration: 'Customer-requested configuration change awaiting scheduling.'
    }[i.kind] + '</p>' + (i.kind === 'Data quality' ? PP.Charts.line({ labels: PP.range(24).map(PP.hourLabel), series: [{ name: 'Entries (cumulative)', values: PP.range(24).map(function (h) { return h * 82 + 40; }), color: PP.C.blue }, { name: 'Exits (cumulative)', values: PP.range(24).map(function (h) { return h * 76; }), color: PP.C.orange }], height: 240, xTicks: 12, wide: true }) : '') }) +
    PP.card(null, { title: 'Affected devices', flush: true, body: devs.length ? '<table class="tbl"><thead><tr><th>Device</th><th>Site</th><th>Status</th><th class="num">Last seen</th></tr></thead><tbody>' + devs.map(function (d) { return '<tr class="click" data-go="/admin/fleet/' + d.id + '"><td class="mono name">' + d.id + '</td><td>' + d.site + '</td><td>' + PP.status(d.status) + '</td><td class="num">' + PP.ago(d.lastSeen) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted" style="padding:0 18px">No device faults linked.</p>' }) +
    '</div><div class="stack">' +
    PP.card(null, { title: 'Customer', body: '<dl class="kv"><dt>Customer</dt><dd><a href="#/admin/customers/' + c.id + '">' + c.name + '</a></dd><dt>Tier</dt><dd>' + PP.tierChip(PP.customerTier(c)) + '</dd><dt>Contact</dt><dd>' + c.contact + '</dd><dt>Owner</dt><dd>' + i.owner + '</dd><dt>Status</dt><dd>' + i.status + '</dd></dl>' }) +
    PP.card(null, { title: 'Activity', body: '<div class="list" style="margin:0 -18px">' + [['System', 'Issue opened automatically by data-quality check', i.age], [i.owner === 'Unassigned' ? 'Jo Bennett' : i.owner, 'Checked device logs, no firmware errors', i.age - 20], ['Customer', 'Confirmed no building works on site', Math.max(1, i.age - 60)]].map(function (a) { return '<div class="li"><div class="li-main"><div class="li-t">' + a[0] + '</div><div class="li-s">' + a[1] + '</div></div><div class="li-r">' + PP.ago(Math.max(1, a[2])) + '</div></div>'; }).join('') + '</div><textarea class="input mt" rows="2" placeholder="Add an internal note"></textarea><button class="btn btn-sm mt-s" data-action="toast" data-msg="Note added">Add note</button>' }) +
    '</div></div>';
};
PP.inputs['noop-input'] = function () { PP.toast('Updated'); };

/* =========================================================
   14 · Customer Management (+ Customer Profile, Onboarding Wizard)
   ========================================================= */
PP.S.customers = function () {
  return PP.pageHead({ title: 'Customer Management', screen: 'customers', sub: 'Every customer account, its tier and status.', actions: PP.opener('onboarding', 'Onboard new customer', 'data-go="/admin/customers/new"', { cls: 'btn-primary', icon: 'plus' }) }) +
    PP.card('customer-list', {
      flush: true, sub: PP.CUSTOMERS.length + ' customers · click a row to open',
      body: '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Customer</th><th>Sector</th><th>Tier</th><th class="num">Sites</th><th class="num">Devices</th><th class="num">Users</th><th>Status</th><th>Since</th></tr></thead><tbody>' + PP.CUSTOMERS.map(function (c) {
        return '<tr class="click" data-go="/admin/customers/' + c.id + '"><td><div class="name">' + c.name + '</div><div class="sub">' + c.city + ' · ' + c.contact + '</div></td><td>' + c.sector + '</td><td>' + PP.tierChip(PP.customerTier(c)) + '</td><td class="num">' + c.sites + '</td><td class="num">' + PP.custDevices(c.id).length + '</td><td class="num">' + c.users + '</td><td>' + PP.status(c.status) + '</td><td class="muted">' + c.since + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    });
};

PP.S.customerProfile = function (id) {
  var c = PP.customer(id) || PP.CUSTOMERS[0];
  var ds = PP.custDevices(c.id);
  var on = ds.filter(function (d) { return d.status === 'online'; }).length;
  var users = PP.GLOBAL_USERS.filter(function (u) { return u.customer === c.id; });
  var tier = PP.customerTier(c);
  PP.adminCrumbs([{ label: 'Customer Management', go: '/admin/customers' }, { label: c.name }]);
  PP.onMount(function () {
    var m = PP.Maps.make('cust-map');
    var seen = {}, pts = [];
    ds.forEach(function (d) { if (!seen[d.site]) { seen[d.site] = { lat: d.lat, lng: d.lng, n: 0 }; } seen[d.site].n++; });
    Object.keys(seen).forEach(function (k) { var s = seen[k]; pts.push([s.lat, s.lng]); PP.Maps.bubble(m, s.lat, s.lng, { radius: 6 + Math.sqrt(s.n), color: PP.C.blue, label: k + ' · ' + s.n }); });
    PP.Maps.fit(m, pts, 30);
  });
  return PP.pageHead({ title: c.name, screen: 'customers', fid: 'customer-profile', back: { label: 'Back to Customer Management', go: '/admin/customers' }, sub: c.sector + ' · ' + c.city + ' · customer since ' + c.since, chips: PP.status(c.status),
    actions: (c.id === 'meridian' ? '<button class="btn" data-action="impersonate" data-role="pm">' + PP.icon('eye') + 'Open customer app as Priya Nair</button>' : '') + '<button class="btn" data-go="/admin/billing/' + c.id + '">' + PP.icon('card') + 'Billing</button>' }) +
    '<div class="grid g-4"><div class="card">' + PP.kpi('Sites', c.sites, { icon: 'building' }) + '</div><div class="card">' + PP.kpi('Devices', ds.length, { icon: 'server', extra: '<div class="tiny muted mt-s">' + PP.fmt1(on / Math.max(1, ds.length) * 100) + '% online</div>' }) + '</div><div class="card">' + PP.kpi('Users', c.users, { icon: 'users' }) + '</div><div class="card">' + PP.kpi('Monthly value', PP.money(PP.mrr(c)), { icon: 'dollar' }) + '</div></div>' +
    '<div class="grid g-main mt"><div class="stack">' + PP.card(null, { title: 'Sites & devices', icon: 'map', body: '<div id="cust-map" class="map"></div>' }) +
    PP.card(null, { title: 'Users', flush: true, body: '<table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Last active</th></tr></thead><tbody>' + users.map(function (u) { var idx = PP.GLOBAL_USERS.indexOf(u); return '<tr class="click" data-go="/admin/users/' + idx + '"><td><div class="name">' + u.name + '</div><div class="sub">' + u.email + '</div></td><td>' + PP.roleChip(u.role) + '</td><td>' + PP.status(u.status) + '</td><td class="muted">' + u.last + '</td></tr>'; }).join('') + '</tbody></table>' }) + '</div>' +
    '<div class="stack">' + PP.card(null, { title: 'Subscription', body: '<div class="form"><label class="field"><span>Tier</span><select class="select" data-input="cust-tier" data-id="' + c.id + '">' + PP.LEVELS.map(function (l) { return '<option value="' + l.n + '"' + (l.n === tier ? ' selected' : '') + '>Level ' + l.n + ' · ' + l.name + '</option>'; }).join('') + '</select>' + (c.id === 'meridian' ? '<small>Meridian is the demo customer, changing this also changes the preview level.</small>' : '') + '</label><dl class="kv"><dt>Contract</dt><dd>12 months · renews Mar 2027</dd><dt>Billing contact</dt><dd>' + c.contact + '</dd></dl></div>' }) +
    PP.card(null, { title: 'Recent admin activity', body: '<div class="list" style="margin:0 -18px">' + PP.AUDIT.filter(function (a) { return a.customer === c.id; }).slice(0, 5).map(function (a) { return '<div class="li"><div class="li-main"><div class="li-t">' + a.action + '</div><div class="li-s">' + a.detail + '</div></div><div class="li-r">' + PP.ago(a.mins) + '</div></div>'; }).join('') + '</div>' }) +
    PP.card(null, { title: 'Open issues', body: PP.ISSUES.filter(function (i) { return i.customer === c.id; }).map(function (i) { return '<div class="row" style="margin-bottom:8px">' + PP.status(i.pri) + '<a href="#/admin/issues/' + i.id + '">' + i.title + '</a></div>'; }).join('') || '<p class="muted small" style="margin:0">None</p>' }) +
    '</div></div>';
};
PP.inputs['cust-tier'] = function (el) {
  var c = PP.customer(el.getAttribute('data-id'));
  if (c.tier == null) { PP.setState({ level: +el.value }); } else { c.tier = +el.value; PP.render(true); }
  PP.toast(c.name + ' moved to ' + PP.levelName(+el.value));
};
PP.actions['impersonate'] = function (el) {
  PP.toast('Support session started, viewing as ' + PP.ROLES[el.getAttribute('data-role')].who);
  PP.setState({ role: el.getAttribute('data-role') });
};

PP.wiz = { step: 0 };
PP.S.onboarding = function () {
  PP.adminCrumbs([{ label: 'Customer Management', go: '/admin/customers' }, { label: 'Onboarding' }]);
  var steps = ['Organisation', 'Sites', 'Floorplans & zones', 'Devices', 'Users', 'Tier & review'];
  var s = PP.wiz.step;
  var stepper = '<div class="steps">' + steps.map(function (t, i) { return '<div class="step ' + (i < s ? 'done' : i === s ? 'on' : '') + '"><span class="n">' + (i < s ? '✓' : i + 1) + '</span>' + t + '</div>'; }).join('') + '</div>';
  var body = [
    '<div class="form g-2"><label class="field"><span>Organisation name</span><input class="input" value="Sunrise Shopping Centres"></label><label class="field"><span>Sector</span><select class="select"><option>Retail property</option><option>Local government</option><option>Education</option><option>Libraries</option></select></label><label class="field"><span>Primary contact</span><input class="input" value="Olivia Grant"></label><label class="field"><span>Contact email</span><input class="input" value="olivia.grant@sunrise.example.com"></label><label class="field"><span>Timezone</span><select class="select"><option>Australia/Sydney (AEDT)</option></select></label><div class="field"><span>Branding</span><button class="btn btn-sm" style="justify-self:start" data-action="toast" data-msg="Logo uploaded">' + PP.icon('upload') + 'Upload logo</button></div></div>',
    '<div class="grid g-2"><div><div id="wiz-map" class="map"></div><div class="tiny muted mt-s">Search an address or click the map to drop a site pin.</div></div><div><input class="input" placeholder="Search address…"><table class="tbl mt-s"><thead><tr><th>Site</th><th>Address</th></tr></thead><tbody>' + [['Sunrise Charlestown', 'Charlestown NSW'], ['Sunrise Kotara', 'Kotara NSW'], ['Sunrise Maitland', 'Maitland NSW'], ['Sunrise Cessnock', 'Cessnock NSW'], ['Sunrise Raymond Tce', 'Raymond Terrace NSW']].map(function (r) { return '<tr><td class="name">' + r[0] + '</td><td class="muted">' + r[1] + '</td></tr>'; }).join('') + '</tbody></table></div></div>',
    '<div class="grid g-2"><div class="dropzone">' + PP.icon('upload', 'ico') + '<div class="strong mt-s">Drop floorplans for each floor</div><div class="small">PDF, PNG, JPG or DWG</div></div><div><div class="fp">' + PP.Floorplan.edit(PP.ALL_SITES[2].spaces[0], [], null) + '</div><div class="tiny muted mt-s">Preview: zones drawn over the uploaded plan for Sunrise Charlestown · Lower Mall</div></div></div>',
    '<table class="tbl"><thead><tr><th>Serial</th><th>Type</th><th>Site</th><th>Zone</th><th>Status</th></tr></thead><tbody>' + PP.range(6).map(function (i) { return '<tr><td class="mono">SN' + (448210 + i * 17) + '</td><td>' + ['3D people counter', 'Thermal occupancy sensor', 'Queue analytics sensor'][i % 3] + '</td><td>Sunrise ' + ['Charlestown', 'Kotara'][i % 2] + '</td><td><select class="select select-sm"><option>' + ['Main Entrance', 'Food Court', 'Customer Services', 'Car Park Link', 'Central Concourse', 'Anchor Store'][i] + '</option></select></td><td>' + PP.status(i < 4 ? 'online' : 'provisioning') + '</td></tr>'; }).join('') + '</tbody></table><button class="btn btn-sm mt-s" data-go="/admin/fleet/provision">' + PP.icon('plus') + 'Provision another device</button>',
    '<table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody><tr><td class="name">Olivia Grant</td><td>olivia.grant@sunrise.example.com</td><td>' + PP.roleChip('pm') + '</td></tr><tr><td class="name">Daniel Moss</td><td>daniel.moss@sunrise.example.com</td><td>' + PP.roleChip('exec') + '</td></tr><tr><td><input class="input" placeholder="Name"></td><td><input class="input" placeholder="Email"></td><td><select class="select select-sm"><option>Portfolio Manager</option><option>Executive</option></select></td></tr></tbody></table>',
    '<div class="plan-grid">' + PP.LEVELS.map(function (l) { return '<div class="plan' + (l.n === 2 ? ' cur' : '') + '"><h4 style="color:' + l.color + '">Level ' + l.n + ' · ' + l.name + '</h4><div class="small muted">' + l.tagline + '</div><div class="strong mt-s">' + PP.money(PP.PRICING[l.n]) + '<span class="small muted"> / site / month</span></div></div>'; }).join('') + '</div><div class="note info mt">Summary: 5 sites · 150 devices · 2 users · Level 2 Insights · ' + PP.money(5 * PP.PRICING[2] + 150 * PP.DEVICE_FEE) + ' / month</div>'
  ][s];
  if (s === 1) PP.onMount(function () { var m = PP.Maps.make('wiz-map', { center: [-32.95, 151.65], zoom: 10 }); [[-32.965, 151.693], [-32.938, 151.693], [-32.733, 151.556], [-32.833, 151.355], [-32.766, 151.744]].forEach(function (p) { PP.Maps.bubble(m, p[0], p[1], { radius: 9, color: PP.C.blue }); }); });
  return PP.pageHead({ title: 'Onboard a new customer', screen: 'customers', fid: 'onboarding', back: { label: 'Back to Customer Management', go: '/admin/customers' }, sub: 'Step-by-step setup: sites, floorplans, devices, users and tier.' }) +
    stepper + '<div class="card"><div class="card-h"><div class="card-t">Step ' + (s + 1) + ' · ' + steps[s] + '</div></div><div class="card-b">' + body + '</div><div class="card-f"><button class="btn" data-action="wiz" data-v="-1"' + (s === 0 ? ' disabled' : '') + '>Back</button>' + (s < steps.length - 1 ? '<button class="btn btn-primary" data-action="wiz" data-v="1">Continue</button>' : '<button class="btn btn-primary" data-action="wiz-done">Create customer & send invites</button>') + '</div></div>';
};
PP.actions['wiz'] = function (el) { PP.wiz.step = PP.clamp(PP.wiz.step + +el.getAttribute('data-v'), 0, 5); PP.render(); };
PP.actions['wiz-done'] = function () { PP.wiz.step = 0; PP.toast('Customer created, invitations sent'); PP.go('/admin/customers/sunrise'); };

/* =========================================================
   15 · Global Device Fleet (+ Device Detail (Admin), Provisioning Flow)
   ========================================================= */
PP.fleetFilter = { customer: 'all', type: 'all', status: 'all', q: '', page: 0 };
PP.S.fleet = function () {
  var f = PP.fleetFilter, all = PP.FLEET;
  var c = { online: 0, warning: 0, offline: 0, provisioning: 0 };
  all.forEach(function (d) { c[d.status]++; });
  var list = all.filter(function (d) {
    return (f.customer === 'all' || d.customer === f.customer) && (f.type === 'all' || d.type === f.type) && (f.status === 'all' || d.status === f.status) && (!f.q || (d.id + ' ' + d.site).toLowerCase().indexOf(f.q.toLowerCase()) >= 0);
  });
  var per = 25, pages = Math.max(1, Math.ceil(list.length / per));
  f.page = Math.min(f.page, pages - 1);
  var rows = list.slice(f.page * per, f.page * per + per);
  var summary = PP.card('fleet-summary', {
    body: '<div class="grid g-4"><div>' + PP.kpi('Total deployed', PP.fmt(all.length), { icon: 'server' }) + '</div><div>' + PP.kpi('Total online', '<span class="up">' + PP.fmt(c.online) + '</span>', { icon: 'check', extra: '<div class="mt-s">' + PP.Charts.meter(c.online / all.length, PP.C.green) + '</div>' }) + '</div><div>' + PP.kpi('Total offline', '<span class="down">' + PP.fmt(c.offline) + '</span>', { icon: 'close', extra: '<div class="tiny muted mt-s">+ ' + c.warning + ' warning</div>' }) + '</div><div>' + PP.kpi('Provisioning', PP.fmt(c.provisioning), { icon: 'refresh' }) + '</div></div>'
  });
  var sel = function (key, opts) { return '<select class="select select-sm" data-input="fleet-f" data-k="' + key + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (f[key] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
  var table = PP.card('global-devices', {
    sub: PP.fmt(list.length) + ' devices match',
    actions: '<input class="input" style="width:170px;padding:6px 10px" placeholder="Search ID or site…" value="' + PP.esc(f.q) + '" data-input="fleet-q">' +
      sel('customer', [['all', 'All customers']].concat(PP.CUSTOMERS.map(function (x) { return [x.id, x.name]; }))) +
      sel('type', [['all', 'All types']].concat(Object.keys(PP.DEVICE_TYPES).map(function (k) { return [k, PP.DEVICE_TYPES[k].label]; }))) +
      sel('status', [['all', 'Any state'], ['online', 'Online'], ['warning', 'Warning'], ['offline', 'Offline'], ['provisioning', 'Provisioning']]) +
      PP.opener('provisioning', 'Provision device', 'data-go="/admin/fleet/provision"', { cls: 'btn-sm btn-primary', icon: 'plus' }),
    flush: true,
    body: '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Device</th><th>Customer</th><th>Site</th><th>Type</th><th>Status</th><th>Firmware</th><th class="num">Last seen</th></tr></thead><tbody>' + rows.map(function (d) {
      return '<tr class="click" data-go="/admin/fleet/' + d.id + '"><td class="mono name">' + d.id + '</td><td>' + PP.customer(d.customer).name + '</td><td>' + d.site + '<div class="sub">' + d.city + '</div></td><td>' + d.typeLabel + '</td><td>' + PP.status(d.status) + '</td><td>' + d.firmware + '</td><td class="num">' + PP.ago(d.lastSeen) + '</td></tr>';
    }).join('') + '</tbody></table></div><div class="pager"><span>Showing ' + (list.length ? f.page * per + 1 : 0) + '–' + Math.min(list.length, (f.page + 1) * per) + ' of ' + PP.fmt(list.length) + '</span><span class="row"><button class="btn btn-sm" data-action="fleet-page" data-v="-1"' + (f.page === 0 ? ' disabled' : '') + '>Prev</button>Page ' + (f.page + 1) + ' of ' + pages + '<button class="btn btn-sm" data-action="fleet-page" data-v="1"' + (f.page >= pages - 1 ? ' disabled' : '') + '>Next</button></span></div>'
  });
  PP.onMount(function () {
    var m = PP.Maps.make('fleet-map', { center: [-30, 142], zoom: 4 });
    var sites = {};
    list.forEach(function (d) { var k = d.customer + d.site; if (!sites[k]) sites[k] = { d: d, n: 0, off: 0 }; sites[k].n++; if (d.status === 'offline') sites[k].off++; });
    PP.Maps.fit(m, Object.keys(sites).map(function (k) { return [sites[k].d.lat, sites[k].d.lng]; }), 30);
    Object.keys(sites).forEach(function (k) { var s = sites[k]; PP.Maps.bubble(m, s.d.lat, s.d.lng, { radius: 4 + Math.sqrt(s.n) * 1.4, color: s.off ? PP.C.red : PP.C.green, popup: '<b>' + s.d.site + '</b><div class="muted">' + PP.customer(s.d.customer).name + '</div><div>' + s.n + ' devices · ' + s.off + ' offline</div>' }); });
  });
  return PP.pageHead({ title: 'Global Device Fleet', screen: 'fleet', sub: 'Every device across every customer, monitor, filter and provision hardware.' }) +
    summary + '<div class="mt">' + PP.card(null, { title: 'Fleet map', icon: 'map', sub: 'Filtered devices, grouped by site', body: '<div id="fleet-map" class="map"></div>' }) + '</div><div class="mt">' + table + '</div>';
};
PP.inputs['fleet-f'] = function (el) { PP.fleetFilter[el.getAttribute('data-k')] = el.value; PP.fleetFilter.page = 0; PP.render(true); };
PP.actions['fleet-page'] = function (el) { PP.fleetFilter.page += +el.getAttribute('data-v'); PP.render(true); };
PP._fleetQ = null;
PP.inputs['fleet-q'] = function (el) {
  PP.fleetFilter.q = el.value; PP.fleetFilter.page = 0;
  clearTimeout(PP._fleetQ);
  PP._fleetQ = setTimeout(function () { PP.render(true); var i = document.querySelector('[data-input="fleet-q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300);
};

PP.S.fleetDevice = function (id) {
  var d = PP.FLEET.find(function (x) { return x.id === id; }) || PP.FLEET[0];
  var c = PP.customer(d.customer);
  var local = PP.device(d.id);
  PP.adminCrumbs([{ label: 'Global Device Fleet', go: '/admin/fleet' }, { label: d.id }]);
  var r = PP.rng('fd-' + d.id);
  var hist = PP.range(30).map(function () { return d.status === 'online' ? PP.between(r, 99, 100) : PP.between(r, 82, 100); });
  return PP.pageHead({ title: d.id, screen: 'fleet', fid: 'device-detail-admin', back: { label: 'Back to Global Device Fleet', go: '/admin/fleet' }, sub: d.typeLabel + ' · ' + d.model + ' · ' + c.name, chips: PP.status(d.status),
    actions: '<button class="btn" data-action="remote-start" data-id="' + (local ? local.id : PP.DEVICES[0].id) + '">' + PP.icon('terminal') + 'Remote session</button><button class="btn" data-action="toast" data-msg="Firmware 4.3.0 queued">Push firmware</button><button class="btn btn-danger" data-action="toast" data-msg="Device decommissioned">Decommission</button>' }) +
    '<div class="grid g-main"><div class="stack">' +
    (local ? PP.card(null, { title: 'Device record (as the customer sees it)', body: PP.deviceDetailBody(local, true) }) : PP.card(null, { title: 'Device record', body: '<dl class="kv"><dt>Customer</dt><dd>' + c.name + '</dd><dt>Site</dt><dd>' + d.site + ', ' + d.city + '</dd><dt>Status</dt><dd>' + PP.status(d.status) + '</dd><dt>Last seen</dt><dd>' + PP.ago(d.lastSeen) + '</dd><dt>Firmware</dt><dd>' + d.firmware + '</dd></dl><div class="strong small mt">Uptime, last 30 days</div>' + PP.Charts.bars({ labels: PP.daysBack(30).map(PP.dateLabel), series: [{ values: hist, color: PP.C.green }], height: 150, max: 100, xTicks: 6, colorFn: function (v) { return v > 98 ? PP.C.green : v > 90 ? PP.C.amber : PP.C.red; } }) })) +
    '</div><div class="stack">' +
    PP.card(null, { title: 'Admin context', body: '<dl class="kv"><dt>Customer</dt><dd><a href="#/admin/customers/' + c.id + '">' + c.name + '</a></dd><dt>Tier</dt><dd>' + PP.tierChip(PP.customerTier(c)) + '</dd><dt>Provisioned by</dt><dd>Jo Bennett</dd><dt>Provisioned</dt><dd>' + c.since + '</dd><dt>Warranty</dt><dd>Until ' + c.since.replace(/\d{4}/, function (y) { return +y + 3; }) + '</dd><dt>Support plan</dt><dd>Next-business-day swap</dd><dt>Tunnel</dt><dd class="mono">wg-' + d.id.toLowerCase() + '</dd></dl>' }) +
    PP.card(null, { title: 'Reassign', body: '<div class="form"><label class="field"><span>Customer</span><select class="select">' + PP.CUSTOMERS.map(function (x) { return '<option' + (x.id === c.id ? ' selected' : '') + '>' + x.name + '</option>'; }).join('') + '</select></label><label class="field"><span>Site</span><input class="input" value="' + d.site + '"></label><button class="btn btn-sm" style="justify-self:start" data-action="toast" data-msg="Device reassigned">Reassign device</button></div>' }) +
    PP.card(null, { title: 'Provisioning history', body: '<div class="list" style="margin:0 -18px">' + [['Registered', c.since], ['Assigned to ' + d.site, c.since], ['Firmware ' + d.firmware + ' installed', 'Aug 2026'], ['Last config change', 'Sep 2026']].map(function (e) { return '<div class="li"><div class="li-main"><div class="li-t" style="font-weight:600">' + e[0] + '</div></div><div class="li-r">' + e[1] + '</div></div>'; }).join('') + '</div>' }) +
    '</div></div>';
};

PP.prov = { step: 0 };
PP.S.provision = function () {
  PP.adminCrumbs([{ label: 'Global Device Fleet', go: '/admin/fleet' }, { label: 'Provision device' }]);
  var steps = ['Identify device', 'Type & firmware', 'Assign customer & location', 'Test & activate'];
  var s = PP.prov.step;
  var space = PP.ALL_SITES[0].spaces[2];
  var body = [
    '<div class="grid g-2"><div class="form"><label class="field"><span>Serial number</span><input class="input mono" value="SN592204"></label><label class="field"><span>MAC address</span><input class="input mono" value="00:1B:C5:4E:22:9A"></label><button class="btn btn-sm" style="justify-self:start" data-action="toast" data-msg="QR code scanned">' + PP.icon('eye') + 'Scan QR on device</button></div><div class="note info">Device found on the provisioning network · checked in 12 seconds ago.</div></div>',
    '<div class="form g-2"><label class="field"><span>Device type</span><select class="select">' + Object.keys(PP.DEVICE_TYPES).map(function (k) { return '<option>' + PP.DEVICE_TYPES[k].label + ' · ' + PP.DEVICE_TYPES[k].model + '</option>'; }).join('') + '</select></label><label class="field"><span>Firmware</span><select class="select"><option>4.3.0 (latest)</option><option>4.2.1</option></select></label><label class="field"><span>Report interval</span><select class="select"><option>60 seconds</option><option>5 minutes</option></select></label><label class="field"><span>Privacy mode</span><select class="select"><option>On, counts only</option><option>Demographics (anonymised)</option></select></label></div>',
    '<div class="grid g-2"><div class="form"><label class="field"><span>Customer</span><select class="select"><option>Meridian Property Group</option>' + PP.CUSTOMERS.slice(1).map(function (c) { return '<option>' + c.name + '</option>'; }).join('') + '</select></label><label class="field"><span>Site</span><select class="select"><option>Civic Tower</option></select></label><label class="field"><span>Space</span><select class="select"><option>Level 7</option></select></label><label class="field"><span>Zone</span><select class="select"><option>Kitchen & Breakout</option></select></label></div><div><div class="fp">' + PP.Floorplan.occupancy(space, { highlight: space.zones[6].id }) + '</div><div class="tiny muted mt-s">Mounting position: Kitchen & Breakout, Level 7</div></div></div>',
    '<div class="list">' + [['Heartbeat received', 'ok'], ['Firmware 4.3.0 verified', 'ok'], ['Counting line calibrated', 'ok'], ['First count events received (14)', 'ok'], ['Linked to zone Kitchen & Breakout', 'ok']].map(function (t) { return '<div class="li"><div class="li-ico tint-green">' + PP.icon('check') + '</div><div class="li-main"><div class="li-t">' + t[0] + '</div></div></div>'; }).join('') + '</div>'
  ][s];
  return PP.pageHead({ title: 'Provision a device', screen: 'fleet', fid: 'provisioning', back: { label: 'Back to Global Device Fleet', go: '/admin/fleet' }, sub: 'Register a new device and assign it to a customer.' }) +
    '<div class="steps">' + steps.map(function (t, i) { return '<div class="step ' + (i < s ? 'done' : i === s ? 'on' : '') + '"><span class="n">' + (i < s ? '✓' : i + 1) + '</span>' + t + '</div>'; }).join('') + '</div>' +
    '<div class="card"><div class="card-h"><div class="card-t">Step ' + (s + 1) + ' · ' + steps[s] + '</div></div><div class="card-b">' + body + '</div><div class="card-f"><button class="btn" data-action="prov" data-v="-1"' + (s === 0 ? ' disabled' : '') + '>Back</button>' + (s < steps.length - 1 ? '<button class="btn btn-primary" data-action="prov" data-v="1">Continue</button>' : '<button class="btn btn-primary" data-action="prov-done">Activate device</button>') + '</div></div>';
};
PP.actions['prov'] = function (el) { PP.prov.step = PP.clamp(PP.prov.step + +el.getAttribute('data-v'), 0, 3); PP.render(); };
PP.actions['prov-done'] = function () { PP.prov.step = 0; PP.toast('Device SN592204 activated for Meridian Property Group'); PP.go('/admin/fleet'); };

/* =========================================================
   16 · Global User Directory (+ User Detail (Admin))
   ========================================================= */
PP.userFilter = { q: '', customer: 'all', role: 'all' };
PP.S.globalUsers = function () {
  var f = PP.userFilter;
  var list = PP.GLOBAL_USERS.map(function (u, i) { return { u: u, i: i }; }).filter(function (x) {
    return (f.customer === 'all' || x.u.customer === f.customer) && (f.role === 'all' || x.u.role === f.role) && (!f.q || (x.u.name + ' ' + x.u.email).toLowerCase().indexOf(f.q.toLowerCase()) >= 0);
  });
  return PP.pageHead({ title: 'Global User Directory', screen: 'users', sub: 'Every user across every customer, for access management and support.' }) +
    PP.card('global-users', {
      sub: list.length + ' of ' + PP.GLOBAL_USERS.length + ' users',
      actions: '<input class="input" style="width:200px;padding:6px 10px" placeholder="Search name or email…" value="' + PP.esc(f.q) + '" data-input="user-q">' +
        '<select class="select select-sm" data-input="user-f" data-k="customer"><option value="all">All customers</option><option value="platform"' + (f.customer === 'platform' ? ' selected' : '') + '>ITESA / Rayven staff</option>' + PP.CUSTOMERS.map(function (c) { return '<option value="' + c.id + '"' + (f.customer === c.id ? ' selected' : '') + '>' + c.name + '</option>'; }).join('') + '</select>' +
        '<select class="select select-sm" data-input="user-f" data-k="role"><option value="all">All roles</option><option value="admin"' + (f.role === 'admin' ? ' selected' : '') + '>Platform Admin</option><option value="pm"' + (f.role === 'pm' ? ' selected' : '') + '>Portfolio Manager</option><option value="exec"' + (f.role === 'exec' ? ' selected' : '') + '>Executive</option></select>',
      flush: true,
      body: '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>User</th><th>Customer</th><th>Role</th><th>Status</th><th>MFA</th><th>SSO</th><th>Last active</th></tr></thead><tbody>' + list.map(function (x) {
        var u = x.u;
        return '<tr class="click" data-go="/admin/users/' + x.i + '"><td><div class="name">' + u.name + '</div><div class="sub">' + u.email + '</div></td><td>' + (u.customer === 'platform' ? '<span class="chip chip-admin">ITESA / Rayven</span>' : PP.customer(u.customer).name) + '</td><td>' + PP.roleChip(u.role) + '</td><td>' + PP.status(u.status) + '</td><td>' + (u.mfa ? '<span class="up">✓</span>' : '<span class="down">✕</span>') + '</td><td>' + (u.sso ? '<span class="up">✓</span>' : '<span class="muted">—</span>') + '</td><td class="muted">' + u.last + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    });
};
PP.inputs['user-f'] = function (el) { PP.userFilter[el.getAttribute('data-k')] = el.value; PP.render(true); };
PP._userQ = null;
PP.inputs['user-q'] = function (el) {
  PP.userFilter.q = el.value;
  clearTimeout(PP._userQ);
  PP._userQ = setTimeout(function () { PP.render(true); var i = document.querySelector('[data-input="user-q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300);
};

PP.S.globalUser = function (idx) {
  var u = PP.GLOBAL_USERS[+idx] || PP.GLOBAL_USERS[0];
  var c = u.customer === 'platform' ? null : PP.customer(u.customer);
  PP.adminCrumbs([{ label: 'Global User Directory', go: '/admin/users' }, { label: u.name }]);
  var imp = u.customer === 'meridian' && u.role !== 'admin' ? '<button class="btn" data-action="impersonate" data-role="' + u.role + '">' + PP.icon('eye') + 'Impersonate for support</button>' : '<button class="btn" disabled title="Impersonation is available for Meridian users in this prototype">' + PP.icon('eye') + 'Impersonate</button>';
  return PP.pageHead({ title: u.name, screen: 'users', fid: 'user-detail-admin', back: { label: 'Back to Global User Directory', go: '/admin/users' }, sub: u.email + ' · ' + (c ? c.name : 'ITESA / Rayven staff'), chips: PP.roleChip(u.role) + PP.status(u.status),
    actions: imp + '<button class="btn" data-action="toast" data-msg="Password reset email sent">Reset password</button><button class="btn btn-danger" data-action="toast" data-msg="User suspended">Suspend</button>' }) +
    '<div class="grid g-2">' +
    PP.card(null, { title: 'Access', body: '<div class="form"><label class="field"><span>Role</span><select class="select"><option' + (u.role === 'pm' ? ' selected' : '') + '>Portfolio Manager</option><option' + (u.role === 'exec' ? ' selected' : '') + '>Executive</option><option' + (u.role === 'admin' ? ' selected' : '') + '>Platform Administrator</option></select></label><label class="field"><span>Customer</span><input class="input" value="' + (c ? c.name : 'ITESA / Rayven') + '" disabled></label><label class="field"><span>Sites</span><div class="pills"><span class="pill on">All sites</span></div></label><button class="btn btn-sm btn-primary" style="justify-self:start" data-action="toast" data-msg="Access updated">Save access</button></div>' }) +
    PP.card(null, { title: 'Security', body: '<dl class="kv"><dt>MFA</dt><dd>' + (u.mfa ? 'Enabled (authenticator app)' : '<span class="down">Not enabled</span>') + '</dd><dt>SSO</dt><dd>' + (u.sso ? 'Signs in via identity provider' : 'Password') + '</dd><dt>Last sign-in</dt><dd>' + u.last + ' · Melbourne, AU</dd><dt>Active sessions</dt><dd>2 (Chrome on Windows, iOS app)</dd></dl><button class="btn btn-sm mt" data-action="toast" data-msg="All sessions signed out">Sign out all sessions</button>' }) +
    '<div class="span-all">' + PP.card(null, { title: 'Recent activity', body: '<div class="list" style="margin:0 -18px">' + [['Signed in', 30], ['Viewed Place Detail, Civic Tower · Level 7', 34], ['Downloaded Weekly Visitation Summary', 1500], ['Edited alert rule "Over-capacity warning"', 4400]].map(function (a) { return '<div class="li"><div class="li-main"><div class="li-t" style="font-weight:600">' + a[0] + '</div></div><div class="li-r">' + PP.ago(a[1]) + '</div></div>'; }).join('') + '</div>' }) + '</div></div>';
};

/* =========================================================
   17 · Audit Log (+ Log Entry Detail overlay)
   ========================================================= */
PP.auditFilter = 'all';
PP.S.audit = function () {
  var list = PP.AUDIT.filter(function (a) { return PP.auditFilter === 'all' || a.target === PP.auditFilter; });
  return PP.pageHead({ title: 'Audit Log', screen: 'audit', sub: 'A record of administrative actions across the platform, for traceability and accountability.', actions: '<button class="btn" data-action="toast" data-msg="Audit log exported to CSV">' + PP.icon('download') + 'Export CSV</button>' }) +
    PP.card('audit-log', {
      sub: list.length + ' entries · newest first',
      actions: '<div class="seg">' + [['all', 'All'], ['device', 'Devices'], ['customer', 'Customers'], ['user', 'Users'], ['config', 'Config']].map(function (o) { return '<button class="' + (PP.auditFilter === o[0] ? 'on' : '') + '" data-action="audit-filter" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>',
      flush: true,
      body: '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Detail</th><th>Customer</th><th></th></tr></thead><tbody>' + list.map(function (a) {
        return '<tr class="click" data-action="log-detail" data-id="' + a.id + '"><td class="nowrap muted">' + PP.stamp(a.mins) + '</td><td class="name">' + a.actor + '</td><td>' + a.action + '</td><td class="small">' + a.detail + '</td><td class="small">' + PP.customer(a.customer).name + '</td><td><span class="open-tag overlay annot">⧉</span></td></tr>';
      }).join('') + '</tbody></table></div>'
    });
};
PP.actions['audit-filter'] = function (el) { PP.auditFilter = el.getAttribute('data-v'); PP.render(true); };
PP.actions['log-detail'] = function (el) {
  var a = PP.AUDIT.find(function (x) { return x.id === el.getAttribute('data-id'); });
  var json = { event_id: a.id, timestamp: new Date(Date.now() - a.mins * 60000).toISOString(), actor: a.actor, actor_ip: a.ip, action: a.action.toLowerCase().replace(/ /g, '_'), target_type: a.target, customer_id: a.customer, detail: a.detail, user_agent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/128', result: 'success' };
  PP.overlay.open({
    title: a.action, fid: 'log-detail', sub: a.id + ' · ' + PP.stamp(a.mins), side: true,
    body: '<dl class="kv"><dt>Actor</dt><dd>' + a.actor + '</dd><dt>Action</dt><dd>' + a.action + '</dd><dt>Customer</dt><dd>' + PP.customer(a.customer).name + '</dd><dt>Source IP</dt><dd class="mono">' + a.ip + '</dd><dt>Result</dt><dd>' + PP.status('online').replace('Online', 'Success') + '</dd></dl>' +
      '<div class="strong small mt">Detail</div><p class="muted">' + a.detail + '</p>' +
      (a.action.indexOf('tier') > 0 ? '<div class="grid g-2"><div class="note" style="background:var(--bad-soft);border-color:#efc2c2;color:#8a2323"><b>Before</b><br>tier: 2</div><div class="note" style="background:var(--ok-soft);border-color:#a9dcc0;color:#0f6a41"><b>After</b><br>tier: 3</div></div>' : '') +
      '<div class="strong small mt">Raw event</div><pre style="background:#18181b;color:#cfd7ff;padding:14px;border-radius:10px;font-size:12px;overflow:auto">' + PP.esc(JSON.stringify(json, null, 2)) + '</pre>'
  });
};

/* =========================================================
   18 · Usage + Billing View (+ Customer Billing Detail)
   ========================================================= */
PP.S.billing = function () {
  var rows = PP.CUSTOMERS.map(function (c) { return { c: c, t: PP.customerTier(c), d: PP.custDevices(c.id).length, m: PP.mrr(c) }; }).sort(function (a, b) { return b.m - a.m; });
  var total = PP.sum(rows.map(function (r) { return r.m; }));
  var byTier = [1, 2, 3, 4].map(function (t) { return PP.sum(rows.filter(function (r) { return r.t === t; }).map(function (r) { return r.m; })); });
  return PP.pageHead({ title: 'Usage + Billing View', screen: 'billing', sub: 'What each customer is using, device counts, active sites and tier, to support billing.' }) +
    '<div class="grid g-4"><div class="card">' + PP.kpi('Monthly recurring', PP.money(total), { icon: 'dollar', delta: 4.1, deltaLabel: 'vs last month' }) + '</div><div class="card">' + PP.kpi('Active sites', PP.sum(rows.map(function (r) { return r.c.sites; })), { icon: 'building' }) + '</div><div class="card">' + PP.kpi('Billable devices', PP.fmt(PP.FLEET.length), { icon: 'server' }) + '</div><div class="card">' + PP.kpi('Avg per customer', PP.money(total / rows.length), { icon: 'users' }) + '</div></div>' +
    '<div class="grid g-main mt">' + PP.card('usage', {
      flush: true, sub: 'Click a customer for an itemised breakdown',
      body: '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Customer</th><th>Tier</th><th class="num">Active sites</th><th class="num">Devices</th><th class="num">Users</th><th class="num">Monthly</th></tr></thead><tbody>' + rows.map(function (r) {
        return '<tr class="click" data-go="/admin/billing/' + r.c.id + '"><td class="name">' + r.c.name + '</td><td>' + PP.tierChip(r.t) + '</td><td class="num">' + r.c.sites + '</td><td class="num">' + r.d + '</td><td class="num">' + r.c.users + '</td><td class="num strong">' + PP.money(r.m) + '</td></tr>';
      }).join('') + '</tbody></table></div>'
    }) + PP.card(null, { title: 'Revenue by tier', body: PP.Charts.donut(PP.LEVELS.map(function (l, i) { return { label: 'L' + l.n + ' ' + l.name, value: byTier[i], color: l.color }; }), { center: PP.short(total), sub: 'per month', size: 170 }) }) + '</div>';
};
PP.S.billingDetail = function (id) {
  var c = PP.customer(id) || PP.CUSTOMERS[0];
  var t = PP.customerTier(c), d = PP.custDevices(c.id).length;
  PP.adminCrumbs([{ label: 'Usage + Billing View', go: '/admin/billing' }, { label: c.name }]);
  var lines = [['Platform · ' + PP.levelName(t), c.sites + ' sites × ' + PP.money(PP.PRICING[t]), c.sites * PP.PRICING[t]], ['Device connectivity', d + ' devices × ' + PP.money(PP.DEVICE_FEE), d * PP.DEVICE_FEE]];
  if (t >= 3) lines.push(['Integrations bundle', 'POS, Wi-Fi, BMS connectors', 400]);
  var total = PP.sum(lines.map(function (l) { return l[2]; }));
  var hist = PP.range(12).map(function (i) { return total * (0.78 + i * 0.02); });
  return PP.pageHead({ title: c.name + ', billing', screen: 'billing', fid: 'billing-detail', back: { label: 'Back to Usage + Billing', go: '/admin/billing' }, sub: 'Itemised billing for the current period (October 2026).', actions: '<button class="btn" data-action="toast" data-msg="Invoice PDF downloaded">' + PP.icon('download') + 'Invoice PDF</button><button class="btn" data-go="/admin/customers/' + c.id + '">Customer profile</button>' }) +
    '<div class="grid g-main"><div class="stack">' + PP.card(null, { title: 'This period', flush: true, body: '<table class="tbl"><thead><tr><th>Item</th><th>Basis</th><th class="num">Amount</th></tr></thead><tbody>' + lines.map(function (l) { return '<tr><td class="name">' + l[0] + '</td><td class="muted">' + l[1] + '</td><td class="num">' + PP.money(l[2]) + '</td></tr>'; }).join('') + '<tr><td></td><td class="right strong">Subtotal</td><td class="num">' + PP.money(total) + '</td></tr><tr><td></td><td class="right muted">GST (10%)</td><td class="num">' + PP.money(total * 0.1) + '</td></tr><tr><td></td><td class="right strong" style="font-size:15px">Total</td><td class="num strong" style="font-size:15px">' + PP.money(total * 1.1) + '</td></tr></tbody></table>' }) +
    PP.card(null, { title: 'Monthly charges, last 12 months', body: PP.Charts.bars({ labels: PP.range(12).map(function (i) { return PP.MONTHS[(new Date().getMonth() - 11 + i + 12) % 12]; }), series: [{ values: hist, color: PP.C.blue }], height: 260, wide: true, yFmt: function (v) { return '$' + PP.short(v); } }) }) + '</div>' +
    '<div class="stack">' + PP.card(null, { title: 'Usage', body: '<dl class="kv"><dt>Tier</dt><dd>' + PP.tierChip(t) + '</dd><dt>Active sites</dt><dd>' + c.sites + '</dd><dt>Devices</dt><dd>' + d + '</dd><dt>Users</dt><dd>' + c.users + '</dd><dt>API calls</dt><dd>' + PP.fmt(d * 1820) + ' / month</dd></dl>' }) +
    PP.card(null, { title: 'Invoices', body: '<div class="list" style="margin:0 -18px">' + ['Sep 2026', 'Aug 2026', 'Jul 2026', 'Jun 2026'].map(function (m, i) { return '<div class="li"><div class="li-main"><div class="li-t">INV-' + (20931 - i) + '</div><div class="li-s">' + m + '</div></div><div class="li-r"><b style="color:var(--ink)">' + PP.money(hist[10 - i] * 1.1) + '</b><br>' + PP.status('online').replace('Online', 'Paid') + '</div></div>'; }).join('') + '</div>' }) + '</div></div>';
};
