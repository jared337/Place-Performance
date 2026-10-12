/* =========================================================
   Place Performance prototype, geographic maps (Leaflet).
   A quiet, label-free basemap with crisp markers whose names
   appear on hover, plus an optional in-map site list panel.
   Maps are created after a screen mounts and removed on unmount.
   ========================================================= */
PP.Maps = {
  /* Create a map inside the element with this id. Returns null if Leaflet failed to load (offline). */
  make: function (elId, opts) {
    opts = opts || {};
    var el = document.getElementById(elId);
    if (!el) return null;
    if (typeof L === 'undefined') {
      el.innerHTML = '<div class="map-fallback">Map tiles need an internet connection.<br>Everything else in the prototype works offline.</div>';
      return null;
    }
    el.classList.add('pp-map');
    var m = L.map(el, { scrollWheelZoom: false, zoomControl: false, attributionControl: true, minZoom: 2, zoomSnap: 0.25 });
    m.attributionControl.setPrefix(false);
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    var base = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap', maxZoom: 19, maxNativeZoom: 16, className: 'pp-base'
    });
    var sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics', maxZoom: 19
    });
    m._pp = { markers: {}, padLeft: 0, base: base, sat: sat, mode: 'sat', home: null }; // satellite by default

    // Map / Satellite toggle, "auto" switches to satellite when zoomed in close
    var Toggle = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        var d = L.DomUtil.create('div', 'map-seg');
        d.innerHTML = '<button data-mode="map">Map</button><button data-mode="sat">Satellite</button>';
        L.DomEvent.disableClickPropagation(d);
        d.querySelectorAll('button').forEach(function (b) {
          b.addEventListener('click', function () { m._pp.mode = b.getAttribute('data-mode'); PP.Maps.syncLayer(m); });
        });
        m._pp.toggle = d;
        return d;
      }
    });
    new Toggle().addTo(m);
    // "All sites" button to fly back out after zooming into a location
    var Home = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        var b = L.DomUtil.create('button', 'map-home');
        b.innerHTML = PP.icon('back', 'ico') + 'All locations';
        L.DomEvent.disableClickPropagation(b);
        b.addEventListener('click', function () { m.closePopup(); PP.Maps.fit(m, m._pp.home.points, m._pp.home.pad, true); });
        m._pp.homeBtn = b;
        return b;
      }
    });
    new Home().addTo(m);
    // set the view before any tile layer is added so layer swaps never act on an uninitialised layer
    m.setView(opts.center || [-28.5, 134], opts.zoom || 4);
    base.addTo(m);
    PP.Maps.syncLayer(m);
    m.on('zoomend', function () { PP.Maps.syncLayer(m); });
    PP.onUnmount(function () { try { m.stop(); m.off(); m.remove(); } catch (e) { /* removed mid-animation */ } });
    setTimeout(function () { try { m.invalidateSize(); } catch (e) { /* map was removed */ } }, 60);
    return m;
  },

  /* Marker. o = { radius, color, label, value, popup, go, key, permanent, halo } */
  bubble: function (m, lat, lng, o) {
    if (!m) return null;
    var size = Math.round(PP.clamp((o.radius || 8) * 1.6, 10, 34));
    var label = o.label ? String(o.label) : '';
    var name = label.split(' · ')[0], val = o.value != null ? o.value : (label.indexOf(' · ') > 0 ? label.split(' · ').slice(1).join(' · ') : '');
    var html = '<div class="mk' + (o.halo ? ' mk-halo' : '') + (o.permanent ? ' mk-on' : '') + '" style="--c:' + (o.color || PP.C.blue) + ';--s:' + size + 'px">' +
      '<span class="mk-dot"></span>' +
      (name ? '<span class="mk-lbl"><b>' + PP.esc(name) + '</b>' + (val ? '<em>' + PP.esc(val) + '</em>' : '') + '</span>' : '') + '</div>';
    var mk = L.marker([lat, lng], {
      icon: L.divIcon({ className: 'mk-icon', html: html, iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] }),
      riseOnHover: true, keyboard: false
    }).addTo(m);
    var pop = o.popup || (o.go ? '<b>' + PP.esc(name) + '</b>' + (val ? '<div class="muted">' + PP.esc(val) + '</div>' : '') + '<button class="btn btn-sm btn-primary" data-go="' + o.go + '">Open</button>' : null);
    if (pop) mk.bindPopup('<div class="map-pop">' + pop + '</div>', { closeButton: false, offset: [0, -4], autoPan: false });
    // clicking a location flies in to satellite view, then shows its details
    mk.off('click');
    mk.on('click', function () { PP.Maps.focus(m, mk); });
    if (o.key || name) m._pp.markers[o.key || name] = mk;
    return mk;
  },

  /* Fly to a marker at street level; satellite imagery takes over as the zoom passes 13. */
  focus: function (m, mk) {
    m.closePopup();
    if (m._pp.mode === 'map') m._pp.mode = 'auto'; // zooming into a location always ends in satellite
    var ll = mk.getLatLng();
    // centre the location in the area not covered by the in-map list panel
    var target = m.unproject(m.project(ll, 17).subtract([m._pp.padLeft / 2, -40]), 17);
    var done = function () { if (mk.getPopup()) mk.openPopup(); };
    if (m.getZoom() >= 16 && m.getCenter().distanceTo(target) < 50) { done(); return; }
    m.once('moveend', done);
    m.flyTo(target, 17, { duration: 1.6, easeLinearity: 0.2 });
  },

  /* Show satellite when zoomed in (or when chosen), the quiet basemap otherwise. */
  syncLayer: function (m) {
    var p = m._pp, satOn = p.mode === 'sat' || (p.mode === 'auto' && m.getZoom() >= 13);
    if (satOn && !m.hasLayer(p.sat)) { p.sat.addTo(m); m.removeLayer(p.base); }
    if (!satOn && !m.hasLayer(p.base)) { p.base.addTo(m); m.removeLayer(p.sat); }
    m.getContainer().classList.toggle('is-sat', satOn);
    if (p.toggle) p.toggle.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', (b.getAttribute('data-mode') === 'sat') === satOn); });
    if (p.homeBtn) p.homeBtn.style.display = p.home && p.home.points.length > 1 && m.getZoom() >= 9 ? '' : 'none';
  },

  /* Frame the points, leaving room for the in-map panel on the left. */
  fit: function (m, points, pad, animate) {
    if (!m || !points.length) return;
    pad = pad || 40;
    m._pp.home = { points: points, pad: pad };
    var apply = function (fly) {
      m.invalidateSize();
      if (points.length === 1) { m[fly ? 'flyTo' : 'setView'](points[0], 15); return; }
      var opt = { paddingTopLeft: [pad + m._pp.padLeft, pad], paddingBottomRight: [pad + 30, pad] };
      if (fly) m.flyToBounds(L.latLngBounds(points), Object.assign(opt, { duration: 1.2 })); else m.fitBounds(L.latLngBounds(points), opt);
    };
    if (animate) { apply(true); return; }
    apply();
    setTimeout(function () { try { apply(); PP.Maps.syncLayer(m); } catch (e) { /* map was removed */ } }, 80); // container may not have its final size on first paint
  },

  /* In-map list of places. items = [{ key, name, sub, value, color, go }]. Call before fit(). */
  panel: function (m, title, items) {
    if (!m) return;
    var el = m.getContainer();
    if (el.clientWidth < 560) return; // too narrow: hover labels only
    var p = document.createElement('div');
    p.className = 'map-panel';
    p.innerHTML = '<div class="map-panel-h">' + PP.esc(title) + '<span>' + items.length + '</span></div>' + items.map(function (it) {
      return '<div class="map-row" data-key="' + PP.esc(it.key) + '"><i style="background:' + it.color + '"></i><div class="map-row-m"><b>' + PP.esc(it.name) + '</b>' + (it.sub ? '<span>' + PP.esc(it.sub) + '</span>' : '') + '</div><em>' + PP.esc(it.value) + '</em></div>';
    }).join('');
    el.appendChild(p);
    L.DomEvent.disableClickPropagation(p);
    L.DomEvent.disableScrollPropagation(p);
    m._pp.padLeft = p.offsetWidth + 12;
    var byKey = {};
    items.forEach(function (it) { byKey[it.key] = it; });
    p.querySelectorAll('.map-row').forEach(function (row) {
      var key = row.getAttribute('data-key'), mk = m._pp.markers[key];
      var hl = function (on) { var n = mk && mk.getElement(); if (n) { n.querySelector('.mk').classList.toggle('mk-on', on); n.style.zIndex = on ? 2000 : ''; } };
      row.addEventListener('mouseenter', function () { hl(true); });
      row.addEventListener('mouseleave', function () { hl(false); });
      row.addEventListener('click', function () { if (mk) PP.Maps.focus(m, mk); else if (byKey[key].go) location.hash = byKey[key].go; });
      if (mk) {
        mk.on('mouseover', function () { row.classList.add('on'); });
        mk.on('mouseout', function () { row.classList.remove('on'); });
      }
    });
  }
};
