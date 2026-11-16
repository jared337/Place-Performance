/* =========================================================
   Place Performance prototype, floorplans.
   Uploaded plans are drawn as SVG; zones are the polygons a
   Portfolio Manager has drawn over each plan.
   ========================================================= */
PP.Floorplan = (function () {
  var PW = 1000, PH = 620;

  function zoneRoute(z) { return '/place/' + z.siteId + '/' + z.spaceId + '/' + z.id; }

  function base(space) {
    var lay = PP.LAYOUTS[space.layout];
    var s = '<rect x="20" y="20" width="' + (PW - 40) + '" height="' + (PH - 20) + '" class="fp-floor" rx="4"/>';
    // corridor hatch hint
    s += '<rect x="24" y="24" width="' + (PW - 48) + '" height="' + (PH - 28) + '" fill="url(#fp-grid)"/>';
    lay.structure.forEach(function (st) {
      var c = PP.polyCenter(st.poly);
      s += '<polygon points="' + PP.polyPoints(st.poly) + '" class="fp-struct"/>';
      s += '<text x="' + c[0] + '" y="' + (c[1] + 4) + '" text-anchor="middle" class="fp-struct-l">' + st.name + '</text>';
    });
    return s;
  }

  function defs(extra) {
    return '<defs><pattern id="fp-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#f4f4f6" stroke-width="1"/></pattern>' +
      '<marker id="fp-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="22" markerHeight="22" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#4f46e5"/></marker>' +
      (extra || '') + '</defs>';
  }

  function labelPos(z) { return z.label || PP.polyCenter(z.poly); }

  function zoneTip(z) {
    var p = z.occ / z.capacity;
    return PP.tip(z.name, [[PP.occColor(p), 'People now', z.occ + ' of ' + z.capacity], ['', 'Occupancy', Math.round(p * 100) + '%'], ['', 'Type', z.type]]);
  }

  function zoneShape(z, o) {
    var p = z.occ / z.capacity, col = PP.occColor(p);
    var cls = 'fp-zone' + (o.highlight && o.highlight !== z.id ? ' dim' : '') + (o.highlight === z.id ? ' hl' : '');
    var go = o.go ? ' data-go="' + zoneRoute(z) + '"' : '';
    return '<polygon points="' + PP.polyPoints(z.poly) + '" class="' + cls + '" data-zone="' + z.id + '"' + go + ' fill="' + col + '" fill-opacity="' + (o.flat ? 0.05 : 0.16) + '" stroke="' + col + '" data-tip="' + zoneTip(z) + '"></polygon>';
  }

  function zoneLabel(z, o) {
    var c = labelPos(z), b = PP.polyBox(z.poly);
    var narrow = (b.x2 - b.x) < 170;
    var dim = o.highlight && o.highlight !== z.id ? ' opacity=".35"' : '';
    var s = '<g' + dim + '>';
    s += '<text x="' + c[0] + '" y="' + (c[1] - 10) + '" text-anchor="middle" class="fp-name" style="font-size:' + (narrow ? 12.5 : 14) + 'px">' + PP.esc(z.name) + '</text>';
    if (!o.noCounts) {
      s += '<text x="' + c[0] + '" y="' + (c[1] + 16) + '" text-anchor="middle"><tspan class="fp-count" data-zcount="' + z.id + '">' + z.occ + '</tspan><tspan class="fp-cap" dx="3">/ ' + z.capacity + '</tspan></text>';
    }
    return s + '</g>';
  }

  function doors(space) {
    return PP.LAYOUTS[space.layout].doors.map(function (d) {
      return '<g><circle cx="' + d.x + '" cy="' + d.y + '" r="18" class="fp-door-ring"/><circle cx="' + d.x + '" cy="' + d.y + '" r="7" class="fp-door"/><text x="' + d.x + '" y="' + (d.y - 14) + '" text-anchor="middle" class="fp-door-l">' + d.label + '</text></g>';
    }).join('');
  }

  /* Live occupancy floorplan. o = { highlight, go, flat } */
  function occupancy(space, o) {
    o = o || {};
    var s = '<svg viewBox="0 -36 ' + PW + ' ' + (PH + 56) + '" data-fp="' + space.id + '">' + defs() + base(space);
    space.zones.forEach(function (z) { s += zoneShape(z, o); });
    space.zones.forEach(function (z) { s += zoneLabel(z, o); });
    s += doors(space);
    return s + '</svg>';
  }

  /* Device pins on the plan. */
  function devices(space, o) {
    o = o || {};
    var devs = PP.DEVICES.filter(function (d) { return d.spaceId === space.id; });
    var s = '<svg viewBox="0 -36 ' + PW + ' ' + (PH + 56) + '">' + defs() + base(space);
    var focus = o.highlight ? PP.device(o.highlight) : null;
    space.zones.forEach(function (z) { s += zoneShape(z, { flat: true, highlight: focus ? focus.zoneId : null }); });
    space.zones.forEach(function (z) { s += zoneLabel(z, { noCounts: true }); });
    var pinColor = function (d) { return d.status === 'online' ? '#10b981' : d.status === 'warning' ? '#f59e0b' : '#ef4444'; };
    devs.forEach(function (d) {
      if (focus && d.id === focus.id) return; // drawn last, on top
      var col = pinColor(d);
      s += '<g class="fp-pin" data-action="' + (o.action || 'device-overlay') + '" data-id="' + d.id + '"' + (focus ? ' opacity=".3"' : '') + '><circle cx="' + d.x + '" cy="' + d.y + '" r="17" fill="' + col + '" stroke="#fff" stroke-width="4"/><circle cx="' + d.x + '" cy="' + d.y + '" r="5.5" fill="#fff"/><circle cx="' + d.x + '" cy="' + d.y + '" r="24" fill="transparent" data-tip="' + PP.tip(d.id, [[col, d.typeLabel, d.status], ['', 'Last reported', PP.ago(d.lastSeen)]]) + '"/></g>';
    });
    if (focus) {
      // the device this page is about: pulsing rings, bigger pin and a callout
      var c = pinColor(focus), x = focus.x, y = focus.y;
      var ring = function (delay) {
        return '<circle cx="' + x + '" cy="' + y + '" r="26" fill="none" stroke="' + c + '" stroke-width="5">' +
          '<animate attributeName="r" values="26;95" dur="2s" begin="' + delay + 's" repeatCount="indefinite"/>' +
          '<animate attributeName="opacity" values=".7;0" dur="2s" begin="' + delay + 's" repeatCount="indefinite"/></circle>';
      };
      var lx = x > 680 ? x - 290 : x + 40, ly = y < 90 ? y + 14 : y - 96;
      s += '<g class="fp-focus" pointer-events="none">' + ring(0) + ring(1) +
        '<circle cx="' + x + '" cy="' + y + '" r="38" fill="' + c + '" opacity=".2"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="26" fill="' + c + '" stroke="#fff" stroke-width="6" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="9" fill="#fff"/>' +
        '<g transform="translate(' + lx + ',' + ly + ')"><rect width="250" height="80" rx="16" fill="#18181b"/>' +
        '<text x="20" y="32" style="font:600 20px Inter,sans-serif;fill:#a5b4fc">This device</text>' +
        '<text x="20" y="62" style="font:600 23px ui-monospace,Consolas,monospace;fill:#fff">' + PP.esc(focus.id) + '</text></g></g>';
    }
    return s + '</svg>';
  }

  /* Heat map for a single zone, zoomed in. hour = 0-23 */
  function heat(space, zone, hour) {
    var b = PP.polyBox(zone.poly), pad = 50;
    var vb = [b.x - pad, b.y - pad, (b.x2 - b.x) + pad * 2, (b.y2 - b.y) + pad * 2];
    var gid = PP.uid('hg'), cid = PP.uid('hc');
    var g = '<radialGradient id="' + gid + '"><stop offset="0" stop-color="#ff1e00" stop-opacity=".85"/><stop offset=".35" stop-color="#ff8a00" stop-opacity=".55"/><stop offset=".7" stop-color="#ffd000" stop-opacity=".22"/><stop offset="1" stop-color="#ffd000" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + cid + '"><polygon points="' + PP.polyPoints(zone.poly) + '"/></clipPath>';
    var s = '<svg viewBox="' + vb.join(' ') + '">' + defs(g) + base(space);
    space.zones.forEach(function (z) { s += '<polygon points="' + PP.polyPoints(z.poly) + '" fill="#f7f7f8" stroke="#e4e4e7" stroke-width="2"/>'; });
    s += '<polygon points="' + PP.polyPoints(zone.poly) + '" fill="#fafaff" stroke="#4f46e5" stroke-width="3" stroke-linejoin="round"/>';
    // hot spots are stable per zone; intensity follows the hour-of-day shape
    var rs = PP.rng('hot-' + zone.id);
    var spots = PP.range(3).map(function () { return [PP.between(rs, b.x + 30, b.x2 - 30), PP.between(rs, b.y + 30, b.y2 - 30), PP.between(rs, 0.5, 1)]; });
    var intensity = PP.clamp(PP.SHAPES[space.layout](hour + 0.5) / 1.1, 0.05, 1);
    var r = PP.rng('heat-' + zone.id + '-' + hour);
    var n = Math.round(10 + intensity * 50);
    s += '<g clip-path="url(#' + cid + ')">';
    for (var i = 0; i < n; i++) {
      var sp = spots[Math.floor(r() * spots.length)];
      var spread = (b.x2 - b.x) * 0.25;
      var x = sp[0] + (r() - 0.5) * spread * 2, y = sp[1] + (r() - 0.5) * spread * 1.4;
      var rad = PP.between(r, 30, 70) * (0.6 + intensity * 0.6);
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rad.toFixed(1) + '" fill="url(#' + gid + ')" opacity="' + (0.35 + intensity * 0.55 * sp[2]).toFixed(2) + '"/>';
    }
    s += '</g>';
    var c = labelPos(zone);
    s += '<text x="' + c[0] + '" y="' + (b.y + 26) + '" text-anchor="middle" class="fp-name" style="font-size:16px">' + PP.esc(zone.name) + '</text>';
    return s + '</svg>';
  }

  /* Movement between entry points and zones within one space. */
  function flows(space) {
    var lay = PP.LAYOUTS[space.layout], r = PP.rng('flow-' + space.id);
    var nodes = lay.doors.map(function (d) { return { name: d.label, x: d.x, y: d.y, door: true }; })
      .concat(space.zones.map(function (z) { var c = labelPos(z); return { name: z.name, x: c[0], y: c[1] + 34, zone: z }; }));
    var out = [];
    lay.doors.forEach(function (d, di) {
      var targets = space.zones.slice().sort(function (a, b) { return PP.hash(space.id + a.id + di) - PP.hash(space.id + b.id + di); }).slice(0, 3);
      targets.forEach(function (z) { out.push({ from: nodes[di], to: nodes.find(function (n) { return n.zone === z; }), n: Math.round(z.capacity * PP.between(r, 2, 6)) }); });
    });
    for (var i = 0; i < 5; i++) {
      var a = space.zones[Math.floor(r() * space.zones.length)], b = space.zones[Math.floor(r() * space.zones.length)];
      if (a === b) continue;
      out.push({ from: nodes.find(function (n) { return n.zone === a; }), to: nodes.find(function (n) { return n.zone === b; }), n: Math.round(Math.min(a.capacity, b.capacity) * PP.between(r, 1, 3.5)) });
    }
    return out.sort(function (a, b) { return b.n - a.n; });
  }

  function flow(space) {
    var list = flows(space);
    var max = Math.max.apply(null, list.map(function (f) { return f.n; }));
    var s = '<svg viewBox="0 -36 ' + PW + ' ' + (PH + 56) + '">' + defs() + base(space);
    space.zones.forEach(function (z) { s += zoneShape(z, { flat: true }); });
    space.zones.forEach(function (z) { s += zoneLabel(z, { noCounts: true }); });
    list.forEach(function (f, i) {
      var mx = (f.from.x + f.to.x) / 2, my = (f.from.y + f.to.y) / 2;
      var dx = f.to.x - f.from.x, dy = f.to.y - f.from.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var bend = (i % 2 ? 1 : -1) * Math.min(80, len * 0.25);
      var cx = mx - dy / len * bend, cy = my + dx / len * bend;
      var w = 2 + (f.n / max) * 12;
      s += '<path d="M' + f.from.x + ',' + f.from.y + ' Q' + cx + ',' + cy + ' ' + f.to.x + ',' + f.to.y + '" fill="none" class="fp-flow" stroke="#4f46e5" stroke-opacity="' + (0.3 + f.n / max * 0.55).toFixed(2) + '" stroke-width="' + w.toFixed(1) + '" stroke-linecap="round" marker-end="url(#fp-arrow)" data-tip="' + PP.tip(f.from.name + ' → ' + f.to.name, [['#4f46e5', 'People today', PP.fmt(f.n)]]) + '" style="cursor:help"></path>';
      if (i < 5) s += '<g><rect x="' + (cx - 22) + '" y="' + (cy - 12) + '" width="44" height="22" rx="11" fill="#fff" stroke="#e0e0e5"/><text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" style="font:600 12px Inter,sans-serif;fill:#4f46e5">' + PP.short(f.n) + '</text></g>';
    });
    s += doors(space);
    return s + '</svg>';
  }

  /* Editable plan for the Sites & Zones editor. draft = points being drawn */
  function edit(space, draft, selected) {
    var s = '<svg viewBox="0 -36 ' + PW + ' ' + (PH + 56) + '" data-edit-svg>' + defs() + base(space);
    space.zones.forEach(function (z) {
      var on = z.id === selected;
      s += '<polygon points="' + PP.polyPoints(z.poly) + '" fill="' + (on ? '#4f46e5' : '#8b5cf6') + '" fill-opacity="' + (on ? 0.18 : 0.08) + '" stroke="' + (on ? '#4f46e5' : '#8b5cf6') + '" stroke-width="' + (on ? 4 : 2.5) + '" data-action="editor-select-zone" data-id="' + z.id + '" style="cursor:pointer"/>';
      if (on) z.poly.forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" class="fp-draw-pt"/>'; });
    });
    space.zones.forEach(function (z) { s += zoneLabel(z, { noCounts: true }); });
    if (draft && draft.length) {
      s += '<polyline points="' + PP.polyPoints(draft) + '" class="fp-new" fill="rgba(79,70,229,.12)"/>';
      draft.forEach(function (p, i) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === 0 ? 10 : 7) + '" class="fp-draw-pt"' + (i === 0 ? ' style="fill:#4f46e5"' : '') + '/>'; });
    }
    return s + '</svg>';
  }

  /* Building stack, every floor of a site with its live occupancy. */
  function stack(site) {
    var floors = site.spaces.slice().reverse();
    var fh = 74, top = 40, H = top + floors.length * fh + 30, W = 520;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="bstack">';
    // roof
    s += '<polygon points="34,' + (top - 24) + ' 334,' + (top - 24) + ' 310,' + (top - 4) + ' 10,' + (top - 4) + '" fill="#27272a"/>';
    floors.forEach(function (sp, i) {
      var y = top + i * fh;
      var occ = PP.sum(sp.zones.map(function (z) { return z.occ; })), cap = PP.sum(sp.zones.map(function (z) { return z.capacity; }));
      var p = occ / cap, col = PP.occColor(p);
      s += '<g class="floor" data-go="/place/' + site.id + '/' + sp.id + '" data-live-floor="' + sp.id + '">';
      s += '<polygon class="slab" points="34,' + y + ' 334,' + y + ' 310,' + (y + 58) + ' 10,' + (y + 58) + '"/>';
      s += '<polygon points="10,' + (y + 58) + ' 310,' + (y + 58) + ' 310,' + (y + 66) + ' 10,' + (y + 66) + '" fill="#ececef"/>';
      s += '<rect x="30" y="' + (y + 38) + '" width="260" height="8" rx="4" fill="#f0f0f2"/>';
      s += '<rect class="fill" data-floor-fill x="30" y="' + (y + 38) + '" width="' + (260 * PP.clamp(p, 0, 1)) + '" height="8" rx="4" fill="' + col + '"/>';
      s += '<text x="44" y="' + (y + 26) + '" style="font-size:17px;font-weight:600;fill:#18181b">' + PP.esc(sp.name) + '</text>';
      s += '<text x="300" y="' + (y + 26) + '" text-anchor="end" style="font-size:12.5px;font-weight:500;fill:#a1a1aa">' + sp.zones.length + ' zones</text>';
      s += '<text x="350" y="' + (y + 30) + '" style="font-size:28px;font-weight:600;fill:#18181b;letter-spacing:-.03em" data-floor-occ>' + occ + '</text>';
      s += '<text x="350" y="' + (y + 50) + '" style="font-size:12.5px;font-weight:500;fill:#a1a1aa" data-floor-cap>of ' + cap + ' · ' + Math.round(p * 100) + '%</text>';
      s += '<text x="490" y="' + (y + 38) + '" style="font-size:24px;fill:#a1a1aa;font-weight:400">›</text>';
      s += '</g>';
    });
    s += '<rect x="0" y="' + (top + floors.length * fh + 2) + '" width="340" height="4" rx="2" fill="#27272a"/>';
    s += '</svg>';
    return s;
  }

  /* Update every live element on screen after the occupancy ticker runs. */
  function refresh(root) {
    root = root || document;
    root.querySelectorAll('polygon[data-zone]').forEach(function (el) {
      var pl = PP.place(el.getAttribute('data-zone'));
      if (!pl) return;
      var z = pl.zone, p = z.occ / z.capacity, col = PP.occColor(p);
      el.setAttribute('fill', col); el.setAttribute('stroke', col);
      el.setAttribute('data-tip', PP.decodeTip(zoneTip(z)));
    });
    root.querySelectorAll('[data-zcount]').forEach(function (el) {
      var pl = PP.place(el.getAttribute('data-zcount')); if (pl) PP.setLive(el, String(pl.zone.occ));
    });
    root.querySelectorAll('[data-live-floor]').forEach(function (g) {
      var pl = PP.place(g.getAttribute('data-live-floor')); if (!pl) return;
      var occ = PP.sum(pl.zones.map(function (z) { return z.occ; })), cap = PP.sum(pl.zones.map(function (z) { return z.capacity; })), p = occ / cap;
      var f = g.querySelector('[data-floor-fill]'); f.setAttribute('width', 260 * PP.clamp(p, 0, 1)); f.setAttribute('fill', PP.occColor(p));
      g.querySelector('[data-floor-occ]').textContent = occ;
      g.querySelector('[data-floor-cap]').textContent = 'of ' + cap + ' · ' + Math.round(p * 100) + '%';
    });
  }

  function legend() {
    return '<div class="fp-legend"><span><i style="background:#10b981"></i>Under 60%</span><span><i style="background:#f59e0b"></i>60–80%</span><span><i style="background:#f97316"></i>80–90%</span><span><i style="background:#ef4444"></i>Over 90% of capacity</span></div>';
  }

  return { occupancy: occupancy, devices: devices, heat: heat, flow: flow, flows: flows, edit: edit, stack: stack, refresh: refresh, legend: legend, zoneRoute: zoneRoute, W: PW, H: PH };
})();
