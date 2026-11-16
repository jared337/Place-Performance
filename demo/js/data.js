/* =========================================================
   Place Performance prototype, spec registry + mock data.
   The FEATURES list mirrors the authoritative spec (level, roles,
   source, drill-down vs overlay). Everything else is sample data.
   ========================================================= */

/* ---------------- Maturity levels ---------------- */
PP.LEVELS = [
  { n: 1, name: 'Essentials', verb: 'Measure', tagline: "Know what's happening.", color: '#2b6cf2' },
  { n: 2, name: 'Insights', verb: 'Understand', tagline: "Know why it's happening.", color: '#8b3fe8' },
  { n: 3, name: 'Professional', verb: 'Optimise', tagline: 'Improve how your place performs.', color: '#0e8a80' },
  { n: 4, name: 'Executive', verb: 'Transform', tagline: 'Lead with intelligence.', color: '#cc2f76' }
];

/* ---------------- Roles ---------------- */
PP.ROLES = {
  admin: { key: 'admin', label: 'Platform Administrator', short: 'Platform Admin', who: 'Sam Rivera', email: 'sam.rivera@rayven.io', org: 'ITESA / Rayven', color: '#b0353b' },
  pm: { key: 'pm', label: 'Portfolio Manager & Administrator', short: 'Portfolio Manager', who: 'Priya Nair', email: 'priya.nair@meridianpg.com.au', org: 'Meridian Property Group', color: '#1f6f8b' },
  exec: { key: 'exec', label: 'Executive', short: 'Executive', who: 'David Chen', email: 'david.chen@meridianpg.com.au', org: 'Meridian Property Group', color: '#7a5b1e' }
};

/* ---------------- Feature registry (from the spec) ----------------
   id, name, screen, level, roles, source, type ('drill' | 'overlay' for opens), from (parent feature) */
(function () {
  var B = 'brief', R = 'recommendation', PE = ['pm', 'exec'], P = ['pm'], A = ['admin'];
  var list = [
    // 1 Login
    ['branded-login', 'Branded Login', 'login', 1, PE, R],
    // 2 Home
    ['overview', 'Configurable Overview', 'home', 1, PE, R],
    ['open-linked', 'Open Linked Screen', 'home', 1, PE, R, 'drill', 'overview'],
    ['quick-links', 'Quick Links', 'home', 1, P, R],
    // 3 Place Detail, shared metrics
    ['visitor-count', 'Visitor Count', 'place', 1, PE, B],
    ['historical-trends', 'Historical Trends', 'place', 2, PE, B, 'overlay', 'visitor-count'],
    ['occupancy', 'Occupancy Monitoring', 'place', 1, PE, B],
    ['peak', 'Peak Period Analysis', 'place', 1, PE, B],
    ['dwell', 'Dwell Time Analysis', 'place', 1, PE, B],
    ['repeat', 'Repeat Visitation', 'place', 2, PE, B],
    ['demographics', 'Demographics', 'place', 1, PE, B],
    ['commercial', 'Commercial Correlation', 'place', 3, PE, B],
    ['queue-ops', 'Queue & Operations', 'place', 3, PE, B],
    ['queue-detail', 'Queue Detail', 'place', 3, P, B, 'overlay', 'queue-ops'],
    ['ops-detail', 'Operational Performance Detail', 'place', 3, P, B, 'overlay', 'queue-ops'],
    ['score', 'Place Performance Score', 'place', 3, PE, B],
    ['device-health', 'Device Health Summary', 'place', 1, P, B],
    ['device-detail-ov', 'Device Detail', 'place', 1, P, R, 'overlay', 'device-health'],
    ['floorplan', 'Floorplan & Live Occupancy', 'place', 2, PE, B],
    // 3 Place Detail, level-specific
    ['site-breakdown', 'Zone Breakdown', 'place', 2, PE, B],
    ['zone-breakdown', 'Zone Breakdown', 'place', 2, PE, B],
    ['visitor-flow', 'Visitor Flow', 'place', 2, PE, B],
    ['heatmap', 'Heat Map', 'place', 2, PE, B],
    // 4 Portfolio
    ['ranking', 'Multi-Site Ranking', 'portfolio', 3, PE, B],
    ['site-drill', 'Site Drill-through', 'portfolio', 3, PE, R, 'drill', 'ranking'],
    ['outliers', 'Outlier Flags', 'portfolio', 3, PE, R],
    ['ppi', 'Portfolio Performance Index', 'portfolio', 4, PE, B],
    ['benchmarking', 'Benchmarking', 'portfolio', 4, PE, B, 'drill', 'ppi'],
    // 5 Executive Intelligence
    ['ai-feed', 'AI Insights Feed', 'intel', 4, PE, B],
    ['insight-detail', 'Insight Detail', 'intel', 4, PE, R, 'overlay', 'ai-feed'],
    ['forecast', 'Forecasting Summary', 'intel', 4, PE, B],
    ['forecast-detail', 'Forecast Detail', 'intel', 4, PE, B, 'overlay', 'forecast'],
    ['investment', 'Investment Analysis', 'intel', 4, PE, B, 'drill', 'forecast'],
    // 6 Scenario
    ['what-if', 'What-If Modelling', 'scenarios', 4, PE, B],
    ['scenario-compare', 'Scenario Comparison', 'scenarios', 4, PE, R, 'drill', 'what-if'],
    // 7 Reports
    ['reports-lib', 'Reports Library', 'reports', 1, PE, B],
    ['report-detail', 'Report Detail', 'reports', 1, PE, B, 'drill', 'reports-lib'],
    ['schedule-editor', 'Schedule Editor', 'reports', 1, P, B, 'overlay', 'reports-lib'],
    ['exec-pack', 'Executive Reporting Pack', 'reports', 4, PE, B],
    // 8 Alerts
    ['notif-feed', 'Notification Feed', 'alerts', 1, P, R],
    ['alert-detail', 'Alert Detail', 'alerts', 1, P, R, 'drill', 'notif-feed'],
    ['alert-rules', 'Alert Rules', 'alerts', 3, P, B],
    ['rule-editor', 'Rule Editor', 'alerts', 3, P, B, 'overlay', 'alert-rules'],
    // 9 Devices
    ['device-list', 'Device List', 'devices', 1, P, B],
    ['device-detail', 'Device Detail', 'devices', 1, P, B, 'drill', 'device-list'],
    ['device-map', 'Device Map View', 'devices', 1, P, R],
    ['remote-access', 'Remote Device Access', 'devices', 3, P, B],
    // 10 Integrations
    ['connected-systems', 'Connected Systems List', 'integrations', 3, P, B],
    ['integration-config', 'Integration Configuration', 'integrations', 3, P, R, 'overlay', 'connected-systems'],
    // 11 Org admin
    ['org-profile', 'Organisation Profile', 'org', 1, P, R],
    ['sites-editor', 'Sites & Zones Editor', 'org', 1, P, R, 'drill', 'org-profile'],
    ['user-mgmt', 'User Management', 'org', 1, P, R, 'drill', 'org-profile'],
    ['subscription', 'Subscription Tier View', 'org', 1, P, R],
    // 12 User profile
    ['personal', 'Personal Details', 'profile', 1, P, R],
    ['sso', 'Single Sign-On (SSO) Setup', 'profile', 3, P, B],
    // 13–18 Platform admin
    ['platform-health', 'Platform Health', 'admin-dash', 1, A, R],
    ['support-queue', 'Support Queue', 'admin-dash', 1, A, R],
    ['issue-detail', 'Issue Detail', 'admin-dash', 1, A, R, 'drill', 'support-queue'],
    ['customer-list', 'Customer List', 'customers', 1, A, R],
    ['customer-profile', 'Customer Profile', 'customers', 1, A, R, 'drill', 'customer-list'],
    ['onboarding', 'Onboarding Wizard', 'customers', 1, A, R, 'drill', 'customer-list'],
    ['fleet-summary', 'Fleet Summary Widgets', 'fleet', 1, A, B],
    ['global-devices', 'Global Device List', 'fleet', 1, A, R],
    ['device-detail-admin', 'Device Detail (Admin)', 'fleet', 1, A, R, 'drill', 'global-devices'],
    ['provisioning', 'Provisioning Flow', 'fleet', 1, A, R, 'drill', 'global-devices'],
    ['global-users', 'Global User List', 'users', 1, A, R],
    ['user-detail-admin', 'User Detail (Admin)', 'users', 1, A, R, 'drill', 'global-users'],
    ['audit-log', 'Admin Action Log', 'audit', 1, A, R],
    ['log-detail', 'Log Entry Detail', 'audit', 1, A, R, 'overlay', 'audit-log'],
    ['usage', 'Usage Summary', 'billing', 1, A, R],
    ['billing-detail', 'Customer Billing Detail', 'billing', 1, A, R, 'drill', 'usage']
  ];
  PP.FEATURES = {};
  list.forEach(function (f) {
    PP.FEATURES[f[0]] = { id: f[0], name: f[1], screen: f[2], level: f[3], roles: f[4], source: f[5], type: f[6] || null, from: f[7] || null };
  });
})();

/* ---------------- Interfaces (screens) ---------------- */
PP.SCREENS = [
  { id: 'login', num: 1, name: 'Login Screen', section: 'customer', route: '/login', icon: 'lock', features: ['branded-login'], nav: false },
  { id: 'home', num: 2, name: 'Home Dashboard', section: 'customer', route: '/home', icon: 'home', features: ['overview', 'quick-links'] },
  { id: 'place', num: 3, name: 'Place Detail', section: 'customer', route: '/place', icon: 'building', features: ['visitor-count', 'occupancy', 'peak', 'dwell', 'demographics', 'device-health', 'floorplan'] },
  { id: 'portfolio', num: 4, name: 'Portfolio Overview', section: 'customer', route: '/portfolio', icon: 'globe', features: ['ranking', 'outliers', 'ppi'], multi: true },
  { id: 'intel', num: 5, name: 'Executive Intelligence', section: 'customer', route: '/intelligence', icon: 'sparkle', features: ['ai-feed', 'forecast'] },
  { id: 'scenarios', num: 6, name: 'Scenario Modelling', section: 'customer', route: '/scenarios', icon: 'sliders', features: ['what-if'] },
  { id: 'reports', num: 7, name: 'Reports', section: 'customer', route: '/reports', icon: 'file', features: ['reports-lib', 'exec-pack'] },
  { id: 'alerts', num: 8, name: 'Alerts', section: 'customer', route: '/alerts', icon: 'bell', features: ['notif-feed', 'alert-rules'] },
  { id: 'devices', num: 9, name: 'Devices', section: 'customer', route: '/devices', icon: 'cpu', features: ['device-list', 'device-map', 'remote-access'] },
  { id: 'integrations', num: 10, name: 'Data Integrations', section: 'customer', route: '/integrations', icon: 'plug', features: ['connected-systems'] },
  { id: 'org', num: 11, name: 'Organisation Administration', section: 'customer', route: '/org', icon: 'settings', features: ['org-profile', 'subscription'] },
  { id: 'profile', num: 12, name: 'User Profile', section: 'customer', route: '/profile', icon: 'user', features: ['personal', 'sso'] },
  { id: 'admin-dash', num: 13, name: 'Platform Dashboard', section: 'admin', route: '/admin', icon: 'dash', features: ['platform-health', 'support-queue'] },
  { id: 'customers', num: 14, name: 'Customer Management', section: 'admin', route: '/admin/customers', icon: 'users', features: ['customer-list'] },
  { id: 'fleet', num: 15, name: 'Global Device Fleet', section: 'admin', route: '/admin/fleet', icon: 'server', features: ['fleet-summary', 'global-devices'] },
  { id: 'users', num: 16, name: 'Global User Directory', section: 'admin', route: '/admin/users', icon: 'people', features: ['global-users'] },
  { id: 'audit', num: 17, name: 'Audit Log', section: 'admin', route: '/admin/audit', icon: 'list', features: ['audit-log'] },
  { id: 'billing', num: 18, name: 'Usage + Billing View', section: 'admin', route: '/admin/billing', icon: 'card', features: ['usage'] }
];
PP.screen = function (id) { return PP.SCREENS.find(function (s) { return s.id === id; }); };

/* ---------------- The demo customer ---------------- */
PP.CUSTOMER = { id: 'meridian', name: 'Meridian Property Group', short: 'Meridian', initials: 'MP', brand: '#18181b', timezone: 'Australia/Melbourne (AEDT)' };

/* ---------------- Floorplan templates (1000 x 620 plan units) ----------------
   Zones are polygons "drawn" over the uploaded plan. {n} is replaced with the floor number. */
PP.LAYOUTS = {
  office: {
    label: 'Office floor', perPerson: 1100, dwell: 96, turnover: 2.6,
    structure: [
      { name: 'Lifts', poly: [[420, 290], [560, 290], [560, 420], [420, 420]] },
      { name: 'Stairs', poly: [[880, 225], [960, 225], [960, 270], [880, 270]] }
    ],
    zones: [
      { key: 'reception', name: 'Reception', type: 'Entrance', poly: [[40, 40], [260, 40], [260, 210], [40, 210]], queue: 'Reception desk' },
      { key: 'board', name: 'Boardroom', type: 'Meeting room', poly: [[280, 40], [480, 40], [480, 210], [280, 210]] },
      { key: 'm1', name: 'Meeting {n}.1', type: 'Meeting room', poly: [[500, 40], [640, 40], [640, 210], [500, 210]] },
      { key: 'm2', name: 'Meeting {n}.2', type: 'Meeting room', poly: [[660, 40], [800, 40], [800, 210], [660, 210]] },
      { key: 'pods', name: 'Focus Pods', type: 'Quiet zone', poly: [[820, 40], [960, 40], [960, 210], [820, 210]] },
      { key: 'ow', name: 'Workspace West', type: 'Workspace', poly: [[40, 290], [390, 290], [390, 430], [300, 430], [300, 580], [40, 580]], label: [170, 435] },
      { key: 'kitchen', name: 'Kitchen & Breakout', type: 'Amenity', poly: [[320, 450], [580, 450], [580, 580], [320, 580]], queue: 'Coffee bar' },
      { key: 'oe', name: 'Workspace East', type: 'Workspace', poly: [[600, 290], [960, 290], [960, 580], [600, 580]] }
    ],
    doors: [{ x: 490, y: 250, label: 'Lift lobby' }, { x: 920, y: 250, label: 'Stairs' }]
  },
  library: {
    label: 'Library floor', perPerson: 800, dwell: 72, turnover: 3.8,
    structure: [
      { name: 'Stairs', poly: [[40, 360], [130, 360], [130, 400], [40, 400]] },
      { name: 'Lifts', poly: [[700, 270], [770, 270], [770, 310], [700, 310]] }
    ],
    zones: [
      { key: 'reading', name: 'Reading Room', type: 'Reading', poly: [[40, 40], [480, 40], [480, 250], [300, 250], [300, 340], [40, 340]], label: [210, 170] },
      { key: 'children', name: "Children's Area", type: 'Activity', poly: [[500, 40], [760, 40], [760, 250], [500, 250]] },
      { key: 'study', name: 'Study Rooms', type: 'Study', poly: [[780, 40], [960, 40], [960, 250], [780, 250]] },
      { key: 'stacks', name: 'Collections', type: 'Stacks', poly: [[320, 270], [680, 270], [680, 440], [320, 440]] },
      { key: 'maker', name: 'Makerspace', type: 'Activity', poly: [[700, 330], [960, 330], [960, 580], [700, 580]] },
      { key: 'entry', name: 'Entrance & Returns', type: 'Entrance', poly: [[40, 420], [300, 420], [300, 580], [40, 580]], queue: 'Returns & help desk' },
      { key: 'cafe', name: 'Café', type: 'Amenity', poly: [[320, 460], [520, 460], [520, 580], [320, 580]], queue: 'Café counter' },
      { key: 'hub', name: 'Computer Hub', type: 'Study', poly: [[540, 460], [680, 460], [680, 580], [540, 580]] }
    ],
    doors: [{ x: 170, y: 600, label: 'Main entry' }, { x: 735, y: 290, label: 'Lifts' }]
  },
  retail: {
    label: 'Retail level', perPerson: 420, dwell: 41, turnover: 7.5,
    structure: [
      { name: 'Escalators', poly: [[430, 300], [570, 300], [570, 340], [430, 340]] }
    ],
    zones: [
      { key: 'food', name: 'Food Court', type: 'Dining', poly: [[40, 40], [380, 40], [380, 230], [40, 230]], queue: 'Food court counters' },
      { key: 'fashion', name: 'Fashion Wing', type: 'Retail', poly: [[400, 40], [600, 40], [600, 230], [400, 230]] },
      { key: 'anchor', name: 'Anchor Store', type: 'Retail', poly: [[620, 40], [960, 40], [960, 230], [620, 230]] },
      { key: 'health', name: 'Health & Beauty', type: 'Retail', poly: [[40, 250], [280, 250], [280, 480], [40, 480]] },
      { key: 'concourse', name: 'Central Concourse', type: 'Circulation', poly: [[300, 250], [700, 250], [700, 480], [300, 480]], label: [500, 410] },
      { key: 'services', name: 'Customer Services', type: 'Services', poly: [[720, 250], [960, 250], [960, 480], [720, 480]], queue: 'Service desk' },
      { key: 'kiosk', name: 'Kiosk Lane', type: 'Retail', poly: [[40, 500], [400, 500], [400, 600], [40, 600]] },
      { key: 'entry', name: 'Main Entrance', type: 'Entrance', poly: [[420, 500], [580, 500], [580, 600], [420, 600]] },
      { key: 'park', name: 'Car Park Link', type: 'Entrance', poly: [[600, 500], [960, 500], [960, 600], [600, 600]] }
    ],
    doors: [{ x: 500, y: 612, label: 'Street entry' }, { x: 780, y: 612, label: 'Car park' }]
  }
};

/* ---------------- Sites → Spaces → Zones ---------------- */
PP.SITE_DEFS = [
  { id: 'civic', name: 'Civic Tower', city: 'Melbourne VIC', lat: -37.8150, lng: 144.9665, type: 'Commercial office', layout: 'office', floors: ['Ground Floor', 'Level 3', 'Level 7', 'Level 12'], busy: 1.0 },
  { id: 'harbour', name: 'Harbourside Library', city: 'Sydney NSW', lat: -33.8675, lng: 151.2070, type: 'Public library', layout: 'library', floors: ['Ground Floor', 'Level 1', 'Level 2'], busy: 1.15 },
  { id: 'westgate', name: 'Westgate Shopping Centre', city: 'Perth WA', lat: -31.9505, lng: 115.8605, type: 'Retail centre', layout: 'retail', floors: ['Lower Mall', 'Upper Mall'], busy: 0.82 },
  { id: 'riverside', name: 'Riverside Market Hall', city: 'Brisbane QLD', lat: -27.4705, lng: 153.0260, type: 'Market & dining', layout: 'retail', floors: ['Market Floor', 'Mezzanine'], busy: 1.22 },
  { id: 'rundle', name: 'Rundle Learning Hub', city: 'Adelaide SA', lat: -34.9220, lng: 138.6050, type: 'Learning centre', layout: 'library', floors: ['Ground Floor', 'Level 1'], busy: 0.64 },
  { id: 'capital', name: 'Capital Civic Centre', city: 'Canberra ACT', lat: -35.2820, lng: 149.1290, type: 'Civic offices', layout: 'office', floors: ['Ground Floor', 'Level 2'], busy: 0.9 }
];

/* Zones that are deliberately busy so the demo has real issues to find. */
PP.HOTSPOTS = {
  'harbour-s0-children': 0.97,   // over capacity, see AI insight i2
  'westgate-s0-services': 0.86,  // service queue surge, see AI insight i5
  'riverside-s0-food': 0.84,     // Saturday trading demand, see AI insight i1
  'civic-s2-kitchen': 0.74       // busy but OK
};

PP.ALL_SITES = PP.SITE_DEFS.map(function (def) {
  var layout = PP.LAYOUTS[def.layout];
  var site = Object.assign({}, def, { kind: 'site', spaces: [] });
  def.floors.forEach(function (floorName, si) {
    var floorNo = /Level (\d+)/.test(floorName) ? floorName.match(/Level (\d+)/)[1] : (floorName.indexOf('Ground') === 0 ? 'G' : String(si + 1));
    var space = { kind: 'space', id: def.id + '-s' + si, name: floorName, siteId: def.id, layout: def.layout, floorNo: floorNo, zones: [] };
    layout.zones.forEach(function (z) {
      var id = space.id + '-' + z.key;
      var r = PP.rng(id);
      var cap = Math.max(8, Math.round(PP.polyArea(z.poly) / layout.perPerson / 5) * 5);
      // most zones sit comfortably below 70%; a few known hotspots (matching the AI insights) run hot
      var load = PP.clamp(PP.between(r, 0.14, 0.6) * def.busy, 0.05, 0.68);
      var hotspot = PP.HOTSPOTS[space.id + '-' + z.key];
      if (hotspot) load = hotspot;
      space.zones.push({
        kind: 'zone', id: id, key: z.key, siteId: def.id, spaceId: space.id,
        name: z.name.replace('{n}', floorNo), type: z.type, poly: z.poly, label: z.label || null, queue: z.queue || null,
        capacity: cap, occ: Math.round(cap * load), base: load
      });
    });
    site.spaces.push(space);
  });
  return site;
});

PP.state = PP.state || { level: 3, role: 'pm', multi: true, showLocked: true, annot: false, period: 'today', pvOpen: false };
PP.sites = function () { return PP.state.multi ? PP.ALL_SITES : PP.ALL_SITES.slice(0, 1); };
PP.site = function (id) { return PP.ALL_SITES.find(function (s) { return s.id === id; }); };

/* Resolve any site / space / zone id to a uniform "place". */
PP.place = function (id) {
  for (var i = 0; i < PP.ALL_SITES.length; i++) {
    var s = PP.ALL_SITES[i];
    if (s.id === id) return { kind: 'site', id: s.id, name: s.name, site: s, zones: PP.flatZones(s), layout: s.layout };
    for (var j = 0; j < s.spaces.length; j++) {
      var sp = s.spaces[j];
      if (sp.id === id) return { kind: 'space', id: sp.id, name: sp.name, site: s, space: sp, zones: sp.zones, layout: s.layout };
      for (var k = 0; k < sp.zones.length; k++) {
        var z = sp.zones[k];
        if (z.id === id) return { kind: 'zone', id: z.id, name: z.name, site: s, space: sp, zone: z, zones: [z], layout: s.layout };
      }
    }
  }
  return null;
};
PP.flatZones = function (site) { return site.spaces.reduce(function (a, sp) { return a.concat(sp.zones); }, []); };

/* ---------------- Metrics ---------------- */
function bell(x, m, s) { return Math.exp(-((x - m) * (x - m)) / (2 * s * s)); }
PP.SHAPES = {
  office: function (h) { return (h >= 7 && h <= 19 ? 0.15 : 0.01) + bell(h, 9.5, 1.2) * 0.9 + bell(h, 13.2, 1.3) * 0.75 + bell(h, 17.2, 1.1) * 0.45; },
  library: function (h) { return (h >= 9 && h <= 20 ? 0.18 : 0.005) + bell(h, 11, 1.8) * 0.6 + bell(h, 15.5, 2) * 0.85 + bell(h, 18.5, 1) * 0.3; },
  retail: function (h) { return (h >= 9 && h <= 21 ? 0.2 : 0.01) + bell(h, 12.6, 1.4) * 1.0 + bell(h, 17.8, 1.6) * 0.75; }
};
PP.DOW = {
  office: [0.18, 1, 1.06, 1.1, 1.02, 0.82, 0.22],
  library: [0.72, 0.92, 1, 1.02, 1.04, 0.96, 1.12],
  retail: [0.96, 0.74, 0.8, 0.86, 1.02, 1.18, 1.34]
};
PP.factor = function (place) {
  return place.kind === 'site' ? 0.42 : place.kind === 'space' ? 0.58 : 1;
};

PP.stats = function (place) {
  var lay = PP.LAYOUTS[place.layout];
  var zones = place.zones;
  var cap = PP.sum(zones.map(function (z) { return z.capacity; }));
  var occ = PP.sum(zones.map(function (z) { return z.occ; }));
  var r = PP.rng('stats-' + place.id);
  var visitors = Math.round(PP.sum(zones.map(function (z) { return z.capacity * lay.turnover * (0.6 + z.base); })) * PP.factor(place) * PP.dayProgress());
  var dwell = lay.dwell * PP.between(r, 0.78, 1.2) * (place.kind === 'zone' ? 0.55 : place.kind === 'space' ? 0.8 : 1);
  var score = Math.round(PP.between(r, 58, 92));
  return {
    cap: cap, occ: occ, occPct: cap ? occ / cap : 0,
    visitors: visitors,
    entries: visitors, exits: Math.max(0, visitors - occ),
    peakPct: PP.clamp((occ / cap) * PP.between(r, 1.1, 1.45), 0.3, 1.08),
    dwell: dwell,
    repeat: PP.between(r, 34, 68),
    score: score, scoreDelta: Math.round(PP.between(r, -6, 8)),
    visitorsDelta: PP.between(r, -9, 14),
    conversion: PP.between(r, 14, 38), salesPerVisitor: PP.between(r, 9, 34),
    wait: PP.between(r, 1.5, 9), queueLen: Math.round(PP.between(r, 1, 14))
  };
};

/* Fraction of a typical day's visitors that have arrived by now. */
PP.dayProgress = function () {
  var h = new Date().getHours() + new Date().getMinutes() / 60;
  var tot = 0, sofar = 0;
  for (var i = 0; i < 24; i++) { var w = PP.SHAPES.office(i + 0.5); tot += w; if (i + 0.5 <= h) sofar += w; }
  return PP.clamp(sofar / tot, 0.08, 1);
};

PP.series = {
  /* hourly entries / exits / occupancy for one day (today unless dayOffset) */
  hourly: function (place, dayOffset) {
    dayOffset = dayOffset || 0;
    var lay = PP.LAYOUTS[place.layout], shape = PP.SHAPES[place.layout];
    var r = PP.rng('h-' + place.id + '-' + dayOffset);
    var st = PP.stats(place);
    var dow = new Date(Date.now() - dayOffset * 864e5).getDay();
    var dayTotal = PP.sum(place.zones.map(function (z) { return z.capacity * lay.turnover * (0.6 + z.base); })) * PP.factor(place) * PP.DOW[place.layout][dow];
    var weights = PP.range(24).map(function (h) { return shape(h + 0.5); });
    var wsum = PP.sum(weights);
    var nowH = new Date().getHours();
    var entries = [], exits = [], occ = [], inside = 0;
    for (var h = 0; h < 24; h++) {
      var e = dayTotal * weights[h] / wsum * PP.between(r, 0.85, 1.15);
      var x = h > 0 ? entries[h - 1] * PP.between(r, 0.75, 1.05) : 0;
      if (dayOffset === 0 && h > nowH) { entries.push(null); exits.push(null); occ.push(null); continue; }
      inside = Math.max(0, inside + e - x);
      inside = Math.min(inside, st.cap * 1.05);
      entries.push(Math.round(e)); exits.push(Math.round(x)); occ.push(Math.round(inside));
    }
    return { labels: PP.range(24).map(PP.hourLabel), entries: entries, exits: exits, occ: occ };
  },
  daily: function (place, n, salt) {
    var lay = PP.LAYOUTS[place.layout];
    var r = PP.rng('d-' + place.id + (salt || ''));
    var base = PP.sum(place.zones.map(function (z) { return z.capacity * lay.turnover * (0.6 + z.base); })) * PP.factor(place);
    return PP.daysBack(n).map(function (d, i) {
      var season = 1 + 0.12 * Math.sin((d.getMonth() + d.getDate() / 30) / 12 * Math.PI * 2 + (place.layout === 'retail' ? 2.6 : 0.4));
      var trend = 1 + (i - n) * 0.0006;
      return Math.round(base * PP.DOW[place.layout][d.getDay()] * season * trend * PP.between(r, 0.88, 1.12));
    });
  },
  /* Occupancy as % of capacity over a range: 'today' (hourly), '7d' (hourly across the week),
     '30d' (daily peak + average) or '12m' (monthly peak + average). */
  occHistory: function (place, range) {
    var st = PP.stats(place), shape = PP.SHAPES[place.layout], dow = PP.DOW[place.layout];
    var maxShape = Math.max.apply(null, PP.range(24).map(function (h) { return shape(h + 0.5); }));
    var typical = PP.clamp(st.peakPct * 100, 25, 95);
    var r = PP.rng('oh-' + place.id + '-' + range);
    var dayPeak = function (d) {
      var season = 1 + 0.16 * Math.sin((d.getMonth() + d.getDate() / 30) / 12 * Math.PI * 2 + (place.layout === 'retail' ? 2.6 : 0.4));
      return Math.min(125, typical * dow[d.getDay()] * season * PP.between(r, 0.88, 1.1));
    };
    if (range === 'today') {
      var h = PP.series.hourly(place), y = PP.series.hourly(place, 7);
      var pct = function (v) { return v == null ? null : v / st.cap * 100; };
      return { labels: h.labels, now: h.occ.map(pct), lastWeek: y.occ.map(pct) };
    }
    if (range === '7d') {
      var labels = [], vals = [], nowH = new Date().getHours();
      PP.daysBack(7).forEach(function (d, di) {
        var peak = dayPeak(d), isToday = di === 6;
        for (var hh = 0; hh < 24; hh++) {
          labels.push(PP.DAYS[d.getDay()] + ' ' + d.getDate() + (hh ? ' · ' + PP.hourLabel(hh) : ''));
          vals.push(isToday && hh > nowH ? null : peak * shape(hh + 0.5) / maxShape * PP.between(r, 0.92, 1.06));
        }
      });
      return { labels: labels, now: vals };
    }
    if (range === '30d') {
      var days = PP.daysBack(30);
      var peaks = days.map(dayPeak);
      return { labels: days.map(PP.dateLabel), peak: peaks, avg: peaks.map(function (p) { return p * PP.between(r, 0.38, 0.48); }) };
    }
    // 12 months: sample every day of each month, keep the month's highest peak and mean daily average
    var months = [], mPeak = [], mAvg = [], now = new Date();
    for (var m = 11; m >= 0; m--) {
      var first = new Date(now.getFullYear(), now.getMonth() - m, 1);
      var dps = PP.range(28).map(function (i) { return dayPeak(new Date(first.getFullYear(), first.getMonth(), i + 1)); });
      months.push(PP.MONTHS[first.getMonth()] + (first.getMonth() === 0 || m === 11 ? ' ' + String(first.getFullYear()).slice(2) : ''));
      var sorted = dps.slice().sort(function (a, b) { return a - b; });
      mPeak.push(sorted[Math.floor(sorted.length * 0.9)]); // a typical busy day, not the single worst
      mAvg.push(PP.avg(dps) * 0.43);
    }
    return { labels: months, peak: mPeak, avg: mAvg };
  },
  heat: function (place) {
    var r = PP.rng('heat-' + place.id), shape = PP.SHAPES[place.layout], dow = PP.DOW[place.layout];
    return PP.range(7).map(function (d) {
      var di = (d + 1) % 7; // Mon..Sun
      return PP.range(24).map(function (h) { return shape(h + 0.5) * dow[di] * PP.between(r, 0.85, 1.15); });
    });
  },
  dwell: function (place) {
    var st = PP.stats(place), r = PP.rng('dw-' + place.id);
    var buckets = ['<5m', '5–15m', '15–30m', '30–60m', '1–2h', '2–4h', '4h+'];
    var mids = [3, 10, 22, 45, 90, 180, 300];
    var vals = mids.map(function (m) {
      var x = Math.log(m) - Math.log(st.dwell);
      return Math.round(1000 * Math.exp(-x * x / 1.1) * PP.between(r, 0.85, 1.15));
    });
    return { labels: buckets, values: vals, avg: st.dwell, median: st.dwell * 0.82 };
  },
  demographics: function (place) {
    var r = PP.rng('demo-' + place.id);
    var ages = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55–64', '65+'];
    var base = place.layout === 'office' ? [1, 8, 31, 28, 18, 11, 3] : place.layout === 'library' ? [17, 16, 18, 15, 12, 11, 11] : [9, 18, 22, 19, 14, 10, 8];
    var vals = base.map(function (v) { return v * PP.between(r, 0.8, 1.2); });
    var t = PP.sum(vals);
    var female = PP.between(r, 44, 58);
    return { ages: ages, ageVals: vals.map(function (v) { return v / t * 100; }), female: female, male: 100 - female - 2, other: 2 };
  },
  repeat: function (place) {
    var st = PP.stats(place), r = PP.rng('rep-' + place.id);
    var freq = [PP.between(r, 30, 42), PP.between(r, 18, 26), PP.between(r, 12, 18), PP.between(r, 8, 14)];
    var t = PP.sum(freq);
    return { returning: st.repeat, fresh: 100 - st.repeat, freq: freq.map(function (v) { return v / t * 100; }), freqLabels: ['Weekly+', '2–3× a month', 'Monthly', 'Less often'] };
  }
};

/* Live occupancy ticker, nudges every zone, screens re-read the values. */
PP.tickOccupancy = function () {
  PP.ALL_SITES.forEach(function (s) {
    PP.flatZones(s).forEach(function (z) {
      var drift = (z.base * z.capacity - z.occ) * 0.08;
      var step = (Math.random() - 0.5) * Math.max(2, z.capacity * 0.05) + drift;
      z.occ = Math.round(PP.clamp(z.occ + step, 0, z.capacity * 1.08));
    });
  });
};

/* ---------------- Devices ---------------- */
PP.DEVICE_TYPES = {
  counter: { label: '3D people counter', model: 'PC-3D Pro' },
  thermal: { label: 'Thermal occupancy sensor', model: 'Thermal area sensor' },
  queue: { label: 'Queue analytics sensor', model: 'PC-3D Queue' },
  wifi: { label: 'Wi-Fi presence sensor', model: 'Wi-Fi presence sensor' },
  demo: { label: 'Demographics sensor (anonymised)', model: 'AI vision sensor' }
};
PP.DEVICES = (function () {
  var out = [];
  PP.ALL_SITES.forEach(function (s, si) {
    s.spaces.forEach(function (sp, spi) {
      sp.zones.forEach(function (z, zi) {
        var r = PP.rng('dev-' + z.id);
        var c = PP.polyCenter(z.poly), b = PP.polyBox(z.poly);
        var types = ['counter'];
        if (z.type === 'Entrance') types.push('demo');
        if (z.queue) types.push('queue');
        if (r() > 0.6) types.push('thermal');
        types.forEach(function (t, ti) {
          var roll = r();
          var status = roll > 0.95 ? 'offline' : roll > 0.87 ? 'warning' : 'online';
          var pos = ti === 0 ? [b.x + 22, b.y + 22] : [PP.clamp(c[0] + (r() - 0.5) * (b.x2 - b.x) * 0.6, b.x + 15, b.x2 - 15), PP.clamp(c[1] + (r() - 0.5) * (b.y2 - b.y) * 0.6, b.y + 15, b.y2 - 15)];
          out.push({
            id: s.id.slice(0, 3).toUpperCase() + '-' + (spi + 1) + String(zi + 1).padStart(2, '0') + '-' + t.slice(0, 1).toUpperCase() + (ti + 1),
            type: t, typeLabel: PP.DEVICE_TYPES[t].label, model: PP.DEVICE_TYPES[t].model,
            siteId: s.id, spaceId: sp.id, zoneId: z.id, x: pos[0], y: pos[1],
            status: status,
            lastSeen: status === 'offline' ? Math.round(PP.between(r, 90, 2900)) : status === 'warning' ? Math.round(PP.between(r, 8, 40)) : Math.round(PP.between(r, 0, 3)),
            uptime: status === 'offline' ? PP.between(r, 82, 93) : status === 'warning' ? PP.between(r, 93, 98) : PP.between(r, 99, 100),
            firmware: PP.pick(r, ['4.2.1', '4.2.1', '4.3.0', '4.1.7']),
            ip: '10.' + (si + 10) + '.' + (spi + 1) + '.' + (20 + zi * 3 + ti),
            serial: 'SN' + Math.floor(PP.between(r, 100000, 999999)),
            installed: PP.pick(r, ['Mar 2025', 'May 2025', 'Aug 2025', 'Jan 2026']),
            issue: status === 'offline' ? PP.pick(r, ['No heartbeat, check PoE switch', 'Power loss detected']) : status === 'warning' ? PP.pick(r, ['Lens obstruction suspected', 'Count accuracy drift > 5%', 'High packet loss']) : null
          });
        });
      });
    });
  });
  return out;
})();
PP.devicesFor = function (place) {
  var ids = place.zones.map(function (z) { return z.id; });
  return PP.DEVICES.filter(function (d) { return ids.indexOf(d.zoneId) >= 0; });
};
PP.device = function (id) { return PP.DEVICES.find(function (d) { return d.id === id; }); };
PP.visibleDevices = function () {
  var ids = PP.sites().map(function (s) { return s.id; });
  return PP.DEVICES.filter(function (d) { return ids.indexOf(d.siteId) >= 0; });
};

/* ---------------- Alerts ---------------- */
PP.ALERTS = (function () {
  var r = PP.rng('alerts');
  var mk = [];
  var templates = [
    { kind: 'occupancy', sev: 'high', title: 'Occupancy above 90% capacity', text: 'Live occupancy reached {p}% of capacity for more than 10 minutes.', rule: 'Over-capacity warning' },
    { kind: 'device', sev: 'high', title: 'Sensor offline', text: 'No heartbeat received from {d} for over 60 minutes.', rule: 'Device offline' },
    { kind: 'queue', sev: 'medium', title: 'Queue wait above 8 minutes', text: 'Average wait at {q} exceeded the 8-minute service target.', rule: 'Queue service level' },
    { kind: 'device', sev: 'medium', title: 'Count accuracy drift', text: 'Entries vs exits imbalance of 6.2% on {d} suggests a lens obstruction.', rule: 'Data quality check' },
    { kind: 'system', sev: 'low', title: 'Weekly report delivered', text: 'Weekly Visitation Summary was emailed to 6 recipients.', rule: null },
    { kind: 'integration', sev: 'medium', title: 'POS sync delayed', text: 'Lightspeed POS has not synced for 2 hours. Commercial correlation may be incomplete.', rule: 'Integration health' },
    { kind: 'occupancy', sev: 'low', title: 'Unusually quiet period', text: 'Visitation 38% below the expected level for this time of day.', rule: 'Anomaly detection' }
  ];
  for (var i = 0; i < 18; i++) {
    var t = templates[i % templates.length];
    var s = PP.ALL_SITES[Math.floor(r() * PP.ALL_SITES.length)];
    var zs = PP.flatZones(s);
    var z = zs[Math.floor(r() * zs.length)];
    var qz = zs.filter(function (q) { return q.queue; });
    var qzone = qz[Math.floor(r() * qz.length)] || z;
    var dev = PP.DEVICES.filter(function (d) { return d.zoneId === z.id; })[0];
    var zone = t.kind === 'queue' ? qzone : z;
    mk.push({
      id: 'AL-' + (4120 - i), kind: t.kind, sev: t.sev, title: t.title, rule: t.rule,
      text: t.text.replace('{p}', Math.round(PP.between(r, 91, 104))).replace('{d}', dev ? dev.id : 'sensor').replace('{q}', zone.queue || zone.name),
      siteId: s.id, zoneId: zone.id, deviceId: dev ? dev.id : null,
      mins: Math.round(i * i * 9 + PP.between(r, 2, 30)),
      status: i < 4 ? 'open' : i < 7 ? 'acknowledged' : 'resolved'
    });
  }
  return mk;
})();
PP.visibleAlerts = function () {
  var ids = PP.sites().map(function (s) { return s.id; });
  return PP.ALERTS.filter(function (a) { return ids.indexOf(a.siteId) >= 0; });
};

PP.RULES = [
  { id: 'r1', name: 'Over-capacity warning', metric: 'Occupancy % of capacity', op: '>', value: 90, duration: '10 min', scope: 'All zones', sev: 'high', recipients: ['Priya Nair', 'Facilities team'], escalate: 'Escalate to Operations Manager after 20 min', on: true },
  { id: 'r2', name: 'Device offline', metric: 'Device heartbeat', op: 'missing for', value: 60, duration: '60 min', scope: 'All devices', sev: 'high', recipients: ['Priya Nair', 'ITESA Support'], escalate: 'Auto-raise ITESA support ticket', on: true },
  { id: 'r3', name: 'Queue service level', metric: 'Average queue wait (min)', op: '>', value: 8, duration: '5 min', scope: 'Monitored queue points', sev: 'medium', recipients: ['Site managers'], escalate: 'None', on: true },
  { id: 'r4', name: 'Data quality check', metric: 'Entry/exit imbalance %', op: '>', value: 5, duration: '1 day', scope: 'All devices', sev: 'medium', recipients: ['Priya Nair'], escalate: 'None', on: true },
  { id: 'r5', name: 'Anomaly detection', metric: 'Visitors vs expected %', op: '<', value: -30, duration: '1 hour', scope: 'All sites', sev: 'low', recipients: ['Site managers'], escalate: 'None', on: false },
  { id: 'r6', name: 'Integration health', metric: 'Integration last sync (h)', op: '>', value: 2, duration: '—', scope: 'All integrations', sev: 'medium', recipients: ['Priya Nair'], escalate: 'None', on: true }
];

/* ---------------- Reports ---------------- */
PP.REPORTS = [
  { id: 'weekly', name: 'Weekly Visitation Summary', level: 1, cadence: 'Weekly · Mon 7:00am', last: 'Mon 12 Oct', recipients: 6, scope: 'All sites', fmt: 'PDF', desc: 'Visitors, entries/exits, peak periods and dwell for the past 7 days, with week-on-week change.' },
  { id: 'occupancy', name: 'Monthly Occupancy & Capacity', level: 1, cadence: 'Monthly · 1st 8:00am', last: '1 Oct', recipients: 4, scope: 'All sites', fmt: 'PDF', desc: 'Average and peak occupancy against capacity by site and space; zones regularly over 85%.' },
  { id: 'devices', name: 'Device Health Report', level: 1, cadence: 'Weekly · Fri 5:00pm', last: 'Fri 9 Oct', recipients: 2, scope: 'All devices', fmt: 'CSV + PDF', desc: 'Uptime, offline incidents and data-quality flags for every sensor.' },
  { id: 'peaks', name: 'Peak Periods & Staffing', level: 1, cadence: 'On demand', last: '28 Sep', recipients: 0, scope: 'Civic Tower', fmt: 'PDF', desc: 'Busiest and quietest hours by day of week to guide rosters and cleaning.' },
  { id: 'behaviour', name: 'Zone Performance & Visitor Flow', level: 2, cadence: 'Monthly · 1st 8:00am', last: '1 Oct', recipients: 5, scope: 'All sites', fmt: 'PDF', desc: 'Zone rankings, movement paths, repeat visitation and heat-map snapshots.' },
  { id: 'utilisation', name: 'Space Utilisation & Queues', level: 3, cadence: 'Fortnightly', last: '5 Oct', recipients: 3, scope: 'All sites', fmt: 'PDF', desc: 'Utilisation vs capacity, queue service levels and commercial conversion.' },
  { id: 'portfolio', name: 'Quarterly Portfolio Review', level: 3, cadence: 'Quarterly', last: '1 Oct', recipients: 8, scope: 'Portfolio', fmt: 'PDF', desc: 'Multi-site ranking, outliers and site-by-site performance scores.' },
  { id: 'board', name: 'Board Pack, Q3 FY26', level: 4, cadence: 'Quarterly', last: '3 Oct', recipients: 9, scope: 'Portfolio', fmt: 'Slides', desc: 'Presentation-ready executive pack: index, forecasts, AI insights and investment outcomes.', pack: true }
];

/* ---------------- Integrations ---------------- */
PP.INTEGRATIONS = [
  { id: 'pos', name: 'Lightspeed POS', cat: 'Point of sale', icon: 'cart', status: 'synced', last: 4, sites: ['westgate', 'riverside', 'harbour'], records: '18,420 transactions / day' },
  { id: 'wifi', name: 'Cisco Meraki Wi-Fi', cat: 'Wi-Fi analytics', icon: 'wifi', status: 'synced', last: 2, sites: ['civic', 'harbour', 'rundle', 'capital'], records: '41,900 presence events / day' },
  { id: 'bms', name: 'Schneider EcoStruxure BMS', cat: 'Building management', icon: 'thermo', status: 'delayed', last: 134, sites: ['civic', 'capital'], records: 'HVAC & lighting zones' },
  { id: 'gis', name: 'Esri ArcGIS', cat: 'GIS', icon: 'map', status: 'synced', last: 60, sites: ['all'], records: 'Site boundaries & floor layers' },
  { id: 'parking', name: 'Wilson Parking', cat: 'Parking', icon: 'car', status: 'requested', last: null, sites: ['westgate'], records: '—' },
  { id: 'ticket', name: 'Ticketek', cat: 'Ticketing', icon: 'ticket', status: 'error', last: 1440, sites: ['riverside'], records: 'Event attendance' }
];

/* ---------------- Org users ---------------- */
PP.ORG_USERS = [
  { name: 'Priya Nair', email: 'priya.nair@meridianpg.com.au', role: 'pm', sites: ['all'], last: '2 min ago', status: 'Active' },
  { name: 'David Chen', email: 'david.chen@meridianpg.com.au', role: 'exec', sites: ['all'], last: 'Yesterday', status: 'Active' },
  { name: 'Hannah Lewis', email: 'hannah.lewis@meridianpg.com.au', role: 'exec', sites: ['all'], last: '3 days ago', status: 'Active' },
  { name: 'Tom Okafor', email: 'tom.okafor@meridianpg.com.au', role: 'pm', sites: ['civic', 'capital'], last: '1 h ago', status: 'Active' },
  { name: 'Mei Tanaka', email: 'mei.tanaka@meridianpg.com.au', role: 'pm', sites: ['harbour', 'rundle'], last: 'Today', status: 'Active' },
  { name: 'Luca Romano', email: 'luca.romano@meridianpg.com.au', role: 'pm', sites: ['westgate', 'riverside'], last: '5 days ago', status: 'Active' },
  { name: 'Grace Walker', email: 'grace.walker@meridianpg.com.au', role: 'exec', sites: ['all'], last: '—', status: 'Invited' }
];

/* ---------------- Executive intelligence ---------------- */
PP.INSIGHTS = [
  { id: 'i1', cat: 'Opportunity', icon: 'trend', tint: 'tint-green', site: 'riverside', title: 'Extend Saturday trading at Riverside Market Hall by 1 hour', text: 'Saturday visitation is still 74% of peak at closing time and has grown 11% over 8 weeks. A 6pm close would capture an estimated 1,350 extra visits a week.', confidence: 86, impact: '+1,350 visits / week' },
  { id: 'i2', cat: 'Risk', icon: 'alert', tint: 'tint-red', site: 'harbour', title: "Harbourside Library Children's Area is regularly over capacity", text: 'The zone exceeded 95% capacity on 9 of the last 14 Saturdays between 10am and 12pm. Consider timed sessions or moving story-time to Level 1.', confidence: 92, impact: '9 breaches / 14 weeks' },
  { id: 'i3', cat: 'Efficiency', icon: 'clock', tint: 'tint-amber', site: 'civic', title: 'Civic Tower Level 12 is under 30% utilised on Mondays and Fridays', text: 'Hybrid work patterns leave Level 12 lightly used two days a week. Consolidating to Levels 3 and 7 on those days could reduce cleaning and HVAC costs by about $41k a year.', confidence: 81, impact: '≈ $41k / year' },
  { id: 'i4', cat: 'Opportunity', icon: 'dollar', tint: 'tint-green', site: 'westgate', title: 'Food Court conversion is rising faster than footfall at Westgate', text: 'Sales per visitor rose 9% since the seating refit while footfall rose 3%. The refit has paid back 64% of its cost in five months.', confidence: 88, impact: '64% payback to date' },
  { id: 'i5', cat: 'Risk', icon: 'queue', tint: 'tint-red', site: 'westgate', title: 'Customer Services queue will breach target this weekend', text: 'The forecast shows a school-holiday surge. Wait times are projected above 10 minutes from 11am to 2pm Saturday unless a second counter opens.', confidence: 77, impact: 'Avg wait 10.4 min' },
  { id: 'i6', cat: 'Efficiency', icon: 'people', tint: 'tint-amber', site: 'rundle', title: 'Rundle Learning Hub evening hours see low demand', text: 'Visits after 7pm average 14 people, the lowest across the portfolio. Moving those staff hours to the 3–5pm peak would better match demand.', confidence: 74, impact: '14 visits after 7pm' }
];

PP.INTERVENTIONS = [
  { id: 'foodcourt', name: 'Westgate Food Court seating refit', site: 'westgate', date: 'May 2026', cost: 420000, metric: 'Sales per visitor', before: 21.4, after: 23.3, visitsBefore: 41200, visitsAfter: 42450, dwellBefore: 34, dwellAfter: 41, payback: 64 },
  { id: 'l7', name: 'Civic Tower Level 7 activity-based refit', site: 'civic', date: 'Mar 2026', cost: 1850000, metric: 'Utilisation', before: 41, after: 63, visitsBefore: 2900, visitsAfter: 4120, dwellBefore: 210, dwellAfter: 246, payback: 38 },
  { id: 'hours', name: 'Harbourside Library extended evening hours', site: 'harbour', date: 'Feb 2026', cost: 96000, metric: 'Weekly visits', before: 18400, after: 20150, visitsBefore: 18400, visitsAfter: 20150, dwellBefore: 68, dwellAfter: 71, payback: 112 }
];

/* ---------------- Platform administration data ---------------- */
PP.CITY = {
  Melbourne: [-37.8136, 144.9631], Sydney: [-33.8688, 151.2093], Brisbane: [-27.4698, 153.0251], Perth: [-31.9523, 115.8613],
  Adelaide: [-34.9285, 138.6007], Canberra: [-35.2809, 149.13], Hobart: [-42.8821, 147.3272], Darwin: [-12.4634, 130.8456],
  'Gold Coast': [-28.0167, 153.4], Newcastle: [-32.9283, 151.7817], Geelong: [-38.1499, 144.3617], Auckland: [-36.8485, 174.7633]
};
PP.CUSTOMERS = [
  { id: 'meridian', name: 'Meridian Property Group', tier: null, sites: 6, users: 7, status: 'Active', city: 'Melbourne', since: 'Mar 2025', contact: 'Priya Nair', sector: 'Property' },
  { id: 'yarra', name: 'City of Yarra Council', tier: 3, sites: 9, users: 22, status: 'Active', city: 'Melbourne', since: 'Nov 2024', contact: 'Ben Hughes', sector: 'Local government' },
  { id: 'northbridge', name: 'University of Northbridge', tier: 4, sites: 14, users: 41, status: 'Active', city: 'Sydney', since: 'Jul 2024', contact: 'Dr Alana Ruiz', sector: 'Education' },
  { id: 'coastal', name: 'Coastal Libraries Network', tier: 2, sites: 7, users: 12, status: 'Active', city: 'Gold Coast', since: 'Feb 2025', contact: 'Fiona Marsh', sector: 'Libraries' },
  { id: 'harbourreit', name: 'Harbour Retail REIT', tier: 3, sites: 11, users: 18, status: 'Active', city: 'Brisbane', since: 'Sep 2024', contact: 'Josh Patel', sector: 'Retail property' },
  { id: 'metro', name: 'Metro Transit Authority', tier: 4, sites: 23, users: 35, status: 'Active', city: 'Sydney', since: 'Apr 2024', contact: 'Karen Wells', sector: 'Transport' },
  { id: 'greenfield', name: 'Greenfield Health', tier: 1, sites: 3, users: 6, status: 'Active', city: 'Adelaide', since: 'Jun 2025', contact: 'Nina Brooks', sector: 'Healthcare' },
  { id: 'pinnacle', name: 'Pinnacle Stadiums', tier: 3, sites: 4, users: 15, status: 'Active', city: 'Perth', since: 'Jan 2025', contact: 'Ryan Ford', sector: 'Venues' },
  { id: 'sunrise', name: 'Sunrise Shopping Centres', tier: 2, sites: 5, users: 9, status: 'Onboarding', city: 'Newcastle', since: 'Sep 2026', contact: 'Olivia Grant', sector: 'Retail property' },
  { id: 'eastbank', name: 'Eastbank Arts Precinct', tier: 1, sites: 1, users: 3, status: 'Trial', city: 'Hobart', since: 'Oct 2026', contact: 'Marcus Lee', sector: 'Arts & culture' },
  { id: 'kiwi', name: 'Auckland Waterfront Trust', tier: 2, sites: 4, users: 8, status: 'Active', city: 'Auckland', since: 'Mar 2026', contact: 'Aroha Tane', sector: 'Precincts' }
];
PP.customerTier = function (c) { return c.tier == null ? PP.state.level : c.tier; };

/* Every device across every customer, Meridian's are the real ones above. */
PP.FLEET = (function () {
  var out = [];
  PP.DEVICES.forEach(function (d) {
    var s = PP.site(d.siteId);
    out.push({ id: d.id, customer: 'meridian', site: s.name, city: s.city.split(' ')[0], lat: s.lat, lng: s.lng, type: d.type, typeLabel: d.typeLabel, model: d.model, status: d.status, lastSeen: d.lastSeen, firmware: d.firmware, local: d.id });
  });
  var counts = { yarra: 212, northbridge: 486, coastal: 96, harbourreit: 344, metro: 812, greenfield: 38, pinnacle: 268, sunrise: 150, eastbank: 12, kiwi: 74 };
  var siteWords = ['Central', 'North', 'South', 'East', 'West', 'Harbour', 'Park', 'Station', 'Plaza', 'Campus', 'Square', 'Gateway', 'Hall', 'Annex'];
  PP.CUSTOMERS.forEach(function (c) {
    if (!counts[c.id]) return;
    var r = PP.rng('fleet-' + c.id);
    var home = PP.CITY[c.city];
    var siteList = PP.range(c.sites).map(function (i) {
      return { name: c.name.split(' ')[0] + ' ' + siteWords[i % siteWords.length] + (i >= siteWords.length ? ' ' + (i + 1) : ''), lat: home[0] + (r() - 0.5) * 0.25, lng: home[1] + (r() - 0.5) * 0.3 };
    });
    for (var i = 0; i < counts[c.id]; i++) {
      var s = siteList[Math.floor(r() * siteList.length)];
      var roll = r();
      var status = c.status === 'Onboarding' && roll > 0.7 ? 'provisioning' : roll > 0.965 ? 'offline' : roll > 0.92 ? 'warning' : 'online';
      var t = PP.pick(r, ['counter', 'counter', 'counter', 'thermal', 'queue', 'wifi', 'demo']);
      out.push({
        id: c.id.slice(0, 3).toUpperCase() + '-' + String(1000 + i), customer: c.id, site: s.name, city: c.city, lat: s.lat, lng: s.lng,
        type: t, typeLabel: PP.DEVICE_TYPES[t].label, model: PP.DEVICE_TYPES[t].model, status: status,
        lastSeen: status === 'offline' ? Math.round(PP.between(r, 70, 4000)) : status === 'warning' ? Math.round(PP.between(r, 6, 50)) : Math.round(PP.between(r, 0, 3)),
        firmware: PP.pick(r, ['4.2.1', '4.3.0', '4.1.7', '4.0.9'])
      });
    }
  });
  return out;
})();
PP.customer = function (id) { return PP.CUSTOMERS.find(function (c) { return c.id === id; }); };

PP.ISSUES = [
  { id: 'SUP-2291', pri: 'P1', customer: 'metro', title: '14 counters offline at Central Station concourse', kind: 'Device', age: 38, owner: 'Sam Rivera', status: 'In progress' },
  { id: 'SUP-2290', pri: 'P1', customer: 'meridian', title: 'Entry/exit imbalance on Harbourside Library Ground Floor', kind: 'Data quality', age: 95, owner: 'Unassigned', status: 'New' },
  { id: 'SUP-2288', pri: 'P2', customer: 'harbourreit', title: 'POS feed missing 2 stores since Friday', kind: 'Integration', age: 1500, owner: 'Alex Kim', status: 'Waiting on customer' },
  { id: 'SUP-2287', pri: 'P2', customer: 'sunrise', title: 'Onboarding: floorplans for 3 sites not yet uploaded', kind: 'Onboarding', age: 2880, owner: 'Jo Bennett', status: 'In progress' },
  { id: 'SUP-2285', pri: 'P2', customer: 'northbridge', title: 'SSO login failures for 12 users (certificate expiry)', kind: 'Access', age: 300, owner: 'Alex Kim', status: 'In progress' },
  { id: 'SUP-2284', pri: 'P3', customer: 'coastal', title: 'Request: add Makerspace zones to Level 1 plan', kind: 'Configuration', age: 4300, owner: 'Jo Bennett', status: 'New' },
  { id: 'SUP-2281', pri: 'P3', customer: 'pinnacle', title: 'Firmware 4.3.0 rollout, 22 devices pending', kind: 'Device', age: 7200, owner: 'Sam Rivera', status: 'Scheduled' },
  { id: 'SUP-2279', pri: 'P3', customer: 'greenfield', title: 'Demographics disabled, privacy review requested', kind: 'Configuration', age: 8600, owner: 'Unassigned', status: 'New' }
];

PP.GLOBAL_USERS = (function () {
  var first = ['Olivia', 'Liam', 'Ava', 'Noah', 'Isla', 'Jack', 'Mia', 'Oliver', 'Chloe', 'Leo', 'Zoe', 'Ethan', 'Ruby', 'Lucas', 'Sienna', 'Mason', 'Harper', 'Henry', 'Willow', 'James', 'Aria', 'Kai', 'Ella', 'Archie'];
  var last = ['Smith', 'Nguyen', 'Brown', 'Wilson', 'Taylor', 'Kaur', 'Martin', 'Anderson', 'Thompson', 'Singh', 'White', 'Harris', 'Clarke', 'Kelly', 'Murphy', 'Walsh', 'Ryan', 'Chen', 'Patel', 'Cooper'];
  var r = PP.rng('gusers');
  var out = PP.ORG_USERS.map(function (u) { return { name: u.name, email: u.email, role: u.role, customer: 'meridian', last: u.last, status: u.status, mfa: true, sso: false }; });
  PP.CUSTOMERS.slice(1).forEach(function (c) {
    var n = Math.min(c.users, 8);
    for (var i = 0; i < n; i++) {
      var fn = PP.pick(r, first), ln = PP.pick(r, last);
      out.push({ name: fn + ' ' + ln, email: (fn + '.' + ln).toLowerCase() + '@' + c.id + '.example.com', role: i === 0 ? 'pm' : r() > 0.6 ? 'exec' : 'pm', customer: c.id, last: PP.pick(r, ['Today', 'Yesterday', '3 days ago', '2 weeks ago', '—']), status: r() > 0.92 ? 'Suspended' : r() > 0.85 ? 'Invited' : 'Active', mfa: r() > 0.3, sso: PP.customerTier(c) >= 3 && r() > 0.4 });
    }
  });
  ['Sam Rivera', 'Alex Kim', 'Jo Bennett'].forEach(function (n) {
    out.push({ name: n, email: n.toLowerCase().replace(' ', '.') + '@rayven.io', role: 'admin', customer: 'platform', last: 'Today', status: 'Active', mfa: true, sso: true });
  });
  return out;
})();

PP.AUDIT = (function () {
  var r = PP.rng('audit');
  var actors = ['Sam Rivera', 'Alex Kim', 'Jo Bennett', 'System'];
  var acts = [
    ['Provisioned device', 'device', 'Registered {dev} and assigned to {cust}'],
    ['Changed subscription tier', 'customer', 'Updated {cust} from Level 2 to Level 3'],
    ['Impersonated user', 'user', 'Started support session as {user} ({cust})'],
    ['Reset password', 'user', 'Sent password reset to {user}'],
    ['Updated firmware', 'device', 'Pushed firmware 4.3.0 to {dev}'],
    ['Created customer', 'customer', 'Created customer account {cust}'],
    ['Remote session', 'device', 'Opened remote diagnostics session on {dev}'],
    ['Edited zones', 'config', 'Redrew 3 zone polygons on {cust} floorplan'],
    ['Suspended user', 'user', 'Suspended {user} at request of {cust}']
  ];
  var out = [];
  for (var i = 0; i < 40; i++) {
    var a = PP.pick(r, acts), c = PP.pick(r, PP.CUSTOMERS), d = PP.pick(r, PP.FLEET), u = PP.pick(r, PP.GLOBAL_USERS);
    out.push({
      id: 'EV-' + (88310 - i), mins: Math.round(i * 37 + PP.between(r, 1, 30)), actor: a[1] === 'device' && r() > 0.7 ? 'System' : PP.pick(r, actors.slice(0, 3)),
      action: a[0], target: a[1], detail: a[2].replace('{dev}', d.id).replace('{cust}', c.name).replace('{user}', u.name),
      ip: '203.0.113.' + Math.floor(PP.between(r, 2, 250)), customer: c.id
    });
  }
  return out;
})();

PP.PRICING = { 1: 450, 2: 750, 3: 1150, 4: 1800 }; // per site per month
PP.DEVICE_FEE = 18; // per device per month
