"""Animated isometric scene illustrations (original artwork, generated as inline SVG).

Each scene is a light-grey isometric space with shaded 3D boxes, walking people,
a labelled 3D people counter with its count zone, IN/OUT pop-ups timed to people
crossing the zone, animated flow arrows and live badges.
"""
import math

C30 = math.cos(math.radians(30))
INK = '#0a2540'
ACC = '#635bff'
P1, P2 = '#a9b2bd', '#8e98a5'   # person tones


def f2(v):
    return ('%.1f' % v).rstrip('0').rstrip('.')


class Scene:
    def __init__(self, sid, W=16, D=12, S=25.5, w=720, h=500, oy=118, floor='#f4f6f9', grid='#e7ebf1'):
        self.sid, self.W, self.D, self.S, self.w, self.h = sid, W, D, S, w, h
        self.ox = w / 2 - (W - D) / 2 * S * C30
        self.oy = oy
        self.layers = {k: [] for k in ('floor', 'zone', 'back', 'people', 'front', 'labels')}
        self.defs = []
        self.n = 0
        self.k = S / 22.0
        self._floor(floor, grid)

    # ---------------- geometry ----------------
    def p(self, x, y, z=0):
        return (self.ox + (x - y) * self.S * C30, self.oy + (x + y) * self.S * 0.5 - z * self.S)

    def poly(self, pts, fill, extra=''):
        return '<polygon points="%s" fill="%s"%s/>' % (' '.join('%s,%s' % (f2(a), f2(b)) for a, b in pts), fill, extra)

    def _floor(self, fill, grid):
        W, D = self.W, self.D
        out = [self.poly([self.p(0, 0), self.p(W, 0), self.p(W, D), self.p(0, D)], fill)]
        for i in range(1, W):
            a, b = self.p(i, 0), self.p(i, D)
            out.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="1"/>' % (f2(a[0]), f2(a[1]), f2(b[0]), f2(b[1]), grid))
        for j in range(1, D):
            a, b = self.p(0, j), self.p(W, j)
            out.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="1"/>' % (f2(a[0]), f2(a[1]), f2(b[0]), f2(b[1]), grid))
        self.layers['floor'].append(''.join(out))

    def patch(self, x, y, w, d, fill, extra=''):
        """Coloured floor area (rug, grass, path)."""
        self.layers['floor'].append(self.poly([self.p(x, y), self.p(x + w, y), self.p(x + w, y + d), self.p(x, y + d)], fill, extra))

    def box(self, x, y, z, w, d, h, tone=('#ffffff', '#eef1f5', '#dfe5ec'), layer='back', shadow=True, extra_top=''):
        top, left, right = tone
        out = []
        if shadow and z == 0:
            out.append(self.poly([self.p(x + .25, y + .25), self.p(x + w + .5, y + .25), self.p(x + w + .5, y + d + .5), self.p(x + .25, y + d + .5)], '#0a2540', ' opacity=".05"'))
        out.append(self.poly([self.p(x, y + d, z), self.p(x + w, y + d, z), self.p(x + w, y + d, z + h), self.p(x, y + d, z + h)], left))
        out.append(self.poly([self.p(x + w, y, z), self.p(x + w, y + d, z), self.p(x + w, y + d, z + h), self.p(x + w, y, z + h)], right))
        out.append(self.poly([self.p(x, y, z + h), self.p(x + w, y, z + h), self.p(x + w, y + d, z + h), self.p(x, y + d, z + h)], top, extra_top))
        self.layers[layer].append(''.join(out))

    def glass(self, x, y, w, d, h, layer='back'):
        """Glass-walled room: translucent faces and a light frame."""
        g = ' fill-opacity=".35" stroke="#c9d6e6" stroke-width="1"'
        out = [self.poly([self.p(x, y + d), self.p(x + w, y + d), self.p(x + w, y + d, h), self.p(x, y + d, h)], '#dbe8f6', g),
               self.poly([self.p(x + w, y), self.p(x + w, y + d), self.p(x + w, y + d, h), self.p(x + w, y, h)], '#cfdff0', g)]
        self.layers[layer].append(''.join(out))

    def tree(self, x, y, r=1.1, h=2.4, layer='back'):
        bx, by = self.p(x, y)
        tx, ty = self.p(x, y, h)
        gid = '%s-tr' % self.sid
        if not any(gid in d for d in self.defs):
            self.defs.append('<radialGradient id="%s" cx=".35" cy=".35"><stop offset="0" stop-color="#d7ead2"/><stop offset="1" stop-color="#a9c9a1"/></radialGradient>' % gid)
        self.layers[layer].append('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="#0a2540" opacity=".07"/><rect x="%s" y="%s" width="4" height="%s" fill="#b9a99a"/><circle cx="%s" cy="%s" r="%s" fill="url(#%s)"/>' % (
            f2(bx + 6), f2(by + 2), f2(r * self.S * .9), f2(r * self.S * .45), f2(bx - 2), f2(ty), f2(by - ty), f2(tx), f2(ty - r * self.S * .4), f2(r * self.S), gid))

    # ---------------- sensing ----------------
    def zone(self, x, y, w, d, label=None):
        pts = [self.p(x, y), self.p(x + w, y), self.p(x + w, y + d), self.p(x, y + d)]
        self.layers['zone'].append(self.poly(pts, ACC, ' fill-opacity=".10" stroke="%s" stroke-width="1.6" stroke-dasharray="6 5"' % ACC))
        cx, cy = self.p(x + w / 2, y + d / 2)
        self.layers['zone'].append('<g fill="none" stroke="%s" stroke-width="2.2" stroke-linecap="round" opacity=".55"><path d="M%s %sl-14 7m14 -7l-5 -3m5 3l-2 5"/><path d="M%s %sl14 -7m-14 7l5 3m-5 -3l2 -5"/></g>' % (
            ACC, f2(cx + 4), f2(cy - 6), f2(cx - 4), f2(cy + 6)))

    def sensor(self, x, y, z=3.6, label='3D people counter', beam=None):
        """Ceiling sensor with pulsing beam onto beam=(x,y,w,d) and a dark label tag."""
        if beam:
            bx, by, bw, bd = beam
            s = self.p(x + .3, y + .3, z)
            pts = [s, self.p(bx, by + bd), self.p(bx + bw, by + bd), self.p(bx + bw, by)]
            self.layers['labels'].append('<polygon points="%s" fill="%s" opacity=".08"><animate attributeName="opacity" values=".04;.13;.04" dur="2.4s" repeatCount="indefinite"/></polygon>' % (' '.join('%s,%s' % (f2(a), f2(b)) for a, b in pts), ACC))
        self.box(x, y, z, .9, .6, .35, ('#3b4656', '#232c38', '#151b23'), layer='labels', shadow=False)
        if label:
            tx, ty = self.p(x + .45, y + .3, z + 1.0)
            wpx = 8 + len(label) * 6.6
            self.layers['labels'].append(
                '<g transform="translate(%s %s)"><rect x="%s" y="-26" width="%s" height="24" rx="6" fill="#1f2937"/><path d="M-5 -2h10l-5 6z" fill="#1f2937"/>'
                '<text x="0" y="-10" text-anchor="middle" fill="#fff" font-size="11.5" font-weight="600">%s</text></g>' % (f2(tx), f2(ty), f2(-wpx / 2), f2(wpx), label))

    def pop(self, x, y, z, text, color, dur, begin, f):
        """Text that pops up at fraction f of a walker's cycle (synchronised with its crossing)."""
        a = max(0.0, min(f, .97))
        b, c, d = min(a + .01, .98), min(a + .14, .99), min(a + .18, .995)
        kt = '0;%.3f;%.3f;%.3f;%.3f;1' % (a, b, c, d)
        tx, ty = self.p(x, y, z)
        self.layers['labels'].append(
            '<text x="%s" y="%s" text-anchor="middle" font-size="15" font-weight="800" fill="%s" opacity="0">%s'
            '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="%s" dur="%ss" begin="%ss" repeatCount="indefinite"/>'
            '<animateTransform attributeName="transform" type="translate" values="0 6;0 6;0 0;0 -8;0 -10;0 -10" keyTimes="%s" dur="%ss" begin="%ss" repeatCount="indefinite"/></text>' % (
                f2(tx), f2(ty), color, text, kt, f2(dur), f2(begin), kt, f2(dur), f2(begin)))

    # ---------------- people ----------------
    def _person(self, k=1.0, walk=True, tone=(P1, P2)):
        c1, c2 = tone
        leg = lambda dx, phase: ('<rect x="%s" y="-17" width="3.4" height="17" rx="1.6" fill="%s">%s</rect>' % (
            f2(dx), c2, '<animateTransform attributeName="transform" type="rotate" values="%s" dur=".75s" repeatCount="indefinite"/>' % (
                '16 0 -16;-16 0 -16;16 0 -16' if phase else '-16 0 -16;16 0 -16;-16 0 -16') if walk else ''))
        return ('<g transform="scale(%s)"><ellipse cx="0" cy="0" rx="7" ry="3" fill="#0a2540" opacity=".09"/>%s%s'
                '<rect x="-5.2" y="-32" width="10.4" height="17" rx="4.5" fill="%s"/><circle cx="0" cy="-36.5" r="4.7" fill="%s"/></g>') % (
            f2(k), leg(-3.6, True), leg(.2, False), c1, c1)

    def _rider(self, k=1.0):
        w = '<circle cx="%s" cy="-6" r="6" fill="none" stroke="%s" stroke-width="1.8"/>'
        return ('<g transform="scale(%s)"><ellipse cx="0" cy="0" rx="13" ry="3" fill="#0a2540" opacity=".09"/>' % f2(k) +
                w % (-9, P2) + w % (9, P2) +
                '<path d="M-9 -6 L-2 -15 L6 -15 L9 -6 M-2 -15 L1 -6" fill="none" stroke="%s" stroke-width="1.8"/>' % P2 +
                '<rect x="-6" y="-33" width="9" height="16" rx="4" fill="%s" transform="rotate(14 -2 -25)"/><circle cx="2" cy="-37" r="4.5" fill="%s"/></g>' % (P1, P1))

    def walker(self, pts, dur, begin=0.0, kind='person', count=None, k=1.0):
        """Animate a person along world points. count=(zone_y_or_x_fraction, text, color, (x,y,z)) pops a label when crossing."""
        sp = [self.p(x, y) for x, y in pts]
        path = 'M' + ' L'.join('%s %s' % (f2(a), f2(b)) for a, b in sp)
        body = self._rider(k * self.k) if kind == 'bike' else self._person(k * self.k)
        self.layers['people'].append(
            '<g opacity="0">%s<animateMotion path="%s" dur="%ss" begin="%ss" repeatCount="indefinite"/>'
            '<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.07;.93;1" dur="%ss" begin="%ss" repeatCount="indefinite"/></g>' % (
                body, path, f2(dur), f2(begin), f2(dur), f2(begin)))
        if count:
            f, text, color, at = count
            self.pop(at[0], at[1], at[2], text, color, dur, begin, f)

    def person(self, x, y, z=0, seated=False, k=1.0, tone=(P1, P2)):
        sx, sy = self.p(x, y, z)
        if seated:
            g = ('<g transform="translate(%s %s) scale(%s)"><rect x="-5" y="-18" width="10" height="13" rx="4.5" fill="%s"/><circle cx="0" cy="-22.5" r="4.6" fill="%s"/></g>' % (
                f2(sx), f2(sy), f2(k * self.k), tone[0], tone[0]))
        else:
            g = '<g transform="translate(%s %s)">%s</g>' % (f2(sx), f2(sy), self._person(k * self.k, walk=False, tone=tone))
        self.layers['people'].append(g)

    # ---------------- annotation ----------------
    def flow(self, pts, layer='zone', width=7, opacity=.55):
        sp = [self.p(x, y) for x, y in pts]
        d = 'M%s %s' % (f2(sp[0][0]), f2(sp[0][1]))
        for i in range(1, len(sp) - 1):
            mx, my = (sp[i][0] + sp[i + 1][0]) / 2, (sp[i][1] + sp[i + 1][1]) / 2
            d += ' Q%s %s %s %s' % (f2(sp[i][0]), f2(sp[i][1]), f2(mx), f2(my))
        d += ' L%s %s' % (f2(sp[-1][0]), f2(sp[-1][1]))
        mid = '%s-ah' % self.sid
        if not any(mid in x for x in self.defs):
            self.defs.append('<marker id="%s" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#60a5fa"/></marker>' % mid)
        self.layers[layer].append('<path d="%s" fill="none" stroke="#60a5fa" stroke-width="%s" stroke-linecap="round" opacity="%s" class="iflow" marker-end="url(#%s)"/>' % (d, width, opacity, mid))

    def badge(self, x, y, z, title, value, color='#10b981', pulse=False, inc=None, tick=None):
        """White floating card with a coloured dot. inc=(period_s, first_s, start) makes value a live counter."""
        tx, ty = self.p(x, y, z)
        wpx = max(len(title), len(value) + 2) * 6.7 + 34
        val = value
        if inc:
            val = '<tspan data-inc="%s,%s">%s</tspan>' % (f2(inc[0]), f2(inc[1]), value)
        elif tick:
            val = '<tspan class="js-tick" data-base="%s" data-jitter="%s">%s</tspan>%s' % (tick[0], tick[1], tick[2], tick[3] if len(tick) > 3 else '')
        dot = '<circle cx="14" cy="15" r="4" fill="%s">%s</circle>' % (color, '<animate attributeName="r" values="4;6;4" dur="1.4s" repeatCount="indefinite"/>' if pulse else '')
        self.layers['labels'].append(
            '<g transform="translate(%s %s)" class="ibadge"><rect x="0" y="0" width="%s" height="42" rx="9" fill="#fff" filter="url(#%s-sh)"/>%s'
            '<text x="26" y="18" font-size="11" fill="#6b7c93">%s</text><text x="26" y="34" font-size="13.5" font-weight="700" fill="%s">%s</text></g>' % (
                f2(tx - wpx / 2), f2(ty - 21), f2(wpx), self.sid, dot, title, INK, val))

    def tag(self, x, y, z, text, color=ACC):
        tx, ty = self.p(x, y, z)
        wpx = len(text) * 6.4 + 18
        self.layers['labels'].append('<g transform="translate(%s %s)"><rect x="0" y="0" width="%s" height="22" rx="6" fill="%s"/><text x="%s" y="15" text-anchor="middle" font-size="11.5" font-weight="600" fill="#fff">%s</text></g>' % (
            f2(tx - wpx / 2), f2(ty - 11), f2(wpx), color, f2(wpx / 2), text))

    def render(self, title, caption=''):
        self.defs.append('<filter id="%s-sh" x="-20%%" y="-30%%" width="140%%" height="170%%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0a2540" flood-opacity=".14"/></filter>' % self.sid)
        body = ''.join(''.join(self.layers[k]) for k in ('floor', 'zone', 'back', 'people', 'front', 'labels'))
        return ('<figure class="illus"><svg viewBox="0 0 %d %d" role="img" aria-label="%s" font-family="Inter, -apple-system, Segoe UI, sans-serif"><title>%s</title><defs>%s</defs>%s</svg>%s</figure>' % (
            self.w, self.h, title, title, ''.join(self.defs), body, ('<figcaption>%s</figcaption>' % caption) if caption else ''))


WALL = ('#ffffff', '#f2f4f8', '#e4e9f0')
SHELF = ('#f7f3ee', '#e9e1d6', '#d9cfc2')
TABLE = ('#ffffff', '#e8ecf2', '#d6dde7')
DARK = ('#e9edf3', '#d5dce6', '#c4cdd9')


def back_walls(s, h=4.2):
    s.box(0, -0.4, 0, s.W, .4, h, WALL, shadow=False)
    s.box(-0.4, -0.4, 0, .4, s.D + .4, h, WALL, shadow=False)


# =====================================================================
# Scenes
# =====================================================================

def entrance():
    s = Scene('ie')
    back_walls(s)
    # two shop units either side of a doorway in the back wall
    s.box(.6, 0, 0, 6, 1.6, 3.4, WALL)
    s.box(10.4, 0, 0, 5, 1.6, 3.4, WALL)
    s.box(1.2, 1.6, 0, 4.6, .05, 2.6, ('#e8f0fa', '#dce8f6', '#cfdff0'), shadow=False)
    s.box(11, 1.6, 0, 3.8, .05, 2.6, ('#e8f0fa', '#dce8f6', '#cfdff0'), shadow=False)
    for x in (2, 3.4, 4.8):
        s.person(x, 1.2, 0, tone=('#e4e8ee', '#d6dce4'))
    s.zone(7, 2.2, 3, 3)
    s.sensor(8.1, 3.2, 3.6, beam=(7, 2.2, 3, 3))
    D = 8.0
    s.walker([(8, 12.5), (8.3, 3.7), (8.4, .5)], D, 0, count=(.70, 'IN +1', '#16a34a', (6.6, 3.2, 2.2)))
    s.walker([(9.4, .5), (9.6, 3.7), (10.6, 12.5)], D, -3.5, count=(.25, 'OUT +1', ACC, (11.3, 4.2, 2.2)))
    s.walker([(-.5, 8), (16.5, 8.6)], 11, -2)
    s.walker([(16.5, 10), (-.5, 9.4)], 12, -7)
    s.walker([(8.6, 12.5), (8.7, .5)], D, -6, count=(.70, 'IN +1', '#16a34a', (6.6, 3.2, 2.2)))
    s.badge(13.2, 6.2, 2.4, 'In today', '1,284', '#16a34a', inc=(D / 2, 0.70 * D))
    s.badge(13.4, 9.6, 1.6, 'Out today', '1,197', ACC, inc=(D, 0.25 * D + 3.5))
    return s.render('Animated illustration of a 3D people counter above a doorway counting people in and out', 'Entrance counting: people in and out, processed on the device.')


def library():
    s = Scene('il')
    back_walls(s)
    for i in range(4):
        s.box(.6 + i * 1.8, .3, 0, 1.3, 1.2, 2.4, SHELF)
    s.box(.2, 3.2, 0, .9, 5, 2.4, SHELF)
    s.patch(2.4, 6.4, 5.4, 4.6, '#fde7e4')
    s.patch(2.4, 6.4, 5.4, 4.6, 'none', ' stroke="#f19c90" stroke-width="1.5" stroke-dasharray="5 4"')
    for (x, y) in ((3.6, 7.6), (5.0, 8.3), (4.0, 9.6), (6.2, 7.4), (6.6, 9.8), (3.2, 10.2), (5.6, 10.4)):
        s.person(x, y, 0, seated=True, k=.85)
    for (x, y) in ((9.6, 2.8), (12.6, 2.8), (9.6, 6.2), (12.6, 6.2)):
        s.box(x, y, 0, 2.2, 1.4, .75, TABLE)
        s.person(x + .5, y + .4, .75, seated=True, k=.85)
        s.person(x + 1.6, y + 1.0, .75, seated=True, k=.85)
    s.zone(13, 9, 2.6, 2.6)
    s.sensor(14, 9.9, 3.6, beam=(13, 9, 2.6, 2.6))
    s.flow([(14.2, 10.2), (11, 9.2), (7.8, 8.6)], width=6)
    s.flow([(14.6, 9.4), (14.2, 7.6), (12.4, 5.4)], width=6)
    D = 9.0
    s.walker([(17, 13.2), (14.3, 10.3), (9.8, 9.0)], D, 0, count=(.3, 'IN +1', '#16a34a', (16.3, 9.6, 2.3)))
    s.walker([(9.6, 8.6), (14.0, 9.8), (17, 13.6)], D, -4.5, count=(.62, 'OUT +1', ACC, (16.6, 11.4, 2.0)))
    s.walker([(8.8, 4.6), (8.4, 8.0), (2.0, 12.6)], 12, -3)
    s.badge(5.0, 8.6, 3.0, "Children's Area", '29 / 30 · 97%', '#ef4444', pulse=True)
    s.badge(11.2, 4.4, 3.0, 'Reading Room', '18 / 32 · 58%', '#10b981')
    s.badge(3.4, 1.6, 3.6, 'Visits today', '2,416', ACC, inc=(D, .3 * D))
    return s.render('Animated illustration of a library with live occupancy in the children\'s area and reading room', 'Libraries: visits at the door and live occupancy in every zone.')


def shopping():
    s = Scene('is')
    back_walls(s, 4.6)
    for x0 in (.4, 5.6, 10.8):
        s.box(x0, 0, 0, 4.6, 2.2, 3.6, WALL)
        s.box(x0 + .5, 2.2, 0, 3.6, .05, 2.6, ('#e8f0fa', '#dce8f6', '#cfdff0'), shadow=False)
    for y0 in (3.2, 7.6):
        s.box(0, y0, 0, 2.2, 4, 3.6, WALL)
    for x0 in (4.0, 9.6):
        s.box(x0, 6.6, 0, 2.4, 1.6, .9, DARK)
    s.zone(6.4, 9.6, 3.2, 2.4)
    s.sensor(7.6, 10.4, 3.8, beam=(6.4, 9.6, 3.2, 2.4))
    s.flow([(8, 11.5), (8.2, 5.4), (12.6, 3.6)], width=7)
    s.flow([(3.6, 4.6), (7.2, 4.4), (8.6, 11.6)], width=7)
    s.flow([(15.6, 5.2), (11.6, 4.2), (6.6, 3.6), (3.2, 6.2)], width=6, opacity=.4)
    D = 10.0
    s.walker([(8.4, 13.2), (8.3, 5.2), (13.2, 3.4)], D, 0, count=(.18, 'IN +1', '#16a34a', (5.4, 10.6, 2.2)))
    s.walker([(3.2, 4.4), (7.6, 4.6), (8.0, 13.2)], D, -5, count=(.86, 'OUT +1', ACC, (10.8, 11.2, 2.2)))
    s.walker([(16.4, 5.2), (2.6, 4.6)], 12, -2)
    s.walker([(3.0, 5.6), (15.8, 5.8)], 13, -8)
    s.person(5.0, 3.0, 0)
    s.person(12.0, 2.9, 0)
    s.badge(12.4, 3.2, 4.4, 'Average dwell', '00:45', '#f59e0b')
    s.badge(13.8, 10.4, 1.8, 'Footfall today', '18,940', ACC, inc=(D, .18 * D))
    s.tag(10.8, 7.4, 1.6, 'Food court · 84%', '#f97316')
    return s.render('Animated illustration of a shopping centre mall with footfall counting at the entrance and visitor flow', 'Shopping centres: footfall, flow between zones and dwell time.')


def venue():
    s = Scene('iv')
    tiers = (3.4, 2.6, 1.8, 1.0)
    for i, h in enumerate(tiers):
        s.box(0, i * 1.2, 0, 16, 1.2, h, ('#eef1f5', '#e1e6ee', '#d3dae4'), shadow=False)
        dots = []
        for x in range(1, 16):
            for half in (0, .5):
                if int(x * 7 + i * 3 + half * 10) % 4:
                    cx, cy = s.p(x + half, i * 1.2 + .6, h)
                    dots.append('<circle cx="%s" cy="%s" r="3.4" fill="%s"/>' % (f2(cx), f2(cy - 3), ('#a9b2bd', '#c3c9d1', '#8e98a5')[(x + i) % 3]))
        s.layers['back'].append(''.join(dots))
    for gx in (3.2, 7.2, 11.2):
        s.box(gx, 8.6, 0, .35, 1.2, 1.1, DARK, layer='back')
        s.box(gx + 1.8, 8.6, 0, .35, 1.2, 1.1, DARK, layer='back')
        s.zone(gx + .4, 8.6, 1.4, 1.2)
    s.sensor(8.5, 8.8, 3.4, label='3D people counters', beam=(7.6, 8.6, 1.4, 1.2))
    D = 6.0
    for gi, gx in enumerate((3.2, 7.2, 11.2)):
        for j in range(2):
            s.walker([(gx + 1.1, 14), (gx + 1.1, 9.2), (gx + 1.0 + j * .4, 5.6)], D, -gi * 1.7 - j * 3,
                     count=(.62, 'IN +1', '#16a34a', (gx + 2.6, 10.2, 1.6)) if j == 0 else None)
    s.walker([(-.5, 6.2), (16.5, 6.6)], 9, -1)
    s.walker([(16.5, 7.2), (-.5, 6.9)], 10, -6)
    s.badge(3.0, 2.6, 5.2, 'Concourse', '92% of limit', '#ef4444', pulse=True)
    s.badge(13.6, 3.2, 4.6, 'Live attendance', '41,862', ACC, inc=(D / 3, .62 * D))
    s.tag(5.0, 12.6, 1.0, 'Alert sent · Gate A busy', '#ef4444')
    return s.render('Animated illustration of stadium gates counting arrivals with live attendance and a capacity alert', 'Stadiums and venues: arrivals by gate and live crowd capacity.')


def street():
    s = Scene('it', floor='#eef1f5', grid='#e4e8ee')
    s.patch(4, -0.2, 8, 12.2, '#f8f9fb')
    GL = ('#e8f0fa', '#dce8f6', '#cfdff0')
    for y0, h in ((0, 5.0), (3.1, 3.8), (6.2, 4.6), (9.3, 3.4)):
        s.box(0, y0, 0, 4, 3.0, h, WALL)
        s.box(4, y0 + .5, .3, .06, 2.0, 2.0, GL, shadow=False)
    for x0, h in ((12.2, 3.0), (14.2, 3.6)):
        s.box(x0, 0, 0, 1.8, 3.4, h, WALL)
    for (x, y) in ((10.6, 1.4), (10.6, 3.4), (10.8, 9.0)):
        s.box(x, y, 0, .9, .9, .75, TABLE)
        s.person(x + .3, y + .5, .75, seated=True, k=.85)
    s.box(11.7, 6.0, 0, .2, .2, 3.2, ('#9aa4b1', '#8a95a3', '#7a8594'), shadow=False)
    s.zone(4.4, 5.6, 7.2, 1.0)
    s.sensor(11.0, 5.8, 3.2, label='Pedestrian counter', beam=(4.4, 5.6, 7.2, 1.0))
    D = 9.0
    for x, rev, b, c in ((5.4, 0, 0, 1), (7.2, 1, -2.2, 1), (8.6, 0, -4.6, 0), (6.4, 1, -6.4, 0), (9.6, 1, -3.4, 0), (5.0, 0, -7.6, 0)):
        pts = [(x, -.6), (x + .2, 12.6)] if not rev else [(x, 12.6), (x - .2, -.6)]
        f = (6.1 + .6) / 13.2 if not rev else (12.6 - 6.1) / 13.2
        s.walker(pts, D, b, count=(f, '+1', '#16a34a' if not rev else ACC, (x + (1.2 if not rev else -1.2), 6.1, 2.0)) if c else None)
    s.badge(8.2, 10.6, 2.2, 'Pedestrians today', '8,412', ACC, inc=(D, (6.7 / 13.2) * D))
    s.tag(8.0, 1.0, 3.2, 'Peak · 12:30pm', '#f59e0b')
    return s.render('Animated illustration of a laneway with a pole-mounted pedestrian counter and people walking both ways', 'Streets and laneways: pedestrian counts by hour and direction.')


def park():
    s = Scene('ip', floor='#eef6ea', grid='#e2eedd')
    s.patch(0, 0, 16, 1.6, '#d8ebf7')
    s.patch(0, 5.0, 16, 2.0, '#f1efe9')
    s.patch(11.2, 7.0, 1.8, 5.0, '#f1efe9')
    for (x, y, r) in ((2.0, 2.8, 1.1), (5.0, 2.6, .9), (13.6, 2.8, 1.2), (2.2, 9.2, 1.1), (5.2, 10.6, 1.0), (15.0, 9.4, .9)):
        s.tree(x, y, r)
    s.box(9.4, 3.2, 0, 1.8, .5, .45, SHELF)
    s.person(10.0, 3.4, .45, seated=True, k=.85)
    s.person(10.8, 3.5, .45, seated=True, k=.85)
    s.box(8.6, 4.4, 0, .2, .2, 1.4, ('#9aa4b1', '#8a95a3', '#7a8594'), shadow=False)
    s.zone(7.6, 5.0, 1.4, 2.0)
    s.sensor(8.4, 4.2, 1.6, label='Path counter', beam=(7.6, 5.0, 1.4, 2.0))
    s.walker([(-.5, 6.5), (16.5, 5.9)], 7, 0, kind='bike', count=(.52, 'Cyclist +1', '#0ea5e9', (10.4, 8.4, 1.4)))
    s.walker([(16.5, 5.5), (-.5, 6.1)], 8, -3.5, kind='bike')
    s.walker([(-.5, 5.7), (16.5, 5.3)], 16, -2, count=(.52, 'Walker +1', '#16a34a', (6.6, 8.6, 1.4)))
    s.walker([(16.5, 6.7), (-.5, 6.8)], 18, -9)
    s.walker([(12.1, 12.6), (12.0, 6.6), (4.0, 6.2)], 12, -4)
    s.badge(3.4, 4.4, 3.4, 'Visitors today', '3,207', '#10b981', inc=(8, 8.3))
    s.badge(13.4, 4.8, 3.4, 'Cyclists today', '1,142', '#0ea5e9', inc=(7, 3.6))
    return s.render('Animated illustration of a park path with a counter measuring walkers and cyclists', 'Parks and foreshores: walkers and cyclists, by direction and season.')


def office():
    s = Scene('io')
    back_walls(s)
    s.glass(.4, 0, 3.6, 3.0, 3.2)
    s.glass(4.4, 0, 3.6, 3.0, 3.2)
    for x0 in (.4, 4.4):
        s.box(x0 + .8, .8, 0, 2.0, 1.2, .75, TABLE)
    for (x, y) in ((1.2, .7), (2.6, .7), (1.6, 2.2)):
        s.person(x, y, .75, seated=True, k=.85)
    s.person(5.6, .8, .75, seated=True, k=.85)
    s.box(9.0, .2, 0, 4.4, 1.0, 1.0, SHELF)
    s.box(14.2, 0, 0, 1.8, 3.0, 3.8, DARK)
    s.box(14.5, 3.0, 0, 1.2, .05, 2.4, ('#c4cdd9', '#b3bdcb', '#a5b0bf'), shadow=False)
    for (x, y) in ((1.0, 5.4), (5.0, 5.4), (1.0, 8.8), (5.0, 8.8)):
        s.box(x, y, 0, 3.0, 1.6, .75, TABLE)
        s.person(x + .6, y + .3, .75, seated=True, k=.85)
        s.person(x + 2.2, y + 1.2, .75, seated=True, k=.85)
    s.zone(13.0, 3.6, 2.6, 2.6)
    s.sensor(13.9, 4.6, 3.6, beam=(13.0, 3.6, 2.6, 2.6))
    s.flow([(13.6, 5.4), (11.6, 3.2), (10.8, 1.8)], width=6)
    s.flow([(13.2, 6.4), (10.6, 7.4), (8.6, 7.2)], width=6)
    D = 9.0
    s.walker([(15.1, 3.1), (14.4, 5.0), (10.4, 7.6), (9.0, 11.6)], D, 0, count=(.18, 'IN +1', '#16a34a', (16.0, 6.6, 1.4)))
    s.walker([(8.8, 3.8), (12.0, 4.4), (14.9, 3.2)], D, -4.5, count=(.82, 'OUT +1', ACC, (12.6, 7.6, 1.4)))
    s.walker([(8.4, 12.6), (8.6, 3.8)], 10, -2)
    s.badge(2.2, 1.6, 4.4, 'Meeting 7.1', '3 / 8 seats', '#f59e0b')
    s.badge(6.2, 1.6, 4.4, 'Meeting 7.2', 'Free now', '#10b981')
    s.badge(3.4, 10.6, 2.4, 'Level 7', '61 of 160 people', '#10b981', tick=(61, 2, '61', ' of 160 people'))
    s.tag(10.2, .4, 2.4, 'Kitchen busy 12:30', '#f97316')
    return s.render('Animated illustration of an office floor with meeting room occupancy and lift lobby counting', 'Office towers: floors, meeting rooms and amenities, used on demand.')


def campus():
    s = Scene('ic')
    back_walls(s, 4.6)
    for i in range(5):
        h = (5 - i) * .38
        s.box(.4, .3 + i * 1.1, 0, 8.4, 1.1, h, ('#f1f3f7', '#e3e8ef', '#d6dde7'), shadow=False)
        for x in range(1, 9):
            if (x * 3 + i) % 4 == 0:
                s.person(.6 + x * .95, .8 + i * 1.1, h, seated=True, k=.8)
    s.box(.4, 6.2, 0, 8.4, .25, .7, WALL, layer='back')
    s.box(10.2, 0, 0, .3, 6.6, 3.0, WALL)
    s.zone(9.0, 6.5, 1.4, 1.4)
    s.sensor(9.4, 6.8, 3.4, beam=(9.0, 6.5, 1.4, 1.4))
    for (x, y) in ((11.4, 1.2), (13.6, 1.2), (11.4, 3.6), (13.6, 3.6)):
        s.box(x, y, 0, 1.6, 1.2, .75, TABLE)
    for (x, y) in ((11.8, 1.5), (14.0, 3.9)):
        s.person(x, y, .75, seated=True, k=.85)
    D = 8.0
    s.walker([(16.5, 9.6), (11.0, 8.6), (9.6, 7.2), (8.6, 5.6)], D, 0, count=(.64, 'IN +1', '#16a34a', (8.0, 8.6, 2.2)))
    s.walker([(8.4, 5.4), (9.8, 7.4), (12.0, 9.0), (16.5, 10.6)], D, -4, count=(.3, 'OUT +1', ACC, (12.2, 7.4, 2.2)))
    s.walker([(-.5, 10.2), (16.5, 9.8)], 12, -6)
    s.walker([(16.5, 11.2), (-.5, 11.0)], 13, -1)
    s.badge(4.6, 2.4, 4.4, 'Lecture theatre', '34% · 82 of 240', '#f59e0b')
    s.badge(13.0, 2.6, 2.8, 'Study space', '14 seats free', '#10b981', tick=(14, 2, '14', ' seats free'))
    s.tag(4.8, 8.0, 1.2, 'Booked 240 · used 82', ACC)
    return s.render('Animated illustration of a lecture theatre and study space with room occupancy counted at the door', 'Campuses: booked versus used, room by room.')


def service():
    s = Scene('ig')
    back_walls(s)
    for i in range(4):
        s.box(1.0 + i * 3.4, .6, 0, 2.6, 1.2, 1.1, ('#ffffff', '#e8ecf2', '#d6dde7'))
        s.person(2.3 + i * 3.4, .3, 0)
    for x in (1.6, 4.6, 7.6, 10.6, 13.6):
        s.box(x, 4.2, 0, .18, .18, .9, ('#cfd6df', '#b9c2ce', '#a6b0bd'), shadow=False)
    a, b = s.p(1.6, 4.3, .8), s.p(13.8, 4.3, .8)
    s.layers['back'].append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="#635bff" stroke-width="2.4" opacity=".5"/>' % (f2(a[0]), f2(a[1]), f2(b[0]), f2(b[1])))
    for x in (6.0, 7.2, 8.4, 9.6, 10.8):
        s.person(x, 5.6, 0)
    s.zone(13.4, 9.0, 2.4, 2.4)
    s.sensor(14.3, 9.8, 3.6, beam=(13.4, 9.0, 2.4, 2.4))
    s.zone(5.4, 5.0, 6.4, 1.2)
    D = 12.0
    s.walker([(17, 13), (14.4, 10.2), (12.4, 5.6)], D, 0, count=(.28, 'IN +1', '#16a34a', (16.4, 9.2, 2.2)))
    s.walker([(4.6, 2.6), (4.0, 7.4), (13.6, 9.6), (17, 13.4)], D, -6, count=(.86, 'OUT +1', ACC, (12.4, 11.2, 2.2)))
    s.walker([(5.4, 5.6), (5.2, 2.0)], 6, -1)
    s.badge(6.0, 8.4, 2.2, 'Queue', '6 people · wait 5 min', '#f59e0b')
    s.badge(13.2, 3.4, 3.4, 'Served today', '312', ACC, inc=(D, .86 * D + 6))
    s.tag(3.2, 3.0, 2.6, 'Target: under 10 min', '#10b981')
    return s.render('Animated illustration of a government service centre with queue monitoring and entrance counting', 'Service centres: queue length, wait times and visits.')


SCENES = {'entrance': entrance, 'library': library, 'shopping': shopping, 'venue': venue, 'street': street,
          'park': park, 'office': office, 'campus': campus, 'service': service}
_cache = {}


def illus(name):
    if name not in _cache:
        _cache[name] = SCENES[name]()
    return _cache[name]
