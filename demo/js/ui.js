/* =========================================================
   Place Performance prototype, UI building blocks:
   feature gating (level + role), cards, openers, overlays, toasts.
   ========================================================= */

/* ---------------- Gating ---------------- */
PP.roleOk = function (fid) {
  var f = PP.FEATURES[fid];
  if (!f) return true;
  if (PP.state.role === 'admin') return true; // Platform Administrator sees everything
  return f.roles.indexOf(PP.state.role) >= 0;
};
PP.levelOk = function (fid) {
  var f = PP.FEATURES[fid];
  return !f || PP.state.level >= f.level;
};
PP.can = function (fid) { return PP.roleOk(fid) && PP.levelOk(fid); };
PP.levelName = function (n) { return 'Level ' + n + ' · ' + PP.LEVELS[n - 1].name; };

PP.screenAccess = function (sc) {
  if (sc.section === 'admin') return PP.state.role === 'admin' ? 'ok' : 'hidden';
  if (sc.multi && !PP.state.multi) return 'hidden';
  var feats = sc.features.filter(PP.roleOk);
  if (!feats.length) return 'hidden';
  return feats.some(PP.levelOk) ? 'ok' : 'locked';
};
PP.screenMinLevel = function (sc) {
  var lv = sc.features.filter(PP.roleOk).map(function (id) { return PP.FEATURES[id].level; });
  return lv.length ? Math.min.apply(null, lv) : 1;
};

/* ---------------- Chips ---------------- */
PP.levelChip = function (n, always) {
  return '<span class="chip chip-l' + n + (always ? '' : ' annot') + '" title="' + PP.levelName(n) + '">L' + n + ' ' + PP.LEVELS[n - 1].name + '</span>';
};
PP.featureChips = function (fid) {
  var f = PP.FEATURES[fid];
  if (!f) return '';
  var s = PP.levelChip(f.level);
  if (f.roles.length === 1 && f.roles[0] === 'pm') s += '<span class="chip chip-pm annot" title="Visible to Portfolio Managers only">PM only</span>';
  if (f.type === 'drill') s += '<span class="chip chip-drill annot">Drill-down</span>';
  if (f.type === 'overlay') s += '<span class="chip chip-overlay annot">Overlay</span>';
  return s;
};
PP.roleChip = function (role) {
  var r = PP.ROLES[role];
  return '<span class="chip chip-' + role + '">' + (r ? r.short : role) + '</span>';
};
PP.status = function (st) {
  var map = {
    online: ['st-ok', 'Online'], warning: ['st-warn', 'Warning'], offline: ['st-bad', 'Offline'], provisioning: ['st-info', 'Provisioning'],
    synced: ['st-ok', 'Syncing'], delayed: ['st-warn', 'Delayed'], error: ['st-bad', 'Sync failed'], requested: ['st-info', 'Requested'],
    open: ['st-bad', 'Open'], acknowledged: ['st-warn', 'Acknowledged'], resolved: ['st-ok', 'Resolved'],
    high: ['st-bad', 'High'], medium: ['st-warn', 'Medium'], low: ['st-idle', 'Low'],
    Active: ['st-ok', 'Active'], Invited: ['st-info', 'Invited'], Suspended: ['st-bad', 'Suspended'], Onboarding: ['st-info', 'Onboarding'], Trial: ['st-warn', 'Trial'],
    P1: ['st-bad', 'P1'], P2: ['st-warn', 'P2'], P3: ['st-idle', 'P3']
  };
  var m = map[st] || ['st-idle', st];
  return '<span class="st ' + m[0] + '">' + m[1] + '</span>';
};

/* ---------------- Cards ----------------
   PP.card(featureId, { title, sub, body, actions, cls, flush, footer, attrs })
   Hidden when the role can't see the feature; a locked placeholder when the level is too low. */
PP.card = function (fid, o) {
  o = o || {};
  if (fid && !PP.roleOk(fid)) return '';
  if (fid && !PP.levelOk(fid)) return PP.state.showLocked ? PP.locked(fid, o) : '';
  var f = fid ? PP.FEATURES[fid] : null;
  var title = o.title || (f ? f.name : '');
  return '<section class="card ' + (o.cls || '') + '"' + (o.attrs || '') + '>' +
    (title || o.actions ? '<div class="card-h"><div><div class="card-t">' + (o.icon ? PP.icon(o.icon) : '') + PP.esc(title) + (fid ? PP.featureChips(fid) : '') + (o.titleExtra || '') + '</div>' + (o.sub ? '<div class="card-s">' + o.sub + '</div>' : '') + '</div>' + (o.actions ? '<div class="card-a">' + o.actions + '</div>' : '') + '</div>' : '') +
    '<div class="card-b' + (o.flush ? ' flush' : '') + '">' + (o.body || '') + '</div>' +
    (o.footer ? '<div class="card-f">' + o.footer + '</div>' : '') +
    '</section>';
};
PP.locked = function (fid, o) {
  var f = PP.FEATURES[fid];
  return '<section class="card locked"><div class="locked-b"><div class="locked-ico">' + PP.icon('lock') + '</div><div><h4>' + PP.esc((o && o.title) || f.name) + '</h4>' +
    '<p>Available from ' + PP.levelName(f.level) + ', "' + PP.LEVELS[f.level - 1].tagline + '"</p>' +
    '<button class="btn btn-sm" data-action="set-level" data-level="' + f.level + '">Preview at Level ' + f.level + '</button></div></div></section>';
};

/* Button that opens a drill-down or overlay feature. attrs: 'data-go="…"' or 'data-action="…" data-id="…"' */
PP.opener = function (fid, label, attrs, o) {
  o = o || {};
  var f = PP.FEATURES[fid];
  if (!PP.roleOk(fid)) return '';
  if (!PP.levelOk(fid)) {
    return PP.state.showLocked ? '<button class="btn ' + (o.cls || 'btn-sm') + '" disabled title="Available from ' + PP.levelName(f.level) + '">' + PP.icon('lock') + PP.esc(label) + ' <span class="chip chip-l' + f.level + '" style="font-size:9px;padding:1px 6px">L' + f.level + '</span></button>' : '';
  }
  var tag = f.type ? '<span class="open-tag ' + f.type + ' annot">' + (f.type === 'drill' ? 'Drill-down ↗' : 'Overlay ⧉') + '</span>' : '';
  return '<button class="btn ' + (o.cls || 'btn-sm') + '" ' + attrs + '>' + (o.icon ? PP.icon(o.icon) : '') + PP.esc(label) + tag + '</button>';
};

/* ---------------- Page header ---------------- */
PP.pageHead = function (o) {
  var sc = o.screen ? PP.screen(o.screen) : null;
  var back = o.back ? '<div class="ph-back" data-go="' + o.back.go + '">' + PP.icon('back', 'ico') + PP.esc(o.back.label) + '</div>' : '';
  var chips = '';
  if (sc) chips += '<span class="chip chip-iface annot">Interface ' + sc.num + '</span>';
  if (o.fid) chips += PP.featureChips(o.fid);
  if (o.chips) chips += o.chips;
  return '<div class="ph"><div>' + back + '<div class="ph-title"><h1>' + PP.esc(o.title) + '</h1>' + chips + '</div>' + (o.sub ? '<div class="ph-sub">' + o.sub + '</div>' : '') + '</div>' +
    (o.actions ? '<div class="ph-actions">' + o.actions + '</div>' : '') + '</div>';
};

PP.kpi = function (label, value, o) {
  o = o || {};
  var d = '';
  if (o.delta != null) {
    var cls = o.delta > 0.5 ? 'up' : o.delta < -0.5 ? 'down' : 'flat';
    if (o.invert) cls = cls === 'up' ? 'down' : cls === 'down' ? 'up' : cls;
    d = '<div class="kpi-d ' + cls + '">' + (o.delta > 0 ? '▲ ' : o.delta < 0 ? '▼ ' : '') + Math.abs(Math.round(o.delta * 10) / 10) + (o.deltaUnit || '%') + ' <span class="muted" style="font-weight:500">' + (o.deltaLabel || 'vs last week') + '</span></div>';
  }
  return '<div class="kpi"><div class="kpi-l">' + (o.icon ? PP.icon(o.icon, 'ico') : '') + label + '</div><div class="kpi-v"' + (o.liveAttr || '') + '>' + value + '</div>' + d + (o.spark ? '<div class="kpi-spark">' + o.spark + '</div>' : '') + (o.extra || '') + '</div>';
};

PP.empty = function (icon, title, text, extra) {
  return '<div class="empty"><div class="ico-xl">' + PP.icon(icon, 'ico') + '</div><h2>' + title + '</h2><p>' + text + '</p>' + (extra || '') + '</div>';
};

PP.switchHtml = function (label, on, attrs) {
  return '<label class="switch"><input type="checkbox"' + (on ? ' checked' : '') + ' ' + (attrs || '') + '><span class="track"></span>' + (label || '') + '</label>';
};

/* ---------------- Overlays ---------------- */
PP.overlay = {
  open: function (o) {
    var root = document.getElementById('overlay-root');
    var wrap = document.createElement('div');
    wrap.className = 'ov-backdrop' + (o.side ? ' side' : '');
    var chips = (o.fid ? PP.featureChips(o.fid) : '<span class="chip chip-overlay annot">Overlay</span>') + (o.chips || '');
    wrap.innerHTML = '<div class="ov ' + (o.size || '') + '" role="dialog" aria-modal="true">' +
      '<div class="ov-h"><div><div class="row"><h3>' + PP.esc(o.title) + '</h3>' + chips + '</div>' + (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') + '</div>' +
      '<button class="ov-close" data-action="ov-close" aria-label="Close">' + PP.icon('close') + '</button></div>' +
      '<div class="ov-b">' + (o.body || '') + '</div>' +
      (o.footer ? '<div class="ov-f">' + o.footer + '</div>' : '') + '</div>';
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) PP.overlay.close(); });
    root.appendChild(wrap);
    // anything an overlay mounts (e.g. a map) is cleaned up when it closes
    var saved = PP._unmounts; PP._unmounts = [];
    if (o.onMount) o.onMount(wrap);
    PP.runMounts();
    wrap._unmounts = PP._unmounts; PP._unmounts = saved;
    return wrap;
  },
  close: function () {
    var root = document.getElementById('overlay-root');
    var last = root.lastElementChild;
    if (!last) return;
    (last._unmounts || []).forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
    root.removeChild(last);
  },
  closeAll: function () { while (document.getElementById('overlay-root').lastElementChild) PP.overlay.close(); },
  top: function () { return document.getElementById('overlay-root').lastElementChild; }
};

PP.toast = function (msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = PP.icon('check') + PP.esc(msg);
  document.getElementById('toast-root').appendChild(t);
  setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; }, 2400);
  setTimeout(function () { t.remove(); }, 2800);
};

/* ---------------- Common actions ---------------- */
PP.actions['ov-close'] = function () { PP.overlay.close(); };
PP.actions['toast'] = function (el) { PP.toast(el.getAttribute('data-msg') || 'Done'); };
PP.actions['set-level'] = function (el) { PP.setState({ level: +el.getAttribute('data-level') }); PP.toast('Previewing ' + PP.levelName(PP.state.level)); };
PP.actions['save-close'] = function (el) { PP.overlay.close(); PP.toast(el.getAttribute('data-msg') || 'Saved'); };

/* ---------------- Screen map (reviewer aid) ---------------- */
PP.actions['screen-map'] = function () {
  function section(sec, label) {
    var cards = PP.SCREENS.filter(function (s) { return s.section === sec; }).map(function (sc) {
      var acc = sc.id === 'login' ? 'ok' : PP.screenAccess(sc);
      var opens = Object.keys(PP.FEATURES).map(function (k) { return PP.FEATURES[k]; }).filter(function (f) { return f.screen === sc.id && f.type; });
      var go = sc.id === 'place' ? '/place' : sc.route;
      return '<div class="smap-card' + (acc === 'hidden' ? ' off' : '') + '"><div class="smap-h" data-go="' + go + '" data-close-overlay><span class="smap-n">' + sc.num + '</span>' + sc.name + (acc === 'locked' ? ' ' + PP.icon('lock', 'ico') : '') + (acc === 'hidden' ? ' <span class="tiny muted">(not visible to this role)</span>' : '') + '</div>' +
        (opens.length || sc.id === 'place' ? '<div class="smap-opens">' + (sc.id === 'place' ? '<div class="smap-open"><span class="open-tag drill">Drill</span>Site → Space → Zone</div>' : '') + opens.map(function (f) {
          return '<div class="smap-open"><span class="open-tag ' + f.type + '">' + (f.type === 'drill' ? 'Drill' : 'Overlay') + '</span>' + f.name + ' <span class="tiny">from ' + PP.FEATURES[f.from].name + '</span>' + (PP.can(f.id) ? '' : PP.icon('lock', 'lock')) + '</div>';
        }).join('') + '</div>' : '') + '</div>';
    }).join('');
    return '<div class="smap-sec ' + (sec === 'admin' ? 'admin' : '') + '">' + label + '</div><div class="smap">' + cards + '</div>';
  }
  PP.overlay.open({
    title: 'Screen map', size: 'lg', chips: '<span class="chip chip-iface">18 interfaces</span>',
    sub: 'Every interface and what opens from it. Click an interface to jump to it. Locks reflect the current preview level and role.',
    body: section('customer', 'Customer Application') + section('admin', 'Platform Administration (ITESA / Rayven only)')
  });
};
