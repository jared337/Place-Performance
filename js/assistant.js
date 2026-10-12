/* =========================================================
   Place Assistant, ask questions about your places in plain language.
   Uses Claude (Anthropic SDK, loaded on first use) with the prototype's
   live data as context. Without an API key it falls back to built-in
   answers computed from the same data, so demos always work.
   Gated to Level 4 · Executive (feature "ask-ai").
   ========================================================= */
PP.ai = {
  open: false,
  busy: false,
  messages: [],          // [{role: 'user'|'assistant', content: string, source: 'claude'|'demo'}]
  model: 'claude-opus-5-5',
  sdkUrl: 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.133.0/+esm',
  keyStore: 'pp_anthropic_key'
};

PP.FEATURES['ask-ai'] = { id: 'ask-ai', name: 'Place Assistant (Ask AI)', screen: 'intel', level: 4, roles: ['pm', 'exec'], source: 'recommendation', type: null, from: null };

PP.ai.getKey = function () { try { return localStorage.getItem(PP.ai.keyStore) || ''; } catch (e) { return PP.ai._key || ''; } };
PP.ai.setKey = function (k) { PP.ai._key = k; try { if (k) localStorage.setItem(PP.ai.keyStore, k); else localStorage.removeItem(PP.ai.keyStore); } catch (e) { /* memory only */ } };

/* ---------------- Context: what the assistant knows ---------------- */
PP.ai.currentPlace = function () {
  var m = (location.hash || '').match(/^#\/place(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?/);
  if (!m) return null;
  return PP.place(m[3] || m[2] || m[1] || PP.lastSite || PP.sites()[0].id);
};

PP.ai.context = function () {
  var st = PP.state, sites = PP.sites();
  var round = function (v, d) { var p = Math.pow(10, d || 0); return Math.round(v * p) / p; };
  var ctx = {
    today: new Date().toLocaleString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
    customer: PP.CUSTOMER.name,
    subscription: PP.levelName(st.level),
    viewer_role: PP.ROLES[st.role].label,
    current_screen: PP.current ? { route: '#' + PP.current.path, name: PP.screen(PP.current.route.screen).name } : null,
    sites: sites.map(function (s) {
      var pl = PP.place(s.id), x = PP.stats(pl), heat = PP.series.heat(pl);
      var peak = { v: 0 }; heat.forEach(function (row, d) { row.forEach(function (v, h) { if (v > peak.v) peak = { v: v, d: d, h: h }; }); });
      return {
        id: s.id, name: s.name, city: s.city, type: s.type, route: '#/place/' + s.id,
        people_now: x.occ, capacity: x.cap, occupancy_pct: round(x.occPct * 100),
        visitors_today: x.visitors, visitors_change_vs_last_week_pct: round(x.visitorsDelta, 1),
        avg_dwell_min: round(x.dwell), returning_visitors_pct: round(x.repeat),
        performance_score: st.level >= 3 ? x.score : undefined,
        busiest_period: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][peak.d] + ' ' + PP.hourLabel(peak.h),
        visitors_last_7_days: PP.series.daily(pl, 7),
        spaces: s.spaces.map(function (sp) {
          return {
            id: sp.id, name: sp.name, route: '#/place/' + s.id + '/' + sp.id,
            zones: sp.zones.map(function (z) { return [z.id, z.name, z.type, z.occ, z.capacity]; })
          };
        })
      };
    }),
    zone_columns: ['id', 'name', 'type', 'people_now', 'capacity']
  };
  var here = PP.ai.currentPlace();
  if (here) ctx.place_being_viewed = { level: here.kind, id: here.id, name: here.name, route: '#' + PP.placeRoute(here) };
  if (PP.can('device-list') || PP.can('device-health')) {
    var devs = PP.visibleDevices();
    ctx.devices = {
      total: devs.length,
      online: devs.filter(function (d) { return d.status === 'online'; }).length,
      not_online: devs.filter(function (d) { return d.status !== 'online'; }).map(function (d) {
        var z = PP.place(d.zoneId);
        return { id: d.id, type: d.typeLabel, status: d.status, issue: d.issue, last_reported_min_ago: d.lastSeen, location: z.site.name + ' · ' + z.space.name + ' · ' + z.name, route: '#/devices/' + d.id };
      })
    };
  }
  if (PP.can('notif-feed')) {
    ctx.alerts = PP.visibleAlerts().slice(0, 12).map(function (a) {
      return { id: a.id, title: a.title, severity: a.sev, status: a.status, minutes_ago: a.mins, site: PP.site(a.siteId).name, zone: PP.place(a.zoneId).name, detail: a.text, route: '#/alerts/' + a.id };
    });
  }
  if (st.level >= 4) {
    var ids = sites.map(function (s) { return s.id; });
    ctx.ai_insights = PP.INSIGHTS.filter(function (i) { return ids.indexOf(i.site) >= 0; }).map(function (i) { return { category: i.cat, title: i.title, detail: i.text, confidence_pct: i.confidence, impact: i.impact }; });
    ctx.interventions = PP.INTERVENTIONS.map(function (x) { return { name: x.name, site: PP.site(x.site).name, completed: x.date, cost_aud: x.cost, metric: x.metric, before: x.before, after: x.after, payback_pct: x.payback }; });
  }
  if (PP.can('reports-lib')) ctx.reports = PP.REPORTS.filter(function (r) { return r.level <= st.level; }).map(function (r) { return { name: r.name, schedule: r.cadence, route: '#/reports/' + r.id }; });
  ctx.other_routes = { home: '#/home', portfolio: '#/portfolio', intelligence: '#/intelligence', scenarios: '#/scenarios', devices: '#/devices', alerts: '#/alerts', reports: '#/reports' };
  return ctx;
};

PP.ai.system = [
  'You are Place Assistant, the AI analyst built into Place Performance, an occupancy and visitation analytics platform by Rayven and ITESA.',
  'You answer questions from people who manage physical places (sites, floors/spaces and zones/rooms) for the customer named in the data.',
  '',
  'How to answer:',
  '- Use only the JSON data supplied with each question. It is live sample data for this prototype. If the data does not contain the answer, say so plainly and suggest which screen would help.',
  '- Lead with the direct answer in the first sentence, then the few numbers that support it. Keep answers under about 150 words unless the user asks for detail.',
  '- Do not use em dashes; use commas, colons or full stops instead.',
  '- Use short paragraphs or a brief bullet list. Use **bold** for the key figure. Avoid tables unless comparing three or more places.',
  '- When you mention a site, floor, zone, device, alert or report, link it with a markdown link to its route from the data, for example [Level 7](#/place/civic/civic-s2). Only use routes that appear in the data.',
  '- When the user says "here" or "this place", they mean place_being_viewed (or the current screen).',
  '- Occupancy above 90% of capacity is crowded, 70-90% busy, under 45% quiet. Percentages and times are local to each site.',
  '- Recommendations should be practical and operational (staffing, opening hours, layout, maintenance) and tied to the numbers.',
  '- The viewer role and subscription level are given. Only discuss data that is present; never invent figures.'
].join('\n');

/* ---------------- Claude call (streaming) ---------------- */
PP.ai.askClaude = async function (onText) {
  var key = PP.ai.getKey();
  var mod = await import(PP.ai.sdkUrl);
  var Anthropic = mod.default;
  var client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  // Send the conversation; the latest question carries a fresh data snapshot.
  var msgs = PP.ai.messages.map(function (m, i) {
    var last = i === PP.ai.messages.length - 1;
    return { role: m.role, content: last ? '<data>\n' + JSON.stringify(PP.ai.context()) + '\n</data>\n\n' + m.content : m.content };
  });
  var stream = client.beta.messages.stream({
    model: PP.ai.model,
    max_tokens: 64000,
    output_config: { effort: 'low' }, // conversational Q&A: fast and concise
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: PP.ai.system,
    messages: msgs
  });
  stream.on('text', onText);
  var final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') throw Object.assign(new Error('refusal'), { kind: 'refusal' });
  return { Anthropic: Anthropic, message: final };
};

/* ---------------- Built-in answers (no key / offline) ---------------- */
PP.ai.localAnswer = function (q) {
  var s = q.toLowerCase(), sites = PP.sites();
  var link = function (pl) { return '[' + pl.name + '](#' + PP.placeRoute(pl) + ')'; };
  var named = sites.filter(function (x) { return s.indexOf(x.name.toLowerCase().split(' ')[0]) >= 0; });
  var here = PP.ai.currentPlace();
  // a named site wins; otherwise questions asked on a place page are about that place unless they say "all sites"
  var scope = named.length ? PP.place(named[0].id) : (here && !/\b(all|across|every|portfolio|sites|which site|what site)\b/.test(s) ? here : null);
  var rows = sites.map(function (x) { var pl = PP.place(x.id); return { pl: pl, st: PP.stats(pl) }; });
  var zonesOf = function (pl) { return pl.zones.map(function (z) { return { z: z, p: z.occ / z.capacity }; }); };

  if (/offline|sensor|device|hardware/.test(s)) {
    if (!(PP.can('device-list') || PP.can('device-health'))) return 'Device health isn\'t available to the ' + PP.ROLES[PP.state.role].short + ' role.';
    var inScope = scope ? scope.zones.map(function (z) { return z.id; }) : null;
    var bad = PP.visibleDevices().filter(function (d) { return d.status !== 'online' && (!inScope || inScope.indexOf(d.zoneId) >= 0); });
    var off = bad.filter(function (d) { return d.status === 'offline'; });
    if (!bad.length) return 'All sensors' + (scope ? ' at ' + link(scope) : '') + ' are online and reporting normally.';
    return '**' + off.length + (off.length === 1 ? ' sensor is' : ' sensors are') + ' offline** and ' + (bad.length - off.length) + ((bad.length - off.length) === 1 ? ' has a warning' : ' have warnings') + (scope ? ' at ' + link(scope) : '') + '.\n\n' +
      (off.length ? off : bad).slice(0, 5).map(function (d) { var z = PP.place(d.zoneId); return '- [' + d.id + '](#/devices/' + d.id + ') · ' + z.site.name + ', ' + z.name + ': ' + (d.issue || d.status); }).join('\n') +
      '\n\nOffline sensors leave gaps in those zones\' counts, so fixing them first keeps the numbers trustworthy.';
  }
  if (/alert/.test(s)) {
    if (!PP.can('notif-feed')) return 'Alerts aren\'t available to the ' + PP.ROLES[PP.state.role].short + ' role.';
    var open = PP.visibleAlerts().filter(function (a) { return a.status === 'open'; });
    return '**' + open.length + ' alerts are open.**\n\n' + open.map(function (a) { return '- [' + a.title + '](#/alerts/' + a.id + ') · ' + PP.site(a.siteId).name + ', ' + PP.place(a.zoneId).name + ' (' + PP.ago(a.mins) + ')'; }).join('\n');
  }
  if (/forecast|predict|next week|expect|coming/.test(s)) {
    var tot = PP.sum(rows.map(function (r) { return PP.sum(PP.series.daily(r.pl, 7)); }));
    return 'Next week looks similar to this one: about **' + PP.fmt(tot * 1.04) + ' visits** across ' + sites.length + ' sites (+4%). Saturday is the busiest day, led by ' + link(rows.slice().sort(function (a, b) { return b.st.visitors - a.st.visitors; })[0].pl) + '.\n\nSee [Executive Intelligence](#/intelligence) for per-site forecasts with confidence ranges.';
  }
  if (/when|peak|busiest time|what time|quietest time/.test(s)) {
    var pl = scope || here || rows[0].pl, heat = PP.series.heat(pl), days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var flat = []; heat.forEach(function (row, d) { row.forEach(function (v, h) { flat.push({ v: v, d: d, h: h }); }); });
    flat.sort(function (a, b) { return b.v - a.v; });
    var quiet = flat.filter(function (x) { return x.h >= 9 && x.h <= 17; }).pop();
    return link(pl) + ' is busiest on **' + days[flat[0].d] + ' around ' + PP.hourLabel(flat[0].h) + '**. The quietest daytime slot is ' + days[quiet.d] + ' at ' + PP.hourLabel(quiet.h) + '.\n\nThat\'s a good window for cleaning, maintenance or reduced staffing.';
  }
  if (/dwell|how long|stay/.test(s)) {
    return 'Average dwell by site:\n\n' + rows.slice().sort(function (a, b) { return b.st.dwell - a.st.dwell; }).map(function (r) { return '- ' + link(r.pl) + ': **' + PP.mins(r.st.dwell) + '**'; }).join('\n');
  }
  if (/recommend|should|improve|focus|action|advice|priorit/.test(s)) {
    var ins = PP.INSIGHTS.filter(function (i) { return sites.some(function (x) { return x.id === i.site; }); }).slice(0, 3);
    return 'Three things worth acting on:\n\n' + ins.map(function (i, n) { return (n + 1) + '. **' + i.title + '** · ' + i.impact + ' (' + i.confidence + '% confidence).'; }).join('\n') + '\n\nThe evidence for each is in [Executive Intelligence](#/intelligence).';
  }
  if (/score|perform|best|worst|rank|underperform|compare/.test(s)) {
    var r = rows.slice().sort(function (a, b) { return b.st.score - a.st.score; });
    return '**' + r[0].pl.name + '** is the top performer (score ' + r[0].st.score + '), and **' + r[r.length - 1].pl.name + '** is the weakest (' + r[r.length - 1].st.score + ').\n\n' + r.map(function (x) { return '- ' + link(x.pl) + ': ' + x.st.score + ' · ' + (x.st.visitorsDelta >= 0 ? '+' : '') + PP.fmt1(x.st.visitorsDelta) + '% visits vs last week'; }).join('\n');
  }
  if (/zone|room|floor|over capacity|crowded|full/.test(s)) {
    var pool = scope ? zonesOf(scope) : [].concat.apply([], rows.map(function (x) { return zonesOf(x.pl); }));
    pool.sort(function (a, b) { return b.p - a.p; });
    var hot = pool.slice(0, 5);
    return 'The fullest zones' + (scope ? ' at ' + link(scope) : '') + ' right now:\n\n' + hot.map(function (h) { var p = PP.place(h.z.id); return '- ' + link(p) + ' (' + p.site.name + ', ' + p.space.name + '): **' + h.z.occ + '/' + h.z.capacity + '** · ' + PP.pct(h.p * 100); }).join('\n') +
      (hot[0].p > 0.9 ? '\n\n' + hot[0].z.name + ' is over 90%, consider redirecting people or opening overflow space.' : '');
  }
  if (/quiet|least|empty/.test(s)) {
    var q2 = rows.slice().sort(function (a, b) { return a.st.occPct - b.st.occPct; })[0];
    return 'The quietest site right now is ' + link(q2.pl) + ' at **' + PP.pct(q2.st.occPct * 100) + '** of capacity (' + q2.st.occ + ' people).';
  }
  if (named.length || /busy|people|occupancy|visitors|how many|footfall|now|full/.test(s)) {
    if (scope) {
      var x = PP.stats(scope);
      return link(scope) + ' has **' + PP.fmt(x.occ) + ' people** right now · ' + PP.pct(x.occPct * 100) + ' of its ' + PP.fmt(x.cap) + ' capacity. It has had ' + PP.fmt(x.visitors) + ' visitors today (' + (x.visitorsDelta >= 0 ? '+' : '') + PP.fmt1(x.visitorsDelta) + '% vs last week), staying ' + PP.mins(x.dwell) + ' on average.';
    }
    var b = rows.slice().sort(function (a, c) { return c.st.occPct - a.st.occPct; });
    return '**' + b[0].pl.name + '** is the busiest site right now at ' + PP.pct(b[0].st.occPct * 100) + ' of capacity. Across all sites there are **' + PP.fmt(PP.sum(rows.map(function (r) { return r.st.occ; }))) + ' people** on site and ' + PP.fmt(PP.sum(rows.map(function (r) { return r.st.visitors; }))) + ' visitors so far today.\n\n' + b.map(function (r) { return '- ' + link(r.pl) + ': ' + PP.pct(r.st.occPct * 100) + ' full · ' + PP.fmt(r.st.visitors) + ' visitors'; }).join('\n');
  }
  return 'I can answer questions about occupancy, visitors, peak times, dwell, zones, devices, alerts, forecasts and performance across your sites. Try one of the suggestions below.\n\n_Built-in answers are active. Add an Anthropic API key in settings for free-form answers from Claude._';
};

/* ---------------- Rendering ---------------- */
PP.ai.md = function (text) {
  var esc = PP.esc(text);
  var inline = function (t) {
    return t.replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>')
      .replace(/(^|\s)_([^_\n]+)_/g, '$1<i>$2</i>')
      .replace(/\[([^\]]+)\]\((#\/[^)\s]+|https:\/\/[^)\s]+)\)/g, function (m, label, href) {
        return href.charAt(0) === '#' ? '<a href="' + href + '" class="ai-link">' + label + '</a>' : '<a href="' + href + '" target="_blank" rel="noopener">' + label + '</a>';
      });
  };
  var out = [], list = null, table = null;
  var flushList = function () { if (list) { out.push('<' + list.tag + '>' + list.items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</' + list.tag + '>'); list = null; } };
  var flushTable = function () {
    if (!table) return;
    var rows = table.filter(function (r) { return !/^\s*\|?\s*:?-{2,}/.test(r); }).map(function (r) { return r.replace(/^\s*\||\|\s*$/g, '').split('|').map(function (c) { return inline(c.trim()); }); });
    out.push('<div class="tbl-wrap"><table class="tbl ai-tbl"><thead><tr>' + rows[0].map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.slice(1).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
    table = null;
  };
  esc.split('\n').forEach(function (line) {
    var ul = line.match(/^\s*[-*•]\s+(.*)/), ol = line.match(/^\s*\d+[.)]\s+(.*)/), h = line.match(/^#{1,4}\s+(.*)/);
    if (/^\s*\|.*\|\s*$/.test(line)) { flushList(); (table = table || []).push(line); return; }
    flushTable();
    if (ul || ol) {
      var tag = ul ? 'ul' : 'ol';
      if (!list || list.tag !== tag) { flushList(); list = { tag: tag, items: [] }; }
      list.items.push((ul || ol)[1]); return;
    }
    flushList();
    if (h) out.push('<h4>' + inline(h[1]) + '</h4>');
    else if (line.trim()) out.push('<p>' + inline(line) + '</p>');
  });
  flushList(); flushTable();
  return out.join('');
};

PP.ai.suggestions = function () {
  var here = PP.ai.currentPlace(), scr = PP.current ? PP.current.route.screen : 'home';
  if (here) return ['How busy is ' + here.name + ' right now?', 'When is ' + here.name + ' busiest?', 'Which zones are closest to capacity?', 'Any sensor problems here?'];
  if (scr === 'portfolio') return ['Which site is underperforming and why?', 'Compare visitation week on week', 'Which sites need attention?'];
  if (scr === 'devices') return ['Which sensors are offline?', 'Which site has the most device issues?'];
  if (scr === 'alerts') return ['Summarise the open alerts', 'Which alerts need action first?'];
  if (scr === 'intel' || scr === 'scenarios') return ['What should I focus on this week?', 'What does the forecast say for next week?'];
  return ['Which site is busiest right now?', 'Which rooms are over capacity?', 'What should I focus on this week?', 'Are any sensors offline?'];
};

PP.ai.render = function () {
  var root = document.getElementById('ai-root');
  if (!root) { root = document.createElement('div'); root.id = 'ai-root'; document.body.appendChild(root); }
  var a = PP.ai, hasKey = !!a.getKey(), ok = PP.can('ask-ai');
  var here = a.currentPlace();
  var ctxLabel = here ? here.name : PP.current ? PP.screen(PP.current.route.screen).name : 'Home';
  var body;
  if (!PP.roleOk('ask-ai')) {
    body = '<div class="ai-empty">' + PP.icon('lock', 'ico') + '<b>Not available to this role</b><p>The assistant is for customer users.</p></div>';
  } else if (!ok) {
    body = '<div class="ai-empty"><div class="ai-orb">' + PP.icon('sparkle', 'ico') + '</div><b>Ask questions about your places</b><p>Place Assistant answers questions in plain language using your live data. It\'s part of ' + PP.levelName(4) + '.</p><button class="btn btn-primary" data-action="set-level" data-level="4">Preview at Level 4</button></div>';
  } else if (a.settings) {
    body = '<div class="ai-settings"><b>Claude connection</b><p class="small muted">Answers come from <b>Claude Opus 5.5</b> through the Anthropic API. Your key is stored only in this browser and sent only to api.anthropic.com. For a prototype only, a production build would call Claude from a server.</p>' +
      '<label class="field"><span>Anthropic API key</span><input class="input mono" type="password" id="ai-key" placeholder="sk-ant-…" value="' + PP.esc(a.getKey()) + '" autocomplete="off"></label>' +
      '<div class="row mt-s"><button class="btn btn-primary btn-sm" data-action="ai-key-save">Save</button>' + (hasKey ? '<button class="btn btn-sm btn-danger" data-action="ai-key-clear">Remove key</button>' : '') + '<button class="btn btn-sm btn-ghost" data-action="ai-settings">Back</button></div>' +
      '<p class="tiny muted mt">Without a key, built-in answers computed from the same data are used.</p></div>';
  } else {
    var msgs = a.messages.map(function (m, i) {
      if (m.role === 'user') return '<div class="ai-msg me"><div class="ai-bubble">' + PP.esc(m.content) + '</div></div>';
      return '<div class="ai-msg bot"><div class="ai-av">' + PP.icon('sparkle', 'ico') + '</div><div class="ai-ans"' + (i === a.messages.length - 1 && a.busy ? ' id="ai-live"' : '') + '>' + (m.content ? PP.ai.md(m.content) : '<span class="ai-typing"><i></i><i></i><i></i></span>') +
        (m.note ? '<div class="ai-note">' + m.note + '</div>' : '') + '</div></div>';
    }).join('');
    var welcome = !a.messages.length ? '<div class="ai-hello"><div class="ai-orb">' + PP.icon('sparkle', 'ico') + '</div><h3>Ask about your places</h3><p>Occupancy, visitors, peak times, zones, sensors, alerts and forecasts, answered from your live data.</p></div>' : '';
    body = '<div class="ai-thread" id="ai-thread">' + welcome + msgs + '</div>' +
      '<div class="ai-suggest">' + PP.ai.suggestions().map(function (q) { return '<button class="ai-chip" data-action="ai-ask" data-q="' + PP.esc(q) + '">' + PP.esc(q) + '</button>'; }).join('') + '</div>' +
      '<form class="ai-input" id="ai-form"><textarea id="ai-q" rows="1" placeholder="Ask anything about ' + PP.esc(ctxLabel) + '…"' + (a.busy ? ' disabled' : '') + '></textarea><button class="ai-send" type="submit" aria-label="Send"' + (a.busy ? ' disabled' : '') + '>' + PP.icon('trend', 'ico') + '</button></form>';
  }
  root.innerHTML = '<aside class="ai-panel' + (a.open ? ' open' : '') + '" aria-label="Place Assistant">' +
    '<div class="ai-head"><div class="ai-title">' + PP.icon('sparkle', 'ico') + 'Place Assistant</div>' +
    '<span class="ai-src ' + (hasKey ? 'live' : '') + '" title="' + (hasKey ? 'Answers from Claude Opus 5.5' : 'Built-in answers, add an API key in settings') + '">' + (hasKey ? 'Claude' : 'Demo') + '</span>' +
    (ok ? '<button class="ai-icon" data-action="ai-settings" title="Settings">' + PP.icon('settings', 'ico') + '</button>' + (a.messages.length ? '<button class="ai-icon" data-action="ai-clear" title="New conversation">' + PP.icon('refresh', 'ico') + '</button>' : '') : '') +
    '<button class="ai-icon" data-action="ai-toggle" title="Close">' + PP.icon('close', 'ico') + '</button></div>' +
    (ok && !a.settings ? '<div class="ai-ctx">' + PP.icon('eye', 'ico') + 'Looking at <b>' + PP.esc(ctxLabel) + '</b>' + PP.featureChips('ask-ai') + '</div>' : '') +
    body + '</aside>';
  document.body.classList.toggle('ai-open', a.open);
  var th = document.getElementById('ai-thread'); if (th) th.scrollTop = th.scrollHeight;
  var form = document.getElementById('ai-form');
  if (form) {
    var ta = document.getElementById('ai-q');
    form.addEventListener('submit', function (e) { e.preventDefault(); PP.ai.ask(ta.value); });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); PP.ai.ask(ta.value); } });
    ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; });
    if (a.open && !a.busy) setTimeout(function () { ta.focus(); }, 50);
  }
};

/* ---------------- Asking ---------------- */
PP.ai.ask = async function (q) {
  q = (q || '').trim();
  var a = PP.ai;
  if (!q || a.busy || !PP.can('ask-ai')) return;
  a.messages.push({ role: 'user', content: q });
  var reply = { role: 'assistant', content: '' };
  a.messages.push(reply);
  a.busy = true;
  PP.ai.render();
  var paint = function () {
    var el = document.getElementById('ai-live');
    if (el) el.innerHTML = PP.ai.md(reply.content) || '<span class="ai-typing"><i></i><i></i><i></i></span>';
    var th = document.getElementById('ai-thread'); if (th) th.scrollTop = th.scrollHeight;
  };
  var useDemo = function (note) {
    reply.content = PP.ai.localAnswer(q);
    reply.source = 'demo';
    if (note) reply.note = note;
  };
  if (!a.getKey()) {
    await new Promise(function (r) { setTimeout(r, 450); }); // brief "thinking" pause for the demo answers
    useDemo();
  } else {
    var pending = false;
    try {
      // the API needs strictly alternating turns: send history without the empty reply placeholder
      a.messages.pop();
      var res = await PP.ai.askClaude(function (delta) {
        reply.content += delta;
        if (!pending) { pending = true; requestAnimationFrame(function () { pending = false; paint(); }); }
      });
      a.messages.push(reply);
      reply.source = 'claude';
      void res;
    } catch (err) {
      if (a.messages[a.messages.length - 1] !== reply) a.messages.push(reply);
      var status = err && err.status;
      var why = err && err.kind === 'refusal' ? 'Claude declined this question'
        : status === 401 ? 'The API key was rejected'
        : status === 429 ? 'Rate limited by the API'
        : status >= 500 ? 'The API is temporarily unavailable'
        : /import|Failed to fetch|NetworkError|module/i.test(String(err && err.message)) ? 'Couldn\'t reach Claude (offline?)'
        : 'Claude request failed';
      reply.content = '';
      useDemo(why + ', showing a built-in answer instead.');
    }
  }
  a.busy = false;
  PP.ai.render();
};

PP.actions['ai-toggle'] = function () { PP.ai.open = !PP.ai.open; PP.ai.settings = false; PP.ai.render(); };
PP.actions['ai-ask'] = function (el) { PP.ai.ask(el.getAttribute('data-q')); };
PP.actions['ai-clear'] = function () { if (!PP.ai.busy) { PP.ai.messages = []; PP.ai.render(); } };
PP.actions['ai-settings'] = function () { PP.ai.settings = !PP.ai.settings; PP.ai.render(); };
PP.actions['ai-key-save'] = function () {
  var v = (document.getElementById('ai-key').value || '').trim();
  PP.ai.setKey(v); PP.ai.settings = false; PP.ai.render();
  PP.toast(v ? 'Connected, answers now come from Claude' : 'Key cleared');
  var btn = document.querySelector('.ai-btn .ai-src'); if (btn) btn.textContent = v ? 'Claude' : '';
};
PP.actions['ai-key-clear'] = function () { PP.ai.setKey(''); PP.ai.settings = false; PP.ai.render(); PP.toast('Key removed, using built-in answers'); };

// keep the context label and suggestions in step with navigation; Ctrl/Cmd+J toggles the panel
window.addEventListener('hashchange', function () { setTimeout(PP.ai.render, 0); });
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) { e.preventDefault(); PP.actions['ai-toggle'](); }
});
