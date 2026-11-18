"""Static site builder for the Place Performance marketing website.

Generates every page (with shared header/footer, SEO meta, JSON-LD and FAQ
sections), plus sitemap.xml, robots.txt and llms.txt.

Run from anywhere:  python website/_build/build.py
"""
import json
import os
from datetime import date
from html import escape

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)  # website/
BASE = 'https://placeperformance.ai/'
APP_URL = 'https://placeperformance.ai/demo/'
SITE = 'Place Performance'
import sys
sys.path.insert(0, HERE)
from illus import illus  # noqa: E402
TODAY = date.today().isoformat()

# --------------------------------------------------------------------------
# Small HTML helpers
# --------------------------------------------------------------------------

def ticks(items, cls=''):
    return '<ul class="ticks %s">%s</ul>' % (cls, ''.join('<li><b>%s</b> %s</li>' % (b, t) for b, t in items))


def shot(src, alt, extra=''):
    return '<div class="shot-card %s"><img src="{R}assets/screens/%s.jpg" alt="%s" loading="lazy"></div>' % (extra, src, escape(alt))


def photo(src, alt, badge=None):
    b = '<div class="photo-badge"><b>%s</b><span>%s</span></div>' % badge if badge else ''
    return '<div class="photo-card"><img src="{R}assets/photos/%s.jpg" alt="%s" loading="lazy">%s</div>' % (src, escape(alt), b)


def split(left, right, rev=False):
    return '<div class="split %s reveal">%s%s</div>' % ('split-rev' if rev else '', left, right)


def copy(eyebrow, h3, p, extra=''):
    return '<div class="split-copy"><p class="eyebrow">%s</p><h3>%s</h3><p class="muted">%s</p>%s</div>' % (eyebrow, h3, p, extra)


def section(inner, cls='', id_=''):
    return '<section class="sec %s"%s><div class="wrap">%s</div></section>' % (cls, (' id="%s"' % id_) if id_ else '', inner)


def guide(eyebrow, h2, blocks, related, cls=''):
    """Long-form prose with contextual links, plus a related-pages aside. related: (path, title, text)."""
    art = ''.join(('<h3>%s</h3>' % h if h else '') + '<p>%s</p>' % p for h, p in blocks)
    aside = '<aside class="guide-aside"><p class="eyebrow">Related pages</p>' + ''.join(
        '<a href="{R}%s"><b>%s</b><span>%s</span></a>' % r for r in related) + '</aside>'
    return section('<div class="guide reveal"><article class="prose"><p class="eyebrow">%s</p><h2>%s</h2>%s</article>%s</div>' % (eyebrow, h2, art, aside), cls)


def in_practice(scene, h2='How it works on site.', lead='Sensors count people as they move through each space. Counting happens on the device, and the numbers appear in the platform within seconds.'):
    return section(head('In practice', h2, lead) + '<div class="illus-wide reveal">%s</div>' % illus(scene), 'sec-illus')


def head(eyebrow, h2, lead='', light=False):
    return '<div class="sec-head %s"><p class="eyebrow">%s</p><h2>%s</h2>%s</div>' % ('light' if light else '', eyebrow, h2, '<p class="sec-lead">%s</p>' % lead if lead else '')


def cards(items, cols=3):
    """items: (title, text, href or None, icon letter or None)"""
    out = []
    for it in items:
        title, text, href = it[0], it[1], it[2] if len(it) > 2 else None
        inner = '<h4>%s</h4><p>%s</p>%s' % (title, text, '<span class="link-arrow">Learn more</span>' if href else '')
        out.append(('<a class="fcard" href="%s">%s</a>' % (href, inner)) if href else '<div class="fcard">%s</div>' % inner)
    return '<div class="fgrid fgrid-%d reveal">%s</div>' % (cols, ''.join(out))


def photo_cards(items, folder='photos'):
    return '<div class="pgrid reveal">%s</div>' % ''.join(
        '<a class="pcard" href="%s"><img src="{R}assets/%s/%s.jpg" alt="%s" loading="lazy"><div><h4>%s</h4><p>%s</p><span class="link-arrow">Explore</span></div></a>' % (href, folder, img, escape(t), t, d)
        for t, d, img, href in items)


def stats(items):
    return '<div class="stats reveal">%s</div>' % ''.join('<div><b>%s</b><span>%s</span></div>' % s for s in items)


def faq_html(faqs, title='Questions &amp; answers'):
    return section(head('FAQ', title) + '<div class="faq">%s</div>' % ''.join(
        '<details class="qa"%s><summary><h3>%s</h3><i></i></summary><div class="qa-a"><p>%s</p></div></details>' % (' open' if i == 0 else '', q, a)
        for i, (q, a) in enumerate(faqs)), 'sec-faq', 'faq')


def cta_band():
    return '''<section class="cta cta-band">
  <canvas id="gradient2" class="hero-gradient" aria-hidden="true"></canvas>
  <div class="wrap cta-in cta-in-band">
    <div class="cta-copy"><h2>See your places in a new light.</h2><p>Book a 30-minute walkthrough and we'll scope a pilot for one of your sites: sensors, installation, software and insights in one agreement.</p></div>
    <div class="cta-actions"><a class="btn btn-white btn-lg" href="{R}contact/">Book a demo <i class="arr"></i></a><a class="btn btn-outline btn-lg" href="{R}talk-to-us/">Talk to us</a></div>
  </div>
</section>'''


def page_hero(eyebrow, h1, lead, visual='', crumbs=None, ctas=True):
    bc = ''
    if crumbs:
        bc = '<nav class="crumbs" aria-label="Breadcrumb">' + ' <span>/</span> '.join(
            ('<a href="%s">%s</a>' % (h, n)) if h else '<span aria-current="page">%s</span>' % n for n, h in crumbs) + '</nav>'
    btns = '<div class="hero-ctas"><a class="btn btn-dark btn-lg" href="{R}contact/">Book a demo <i class="arr"></i></a></div>' if ctas else ''
    return '''<section class="hero page-hero">
  <canvas id="gradient" class="hero-gradient" aria-hidden="true"></canvas>
  <div class="hero-skew"></div>
  <div class="wrap hero-in %s">
    <div class="hero-copy">%s<p class="eyebrow eyebrow-hero">%s</p><h1>%s</h1><p class="lead">%s</p>%s</div>
    %s
  </div>
</section>''' % ('' if visual else 'hero-in-solo', bc, eyebrow, h1, lead, btns, '<div class="page-visual">%s</div>' % visual if visual else '')


SENSOR_VIS = '<div class="sensor-vis" role="img" aria-label="LiDAR sensor counting people in and out across a count line, processed on the device">\n  <svg viewBox="0 0 420 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">\n    <defs>\n      <radialGradient id="svBlob"><stop offset="0" stop-color="#22d3ee" stop-opacity=".55"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>\n      <linearGradient id="svCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#635bff" stop-opacity=".45"/><stop offset="1" stop-color="#635bff" stop-opacity=".04"/></linearGradient>\n      <pattern id="svGrid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#1e3a5f" stroke-width="1"/></pattern>\n    </defs>\n    <rect width="420" height="340" fill="#0a2540"/>\n    <rect y="30" width="420" height="310" fill="url(#svGrid)"/>\n    <path d="M210 30 L40 340 L380 340 Z" fill="url(#svCone)"/>\n    <line x1="30" y1="185" x2="390" y2="185" stroke="#f59e0b" stroke-width="2" stroke-dasharray="8 7"/>\n    <text x="34" y="176" fill="#f59e0b" font-size="11" font-weight="600" font-family="Inter,sans-serif">COUNT LINE</text>\n    <g class="sv-p"><circle cx="90" cy="0" r="13" fill="url(#svBlob)"/><circle cx="90" cy="0" r="5" fill="#a5f3fc"/><animateTransform attributeName="transform" type="translate" from="0 40" to="0 300" dur="6s" begin="0s" repeatCount="indefinite"/></g><g class="sv-p"><circle cx="150" cy="0" r="13" fill="url(#svBlob)"/><circle cx="150" cy="0" r="5" fill="#a5f3fc"/><animateTransform attributeName="transform" type="translate" from="0 300" to="0 40" dur="7.5s" begin="-3s" repeatCount="indefinite"/></g><g class="sv-p"><circle cx="215" cy="0" r="13" fill="url(#svBlob)"/><circle cx="215" cy="0" r="5" fill="#a5f3fc"/><animateTransform attributeName="transform" type="translate" from="0 40" to="0 300" dur="5.5s" begin="-1.5s" repeatCount="indefinite"/></g><g class="sv-p"><circle cx="270" cy="0" r="13" fill="url(#svBlob)"/><circle cx="270" cy="0" r="5" fill="#a5f3fc"/><animateTransform attributeName="transform" type="translate" from="0 300" to="0 40" dur="8s" begin="-5s" repeatCount="indefinite"/></g><g class="sv-p"><circle cx="330" cy="0" r="13" fill="url(#svBlob)"/><circle cx="330" cy="0" r="5" fill="#a5f3fc"/><animateTransform attributeName="transform" type="translate" from="0 40" to="0 300" dur="6.5s" begin="-2.2s" repeatCount="indefinite"/></g><g class="sv-p"><circle cx="120" cy="0" r="13" fill="url(#svBlob)"/><circle cx="120" cy="0" r="5" fill="#a5f3fc"/><animateTransform attributeName="transform" type="translate" from="0 300" to="0 40" dur="9s" begin="-6s" repeatCount="indefinite"/></g><g class="sv-p"><circle cx="300" cy="0" r="13" fill="url(#svBlob)"/><circle cx="300" cy="0" r="5" fill="#a5f3fc"/><animateTransform attributeName="transform" type="translate" from="0 40" to="0 300" dur="7s" begin="-4s" repeatCount="indefinite"/></g>\n    <rect width="420" height="30" fill="#132f4f"/>\n    <rect x="178" y="18" width="64" height="22" rx="8" fill="#e8edf5"/>\n    <circle cx="198" cy="29" r="5" fill="#0a2540"/><circle cx="222" cy="29" r="5" fill="#0a2540"/>\n    <circle cx="198" cy="29" r="2" fill="#22d3ee"/><circle cx="222" cy="29" r="2" fill="#22d3ee"/>\n  </svg>\n  <div class="sv-chip sv-in"><small>In today</small><b class="js-tick" data-base="1284" data-jitter="3">1,284</b></div>\n  <div class="sv-chip sv-out"><small>Out today</small><b class="js-tick" data-base="1197" data-jitter="3">1,197</b></div>\n  <div class="sv-badge"><b>Counted on the device</b><span>LiDAR 3D sensing &middot; no images leave the site</span></div>\n</div>'
SENSOR_VIS = illus('entrance')
PRIVACY_VIS = '<div class="privacy-vis" role="img" aria-label="What the sensor sees is anonymous depth data processed on the device; only counts leave the site">\n  <div class="pv-pane">\n    <p class="pv-label">What the sensor sees</p>\n    <svg viewBox="0 0 400 170" aria-hidden="true">\n      <defs><radialGradient id="pvB"><stop offset="0" stop-color="#22d3ee" stop-opacity=".8"/><stop offset=".55" stop-color="#635bff" stop-opacity=".35"/><stop offset="1" stop-color="#635bff" stop-opacity="0"/></radialGradient>\n      <pattern id="pvG" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#1e3a5f"/></pattern></defs>\n      <rect width="400" height="170" fill="url(#pvG)"/>\n      <g><ellipse cx="80" cy="70" rx="30" ry="26" fill="url(#pvB)"/><ellipse cx="160" cy="112" rx="30" ry="26" fill="url(#pvB)"/><ellipse cx="250" cy="60" rx="30" ry="26" fill="url(#pvB)"/><ellipse cx="320" cy="118" rx="30" ry="26" fill="url(#pvB)"/>\n      <animateTransform attributeName="transform" type="translate" values="0 0;10 4;0 0" dur="6s" repeatCount="indefinite"/></g>\n    </svg>\n    <p class="pv-note">Anonymous 3D depth from LiDAR, processed and discarded on the device</p>\n  </div>\n  <div class="pv-arrow"><span>Only numbers leave the site</span></div>\n  <ul class="pv-data">\n    <li><span>Reading Room</span><b>23 people &middot; 58%</b></li>\n    <li><span>Main entrance</span><b>In 412 &middot; Out 377</b></li>\n    <li><span>Average dwell</span><b>38 min</b></li>\n  </ul>\n  <div class="pv-tags"><span>No images</span><span>No faces</span><span>No identities</span></div>\n</div>'


# --------------------------------------------------------------------------
# Navigation
# --------------------------------------------------------------------------

SEO_TITLES = {'councils': 'People counting for councils', 'universities': 'Space utilisation for universities', 'government': 'Office occupancy for government', 'buildings': 'Occupancy analytics for buildings', 'retail': 'Footfall analytics for retail & precincts', 'parks-and-streets': 'Pedestrian & cyclist counting', 'marketing': 'Footfall and zone analytics for marketing', 'hospitality': 'Footfall and occupancy analytics for hospitality'}

SOLUTIONS = [
    ('councils', 'Councils &amp; civic', 'Libraries, civic centres, events and service desks', 'civic-event'),
    ('universities', 'Universities', 'Space utilisation across campus', 'study-hall'),
    ('government', 'Government', 'Right-size the property portfolio', 'government'),
    ('buildings', 'Buildings &amp; property', 'Run buildings on demand', 'office'),
    ('retail', 'Retail &amp; precincts', 'Turn footfall into performance', 'food-hall'),
    ('parks-and-streets', 'Parks, trails &amp; streets', 'People, cyclists and vehicles outdoors', 'parks'),
    ('marketing', 'Marketing', 'Prove what displays and activations deliver', 'food-hall'),
    ('hospitality', 'Hospitality', 'Staff for the rush and protect the guest experience', 'food-hall'),
]


def _bracket(x1, y1, x2, y2, c='#22d3ee', n=24):
    """Four L-shaped corner marks framing a detected person on a photo overlay."""
    return ('<g fill="none" stroke="%s" stroke-width="4" stroke-linecap="round">'
            '<path d="M%d %d v%d M%d %d h%d"/><path d="M%d %d v%d M%d %d h%d"/>'
            '<path d="M%d %d v%d M%d %d h%d"/><path d="M%d %d v%d M%d %d h%d"/></g>') % (
        c, x1, y1, n, x1, y1, n,  x2, y1, n, x2, y1, -n,
        x1, y2, -n, x1, y2, n,  x2, y2, -n, x2, y2, -n)


def lidar_photo():
    """A real photo (laneway) with a LiDAR field, count line, detection zone and highlighted people overlaid."""
    defs = ('<defs><linearGradient id="lb" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#22d3ee" stop-opacity=".04"/><stop offset="1" stop-color="#22d3ee" stop-opacity=".34"/></linearGradient>'
            '<filter id="lcard" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0a2540" flood-opacity=".35"/></filter></defs>')
    beam = '<polygon points="1200,250 852,548 870,890 560,885 648,545" fill="url(#lb)"><animate attributeName="opacity" values=".65;1;.65" dur="3s" repeatCount="indefinite"/></polygon>'
    zone = '<polygon points="648,545 852,548 870,890 560,885" fill="#22d3ee" fill-opacity=".12" stroke="#22d3ee" stroke-width="3" stroke-dasharray="12 9"/>'
    line = '<line x1="648" y1="545" x2="852" y2="548" stroke="#ffd23f" stroke-width="5"/>'
    brackets = _bracket(648, 498, 756, 892) + _bracket(798, 512, 906, 884) + _bracket(690, 452, 752, 662)
    sensor = ('<line x1="1320" y1="266" x2="1214" y2="250" stroke="#0a2540" stroke-width="6" stroke-linecap="round"/>'
              '<rect x="1150" y="210" width="88" height="48" rx="10" fill="#1f2937" stroke="#3b4656" stroke-width="2"/>'
              '<circle cx="1172" cy="234" r="5" fill="#22d3ee"/><circle cx="1216" cy="234" r="5" fill="#22d3ee"/>'
              '<g transform="translate(1194 300)"><rect x="-54" y="-22" width="108" height="26" rx="7" fill="#1f2937"/><path d="M-6 4h12l-6 7z" fill="#1f2937"/>'
              '<text x="0" y="-4" text-anchor="middle" fill="#fff" font-size="13" font-weight="600">People counter</text></g>')
    pop = '<text x="556" y="516" text-anchor="middle" font-size="26" font-weight="800" fill="#ffd23f">IN +1<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.8;1" dur="3s" repeatCount="indefinite"/></text>'
    badge = ('<g transform="translate(70 70)" filter="url(#lcard)"><rect width="252" height="66" rx="12" fill="#fff"/>'
             '<circle cx="26" cy="26" r="6" fill="#06b6d4"/><text x="44" y="30" font-size="15" fill="#6b7c93">Pedestrians today</text>'
             '<text x="26" y="52" font-size="22" font-weight="700" fill="#0a2540"><tspan class="js-tick" data-base="12408" data-jitter="6">12,408</tspan></text></g>')
    svg = ('<svg viewBox="0 0 1400 934" preserveAspectRatio="xMidYMid slice" aria-hidden="true" font-family="Inter, -apple-system, Segoe UI, sans-serif">'
           + defs + beam + zone + line + brackets + sensor + pop + badge + '</svg>')
    return ('<figure class="lidar-shot"><div class="lidar-shot-frame">'
            '<img src="{R}assets/photos/city.jpg" alt="A busy laneway with a count field and count line overlaid on the walking path" loading="lazy" width="1400" height="934">'
            + svg + '</div><figcaption>The count field and count line shown on a laneway, people are counted as anonymous shapes, with no faces or images.</figcaption></figure>')


def _diag_person(x, fy):
    return f'<g fill="#8e98a5"><circle cx="{x}" cy="{fy-78}" r="12"/><rect x="{x-14}" y="{fy-62}" width="28" height="62" rx="13"/></g>'


def _diag_cyclist(x, fy):
    return (f'<g fill="none" stroke="#8e98a5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'
            f'<circle cx="{x-18}" cy="{fy-11}" r="11"/><circle cx="{x+18}" cy="{fy-11}" r="11"/>'
            f'<path d="M{x-18} {fy-11} L{x-2} {fy-34} L{x+18} {fy-11} M{x-2} {fy-34} L{x+2} {fy-11}"/></g>'
            f'<circle cx="{x+6}" cy="{fy-44}" r="7.5" fill="#8e98a5"/>')


def _diag_car(x, fy):
    return (f'<g fill="#8e98a5"><rect x="{x-36}" y="{fy-24}" width="72" height="20" rx="6"/>'
            f'<path d="M{x-24} {fy-24} Q{x-18} {fy-40} {x-2} {fy-40} L{x+12} {fy-40} Q{x+22} {fy-40} {x+28} {fy-24} Z"/></g>'
            f'<circle cx="{x-20}" cy="{fy-2}" r="8" fill="#5b6672"/><circle cx="{x+20}" cy="{fy-2}" r="8" fill="#5b6672"/>')


def _diag_speed(x, y, text):
    w = int(22 + len(text) * 6.4)
    return (f'<g transform="translate({x} {y})"><rect x="{-w//2}" y="-13" width="{w}" height="22" rx="7" fill="#fff" stroke="#e4e9f0"/>'
            f'<text x="0" y="3" text-anchor="middle" font-size="12" font-weight="600" fill="#06b6d4">{text}</text></g>')


def lidar_diagram():
    cone = '<polygon points="380,62 192,278 568,278" fill="url(#ldc)"/>'
    rays = ('<g stroke="#22d3ee" stroke-width="1.5" stroke-dasharray="4 4" opacity=".75">'
            '<line x1="380" y1="64" x2="272" y2="212"/><line x1="380" y1="64" x2="360" y2="222"/><line x1="380" y1="64" x2="448" y2="206"/></g>')
    people = _diag_person(272, 278) + _diag_person(360, 278) + _diag_person(448, 278)
    return ('<figure class="hw-diagram reveal">'
        '<svg viewBox="0 0 760 320" role="img" aria-label="Diagram of an overhead 3D depth sensor casting infrared light onto people crossing a count line and measuring the distance to each point" font-family="Inter, -apple-system, Segoe UI, sans-serif">'
        '<defs><linearGradient id="ldc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".32"/><stop offset="1" stop-color="#22d3ee" stop-opacity=".04"/></linearGradient></defs>'
        '<rect x="0" y="36" width="760" height="9" fill="#dfe6ee"/>' + cone +
        '<rect x="344" y="45" width="72" height="22" rx="6" fill="#1f2937"/><circle cx="366" cy="56" r="3.5" fill="#22d3ee"/><circle cx="394" cy="56" r="3.5" fill="#22d3ee"/>'
        '<text x="380" y="28" text-anchor="middle" font-size="13" font-weight="600" fill="#0a2540">Overhead sensor</text>' + rays + people +
        '<line x1="44" y1="278" x2="716" y2="278" stroke="#c7d0da" stroke-width="2"/>'
        '<line x1="214" y1="278" x2="548" y2="278" stroke="#ffd23f" stroke-width="4"/>'
        '<text x="566" y="274" font-size="12" fill="#6b7c93">Count line</text>'
        '<text x="470" y="150" font-size="12.5" font-weight="600" fill="#06b6d4">Infrared depth</text>'
        '</svg><figcaption>The sensor times light pulses to measure the distance to every point below, building a live 3D view of each person.</figcaption></figure>')


def radar_diagram():
    fan = '<polygon points="672,112 120,272 660,272" fill="url(#rdf)"/>'
    waves = ('<g fill="none" stroke="#22d3ee" stroke-width="2.4" opacity=".8">'
             '<path d="M648 96 Q628 112 648 128"/><path d="M636 90 Q610 112 636 134"/><path d="M624 84 Q592 112 624 140"/></g>')
    objs = (_diag_person(548, 272) + _diag_speed(548, 168, '4 km/h') +
            _diag_cyclist(356, 272) + _diag_speed(356, 150, '18 km/h') +
            _diag_car(168, 272) + _diag_speed(168, 140, '42 km/h'))
    return ('<figure class="hw-diagram reveal">'
        '<svg viewBox="0 0 760 320" role="img" aria-label="Diagram of a pole-mounted radar sensor detecting a pedestrian, a cyclist and a vehicle at different ranges, each labelled with its speed" font-family="Inter, -apple-system, Segoe UI, sans-serif">'
        '<defs><linearGradient id="rdf" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".28"/><stop offset="1" stop-color="#22d3ee" stop-opacity=".03"/></linearGradient></defs>'
        '<line x1="30" y1="272" x2="730" y2="272" stroke="#c7d0da" stroke-width="2"/>' + fan +
        '<rect x="676" y="118" width="8" height="154" fill="#0a2540"/>'
        '<rect x="652" y="94" width="44" height="30" rx="7" fill="#1f2937"/><circle cx="668" cy="109" r="3.5" fill="#22d3ee"/><circle cx="682" cy="109" r="3.5" fill="#22d3ee"/>'
        '<text x="674" y="84" text-anchor="middle" font-size="13" font-weight="600" fill="#0a2540">Radar sensor</text>' + waves + objs +
        '<text x="300" y="302" text-anchor="middle" font-size="12.5" font-weight="600" fill="#06b6d4">Pedestrian, cyclist and vehicle, told apart by speed</text>'
        '</svg><figcaption>Radio echoes give each object a position and a speed, so the sensor tells people, cyclists and vehicles apart and reads direction.</figcaption></figure>')


def nav(active):
    def a(slug, label):
        on = ' aria-current="page" class="on"' if active == slug else ''
        return '<a href="{R}%s/"%s>%s</a>' % (slug, on, label)
    dd = ''.join('<a href="{R}industries/%s/"><b>%s</b><span>%s</span></a>' % (s, n, d) for s, n, d, _ in SOLUTIONS)
    sol_on = ' on' if active.startswith('industries') else ''
    plat_on = ' on' if active in ('platform', 'real-time', 'ai-forecasting', 'hardware') else ''
    pdd = ''.join('<a href="{R}places/%s/"><b>%s</b><span>%s</span></a>' % (p[0], p[1], p[3]) for p in PLACES)
    pla_on = ' on' if active.startswith('places') else ''
    return '''<header class="nav" id="nav">
  <div class="wrap nav-in">
    <a class="logo" href="{R}"><span class="logo-mark"><svg viewBox="0 0 44 44" aria-hidden="true"><rect x="4" y="6" width="34" height="6" rx="2" fill="#00d4ff"/><rect x="4" y="16" width="27" height="6" rx="2" fill="#12bfe6"/><rect x="4" y="26" width="20" height="6" rx="2" fill="#2f8fe8"/><rect x="4" y="36" width="12" height="6" rx="2" fill="#4f8dff"/></svg></span>Place Performance</a>
    <nav class="nav-links" aria-label="Main">
      <div class="nav-dd"><a href="{R}platform/" class="dd-trigger%s">Platform</a><div class="dd-panel"><a href="{R}platform/"><b>Platform overview</b><span>From the sensor to the decision</span></a><a href="{R}sensors/"><b>Sensors</b><span>Radar, LiDAR and the right sensor per site</span></a><a href="{R}real-time/"><b>Real time</b><span>Live occupancy, floorplans and alerts</span></a><a href="{R}ai-forecasting/"><b>AI &amp; forecasting</b><span>Forecasts, scenarios and the Place Assistant</span></a></div></div>
      <div class="nav-dd"><a href="{R}industries/" class="dd-trigger%s">Industries</a><div class="dd-panel">%s<a class="dd-all" href="{R}industries/">All industries</a></div></div>
      <div class="nav-dd"><a href="{R}places/" class="dd-trigger%s">Places</a><div class="dd-panel">%s<a class="dd-all" href="{R}places/">All places</a></div></div>
      %s
      <div class="nav-m-cta"><a class="btn btn-dark btn-lg" href="{R}contact/">Book a demo <i class="arr"></i></a><a class="btn btn-glass btn-lg" href="{R}talk-to-us/">Talk to us</a></div>
    </nav>
    <div class="nav-cta">
      <a class="btn btn-ghost" href="{R}talk-to-us/">Talk to us</a>
      <a class="btn btn-dark" href="{R}contact/">Book a demo <i class="arr"></i></a>
    </div>
    <button class="nav-burger" aria-label="Menu" id="burger"><span></span><span></span></button>
  </div>
</header>''' % (plat_on, sol_on, dd, pla_on, pdd, a('plans', 'Plans'))


FOOTER = '''<footer class="foot">
  <div class="wrap foot-in">
    <div>
      <a class="logo" href="{R}"><span class="logo-mark"><svg viewBox="0 0 44 44" aria-hidden="true"><rect x="4" y="6" width="34" height="6" rx="2" fill="#00d4ff"/><rect x="4" y="16" width="27" height="6" rx="2" fill="#12bfe6"/><rect x="4" y="26" width="20" height="6" rx="2" fill="#2f8fe8"/><rect x="4" y="36" width="12" height="6" rx="2" fill="#4f8dff"/></svg></span>Place Performance</a>
      <p class="muted">Sensors, software and AI for places that matter.<br>Hardware, installation, support and platform, delivered by one Australian team.</p>
    </div>
    <div class="foot-cols">
      <div><b>Platform</b><a href="{R}platform/">Platform overview</a><a href="{R}sensors/">Sensors</a><a href="{R}real-time/">Real time</a><a href="{R}ai-forecasting/">AI &amp; forecasting</a></div>
      <div><b>Resources</b><a href="{R}plans/">Plans</a><a href="{R}compare/">Compare systems</a><a href="{R}guides/">Guides</a><a href="{R}glossary/">Glossary</a></div>
      <div><b>Industries</b>%s</div>
      <div><b>Places</b><a href="{R}places/campuses/">Campuses</a><a href="{R}places/libraries/">Libraries</a><a href="{R}places/shopping-centres/">Shopping centres</a><a href="{R}places/stadiums-and-venues/">Stadiums &amp; venues</a><a href="{R}places/streets-and-laneways/">Streets &amp; laneways</a><a href="{R}places/parks-and-foreshores/">Parks &amp; foreshores</a><a href="{R}places/office-towers/">Office towers</a><a href="{R}places/government-buildings/">Government buildings</a></div>
      <div><b>Company</b><a href="{R}about/">About us</a><a href="{R}deployments/">In the field</a><a href="{R}contact/">Book a demo</a><a href="{R}quote/">Get a quote</a><a href="{R}talk-to-us/">Talk to us</a><a href="{R}privacy-by-design/">Privacy by design</a><a href="{R}faq/">FAQ</a></div>
    </div>
  </div>
  <div class="wrap foot-note">&copy; 2026 Place Performance. Photography from Unsplash.</div>
</footer>''' % ''.join('<a href="{R}industries/%s/">%s</a>' % (s, n.replace(' &amp; civic', '')) for s, n, _, _ in SOLUTIONS)

# --------------------------------------------------------------------------
# Structured data
# --------------------------------------------------------------------------

ORG = {
    '@type': 'Organization', '@id': BASE + '#org', 'name': SITE, 'url': BASE,
    'logo': BASE + 'assets/logo.png',
    'slogan': 'Sensors, software and AI for places that matter.',
    'description': 'End-to-end people counting and place analytics: privacy-safe sensors, installation, real-time analytics, alerts, reporting, forecasting and AI insights for councils, universities, government and property owners.',
    'areaServed': {'@type': 'Country', 'name': 'Australia'},
    'parentOrganization': [
        {'@type': 'Organization', 'name': 'Rayven', 'url': 'https://rayven.io/'},
        {'@type': 'Organization', 'name': 'ITESA', 'url': 'https://itesa.com.au/'},
    ],
    'knowsAbout': ['people counting', 'occupancy monitoring', 'space utilisation', 'crowd capacity', 'footfall analytics', 'pedestrian and cyclist counting', 'visitor analytics', 'anonymous people counting', 'LiDAR people counting', 'radar people counting'],
}
PRODUCT = {
    '@type': 'SoftwareApplication', '@id': BASE + '#product', 'name': SITE, 'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Web', 'url': BASE, 'publisher': {'@id': BASE + '#org'},
    'description': 'Real-time occupancy, visitor counting, live floorplans, alerts, automated reporting, forecasting, scenario planning and an AI assistant for physical places.',
    'featureList': ['Live occupancy and visitor counting', 'Interactive floorplans with live room occupancy', 'Heat maps and visitor flow', 'Threshold alerts by email, SMS and Teams', 'Scheduled and executive reporting', 'Visitation forecasting', 'What-if scenario planning', 'AI assistant for plain-English questions', 'Multi-site portfolio benchmarking', 'Device health monitoring'],
}


def jsonld(page, url):
    graph = [ORG]
    if page['slug'] == '':
        graph += [{'@type': 'WebSite', '@id': BASE + '#site', 'url': BASE, 'name': SITE, 'publisher': {'@id': BASE + '#org'}}, PRODUCT]
    graph.append({'@type': 'WebPage', '@id': url, 'url': url, 'name': page['title'], 'description': page['desc'], 'isPartOf': {'@id': BASE + '#site'}, 'about': {'@id': BASE + '#product'}})
    if page.get('crumbs'):
        graph.append({'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': n.replace('&amp;', '&'), 'item': BASE + p} for i, (n, p) in enumerate(page['crumbs'])]})
    if page.get('service'):
        graph.append({'@type': 'Service', 'name': page['service'], 'serviceType': page['service'], 'provider': {'@id': BASE + '#org'}, 'areaServed': 'AU', 'audience': {'@type': 'Audience', 'audienceType': page.get('audience', '')}, 'description': page['desc'], 'url': url})
    if page.get('faqs'):
        graph.append({'@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': strip(q), 'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}} for q, a in page['faqs']]})
    if page.get('schema'):
        extra = page['schema']
        graph.extend(extra if isinstance(extra, list) else [extra])
    return json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=1)


def strip(s):
    import re
    return re.sub(r'<[^>]+>', '', s).replace('&amp;', '&').replace('&times;', '×')


# --------------------------------------------------------------------------
# Page content
# --------------------------------------------------------------------------
PAGES = []


def page(slug, title, desc, body, faqs=None, crumbs=None, service=None, audience=None, nav_key=None, schema=None):
    PAGES.append(dict(slug=slug, title=title, desc=desc, body=body, faqs=faqs or [], crumbs=crumbs, service=service, audience=audience, nav_key=nav_key if nav_key is not None else slug, schema=schema))


# ---------------- Home ----------------
HOME_FAQS = [
    ('What is Place Performance?', 'Place Performance is an end-to-end people counting and place analytics service. It combines privacy-safe sensors, professional installation, a real-time analytics platform and AI insights so any organisation that runs buildings, venues or public spaces can see how their places are used and plan with evidence.'),
    ('What does Place Performance measure?', 'It measures visitor counts, entries and exits, live occupancy against capacity, peak periods, dwell time, repeat visitation, movement between zones and, outdoors, pedestrians, cyclists and vehicles. Metrics roll up from a single room to a whole portfolio of sites.'),
    ('Is the hardware included?', 'Yes. The sensors are selected for each environment, then designed, supplied, installed, commissioned and supported by Place Performance in Australia, so you deal with one partner from sensor to insight.'),
    ('Does it identify people?', 'No. Counting happens on the device and data is masked at source, so only anonymous numbers leave the site. The approach is to measure the place, not the person. See <a href="{R}privacy-by-design/">Privacy by design</a>.'),
    ('Who is it for?', 'It is built for local councils, universities and TAFEs, state and federal government agencies, commercial property owners, shopping centres and precinct managers, and anyone responsible for libraries, civic centres, venues, parks, trails or streets.'),
    ('How quickly can we get started?', 'Most organisations start with a pilot at one site. After a site survey and sensor plan, a pilot is typically live in weeks rather than months, and you can add sites and capability levels as you grow.'),
]
FIELD = [
    ('trail-counter.jpg', 'Trail counter', 'Bushland reserve'),
    ('sports-bar.jpg', 'Sports bar', 'Richmond, Melbourne'),
    ('waterfront-sydney.jpg', 'Waterfront venue', 'Sydney'),
    ('popup-melbourne.jpg', 'Retail pop-up', 'Melbourne CBD'),
    ('expo-brisbane.jpg', 'Careers expo', 'Brisbane'),
    ('library-sa.jpg', 'Public library', 'Semaphore, SA'),
    ('cbd-foyer-sydney.jpg', 'CBD building foyer', 'Sydney'),
    ('street-festival.jpg', 'Town street festival', 'Regional Australia'),
]


def field_cards(items):
    return '<div class="field-grid reveal">' + ''.join(
        '<figure class="field-card"><img src="{R}assets/field/%s" alt="Place Performance sensor deployment: %s, %s" loading="lazy"><figcaption><b>%s</b><span>%s</span></figcaption></figure>' % (f, t, c, t, c)
        for f, t, c in items) + '</div>'


home_body = open(os.path.join(HERE, 'home.html'), encoding='utf-8').read().replace('{SENSOR_VIS}', SENSOR_VIS)
home_body = home_body.replace('{FIELD_STRIP}', field_cards(FIELD[:6]))
home_body = home_body.replace('{HERO_ILLUS}', illus('library').replace('id="il-', 'id="ilh-').replace('#il-', '#ilh-').replace('viewBox="0 0 720 500"', 'viewBox="40 40 650 430"').replace('<figcaption>Libraries: visits at the door and live occupancy in every zone.</figcaption>', ''))
for _k in ('library', 'campus', 'shopping', 'venue', 'street', 'park', 'office', 'service'):
    home_body = home_body.replace('{ILLUS_%s}' % _k.upper(), illus(_k))
page('', 'People counting & occupancy analytics with AI | Place Performance',
     'People counting and occupancy analytics for councils, universities, government and property: sensors, real-time data, alerts, forecasting and AI.',
     home_body, HOME_FAQS, nav_key='home')

# ---------------- Deployments (real-world gallery) ----------------
deployments_body = (
    page_hero('In the field', 'Real sensors in real Australian places',
              'A look at Place Performance sensors installed and running on the ground: from bushland trails and parks to libraries, venues, pop-ups and major events across Australia.',
              '', [('Home', '{R}'), ('In the field', None)]) +
    section(field_cards(FIELD)) +
    section(head('What these show', 'Hardware we survey, install and support ourselves.') +
            '<div class="prose"><p>Every site is different. Our Australian team assesses each environment, then selects and installs the right sensing for it: overhead counters at entrances and indoor zones, weatherproof units on poles for trails and open spaces, and temporary deployments for pop-ups and events. See <a href="{R}sensors/">the sensors we use</a> and <a href="{R}compare/">how we compare</a>.</p></div>', 'sec-tint')
)
DEPLOY_FAQS = [
    ('Where does Place Performance operate?', 'Place Performance deploys and supports sensors across Australia, in metropolitan and regional locations, indoors and outdoors.'),
    ('Can you count people at events and temporary sites?', 'Yes. We run temporary and single-event deployments as well as permanent installs, including pop-ups, expos and festivals, using battery, solar and mobile-data sensors where there is no fixed power or network.'),
    ('Can sensors be installed outdoors?', 'Yes. Weatherproof sensors are mounted on poles and structures to count people, cyclists and vehicles along trails, streets and open spaces, in all weather.'),
]
page('deployments', 'Real deployments across Australia | Place Performance',
     'Real-world people counting deployments by Place Performance across Australia: sensors installed and running in libraries, venues, parks, trails, pop-ups and major events.',
     deployments_body, DEPLOY_FAQS, [('Home', ''), ('In the field', 'deployments/')])

# ---------------- Platform ----------------
platform_body = (
    page_hero('Platform', 'One platform from the sensor to the decision.',
              'Place Performance brings together proven sensing hardware, local installation and support, and an analytics and AI platform. You get trustworthy numbers from day one and the intelligence to act on them.',
              shot('place-site', 'Place Performance site dashboard with live occupancy, floor stack and satellite map'),
              [('Home', '{R}'), ('Platform', None)]) +
    section(head('How it works', 'Four layers, delivered as one service.') + '''
    <div class="pipeline reveal">
      <div class="pipe-step"><div class="pipe-ico"><svg viewBox="0 0 24 24"><path d="M4 7h11l3-3v16l-3-3H4z"/><circle cx="9" cy="12" r="2.5"/></svg></div><h3>1. Sensors</h3><p>LiDAR counters at entrances, in spaces and across open areas, plus specialist sensors for cyclists, vehicles and outdoor areas.</p></div>
      <div class="pipe-flow"><span></span><span></span><span></span></div>
      <div class="pipe-step"><div class="pipe-ico"><svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg></div><h3>2. Edge processing</h3><p>Counting happens on the device and data is masked at source. Only anonymous counts are sent onward.</p></div>
      <div class="pipe-flow"><span></span><span></span><span></span></div>
      <div class="pipe-step"><div class="pipe-ico"><svg viewBox="0 0 24 24"><path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18z"/></svg></div><h3>3. Analytics platform</h3><p>Live occupancy, floorplans, trends, benchmarking, alerts and reports across every site, space and zone.</p></div>
      <div class="pipe-flow"><span></span><span></span><span></span></div>
      <div class="pipe-step"><div class="pipe-ico"><svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg></div><h3>4. AI insight</h3><p>Forecasts, scenario planning, ranked recommendations and a Place Assistant you can ask in plain English.</p></div>
    </div>''') +
    section(head('The sensor', 'How the counting actually works.',
                 'The sensors use LiDAR, pulses of light that map the space in 3D, to detect people by their shape and movement rather than their faces. Mounted overhead at an entrance, or positioned to cover an open area or a crowd, each one counts precisely without ever identifying anyone.') + '<div class="illus-wide reveal">' + illus('crowd') + '</div>' + cards([
        ('LiDAR 3D sensing', 'LiDAR maps the space in 3D with light, not a camera, so people are counted by shape and movement, never by their faces. One unit can cover an entrance, a wide walkway or an open area.', None),
        ('Counting on the device', 'A processor inside each unit turns the LiDAR data into counts on the spot. Only anonymous numbers ever leave it, the sensor captures depth, not images.', '{R}privacy-by-design/'),
        ('Accurate in any light', 'Up to 99.8% counting accuracy, held steady through busy crowds and in any lighting, LiDAR works just as well in the dark as in daylight.', None),
        ('Groups and direction understood', 'On-device processing counts people in and out, separates groups and filters out repeat passes, so the numbers reflect genuine visits.', None),
        ('One cable to fit', 'A single network cable carries both power and data, so a unit goes in quickly and cleanly with little disruption to the space.', None),
        ('Built to keep running', 'A sealed, weather-resistant housing rated for years of continuous, unattended operation, indoors or outdoors.', None),
    ]) + '<p style="margin-top:28px;text-align:center"><a class="link-arrow" href="{R}sensors/">The full range of sensors we use, from LiDAR to radar</a></p>', 'sec-tint') +
    section(head('On site', 'What the sensor sees on the ground.',
                 'The sensor projects a 3D field over the space and a count line across it. Anyone crossing is counted as an anonymous shape, no faces, no images.') + '<div class="reveal">' + lidar_photo() + '</div>') +
    section(split(SENSOR_VIS,
                  copy('Hardware included', 'We start with your question, not with a device.',
                       'Every place is different. Before anything is installed, our team assesses the environment, movement patterns, coverage, connectivity, power and privacy needs, then selects the technology that fits.',
                       '<ol class="steps-list"><li><b>Assess.</b> What do you need to understand, and where? Entrances, floors, rooms, paths, roads or open spaces.</li><li><b>Select.</b> LiDAR counters for entrances, open areas and crowds, plus specialist sensors for cyclists, vehicles and outdoor spaces.</li><li><b>Install and commission.</b> Designed, supplied, installed and calibrated by our Australian team, permanent or temporary.</li><li><b>Support.</b> Every device reports a heartbeat. Local experts keep the system accurate and expand it as your needs change.</li></ol>'))) +
    section(head('One service', 'Proven hardware, local expertise and an intelligent platform, delivered together.') + '''
    <div class="pillar-grid reveal">
      <div class="partner"><span class="partner-role">Proven hardware</span><h4>LiDAR people counters</h4><p>Commercial-grade LiDAR sensors with all processing on the device and no personal data collected, plus specialist sensors for cyclists, vehicles and outdoor spaces.</p><a class="link-arrow" href="{R}privacy-by-design/">How counting stays anonymous</a></div>
      <div class="partner"><span class="partner-role">Local expertise</span><h4>Australian team</h4><p>We survey, design, install, calibrate and support every deployment, from the first site visit to ongoing maintenance and expansion.</p><a class="link-arrow" href="{R}platform/">How we deliver</a></div>
      <div class="partner"><span class="partner-role">Intelligent platform</span><h4>Place Performance</h4><p>Real-time dashboards, live floorplans, alerts, reporting, forecasting and AI insights across every site, space and zone.</p><a class="link-arrow" href="{R}real-time/">See it in real time</a></div>
    </div>''', 'sec-tint') +
    section(head('Capabilities', 'Everything you need to measure, understand and act.') + cards([
        ('Live occupancy', 'People present now against capacity, refreshed every few seconds.', '{R}real-time/'),
        ('Live floorplans', 'Upload a plan, draw your rooms and watch them fill in real time.', '{R}real-time/'),
        ('Heat maps &amp; flow', 'Where people gather in a zone and how they move between spaces.', None),
        ('Alerts', 'Thresholds on occupancy, queues, sensor health and anomalies, with escalation.', '{R}real-time/'),
        ('Reporting', 'Scheduled reports and board-ready executive packs, delivered automatically.', None),
        ('Forecasting', 'Predicted visitation and occupancy with confidence ranges.', '{R}ai-forecasting/'),
        ('Scenario planning', 'Test opening hours, capacity, staffing and layout before you commit.', '{R}ai-forecasting/'),
        ('Place Assistant', 'Ask questions in plain English and get answers from your live data.', '{R}ai-forecasting/'),
        ('Portfolio benchmarking', 'Rank sites, flag outliers and compare against peers.', None),
        ('Integrations', 'Point of sale, Wi-Fi, building management, GIS, parking and ticketing.', None),
        ('Device health', 'Every sensor on your plans with live status and uptime history.', None),
        ('Security &amp; access', 'Roles, site-level permissions, single sign-on and an audit log.', '{R}privacy-by-design/'),
    ])) +
    section('<div class="tour reveal"><div class="tour-copy"><span class="tour-num">Reporting</span><h3>Reports that run themselves</h3><p>Weekly visitation summaries, monthly capacity reports and device health, scheduled to the right inboxes. Board-ready executive packs are generated each quarter.</p></div>' + shot('report', 'Weekly visitation summary report') + '</div>'
            '<div class="tour tour-rev reveal"><div class="tour-copy"><span class="tour-num">Device health</span><h3>Data you can trust</h3><p>See every sensor on your floorplans with its live status. When a device goes quiet you are alerted, and the support team is already on it.</p></div>' + shot('device', 'Device record showing a LiDAR counter located on the floorplan') + '</div>', 'sec-tint')
)
PLATFORM_FAQS = [
    ('What hardware does Place Performance use?', 'Place Performance uses commercial-grade LiDAR people counters for entrance, area and crowd counting, plus specialist sensors for cyclists, vehicles and outdoor areas where needed. Our team selects the right technology for each environment after assessing it.'),
    ('Who installs and supports the sensors?', 'Place Performance designs, supplies, installs, commissions and supports the complete measurement system in Australia, from the initial site survey through to ongoing maintenance and expansion.'),
    ('Does it work outdoors?', 'Yes. Deployments can be indoor or outdoor, permanent or temporary, covering buildings, venues, parks, trails, streets and public spaces, including pedestrian, cyclist and vehicle counting.'),
    ('What systems does it integrate with?', 'It connects to point-of-sale, Wi-Fi analytics, building management systems, GIS, parking and ticketing platforms. Integrations are configured for you, and you control settings such as sync frequency and which data feeds reports.'),
    ('Can I see data for a single room as well as a whole portfolio?', 'Yes. Data is organised as portfolio, site, space and zone, so you can drill from all your locations to one building, one floor and a single room, with every metric rolling up automatically.'),
    ('How accurate is the data?', 'Accuracy depends on the sensor and environment, which is why each location is assessed and each device is calibrated during commissioning. Device health monitoring flags drift or outages so data quality stays high.'),
]
page('platform', 'Platform: sensors, analytics & AI | Place Performance',
     'How Place Performance works: LiDAR sensors, installation and support by our Australian team, edge processing, real-time analytics and AI, as one service.',
     platform_body, PLATFORM_FAQS, [('Home', ''), ('Platform', 'platform/')])

# ---------------- Real time ----------------
realtime_body = (
    page_hero('Real time', 'See every room, floor and site as it happens.',
              'Occupancy refreshes every few seconds on interactive floorplans. Drill from your whole portfolio to a single room, and get told the moment something needs attention.',
              shot('floorplan', 'Live floorplan showing occupancy per room with an occupancy gauge'),
              [('Home', '{R}'), ('Real time', None)]) +
    '''<section class="sec sec-dark"><div class="dark-glow"></div><div class="wrap">''' + head('Live across your portfolio', 'Every site, live, on one map.', 'Each site is coloured by its busiest zone, so one overcrowded room flags the whole site. Click into any location to see it at street level.', True) + '''
      <div class="live-grid">
        <div class="live-map reveal" id="live-map">
          <div class="map-head"><span class="dot-live"></span> Live across your portfolio <span class="map-count"><b class="js-tick" data-base="3063" data-jitter="40">3,063</b> people now</span></div>
          <svg class="au" viewBox="0 0 1000 880" aria-label="Map of Australia with live site locations"></svg>
          <div class="map-pins" id="map-pins"></div><div class="map-feed" id="map-feed"></div>
        </div>
        <div class="live-side">''' + shot('home', 'Home dashboard with live occupancy by site on a satellite map') + '''
          <div class="feature-mini reveal"><div><b>Traffic-light status</b><span>Green fine, amber and orange busy, red over capacity.</span></div><div><b>Site &rarr; space &rarr; zone</b><span>One click from portfolio to a single room.</span></div><div><b>Satellite zoom</b><span>Fly into any site at street level.</span></div></div>
        </div>
      </div></div></section>''' +
    section(split(shot('heatmap', 'Heat map of a zone replayed through the day'), copy('Inside each space', 'Heat maps and visitor flow.', 'See where people concentrate within a room and replay the day hour by hour. Visitor flow traces the most common paths between entrances and zones, so you can fix pinch points and place services where people go.'))) +
    in_practice('venue', 'Crowd capacity, live.', 'Counters at every gate measure arrivals as they happen, zone occupancy is compared with each limit, and the right team is alerted before an area fills.') +
    section('<div class="alert-band alert-band-light reveal"><div class="alert-copy"><p class="eyebrow">Alerts &amp; notifications</p><h3>Know before the queue forms or the room overflows.</h3><p>Set thresholds on occupancy, wait times, sensor health or anything unusual. The right people are notified by email, SMS, Teams or in-app, with escalation if nobody responds.</p><div class="toast-stack" id="toast-stack"></div></div>' + shot('alerts', 'Alerts feed and alert rules', 'tilt') + '</div>', 'sec-tint') +
    section(head('What you can monitor', 'Real-time signals that matter.') + cards([
        ('Occupancy vs capacity', 'Live counts against fire, venue or comfort limits for every zone.'),
        ('Queues &amp; wait times', 'Service-point queue length and wait, against your service targets.'),
        ('Entries &amp; exits', 'Inflow and outflow by entrance, hour by hour.'),
        ('Sensor health', 'Heartbeat, uptime and data-quality checks for every device.'),
        ('Anomalies', 'Unusually quiet or busy periods compared with what is expected.'),
        ('Integrations', 'Sync status of POS, Wi-Fi, BMS and other connected systems.'),
    ]))
)
REALTIME_FAQS = [
    ('How often does occupancy data update?', 'Live occupancy refreshes every few seconds on dashboards and floorplans, and sensors typically report counts every minute. Historical views aggregate the same data by hour, day, week, month and year.'),
    ('What alerts can I set up?', 'You can alert on occupancy above a percentage of capacity, queue wait times, entry and exit imbalances, sensor heartbeat loss, integration sync failures and unusual activity compared with what is expected, each with its own duration, scope and severity.'),
    ('How are notifications delivered?', 'Notifications can be sent by email, SMS, Microsoft Teams or in-app, to individuals or teams, with optional escalation to another person if an alert is not acknowledged in time.'),
    ('Can I see live occupancy on a floorplan?', 'Yes. You upload a floorplan for each floor, draw each room or zone as a shape, and every zone then shows its live headcount and is coloured by how full it is.'),
    ('What happens if a sensor goes offline?', 'Each device sends a regular heartbeat. If it stops, an alert is raised, the device is flagged on your floorplan and device list, and the support team is notified so it can be fixed quickly.'),
    ('Can I monitor crowd capacity at events?', 'Yes. Temporary counting can be deployed for events to track attendance, entry flow and live crowd numbers against venue limits, with alerts before limits are reached.'),
]
page('real-time', 'Real-time occupancy monitoring & alerts | Place Performance',
     'Live occupancy every few seconds, interactive floorplans, heat maps, visitor flow and alerts by email, SMS and Teams for every site and room.',
     realtime_body, REALTIME_FAQS, [('Home', ''), ('Real time', 'real-time/')], service='Real-time occupancy monitoring')

# ---------------- AI & forecasting ----------------
ai_body = (
    page_hero('AI, predictions &amp; planning', "Don't just see what happened. Know what's next.",
              'Place Performance learns the rhythm of every place to forecast demand, flag risks and recommend actions, then lets you test changes before you make them.',
              '''<div class="hv ai-hero" aria-label="Example Place Assistant conversation">
      <div class="hv-card ai-chat">
        <div class="ai-chat-top"><span class="ai-spark">&#10022;</span><b>Place Assistant</b><span class="hv-live"><span class="dot-live"></span>Live data</span></div>
        <div class="ai-chat-body">
          <p class="ai-chat-q">Will the Children's Area hit capacity this Saturday?</p>
          <div class="ai-chat-a">
            <p><b>Likely, yes.</b> Saturday is forecast to peak at <b class="t-red">96% at 11am</b>, driven by the school holiday story time. It stays above 85% from 10:30 to 12:30.</p>
            <div class="ai-fc"><div class="ai-fc-bars"><i style="height:22%" class="g"><em>22%</em></i><i style="height:48%" class="g"><em>48%</em></i><i style="height:78%" class="a"><em>78%</em></i><i style="height:96%" class="r"><em>96%</em></i><i style="height:90%" class="r"><em>90%</em></i><i style="height:70%" class="a"><em>70%</em></i><i style="height:52%" class="g"><em>52%</em></i><i style="height:30%" class="g"><em>30%</em></i></div><div class="ai-fc-x"><span>9am</span><span>11am</span><span>1pm</span><span>4pm</span></div></div>
            <p class="ai-rec"><b>Recommendation:</b> open the Activity Room as overflow from 10:30 and roster one extra staff member. <span>Confidence 84%</span></p>
          </div>
        </div>
        <div class="ai-chat-in">Ask anything about your places&hellip;<span>&#8593;</span></div>
      </div>
    </div>''',
              [('Home', '{R}'), ('AI &amp; forecasting', None)]) +
    section('''<div class="ai-grid">
      <div class="ai-card ai-card-wide reveal"><div class="ai-text"><h3>Ask your buildings anything</h3><p>The Place Assistant answers questions in plain English using your live data, links straight to the places it mentions, and knows which screen you are looking at.</p>
        <div class="chat-demo" id="chat-demo"><div class="chat-q">Which zones are closest to capacity?</div><div class="chat-a"><span class="typing"><i></i><i></i><i></i></span></div></div></div>''' + shot('assistant', 'Place Assistant panel open beside a floor dashboard') + '''</div>
      <div class="ai-card reveal"><h3>Forecasting</h3><p>Predicted visitation and occupancy for the weeks ahead, per site, with confidence ranges that widen further out.</p>''' + shot('forecast', 'Visitation forecast with confidence band', 'flat') + '''</div>
      <div class="ai-card reveal"><h3>Scenario planning</h3><p>Change opening hours, capacity, staffing or layout and see the projected impact on visits, peak occupancy, queues and cost per visit.</p>''' + shot('scenario', 'What-if scenario modelling with sliders and projection chart', 'flat') + '''</div>
      <div class="ai-card ai-card-wide reveal insight-card"><div class="ai-text"><h3>AI insights, every morning</h3><p>Plain-language recommendations ranked by impact, each with the evidence behind it and a confidence score.</p></div>
        <div class="insights"><div class="insight"><span class="tag tag-green">Opportunity</span><b>Extend Saturday trading by 1 hour</b><small>+1,350 visits a week &middot; 86% confidence</small></div><div class="insight"><span class="tag tag-red">Risk</span><b>Children's Area regularly over capacity</b><small>9 breaches in 14 weeks &middot; 92% confidence</small></div><div class="insight"><span class="tag tag-amber">Efficiency</span><b>Level 12 under 30% used Mon and Fri</b><small>&asymp; $41k a year &middot; 81% confidence</small></div></div></div>
    </div>''') +
    section(head('Use the data for planning', 'From operations to capital decisions.') + cards([
        ('Staffing &amp; rosters', 'Match staff to forecast demand and peak periods.'),
        ('Opening hours', 'Model the impact of earlier, later or extended trading.'),
        ('Capital works', 'Forecast demand before committing to new space, then measure the result.'),
        ('Investment analysis', 'Before-and-after views show whether a refit or intervention paid off.'),
        ('Benchmarking', 'Compare sites with each other and with anonymised peer cohorts.'),
        ('Board reporting', 'Executive packs summarise performance, forecasts and recommendations.'),
    ]), 'sec-tint')
)
AI_FAQS = [
    ('How does visitation forecasting work?', 'Forecasts are built from each place\'s own history, including time of day, day of week and seasonal patterns, to predict visitation and occupancy for the weeks ahead. Each forecast includes a confidence range that widens further into the future.'),
    ('What can I ask the Place Assistant?', 'You can ask questions such as which rooms are over capacity, when a site is busiest, which sensors are offline, how this week compares with last, or what to focus on. Answers use your live data and link directly to the places they mention.'),
    ('Which AI model powers the Place Assistant?', 'The Place Assistant uses Claude, a large language model from Anthropic, given a snapshot of the data your role is allowed to see at the time you ask. Contact us for details of data handling for your organisation.'),
    ('What is scenario planning?', 'Scenario planning lets you change assumptions such as opening hours, capacity, staffing or layout and immediately see the projected effect on visits, peak occupancy, queue times and cost per visit, then save and compare scenarios side by side.'),
    ('How are AI insights generated?', 'Each morning the platform analyses trends, peaks, capacity breaches and comparisons across your sites and writes plain-language recommendations ranked by impact, each with the supporting evidence and a confidence score.'),
    ('Can it help justify capital investment?', 'Yes. Forecasts support the business case before you build, and investment analysis compares visitation, dwell and other outcomes before and after a project to show whether it paid off.'),
]
page('ai-forecasting', 'AI insights, forecasting & scenarios | Place Performance',
     'Forecast visitation and occupancy, test changes with scenario planning, get daily AI recommendations and ask your buildings questions in plain English.',
     ai_body, AI_FAQS, [('Home', ''), ('AI & forecasting', 'ai-forecasting/')], service='Visitation forecasting and AI insights')

# ---------------- Plans ----------------
FEATURE_ROWS = [
    ('Visitor counting, entries &amp; exits', 1), ('Live occupancy vs capacity', 1), ('Peak periods &amp; dwell time', 1), ('Demographics (where supported)', 1),
    ('Live dashboards &amp; automated reports', 1), ('Device health monitoring', 1), ('Live floorplans', 2), ('Heat maps &amp; visitor flow', 2),
    ('Zone comparison &amp; repeat visitation', 2), ('Historical trends', 2), ('Multi-site portfolio &amp; ranking', 3), ('Alert rules &amp; escalation', 3),
    ('Queue &amp; operations analytics', 3), ('POS, Wi-Fi &amp; BMS integrations', 3), ('Place Performance Score', 3), ('Single sign-on', 3),
    ('Performance index &amp; benchmarking', 4), ('AI insights &amp; Place Assistant', 4), ('Forecasting', 4), ('Scenario modelling &amp; investment analysis', 4), ('Board reporting packs', 4),
]
plan_table = '<div class="cmp-wrap reveal"><table class="cmp"><thead><tr><th>Capability</th><th>Essentials</th><th>Insights</th><th>Professional</th><th>Executive</th></tr></thead><tbody>%s</tbody></table></div>' % ''.join(
    '<tr><td>%s</td>%s</tr>' % (n, ''.join('<td>%s</td>' % ('<span class="yes" aria-label="Included">&#10003;</span>' if lv >= l else '<span class="no" aria-label="Not included">&ndash;</span>') for lv in range(1, 5))) for n, l in FEATURE_ROWS)
plans_body = (
    page_hero('Plans', 'Start by measuring. Finish by transforming.',
              'Four levels. Each includes everything before it, so you can start small, prove value and grow.',
              '', [('Home', '{R}'), ('Plans', None)], ctas=False).replace('class="hero page-hero"', 'class="hero page-hero hero-plans"') +
    section('''<div class="plans reveal">
      <div class="plan"><span class="plan-n">Level 1</span><h3>Essentials</h3><p class="plan-tag">Know what's happening.</p><ul><li>Visitor counting &amp; occupancy</li><li>Peak periods &amp; dwell time</li><li>Live dashboards</li><li>Automated reports</li><li>Device health</li></ul><a class="btn btn-plan" href="{R}quote/?plan=essentials">Get a quote <i class="arr"></i></a></div>
      <div class="plan"><span class="plan-n">Level 2</span><h3>Insights</h3><p class="plan-tag">Know why it's happening.</p><ul><li>Live floorplans</li><li>Heat maps &amp; visitor flow</li><li>Zone comparison</li><li>Repeat visitation</li><li>Historical trends</li></ul><a class="btn btn-plan" href="{R}quote/?plan=insights">Get a quote <i class="arr"></i></a></div>
      <div class="plan plan-hl"><span class="plan-n">Level 3</span><h3>Professional</h3><p class="plan-tag">Improve how your place performs.</p><ul><li>Multi-site portfolio</li><li>Alert rules &amp; escalation</li><li>Queue &amp; operations</li><li>POS, Wi-Fi &amp; BMS integrations</li><li>Single sign-on</li></ul><a class="btn btn-plan btn-plan-hl" href="{R}quote/?plan=professional">Get a quote <i class="arr"></i></a></div>
      <div class="plan"><span class="plan-n">Level 4</span><h3>Executive</h3><p class="plan-tag">Lead with intelligence.</p><ul><li>Performance index &amp; benchmarking</li><li>AI insights &amp; Place Assistant</li><li>Forecasting</li><li>Scenario modelling</li><li>Board reporting packs</li></ul><a class="btn btn-plan" href="{R}quote/?plan=executive">Get a quote <i class="arr"></i></a></div>
    </div>''' + '<p class="plans-note">Every plan includes sensors, installation, commissioning, the platform and ongoing support. Pricing depends on the number of sites and devices. <a href="{R}quote/">Get a quote</a>.</p>', 'sec-pull') +
    section(head('Compare', 'What\'s included at each level.') + plan_table, 'sec-tint')
)
PLANS_FAQS = [
    ('What is included in every plan?', 'Every plan includes the sensors, site survey, installation, commissioning, the analytics platform, device health monitoring and ongoing support. Higher levels add capabilities on top of everything in the levels below.'),
    ('How is Place Performance priced?', 'Pricing is based on the number of sites and devices and the capability level you choose. <a href="{R}quote/">Get a quote</a> tailored to your locations.'),
    ('Can we start small and upgrade later?', 'Yes. Many organisations start with Essentials at one or a few sites and move up a level when they are ready. Upgrades add features without replacing hardware or losing history.'),
    ('Which level do we need for multiple sites?', 'Multi-site portfolio views, site ranking and outlier flags start at Professional (Level 3). Portfolio-wide performance index and external benchmarking are part of Executive (Level 4).'),
    ('Which level includes AI and forecasting?', 'AI insights, the Place Assistant, forecasting, scenario modelling, investment analysis and board reporting packs are included in Executive (Level 4).'),
    ('Can we run a pilot first?', 'Yes. A pilot at one site is the most common way to start. It proves accuracy and value with your own data before you commit to a wider rollout.'),
]
PLANS_SCHEMA = {
    '@type': 'OfferCatalog', '@id': BASE + 'plans/#catalog', 'name': 'Place Performance plans',
    'url': BASE + 'plans/', 'provider': {'@id': BASE + '#org'},
    'itemListElement': [
        {'@type': 'Offer', 'name': 'Essentials', 'url': BASE + 'quote/?plan=essentials',
         'description': "Know what's happening: visitor counting and occupancy, peak periods and dwell time, live dashboards, automated reports and device health."},
        {'@type': 'Offer', 'name': 'Insights', 'url': BASE + 'quote/?plan=insights',
         'description': "Know why it's happening: live floorplans, heat maps and visitor flow, zone comparison, repeat visitation and historical trends."},
        {'@type': 'Offer', 'name': 'Professional', 'url': BASE + 'quote/?plan=professional',
         'description': 'Improve how your place performs: multi-site portfolio, alert rules and escalation, queue and operations analytics, POS, Wi-Fi and BMS integrations and single sign-on.'},
        {'@type': 'Offer', 'name': 'Executive', 'url': BASE + 'quote/?plan=executive',
         'description': 'Lead with intelligence: performance index and benchmarking, AI insights and the Place Assistant, forecasting, scenario modelling and board reporting packs.'},
    ],
}
page('plans', 'Plans & pricing: Essentials to Executive | Place Performance',
     'Compare Place Performance plans, from Essentials to Executive. Every plan includes sensors, installation, platform and support. Start small and grow.',
     plans_body, PLANS_FAQS, [('Home', ''), ('Plans', 'plans/')], schema=PLANS_SCHEMA)

# ---------------- Solutions hub ----------------
sol_hub = (
    page_hero('Industries', 'Different places, different questions. One platform.',
              'Councils focus on safety and service. Universities chase utilisation. Property teams need to prove value. Place Performance answers each with the same trusted data.',
              '', [('Home', '{R}'), ('Industries', None)]) +
    section(photo_cards([(n.replace('&amp;', '&amp;'), d, img, '{R}industries/%s/' % s) for s, n, d, img in SOLUTIONS])) +
    section(head('By outcome', 'What organisations use it for.') + cards([
        ('Crowd capacity &amp; safety', 'Live counts against limits with alerts before they are reached.', '{R}industries/councils/'),
        ('Space utilisation', 'How rooms, floors and buildings are really used, hour by hour.', '{R}industries/universities/'),
        ('Portfolio rationalisation', 'Consolidate and right-size property on evidence.', '{R}industries/government/'),
        ('Operational efficiency', 'Clean, staff and condition spaces on demand.', '{R}industries/buildings/'),
        ('Commercial performance', 'Connect footfall to sales and tenant performance.', '{R}industries/retail/'),
        ('Active transport &amp; public realm', 'Pedestrians, cyclists and vehicles across outdoor places.', '{R}industries/parks-and-streets/'),
    ]), 'sec-tint')
)
SOL_FAQS = [
    ('Which organisations use Place Performance?', 'It is designed for local councils, universities and TAFEs, state and federal government agencies, commercial property owners and managers, shopping centres and precinct operators, and managers of parks, trails and streets.'),
    ('What problems does it solve?', 'The most common uses are crowd capacity and safety, space utilisation, portfolio rationalisation, demand-based operations such as cleaning and staffing, commercial performance, and measuring active transport and public spaces.'),
    ('Which sector page should I start with?', 'Start with the sector that matches your organisation, such as councils or universities, or browse by the type of place you manage, such as libraries, campuses or parks.'),
    ('Is the hardware the same in every sector?', 'The core technology is the same, but each deployment is designed for its environment. Most sites use LiDAR people counters, mounted overhead at entrances or positioned to cover open areas and crowds, with specialist sensors for pedestrians, cyclists or vehicles where needed.'),
    ('Can one organisation use it for several purposes?', 'Yes. The same sensors and data support safety, utilisation, operations and planning at the same time, and different teams see the views that matter to them.'),
]
page('industries', 'Industries | Place Performance',
     'How councils, universities, government, property owners, retail precincts and public-realm managers use Place Performance for capacity and planning.',
     sol_hub, SOL_FAQS, [('Home', ''), ('Industries', 'industries/')], nav_key='industries')

# ---------------- Individual solutions ----------------
SECTOR_SCENE = {'councils': 'library', 'universities': 'campus', 'government': 'service', 'buildings': 'office', 'retail': 'shopping', 'parks-and-streets': 'park', 'marketing': 'shopping', 'hospitality': 'venue'}


def solution(slug, name, h1, lead, img, img_alt, shot1, shot1_alt, shot2, shot2_alt, outcomes, metrics, scenarios, faqs, desc, service, audience):
    body = (
        page_hero(name, h1, lead, photo(img, img_alt), [('Home', '{R}'), ('Industries', '{R}industries/'), (name, None)]) +
        section(head('Outcomes', 'What you can achieve.') + ticks(outcomes, 'ticks-grid reveal')) +
        in_practice(SECTOR_SCENE[slug]) +
        section(split(shot(shot1, shot1_alt), copy('In the platform', scenarios[0][0], scenarios[0][1])) +
                '<div style="height:80px"></div>' +
                split(copy('In the platform', scenarios[1][0], scenarios[1][1]), shot(shot2, shot2_alt), True), 'sec-tint') +
        section(head('Metrics', 'The numbers you get.') + cards([(m, d) for m, d in metrics])) +
        section(head('Related', 'Explore more.') + photo_cards([
            ('Real-time monitoring', 'Live occupancy, floorplans and alerts.', 'floorplan', '{R}real-time/'),
            ('AI &amp; forecasting', 'Forecasts, scenarios and the Place Assistant.', 'forecast', '{R}ai-forecasting/'),
            ('Privacy by design', 'Counts, not identities.', 'device', '{R}privacy-by-design/'),
        ], 'screens'), 'sec-tint')
    )
    page('industries/' + slug, '%s | Place Performance' % SEO_TITLES[slug], desc, body, faqs,
         [('Home', ''), ('Industries', 'industries/'), (strip(name), 'industries/%s/' % slug)], service=service, audience=audience, nav_key='industries')


solution('councils', 'Councils &amp; civic', 'People counting and crowd capacity for councils.',
         'Libraries, community centres, events and customer service points, managed with live crowd numbers instead of guesswork, plus the evidence to justify funding.',
         'civic-event', 'Crowd at a community event under the Sydney Harbour Bridge', 'heatmap', 'Heat map of a library children\'s area', 'peak-periods', 'Peak periods heat grid by day and hour',
         [('Crowd capacity and safety.', 'Live counts against fire and venue limits, with alerts before limits are reached.'),
          ('Service levels.', 'Queue and wait-time tracking at customer service points.'),
          ('Opening hours and staffing.', 'Match hours and rosters to when the community actually visits.'),
          ('Evidence for funding.', 'Visitation reports that prove the value of community facilities.'),
          ('Events.', 'Temporary counting for attendance and crowd management.'),
          ('Active transport.', 'Pedestrian and cyclist counts on shared paths and trails.')],
         [('Visitors &amp; attendance', 'Daily, weekly and seasonal visitation per facility.'), ('Live occupancy', 'People present now against each space\'s limit.'), ('Peak periods', 'Busiest and quietest hours by day.'),
          ('Dwell time', 'How long people stay in libraries and centres.'), ('Queue &amp; wait', 'Service desk wait against targets.'), ('Repeat visitation', 'New versus returning community members.')],
         [('See where crowds build, room by room.', 'Heat maps show where people concentrate in a library or centre and replay the day hour by hour, so you can manage crowding before it becomes a safety issue.'),
          ('Plan hours and staff around real demand.', 'Peak-period grids show the busiest and quietest hours of each day, so opening hours and rosters match how the community actually uses each facility.')],
         [('How do councils use people counting?', 'Councils use people counting to manage crowd capacity and safety in libraries, civic centres and events, to set opening hours and staffing around real demand, to monitor service-desk queues, and to report visitation as evidence for funding and planning.'),
          ('Can it monitor crowd capacity at events?', 'Yes. Temporary sensors can be deployed for events to track attendance and live crowd numbers at entrances and zones, with alerts to staff before venue limits are reached.'),
          ('Does it work for public libraries?', 'Yes. Libraries are one of the most common uses: visitor counts, occupancy by area such as reading rooms and children\'s areas, peak periods, dwell time and study-room utilisation.'),
          ('Is people counting in public spaces privacy compliant?', 'Counting is anonymous. Processing happens on the device and data is masked at source, so no images or personal information are stored or transmitted, which supports councils\' privacy obligations.'),
          ('Can it count cyclists and pedestrians on shared paths?', 'Yes. Place Performance measures pedestrian and cyclist volumes and direction on shared paths, trails and in parks, so active-transport use can be tracked over time.'),
          ('Can the data support grant applications?', 'Yes. Automated visitation reports provide consistent, independent evidence of how facilities are used, which is useful for grant applications, annual reports and council briefings.')],
         'People counting, crowd capacity monitoring and visitation reporting for councils: libraries, civic centres, events, service desks, shared paths and parks.', 'People counting for local councils', 'Local government')

solution('universities', 'Universities', 'Space utilisation analytics for universities.',
         'Understand how lecture theatres, libraries and study spaces are really used, help students find space, and plan capital works on evidence rather than bookings.',
         'study-hall', 'Students studying in the State Library of New South Wales reading room', 'occupancy-history', 'Occupancy history over a week', 'floorplan', 'Live floorplan of a building level',
         [('Space utilisation.', 'Booked versus actually used, room by room and hour by hour.'),
          ('Timetabling and allocation.', 'Right-size rooms to class sizes and free up under-used space.'),
          ('Student experience.', 'Show students where free study space is, live.'),
          ('Capital planning.', 'Forecast demand before committing to new buildings.'),
          ('Library operations.', 'Staff and open libraries around real demand.'),
          ('Campus safety.', 'Occupancy limits and evacuation counts for large spaces.')],
         [('Utilisation %', 'Share of time and seats actually used.'), ('Live occupancy', 'Free and busy study spaces now.'), ('Peak periods', 'Busiest hours by day of the week and semester.'),
          ('Dwell time', 'How long students stay in each space.'), ('Repeat visitation', 'Regular versus occasional users.'), ('Trends', 'Week, month and year comparisons across semesters.')],
         [('Know which spaces are really used.', 'Occupancy history by hour and day reveals how lecture theatres, labs and study spaces are used across the week and the semester, compared with what is booked.'),
          ('Help students find space, live.', 'Live floorplans show free and busy study rooms in real time, so students waste less time searching and spaces are used more evenly.')],
         [('How do universities measure space utilisation?', 'Sensors count how many people are in each room or zone throughout the day. Comparing actual occupancy with capacity and bookings shows true utilisation by room, building and time of week.'),
          ('Can it compare bookings with actual use?', 'Yes. Measured occupancy can be compared with timetabled or booked use to identify rooms that are booked but empty and classes that need larger or smaller rooms.'),
          ('Can students see free study spaces?', 'Yes. Live occupancy can be shown on floorplans so students and staff can see which study rooms and library areas have space right now.'),
          ('Does it identify individual students?', 'No. Counting is anonymous, with processing on the device and no images or personal information collected.'),
          ('Can it support capital planning decisions?', 'Yes. Utilisation trends and demand forecasts show whether more space is really needed or existing space can be used better, before committing to new buildings.')],
         'Space utilisation analytics for universities: measure lecture theatre, library and study space use, compare bookings with real occupancy and plan on evidence.', 'Space utilisation analytics for universities', 'Higher education')

solution('government', 'Government', 'Office occupancy analytics for government property.',
         'Hybrid work changed how offices are used. See occupancy across every floor and site, consolidate with confidence, and report transparently to executives and ministers.',
         'government', 'Parliament House, Canberra', 'portfolio', 'Portfolio overview with site ranking and map', 'report', 'Weekly visitation report',
         [('Portfolio rationalisation.', 'Compare utilisation across buildings and identify consolidation opportunities.'),
          ('Workplace strategy.', 'Understand attendance patterns by day and floor.'),
          ('Safety and compliance.', 'Capacity monitoring and evacuation counts for public-facing sites.'),
          ('Transparent reporting.', 'Executive packs ready for boards, ministers and audit.'),
          ('Service centres.', 'Queue and wait-time monitoring at shopfronts.'),
          ('Energy savings.', 'Condition and clean only the floors in use.')],
         [('Floor utilisation', 'Average and peak occupancy per floor.'), ('Attendance by weekday', 'Hybrid patterns across the week.'), ('Portfolio ranking', 'Sites compared by utilisation and score.'),
          ('Live occupancy', 'People on site now for safety.'), ('Queue &amp; wait', 'Service-centre wait against targets.'), ('Trends', 'Change over months and years.')],
         [('Compare every building in the portfolio.', 'Portfolio views rank sites by utilisation and performance, flag outliers and show where floors are consistently under-used, so consolidation decisions rest on evidence.'),
          ('Report transparently, automatically.', 'Scheduled reports and board packs summarise attendance, utilisation and trends for executives and ministers without manual data gathering.')],
         [('How can government agencies right-size office space?', 'By measuring actual occupancy on every floor over time, agencies can see average and peak utilisation by day, identify consistently under-used floors and buildings, and consolidate based on evidence rather than headcount or bookings.'),
          ('Can it measure hybrid work attendance?', 'Yes. Occupancy by floor and day of the week shows hybrid attendance patterns, such as low use on Mondays and Fridays, without tracking individuals.'),
          ('Is the data anonymous?', 'Yes. Sensors count people without identifying them, with processing on the device and no images or personal information collected.'),
          ('Can it support evacuation and safety requirements?', 'Live occupancy shows how many people are in each building and floor at any moment, supporting capacity limits and emergency management at public-facing sites.'),
          ('Where is the data hosted?', 'Hosting arrangements can be discussed to meet your agency\'s data and security requirements. Contact us with your requirements.')],
         'Office occupancy analytics for government: right-size property portfolios, understand hybrid attendance, monitor capacity and report transparently.', 'Office occupancy analytics for government', 'Government agencies')

solution('buildings', 'Buildings &amp; property', 'Occupancy analytics for commercial buildings.',
         'Clean, cool and staff spaces when people are actually there, give tenants the data to value their workplace, and prove the return on every refit.',
         'office', 'Office tower courtyard in the Sydney CBD', 'visitor-flow', 'Visitor flow between entrances and zones on a floor', 'device', 'Device record on a floorplan',
         [('Demand-based cleaning.', 'Trigger cleans after a set number of visits, not fixed times.'),
          ('Energy and HVAC.', 'Feed occupancy into your BMS and stop conditioning empty floors.'),
          ('Tenant insights.', 'Show tenants how their space performs and support lease decisions.'),
          ('Asset value.', 'Prove the impact of refits with before-and-after analysis.'),
          ('Amenity planning.', 'Size kitchens, meeting rooms and end-of-trip facilities to demand.'),
          ('Reliable data.', 'Monitored sensors with health alerts and local support.')],
         [('Floor &amp; room occupancy', 'Live and historical, per tenancy.'), ('Meeting room use', 'Booked versus used, by size.'), ('Visitor flow', 'Paths between lifts, entrances and amenities.'),
          ('Cleaning triggers', 'Visits since the last clean, per area.'), ('Energy demand', 'Occupancy signal for HVAC and lighting.'), ('Score', 'One headline performance number per building.')],
         [('See how people move through a floor.', 'Visitor flow traces the paths between lifts, entrances and amenities, so you can fix pinch points and put services where people actually go.'),
          ('Trust the numbers.', 'Every sensor is shown on your floorplans with live status and uptime history, and the support team is alerted if one goes quiet.')],
         [('How can occupancy data reduce building operating costs?', 'Occupancy data lets you clean, heat, cool and light spaces based on actual use. Integrating it with a building management system means empty floors are not conditioned, and cleaning is triggered by visits rather than fixed schedules.'),
          ('Does it integrate with building management systems?', 'Yes. Occupancy can be shared with building management systems such as HVAC and lighting controls, and integrations are configured for you.'),
          ('Can tenants see their own data?', 'Yes. Access can be limited by site and tenancy, so tenants see occupancy and utilisation for their own space.'),
          ('Can it prove the value of a refit?', 'Yes. Investment analysis compares occupancy, utilisation and dwell before and after a refit to show whether it achieved its goals.'),
          ('How accurate are the sensors?', 'The LiDAR counters are calibrated during commissioning, and continuous device health monitoring flags issues early so data stays reliable.')],
         'Occupancy analytics for commercial buildings: demand-based cleaning, BMS and HVAC integration, tenant insights and refit ROI, with local support.', 'Occupancy analytics for commercial buildings', 'Property owners and managers')

solution('retail', 'Retail &amp; precincts', 'Footfall analytics for shopping centres and precincts.',
         'Connect visitation to sales, see which zones, tenants and events really drive results, and staff and clean for the busiest hours of each day.',
         'food-hall', 'Shopping centre atrium in Sydney', 'peak-periods', 'Peak period heat grid', 'occupancy-history', 'Occupancy trend over a week',
         [('Conversion.', 'Combine footfall with point-of-sale data to see sales per visitor.'),
          ('Peak management.', 'Staff and clean for the busiest hours of each day.'),
          ('Tenant and zone ranking.', 'Find your strongest and weakest areas.'),
          ('Event impact.', 'Measure the uplift from promotions and activations.'),
          ('Queue management.', 'Monitor service desks and food courts against wait targets.'),
          ('Leasing evidence.', 'Footfall data to support leasing and rent reviews.')],
         [('Footfall', 'Entries by door, hour and day.'), ('Conversion', 'Sales per visitor with POS data.'), ('Dwell time', 'How long shoppers stay.'),
          ('Zone ranking', 'Performance by mall, wing and tenant.'), ('Queue &amp; wait', 'Food court and service desk wait.'), ('Event uplift', 'Change during campaigns.')],
         [('Know your busiest hours.', 'Peak-period grids show footfall by hour and day across the week, so rosters, cleaning and security match demand.'),
          ('Track performance over time.', 'Trends by week, month and season reveal the impact of promotions, events and changes to the tenant mix.')],
         [('How do shopping centres use footfall data?', 'Shopping centres use footfall data to understand visitation by entrance, zone and time, measure conversion with sales data, rank zones and tenants, staff for peaks, and evaluate the impact of events and campaigns.'),
          ('Can footfall be combined with sales data?', 'Yes. Point-of-sale integrations combine visitation with sales to calculate conversion and sales per visitor by site and zone.'),
          ('Can it measure queue wait times?', 'Yes. Queue sensors at service desks and food courts measure queue length and wait time against your targets, with alerts when targets are at risk.'),
          ('Does it identify shoppers?', 'No. Counting is anonymous, with processing on the device and no images or personal information collected.'),
          ('Can it measure the impact of a promotion or event?', 'Yes. Comparing footfall, dwell and conversion during a campaign with the expected baseline shows the uplift it created.')],
         'Footfall analytics for shopping centres and precincts: visitation by entrance and zone, conversion with POS data, peak staffing and queue monitoring.', 'Footfall analytics for retail and precincts', 'Shopping centres and precinct managers')

solution('marketing', 'Marketing', 'Zone analytics for marketing teams.',
         'See whether your displays, activations and campaigns are getting the attention you planned, with footfall and zone-level data, dwell time, heat maps and before-and-after comparisons across every store.',
         'food-hall', 'Shoppers moving through a retail centre', 'heatmap', 'Heat map of attention across a store zone', 'peak-periods', 'Footfall by hour and day',
         [('Display and zone performance.', 'See how many people reach, stop at and dwell around each display, zone or activation.'),
          ('Campaign uplift.', 'Compare footfall and dwell before, during and after a campaign to measure the lift it created.'),
          ('A/B and placement testing.', 'Test two layouts, positions or creative treatments and see which draws and holds more people.'),
          ('Attention, not anecdotes.', 'Replace guesswork with anonymous numbers on what is actually drawing the crowd.'),
          ('Prove the spend.', 'Show the business and your brands whether an activation delivered the attention it was meant to.'),
          ('Across every store.', 'Compare how the same display performs across sites, regions and formats.')],
         [('Zone footfall', 'How many people enter and pass each zone.'), ('Dwell time', 'How long people linger at a display or area.'), ('Attraction &amp; capture', 'Passers-by versus those who stop and engage.'),
          ('Heat maps', 'Where attention concentrates in a space.'), ('Campaign uplift', 'Change in footfall and dwell during a campaign.'), ('Site comparison', 'Display performance across stores and regions.')],
         [('See where attention goes.', 'Heat maps and zone footfall show which displays, aisles and activations draw and hold people, and which are quietly ignored.'),
          ('Measure every campaign.', 'Compare footfall, dwell and capture before, during and after an activation to prove the lift, store by store.')],
         [('How does Place Performance help marketing teams?', 'It measures how many people reach, stop at and dwell around displays, zones and activations, so marketing teams can see whether their displays and campaigns are getting the attention they planned, and compare performance across stores.'),
          ('Can it measure a specific display or activation?', 'Yes. A zone can be drawn around any display, aisle, pop-up or activation to measure footfall, dwell time and the share of passers-by who stop, with heat maps showing where attention concentrates.'),
          ('Can it show whether a campaign worked?', 'Yes. Comparing footfall and dwell in a zone before, during and after a campaign shows the uplift it created, and the same display can be compared across stores and regions.'),
          ('Does it combine with sales data?', 'Yes. Where point-of-sale data is available, zone footfall and dwell can be combined with sales to estimate conversion and sales per visitor for a display or area.'),
          ('Does it identify shoppers?', 'No. Counting is anonymous, with processing on the device and no images or personal information collected.')],
         'Footfall and zone analytics for marketing teams: measure display, activation and campaign performance with zone footfall, dwell time, heat maps and before-and-after uplift.', 'Footfall and zone analytics for marketing', 'Retail and brand marketing teams')

solution('hospitality', 'Hospitality', 'Footfall and occupancy analytics for hospitality venues.',
         'See how many people come through, when they arrive, where they linger and how long they wait, so you can staff for the rush, stay within capacity and turn tables and zones faster across every venue.',
         'food-hall', 'Guests in a busy hospitality venue', 'peak-periods', 'Covers by hour across the week', 'occupancy-history', 'Occupancy through the day',
         [('Staff for the rush.', 'Match rosters and kitchen prep to real covers by hour and day, not guesswork.'),
          ('Queue and wait times.', 'Watch entrances, bars and service points against wait targets and act before guests notice.'),
          ('Capacity and safety.', 'Track live occupancy against licensed limits, with alerts as you approach them.'),
          ('Dwell and turnover.', 'See how long guests stay in each zone and how quickly tables and areas turn over.'),
          ('Walk-ins versus walk-bys.', 'For street-facing venues, see how many passers-by actually come in.'),
          ('Across every venue.', 'Compare footfall, dwell and peaks across sites, formats and brands.')],
         [('Covers &amp; footfall', 'Entries by door, hour and day.'), ('Dwell time', 'How long guests stay, by zone.'), ('Live occupancy', 'People on site against capacity.'),
          ('Queue &amp; wait', 'Length and wait at entrances and bars.'), ('Zone use', 'Bar, dining, lounge and function areas.'), ('Peak periods', 'Your busiest hours and days.')],
         [('Know your busiest hours.', 'Peak-period grids show covers by hour and day across the week, so rosters, kitchen prep and cleaning match real demand.'),
          ('Keep within capacity.', 'Live occupancy tracks how many people are on site against your licensed limit, with alerts as you approach it.')],
         [('How do hospitality venues use people-counting data?', 'Venues use it to see how many guests arrive by entrance and hour, how long they stay in each zone, how busy they are against capacity, and where queues build, so they can staff for peaks, protect the guest experience and compare performance across sites.'),
          ('Can it monitor capacity for licensing and safety?', 'Yes. Live occupancy is tracked against your licensed or safe capacity for each space, with alerts as you approach the limit and a history you can report on.'),
          ('Can it measure queues and wait times?', 'Yes. Sensors at entrances, bars and service points measure queue length and wait time against your targets, with alerts when a target is at risk.'),
          ('Does it identify guests?', 'No. Counting is anonymous, with processing on the device and no images or personal information collected.'),
          ('Can it compare multiple venues?', 'Yes. Footfall, dwell, occupancy and peaks can be compared across venues, formats and regions from one place.')],
         'Footfall and occupancy analytics for hospitality: match staffing to real covers, monitor capacity for licensing and safety, cut queues, and compare dwell and peaks across venues.', 'Footfall and occupancy analytics for hospitality', 'Hotels, restaurants, bars and venues')

solution('parks-and-streets', 'Parks, trails &amp; streets', 'Pedestrian, cyclist and vehicle counting for public spaces.',
         'Measure how people use parks, trails, foreshores, plazas and streets, permanently or for a single event, and see how places change before, during and after projects.',
         'parks', 'People on a harbourside lawn near the Sydney Harbour Bridge', 'occupancy-history', 'Activity trend over a week', 'peak-periods', 'Peak periods by hour and day',
         [('Active transport.', 'Cyclist and pedestrian volumes and direction on shared paths and trails.'),
          ('Streets and access points.', 'Vehicle movement across roads, car parks and precinct entries.'),
          ('Before and after.', 'Measure how places change during and after infrastructure projects.'),
          ('Events.', 'Temporary counting for attendance, entry flow and crowd safety.'),
          ('Place management.', 'Understand how plazas, foreshores and parks are used across seasons.'),
          ('Australian conditions.', 'Solutions designed for urban, coastal and remote environments.')],
         [('Pedestrians', 'Counts and direction by location.'), ('Cyclists', 'Volumes on paths and trails.'), ('Vehicles', 'Traffic volumes and direction.'),
          ('Peak periods', 'Busiest times by day and season.'), ('Trends', 'Growth and change over time.'), ('Event attendance', 'Entries and crowd numbers.')],
         [('See how activity changes over time.', 'Daily, weekly and seasonal trends show how use of paths, parks and streets is growing or changing, and the effect of new infrastructure.'),
          ('Know when places are busiest.', 'Peak-period views show the busiest hours and days for each location, informing maintenance, events and safety planning.')],
         [('Can you count cyclists and pedestrians on trails?', 'Yes. Place Performance measures pedestrian and cyclist activity, including volumes and direction, on trails, shared paths and in parks, using technology selected for each outdoor environment.'),
          ('Can it count vehicles?', 'Yes. Vehicle movement can be measured across roads, access points and car parks, including volumes and direction over time.'),
          ('Can sensors be installed temporarily?', 'Yes. Temporary deployments are available for events and short studies, as well as permanent installations for ongoing monitoring.'),
          ('Can it measure the impact of new infrastructure?', 'Yes. Measuring before, during and after a project shows how a new path, crossing or public space has changed how people use the area.'),
          ('Do outdoor sensors need mains power and connectivity?', 'Power and connectivity are assessed for each location during design, and the technology is chosen to suit what is available, including remote environments.')],
         'Pedestrian, cyclist and vehicle counting for parks, trails, streets and public spaces, permanent or temporary, with before-and-after project analysis.', 'Pedestrian, cyclist and vehicle counting', 'Councils and public-realm managers')

# ---------------- Privacy ----------------
privacy_body = (
    page_hero('Privacy by design', 'Measure the place, not the person.',
              'Place Performance is built to understand how places are used without identifying who is there. Counting happens on the device, data is masked at source, and only anonymous numbers leave the site.',
              PRIVACY_VIS, [('Home', '{R}'), ('Privacy by design', None)]) +
    section(head('Principles', 'How privacy is built in.') + cards([
        ('Edge processing', 'Counting runs on the sensor itself. Video is not streamed or stored by the platform.'),
        ('Masked at source', 'Data is anonymised on the device before anything is sent.'),
        ('No personal information', 'No faces, names or identities are collected, only counts, occupancy and movement.'),
        ('Minimal collection', 'The technology is chosen for the question, so only the data you need is measured.'),
        ('Role-based access', 'Users see only the sites and features their role allows, with single sign-on support.'),
        ('Audit trail', 'Administrative actions are logged for traceability and accountability.'),
    ])) +
    section(split(shot('device', 'Device record showing privacy mode on'), copy('Device level', 'Privacy settings you can verify.', 'Every device record shows its privacy mode and configuration. Demographic estimates are optional, anonymised and only used where hardware supports them and you choose to enable them.')), 'sec-tint')
)
PRIVACY_FAQS = [
    ('Do the sensors record video?', 'No video is streamed to or stored by the platform. The sensors process what they see on the device and send only anonymous counts and occupancy numbers.'),
    ('Can people be identified?', 'No. Data is masked at source and no personal information such as faces or names is collected. The system measures how places are used, not who uses them.'),
    ('Does Place Performance use facial recognition?', 'No. Place Performance does not use facial recognition and does not identify individuals.'),
    ('What data is collected?', 'Counts of people entering and leaving, occupancy, dwell time, movement between zones and, where enabled and supported, anonymous demographic estimates. Outdoors it can also count cyclists and vehicles.'),
    ('Who can access the data?', 'Only users in your organisation with an assigned role. Access can be limited to specific sites, single sign-on can be enforced, and administrative actions are recorded in an audit log.'),
    ('Does it support Australian privacy obligations?', 'Anonymous, edge-processed counting with minimal data collection is designed to support organisations\' obligations under Australian privacy law. Contact us for documentation to support your privacy impact assessment.'),
]
page('privacy-by-design', 'Privacy-safe people counting | Place Performance',
     'How Place Performance counts people anonymously: edge processing, data masked at source, no video stored, no facial recognition and role-based access.',
     privacy_body, PRIVACY_FAQS, [('Home', ''), ('Privacy by design', 'privacy-by-design/')])

# ---------------- Contact ----------------
contact_body = page_hero('Contact', 'Book a demo.',
    'Tell us about your places and what you want to understand. We\'ll show you the platform with data that looks like yours and scope a pilot.'
    '</p><ol class="steps-list hero-steps">'
    '<li><b>Walkthrough.</b> A 30-minute demo, focused on your sector.</li>'
    '<li><b>Site survey.</b> We assess your locations and what to measure.</li>'
    '<li><b>Sensor plan &amp; proposal.</b> The right devices and plan level for each site.</li>'
    '<li><b>Pilot.</b> Live data from your own site, typically within weeks.</li></ol>',
    '''<div class="hero-form"><form class="cta-form" id="demo-form">
        <input type="hidden" name="enquiry_type" value="demo">
        <div class="form-row"><label>Name<input required name="name" autocomplete="name"></label><label>Work email<input required type="email" name="email" autocomplete="email"></label></div>
        <div class="form-row"><label>Organisation<input name="org" autocomplete="organization"></label><label>Sector<select name="sector"><option>Local council</option><option>University / TAFE</option><option>Government</option><option>Commercial property</option><option>Retail &amp; precincts</option><option>Parks, trails &amp; streets</option><option>Other</option></select></label></div>
        <div class="form-row"><label>Plan of interest<select name="plan" id="plan-select"><option value="">Not sure yet</option><option value="essentials">Essentials (Level 1)</option><option value="insights">Insights (Level 2)</option><option value="professional">Professional (Level 3)</option><option value="executive">Executive (Level 4)</option></select></label><label>Number of sites<select name="sites"><option>1</option><option>2&ndash;5</option><option>6&ndash;20</option><option>20+</option></select></label></div>
        <label>What would you like to understand?<textarea name="msg" rows="3" placeholder="e.g. how our libraries are used across the week"></textarea></label>
        <button class="btn btn-dark btn-lg" type="submit">Book a demo <i class="arr"></i></button>
        <p class="form-note" id="form-note">We'll be in touch within one business day.</p>
      </form></div>''', [('Home', '{R}'), ('Contact', None)], ctas=False)
CONTACT_FAQS = [
    ('How long does a demo take?', 'A walkthrough takes about 30 minutes and focuses on your sector and the questions you want to answer.'),
    ('How soon can a pilot be live?', 'After a site survey and sensor plan, a pilot at one site is typically live within weeks rather than months.'),
    ('What information should we prepare for a demo?', 'It helps to know which places you want to measure, roughly how many entrances and rooms they have, and the decisions you want the data to support. Floorplans are useful but not required for the first conversation.'),
    ('Is there any obligation after a demo?', 'No. A demo is a walkthrough to see whether Place Performance fits your needs. If it does, we scope a pilot together.'),
    ('Do you work outside major cities?', 'Yes. Solutions are designed and supported for Australian conditions, from busy urban spaces to parks, trails, coastal and remote locations.'),
]
page('contact', 'Book a demo | Place Performance',
     'Book a 30-minute Place Performance walkthrough and scope a pilot: site survey, sensor plan, installation and live data from your own site within weeks.',
     contact_body, CONTACT_FAQS, [('Home', ''), ('Contact', 'contact/')])

# ---------------- Get a quote ----------------
quote_body = page_hero('Pricing', 'Get a quote.',
    'Tell us how many sites you have and what you want to measure, and we\'ll put together pricing for the sensors, installation and the plan level that fits.'
    '</p><ol class="steps-list hero-steps">'
    '<li><b>Tell us your places.</b> How many sites, entrances and spaces you want to measure.</li>'
    '<li><b>We scope the hardware.</b> The right sensors and plan level for each location.</li>'
    '<li><b>One clear price.</b> Sensors, installation, commissioning, platform and support, together.</li></ol>',
    '''<div class="hero-form"><form class="cta-form" id="demo-form">
        <input type="hidden" name="enquiry_type" value="quote">
        <div class="form-row"><label>Name<input required name="name" autocomplete="name"></label><label>Work email<input required type="email" name="email" autocomplete="email"></label></div>
        <div class="form-row"><label>Organisation<input name="org" autocomplete="organization"></label><label>Sector<select name="sector"><option>Local council</option><option>University / TAFE</option><option>Government</option><option>Commercial property</option><option>Retail &amp; precincts</option><option>Parks, trails &amp; streets</option><option>Other</option></select></label></div>
        <div class="form-row"><label>Plan of interest<select name="plan" id="plan-select"><option value="">Not sure yet</option><option value="essentials">Essentials (Level 1)</option><option value="insights">Insights (Level 2)</option><option value="professional">Professional (Level 3)</option><option value="executive">Executive (Level 4)</option></select></label><label>Number of sites<select name="sites"><option>1</option><option>2&ndash;5</option><option>6&ndash;20</option><option>20+</option></select></label></div>
        <label>What would you like to measure?<textarea name="msg" rows="3" placeholder="e.g. entrances and study spaces across six library branches"></textarea></label>
        <button class="btn btn-dark btn-lg" type="submit">Get a quote <i class="arr"></i></button>
        <p class="form-note" id="form-note">We'll send tailored pricing within one business day.</p>
      </form></div>''', [('Home', '{R}'), ('Plans', '{R}plans/'), ('Get a quote', None)], ctas=False)
QUOTE_FAQS = [
    ('How is Place Performance priced?', 'Pricing is based on the number of sites and devices and the capability level you choose. Every quote covers the sensors, installation, commissioning, the platform and ongoing support.'),
    ('What do you need to prepare a quote?', 'A rough idea of how many sites and entrances you want to measure, and which outcomes matter most. Exact device counts are confirmed during the site survey.'),
    ('Is installation included in the price?', 'Yes. Every quote includes design, supply, installation and commissioning by our Australian team, plus ongoing support.'),
    ('Can we start small?', 'Yes. Most organisations start with a pilot at one site and add sites and capability levels as they grow.'),
]
page('quote', 'Get a quote | Place Performance',
     'Get tailored Place Performance pricing: sensors, installation, the analytics platform and support, based on your sites, devices and plan level.',
     quote_body, QUOTE_FAQS, [('Home', ''), ('Plans', 'plans/'), ('Get a quote', 'quote/')], nav_key='plans')

# ---------------- Talk to us ----------------
talktous_body = page_hero('Contact', 'Talk to us.',
    'Have a question, or not sure where to start? Send a message and our team will get back to you. Want a walkthrough instead? <a href="{R}contact/">Book a demo</a>. After pricing? <a href="{R}quote/">Get a quote</a>.'
    '</p><ol class="steps-list hero-steps">'
    '<li><b>Ask anything.</b> The platform, privacy, hardware or how a pilot works.</li>'
    '<li><b>Talk to a human.</b> A local team member, not a call centre.</li>'
    '<li><b>No obligation.</b> We\'ll point you to the right next step.</li></ol>',
    '''<div class="hero-form"><form class="cta-form" id="demo-form">
        <input type="hidden" name="enquiry_type" value="general">
        <div class="form-row"><label>Name<input required name="name" autocomplete="name"></label><label>Work email<input required type="email" name="email" autocomplete="email"></label></div>
        <label>Organisation<input name="org" autocomplete="organization"></label>
        <label>How can we help?<textarea name="msg" rows="4" required placeholder="Tell us what you're after"></textarea></label>
        <button class="btn btn-dark btn-lg" type="submit">Send message <i class="arr"></i></button>
        <p class="form-note" id="form-note">We'll reply within one business day.</p>
      </form></div>''', [('Home', '{R}'), ('Talk to us', None)], ctas=False)
TALK_FAQS = [
    ('Who will I talk to?', 'A member of our Australian team who knows the platform and the hardware, not an outsourced call centre.'),
    ('I am not ready to buy. Can I still ask questions?', 'Of course. Ask about privacy, accuracy, hardware or how a pilot works, with no obligation.'),
    ('What if I want pricing or a demo?', 'For tailored pricing use <a href="{R}quote/">Get a quote</a>. To see the platform with data like yours, <a href="{R}contact/">book a demo</a>.'),
]
page('talk-to-us', 'Talk to us | Place Performance',
     'Get in touch with the Place Performance team. Ask about people counting, privacy, hardware or pilots, or get pointed to a demo or a quote.',
     talktous_body, TALK_FAQS, [('Home', ''), ('Talk to us', 'talk-to-us/')])

# ---------------- About ----------------
about_body = (
    page_hero('About us', 'The team behind Place Performance.',
        'Place Performance is a joint venture between two Australian companies: <a href="https://itesa.com.au/" target="_blank" rel="noopener">ITESA</a>, specialists in measuring how places are used, and <a href="https://rayven.io/" target="_blank" rel="noopener">Rayven</a>, builders of operational software and AI. Together we deliver the sensors, the installation and the intelligent platform as one service, designed and supported in Australia.',
        '', [('Home', '{R}'), ('About', None)], ctas=False) +
    section(head('Our vision', 'Measure the place, not the person.',
        'We help the councils, universities, governments and property owners who run Australia\'s public and shared places understand how they are really used, counting the place, never identifying the person, so every space can be made safer, run more efficiently and planned with evidence.')) +
    section(head('Leadership', 'The people behind it.') +
        '<div class="leader-grid reveal">'
        '<div class="leader"><div class="leader-avatar"><img src="{R}assets/team/paul-berkovic.jpg" alt="Paul Berkovic"></div><h4>Paul Berkovic</h4><p class="leader-role">CEO, Rayven</p>'
        '<p>Paul co-founded Rayven, the Australian operational software and AI company that powers the Place Performance platform, from live dashboards and reporting to forecasting and AI insight.</p>'
        '<a class="link-arrow" href="https://www.linkedin.com/in/paulberkovic/" target="_blank" rel="noopener">LinkedIn</a></div>'
        '<div class="leader"><div class="leader-avatar"><img src="{R}assets/team/keven-meddings.jpg" alt="Keven Meddings"></div><h4>Keven Meddings</h4><p class="leader-role">CEO, ITESA</p>'
        '<p>Keven leads ITESA, the measurement and analytics specialists behind Place Performance\'s sensing, installation and support, from entrance counters to outdoor radar across Australia.</p>'
        '<a class="link-arrow" href="https://www.linkedin.com/in/keven-meddings-04a65291/" target="_blank" rel="noopener">LinkedIn</a></div>'
        '</div>', 'sec-tint') +
    section(head('A joint venture', 'Two specialists, one accountable partner.') +
        '<div class="partner-grid reveal">'
        '<div class="partner"><span class="partner-role">Measurement &amp; analytics</span><h4>ITESA</h4>'
        '<p>ITESA specialises in measuring how people, cyclists and vehicles use buildings, venues, parks, trails, streets and public spaces. They bring together sensing technology, edge processing, connectivity, data management, analytics and visualisation, and they design, supply, install, commission and support complete measurement solutions across Australia.</p>'
        '<p class="about-addr">Level 1, 54 Wellington St<br>Collingwood, Victoria 3066</p>'
        '<a class="link-arrow" href="https://itesa.com.au/" target="_blank" rel="noopener">itesa.com.au</a></div>'
        '<div class="partner"><span class="partner-role">Operational software &amp; AI</span><h4>Rayven</h4>'
        '<p>Rayven is an Australian operational software company. Its unified platform integrates data, automates processes and powers custom AI and apps, the real-time dashboards, alerts, reporting, forecasting and AI insight behind Place Performance. Rayven is trusted by teams across Australia and around the world.</p>'
        '<p class="about-addr">223 Liverpool St<br>Darlinghurst, NSW 2010</p>'
        '<a class="link-arrow" href="https://rayven.io/" target="_blank" rel="noopener">rayven.io</a></div>'
        '</div>') +
    section(head('How it fits together', 'From the sensor to the decision, by one team.',
        'ITESA brings the sensing hardware, the site surveys and the local installation and support. Rayven brings the data platform, the dashboards and the AI. Place Performance brings them together, so you deal with one Australian partner from the first site visit to the insight on the screen.'), 'sec-tint')
)
page('about', 'About us | Place Performance',
     'Place Performance is a joint venture between ITESA (place measurement and sensing) and Rayven (operational software and AI), delivering sensors, installation and an analytics platform across Australia.',
     about_body, None, [('Home', ''), ('About', 'about/')])

# ---------------- Hardware ----------------
hardware_body = (
    page_hero('Sensors', 'The right sensor for every place.',
        'Place Performance is technology-agnostic. No single sensor is best everywhere, so we choose the right one for each site: indoor or outdoor, a single doorway or an open crowd, a permanent install or a one-off event. Whatever we use, the counts are accurate and anonymous, and we design, supply, install and support it all.',
        '<div class="shot-card"><img src="{R}assets/hardware/sensor-3d.jpg" alt="A 3D people-counting sensor"></div>', [('Home', '{R}'), ('Platform', '{R}platform/'), ('Sensors', None)], ctas=False) +
    section(head('3D LiDAR &amp; depth', 'Light that measures distance.',
        'A 3D depth sensor sits above the space and sends out rapid pulses of infrared light. By timing how long each pulse takes to bounce back, it measures the exact distance to every point below it and builds a live 3D map of the scene. Looking straight down, it reads the height and shape of each person passing through, and on-device software tracks them across a count line or within a zone. Because it measures distance, not colour or features, there is nothing to identify, and it performs the same in bright sun or total darkness.') + lidar_diagram() +
        '<div class="fgrid fgrid-3 reveal">'
        '<div class="fcard"><h4>What it is good at</h4><ul class="hw-spec"><li>Pinpoint entrance accuracy, up to 99.8%</li><li>Separates people standing close together</li><li>Ignores trolleys, bags and strollers by shape</li><li>Counts direction and live occupancy at once</li></ul></div>'
        '<div class="fcard"><h4>Where it is less suited</h4><ul class="hw-spec"><li>Needs an overhead mount at a set height</li><li>Each unit covers a doorway or defined zone</li><li>Best indoors or under cover</li></ul></div>'
        '<div class="fcard"><h4>Key specs</h4><ul class="hw-spec"><li>Time-of-flight infrared depth</li><li>Works in any light, captures no images</li><li>Single network cable (PoE)</li><li>Line, zone and occupancy counting</li></ul></div>'
        '</div>') +
    section(head('Radar (mmWave)', 'Radio that reads movement.',
        'A millimetre-wave radar sends out high-frequency radio signals and listens for the echoes. From each echo it works out an object\'s distance and angle, giving a 3D position, and from the shift in frequency it reads the object\'s speed and direction, the same principle as a speed camera. It tracks many objects at once and sorts them into pedestrians, cyclists and vehicles by how fast they move, and adults from children by height. Radio is unaffected by light or weather and passes straight through a sealed housing, so the sensor has no exposed lens and keeps working in rain, fog, snow, glare or complete darkness.') + radar_diagram() +
        '<div class="fgrid fgrid-3 reveal">'
        '<div class="fcard"><h4>What it is good at</h4><ul class="hw-spec"><li>Outdoors and in any weather</li><li>People, cyclists and vehicles on one sensor</li><li>Range to about 10&nbsp;m for people, 20&nbsp;m for vehicles</li><li>Reads speed, direction and classification</li></ul></div>'
        '<div class="fcard"><h4>Where it is less suited</h4><ul class="hw-spec"><li>Lower detail than depth imaging</li><li>Very dense, slow crowds are harder</li><li>Classification by speed has edge cases</li></ul></div>'
        '<div class="fcard"><h4>Key specs</h4><ul class="hw-spec"><li>60&nbsp;GHz mmWave, tracks position and speed</li><li>IP65 to IP68, -25 to +65&deg;C</li><li>PoE, or battery and solar with 4G</li><li>Over 99% accuracy, captures no images</li></ul></div>'
        '</div>', 'sec-tint') +
    section(head('Specialist sensors', 'The right tool for a specific job.',
        'For a particular site or metric, we add a specialist sensor, each with its own strengths.') +
        '<div class="fgrid fgrid-3 reveal">'
        '<div class="fcard"><h4>Thermal</h4><p>Reads the heat people naturally give off, so it detects presence in complete darkness and tells people from their surroundings without any image. Useful for low-light and privacy-sensitive outdoor spots.</p></div>'
        '<div class="fcard"><h4>Stereo vision</h4><p>Two lenses judge depth from the small difference between their views, the way our eyes do, counting people by 3D shape on the device. A passive alternative to LiDAR for some indoor sites.</p></div>'
        '<div class="fcard"><h4>Break-beam</h4><p>A simple infrared beam across a doorway counts each time it is interrupted. Low cost and easy to fit, with lower accuracy, for basic single-door counting.</p></div>'
        '</div>') +
    section(head('Side by side', 'How the main technologies compare.') +
        '<div class="spec-table-wrap reveal"><table class="spec-table"><thead><tr><th>&nbsp;</th><th>3D LiDAR / depth</th><th>Radar (mmWave)</th></tr></thead><tbody>'
        '<tr><th>Where it works</th><td>Indoor entrances and zones, sheltered</td><td>Indoor or outdoor, all weather</td></tr>'
        '<tr><th>What it detects</th><td>People, by shape and height</td><td>People, cyclists and vehicles, by movement and speed</td></tr>'
        '<tr><th>Typical range</th><td>The doorway or zone below the sensor</td><td>About 10&nbsp;m for people, up to 20&nbsp;m for vehicles</td></tr>'
        '<tr><th>Light and weather</th><td>Any light</td><td>Any light, plus rain, fog, snow and full darkness</td></tr>'
        '<tr><th>Mounting</th><td>Overhead</td><td>Overhead, wall or pole</td></tr>'
        '<tr><th>Power</th><td>Single network cable (PoE)</td><td>PoE, or battery and solar</td></tr>'
        '<tr><th>Connectivity</th><td>Wired network</td><td>Wired, Wi-Fi or 4G</td></tr>'
        '<tr><th>Accuracy</th><td>Up to 99.8%</td><td>Over 99%</td></tr>'
        '<tr><th>Privacy</th><td>3D depth only, no images</td><td>Radar signatures only, no images</td></tr>'
        '</tbody></table></div>', 'sec-tint') +
    section(head('What every sensor measures', 'Counts you can act on, processed on site.') + cards([
        ('Lines and zones', 'Draw a count line across a doorway or a zone over an area. The sensor reports people crossing in and out, and how many are inside at any moment.', None),
        ('Direction and dwell', 'Every count carries a direction, in or out, and zones measure how long people stay, so you see flow and dwell time, not just totals.', None),
        ('Classification', 'Radar tells pedestrians, cyclists and vehicles apart by speed, and adults from children by height, so mixed paths and roads are counted correctly.', None),
    ])) +
    section(head('How we choose', 'The best technology for your requirement.') + cards([
        ('Indoor or outdoor', 'Sheltered entrances suit overhead 3D sensors; open, exposed sites use weatherproof radar rated for sun, rain, cold and full darkness.', None),
        ('What you are counting', 'People through a door, or pedestrians, cyclists and vehicles on a path or road, each needs a different sensor and mounting.', None),
        ('Permanent or temporary', 'Fixed sites run on a single network cable; remote or pop-up sites run on battery and solar with 4G, so we can measure a trail, a roadside or a single event without mains power.', None),
    ]), 'sec-tint') +
    section(head('In practice', 'Matched to the kind of place.') +
        '<div class="hw-usegrid reveal">'
        '<div class="hw-use"><span class="hw-use-ico"><svg viewBox="0 0 24 24"><path d="M5 21V4h14v17"/><path d="M3 21h18"/><path d="M12 6.5v6m0 0l-2.5-2.5M12 12.5l2.5-2.5"/></svg></span><h4>Building entrance</h4><p>Overhead 3D LiDAR counts people in and out at the door, accurate even in crowds.</p></div>'
        '<div class="hw-use"><span class="hw-use-ico"><svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="2.2"/><circle cx="16" cy="8" r="2.2"/><path d="M4 19c0-2.5 1.8-4 4-4s4 1.5 4 4"/><path d="M12 19c0-2.5 1.8-4 4-4s4 1.5 4 4"/></svg></span><h4>Open plaza or crowd</h4><p>Wide-area radar or LiDAR covers a whole space and counts the crowd from a single mount.</p></div>'
        '<div class="hw-use"><span class="hw-use-ico"><svg viewBox="0 0 24 24"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-7h5M9 10h4l3 7M13 10l1.5-3H17"/></svg></span><h4>Shared paths and trails</h4><p>Radar separates walkers from cyclists and records direction, day or night.</p></div>'
        '<div class="hw-use"><span class="hw-use-ico"><svg viewBox="0 0 24 24"><path d="M4 13l1.8-4.6A2 2 0 0 1 7.7 7h8.6a2 2 0 0 1 1.9 1.4L20 13v5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H7.5v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="8" cy="14.5" r="1.2"/><circle cx="16" cy="14.5" r="1.2"/></svg></span><h4>Roads and car parks</h4><p>Radar counts vehicles and reads speed alongside pedestrians and cyclists.</p></div>'
        '<div class="hw-use"><span class="hw-use-ico"><svg viewBox="0 0 24 24"><path d="M3 20h18"/><path d="M12 4L4 20M12 4l8 16"/><path d="M12 11l-4.5 9M12 11l4.5 9"/></svg></span><h4>Remote or pop-up sites</h4><p>Battery and solar radar with 4G measures a trail, a roadside or a single event with no mains power or wired network.</p></div>'
        '<div class="hw-use"><span class="hw-use-ico"><svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg></span><h4>A mixed portfolio</h4><p>Different sensors across your sites, all feeding one platform and one set of reports.</p></div>'
        '</div>') +
    section(head('Always anonymous', 'Measure the place, not the person.',
        'Whatever the technology, our sensors capture depth or radar signatures, never images or identities. Counting happens on the device and only anonymous numbers leave the site, so privacy is built in by design.') +
        '<p style="text-align:center;margin-top:8px"><a class="link-arrow" href="{R}privacy-by-design/">How counting stays anonymous</a></p>', 'sec-tint') +
    section(head('One partner', 'Specified, installed and supported by us.',
        'We assess each site, specify the right mix of technologies, then supply, install, commission and support every sensor as one service. You deal with one Australian partner, whatever is on your sites.'))
)
page('sensors', 'Sensors and hardware | Place Performance',
     'The sensing technologies behind Place Performance: 3D LiDAR, radar and specialist sensors, chosen for each site, indoor or outdoor, permanent or temporary, and always anonymous.',
     hardware_body, None, [('Home', ''), ('Platform', 'platform/'), ('Sensors', 'sensors/')], nav_key='platform')

# ---------------- FAQ hub ----------------
ALL_GROUPS = [('General', HOME_FAQS), ('Platform &amp; hardware', PLATFORM_FAQS), ('Real time &amp; alerts', REALTIME_FAQS), ('AI &amp; forecasting', AI_FAQS),
              ('Plans &amp; pricing', PLANS_FAQS), ('Privacy', PRIVACY_FAQS)]
faq_hub = page_hero('FAQ', 'Questions &amp; answers.', 'Everything you need to know about people counting, occupancy monitoring, space utilisation and AI insights with Place Performance.', '', [('Home', '{R}'), ('FAQ', None)], ctas=False)
for g, items in ALL_GROUPS:
    faq_hub += section('<div class="faq-group"><h2>%s</h2><div class="faq">%s</div></div>' % (g, ''.join(
        '<details class="qa"><summary><h3>%s</h3><i></i></summary><div class="qa-a"><p>%s</p></div></details>' % (q, a) for q, a in items)), 'sec-faq sec-compact')
page('faq', 'People counting & occupancy FAQ | Place Performance',
     'Answers to common questions about Place Performance: hardware, installation, privacy, real-time occupancy, alerts, forecasting, AI, plans and pricing.',
     faq_hub, [qa for _, items in ALL_GROUPS for qa in items], [('Home', ''), ('FAQ', 'faq/')])

exec(open(os.path.join(HERE, 'content_guides.py'), encoding='utf-8').read())
exec(open(os.path.join(HERE, 'content_places.py'), encoding='utf-8').read())

# ---------------- Compare: people counting systems in Australia ----------------
PROD_COLS = ['Place Performance', 'FootfallCam', 'Skyfii', 'V-Count']
PROD_ROWS = [
    ('Based in', 'Australia', 'United Kingdom', 'Australia (ASX:SKF)', 'Turkey'),
    ('How you buy and install', 'One local Australian team: survey, supply, install and support', 'Hardware brand, installed through authorised resellers', 'Analytics platform, direct and through partners', 'Hardware and platform, through partners and resellers'),
    ('Sensing technology', 'LiDAR, radar and specialist sensors, matched per site', '3D stereo-vision sensors', 'Camera, 3D, Wi-Fi and vehicle sensing', '3D stereo-vision sensors'),
    ('Indoor and outdoor', 'Both, including cyclists and vehicles', 'Primarily indoor', 'Both', 'Primarily indoor'),
    ('Anonymous, on-device counting', 'Yes, across all sensors', 'Yes, with 3D sensors', 'Varies by sensor type', 'Yes, with 3D sensors'),
    ('Platform', 'Real time, forecasting and an AI assistant', 'Analytics software', 'Analytics platform', 'Analytics software'),
    ('Main focus', 'Councils, public realm and property across Australia', 'Retail and public venues', 'Venues, retail and public spaces', 'Retail'),
]
prod_table = '<div class="cmp-wrap reveal"><table class="cmp cmp-text"><thead><tr><th>What to compare</th>%s</tr></thead><tbody>%s</tbody></table></div>' % (
    ''.join('<th>%s</th>' % c for c in PROD_COLS),
    ''.join('<tr><td>%s</td>%s</tr>' % (r[0], ''.join('<td>%s</td>' % x for x in r[1:])) for r in PROD_ROWS))
cmp_note = '<p class="muted cmp-note">This comparison reflects publicly available information at the time of writing and is shared in good faith to help you shortlist. Vendors update their products often, so confirm current details directly with each supplier. FootfallCam, Skyfii and V-Count are trademarks of their respective owners.</p>'
compare_body = (
    page_hero('Compare', 'Choosing a people counting system in Australia',
              'People counting is sold three ways: one local partner that does it end to end, an overseas hardware brand installed through a reseller, or do-it-yourself analytics added to existing cameras. Here is how they differ, and where Place Performance fits.',
              '', [('Home', '{R}'), ('Compare', None)]) +
    section(head('Three ways places get counted', 'Choose the model before you choose a product.') + cards([
        ('End-to-end local partner', 'One Australian team surveys the site, supplies and installs the sensors, runs the platform and supports it. Fewer handoffs and clear accountability. This is how Place Performance works.'),
        ('Overseas hardware and a reseller', 'A global sensor brand bought and installed through a local reseller, with analytics from the vendor. Proven hardware, but the hardware, installation, software and support can sit with different parties.'),
        ('DIY camera analytics', 'Counting software added to existing CCTV. Low upfront cost, but accuracy, privacy and outdoor coverage depend on cameras that were never meant for counting.'),
    ])) +
    section(head('How Place Performance compares', 'Place Performance next to three widely used people counting products.') + prod_table + cmp_note, 'sec-tint') +
    section(head('Compare', 'Comparing a specific product or vendor?') + '<div class="prose"><p>If you are weighing up a global hardware brand or an Australian analytics platform, the real question is usually not the sensor on its own, but who takes responsibility for the whole system once it is live. Place Performance is the single Australian partner for the sensor, the installation, the platform and the support, with the right sensing technology chosen per site and anonymous counting by design. See ' + L('hardware', 'the sensors we use') + ' and ' + L('privacy', 'how privacy works') + '.</p></div>') +
    section(head('Why Place Performance', 'Built for Australian places.') + cards([
        ('One partner, locally', 'Survey, supply, install, calibrate, platform and support from a single Australian team.'),
        ('Anonymous by design', 'Counting happens on the device. No images and no personal data leave the sensor.'),
        ('The right sensor per site', 'LiDAR, radar or specialist sensors, chosen for indoor, outdoor, crowds or single events.'),
        ('Public realm and public sector', 'Councils, universities, government and property teams, across Australian conditions.'),
        ('Real time to forecast', 'Live occupancy and alerts through to reporting, forecasting, scenarios and an AI assistant.'),
        ('Built to grow', 'Start with one site and a few devices, prove value, then scale without replacing hardware.'),
    ]), 'sec-tint')
)
COMPARE_FAQS = [
    ('What is the best people counting system in Australia?', 'The best system depends on where you are counting and who will run it. For most Australian organisations the deciding factor is not the sensor alone but whether one local partner takes responsibility for the hardware, installation, platform and support. Place Performance provides all four as a single Australian team, with the right sensing technology chosen per site and anonymous counting by design.'),
    ('Is there an Australian alternative to overseas people counting brands?', 'Yes. Many people counting products are overseas hardware brands installed through third-party resellers. Place Performance is an end-to-end Australian alternative: one team surveys, supplies, installs, calibrates, runs the platform and supports it, indoors and outdoors.'),
    ('Do I need cameras to count people?', 'No. Place Performance counts people without identifying them, using depth and movement sensing rather than recognisable images. Counting is processed on the device, so only anonymous numbers leave the sensor.'),
    ('What is the difference between LiDAR and camera people counting?', 'LiDAR and depth sensors map a space in three dimensions with pulses of light and count people by shape and movement, not by their faces. They work in any light, including darkness, and do not capture recognisable images, which suits privacy-sensitive places. Camera counting relies on the image itself, which raises privacy and lighting considerations.'),
    ('How accurate is people counting?', 'Accuracy depends on the sensor and on how well it is installed and calibrated. Place Performance uses high-accuracy sensing that is validated on site during commissioning, with continuous device health monitoring so counts stay reliable.'),
]
page('compare', 'People counting systems in Australia: how to choose | Place Performance',
     'How to choose a people counting system in Australia: an end-to-end local partner versus overseas hardware and DIY camera analytics, compared. Anonymous, accurate counting indoors and outdoors.',
     compare_body, COMPARE_FAQS, [('Home', ''), ('Compare', 'compare/')],
     service='People counting systems in Australia', audience='Australian organisations comparing people counting systems')

# ---------------- Glossary ----------------
GLOSSARY = [
    ('People counting', 'people-counting', 'People counting is the automated measurement of how many people enter, leave or occupy a space, using sensors instead of manual tallies. Modern systems count anonymously, without identifying anyone.'),
    ('Footfall', 'footfall', 'Footfall is the number of people who visit a place over a period of time, such as a store, centre or street. Footfall analytics turns those counts into trends by entrance, hour, day and zone.'),
    ('Occupancy analytics', 'occupancy-analytics', 'Occupancy analytics measures how many people are in a space at a given moment and over time, so teams can manage capacity, safety, cleaning, energy and staffing against real demand.'),
    ('Live occupancy', 'live-occupancy', 'Live occupancy is the number of people currently inside a space, updated in near real time. It is often shown against a capacity limit, with alerts as the limit approaches.'),
    ('Dwell time', 'dwell-time', 'Dwell time is how long people stay in a place or a particular zone. It helps separate a busy area that holds attention from one that people simply pass through.'),
    ('Space utilisation', 'space-utilisation', 'Space utilisation is how much a room, floor or building is actually used compared with its capacity, measured over time. It guides consolidation, scheduling and investment decisions.'),
    ('Pedestrian counting', 'pedestrian-counting', 'Pedestrian counting measures how many people move along a street, path or public space, often outdoors and sometimes alongside cyclist and vehicle counts, to inform planning and investment.'),
    ('Heat map', 'heat-map', 'In place analytics, a heat map shows where people concentrate within a space, so teams can see which zones, displays or routes attract and hold attention.'),
    ('Crowd capacity monitoring', 'crowd-capacity', 'Crowd capacity monitoring tracks live occupancy against a safe or licensed limit for a venue or zone, with alerts before the limit is reached, to protect safety and experience.'),
    ('Anonymous counting', 'anonymous-counting', 'Anonymous counting measures people without identifying them. Counting is processed on the device using shape, depth or movement, so no images or personal information leave the sensor.'),
    ('LiDAR people counting', 'lidar', 'LiDAR people counting maps a space in three dimensions with pulses of light and counts people by shape and movement rather than by their faces. It works in any light and does not capture recognisable images.'),
    ('Conversion rate', 'conversion-rate', 'In retail analytics, conversion rate is the share of visitors who make a purchase, found by combining footfall with sales data. It shows whether visitation is turning into results.'),
]
gloss_html = '<div class="glossary prose reveal">' + ''.join('<h3 id="%s">%s</h3><p>%s</p>' % (s, t, d) for t, s, d in GLOSSARY) + '</div>'
glossary_body = (
    page_hero('Glossary', 'People counting and place analytics, defined',
              'Plain-English definitions of the terms used across people counting, footfall and occupancy analytics.',
              '', [('Home', '{R}'), ('Glossary', None)], ctas=False) +
    section(gloss_html)
)
GLOSSARY_FAQS = [
    ('What is people counting?', GLOSSARY[0][2]),
    ('What is footfall?', GLOSSARY[1][2]),
    ('What is occupancy analytics?', GLOSSARY[2][2]),
    ('What is dwell time?', GLOSSARY[4][2]),
    ('What is space utilisation?', GLOSSARY[5][2]),
    ('What is anonymous people counting?', GLOSSARY[9][2]),
]
GLOSSARY_SCHEMA = {
    '@type': 'DefinedTermSet', '@id': BASE + 'glossary/#terms',
    'name': 'People counting and place analytics glossary', 'url': BASE + 'glossary/',
    'hasDefinedTerm': [{'@type': 'DefinedTerm', 'name': t, 'description': d,
                        'url': BASE + 'glossary/#' + s, 'inDefinedTermSet': {'@id': BASE + 'glossary/#terms'}}
                       for t, s, d in GLOSSARY],
}
page('glossary', 'People counting glossary: footfall, occupancy and more | Place Performance',
     'Plain-English definitions of people counting and place analytics terms: footfall, occupancy, dwell time, space utilisation, pedestrian counting, anonymous counting and more.',
     glossary_body, GLOSSARY_FAQS, [('Home', ''), ('Glossary', 'glossary/')], schema=GLOSSARY_SCHEMA)


# ---------------- Guides (explainer articles + hub) ----------------
def article(slug, eyebrow, h1, lead, blocks, related, faqs, title, desc):
    art = ''.join(('<h2>%s</h2>' % h if h else '') + '<p>%s</p>' % p for h, p in blocks)
    aside = '<aside class="guide-aside"><p class="eyebrow">Related pages</p>' + ''.join(
        '<a href="{R}%s"><b>%s</b><span>%s</span></a>' % r for r in related) + '</aside>'
    prose = section('<div class="guide reveal"><article class="prose">%s</article>%s</div>' % (art, aside))
    body = page_hero(eyebrow, h1, lead, '', [('Home', '{R}'), ('Guides', '{R}guides/'), (h1, None)], ctas=False) + prose
    page('guides/' + slug, title, desc, body, faqs,
         [('Home', ''), ('Guides', 'guides/'), (h1, 'guides/' + slug + '/')], service=None, nav_key='guides')


article('how-people-counting-works', 'Guide', 'How people counting works',
        'From the sensor on the wall to the number on your dashboard, here is how modern, anonymous people counting actually works.',
        [('', 'People counting replaces manual clickers and guesswork with sensors that measure how many people enter, leave and occupy a space. The best systems do this anonymously, counting people as shapes in motion rather than recording who they are.'),
         ('Counting happens on the device', 'Each sensor processes what it sees on the spot. It detects a person, follows their movement across a line or through a zone, and adds to a count. Only the anonymous numbers leave the device, so no images or personal information are sent anywhere.'),
         ('Shapes and movement, not faces', 'Depth and movement sensing recognises the shape of a person and the direction they travel. Because it does not rely on recognisable images, it avoids the privacy and lighting problems of camera-based approaches and keeps working in the dark.'),
         ('From count to dashboard in seconds', 'Counts are sent to the platform over a single network or mobile connection and appear within seconds. From there they become live occupancy, peak periods, dwell time, heat maps and trends, with alerts when a space approaches a limit.'),
         ('Indoors, outdoors and in any light', 'Different sites need different sensing. Overhead depth sensors suit entrances and indoor zones, while all-weather sensors count people, cyclists and vehicles outdoors, including temporary and single-event deployments on battery and mobile data.'),
         ('Keeping the numbers reliable', 'Accuracy comes from good placement and calibration during installation, then continuous device health monitoring so a sensor that goes quiet is flagged early. That is the difference between a count you report on and one you second-guess.')],
        [('compare/', 'Compare systems', 'How the three approaches differ'), ('sensors/', 'Sensors', 'Radar, LiDAR and the right sensor per site'), ('privacy-by-design/', 'Privacy by design', 'Why counting is anonymous'), ('glossary/', 'Glossary', 'Key terms defined')],
        [('Does people counting use cameras?', 'Not necessarily. Depth and movement sensors count people by shape without capturing recognisable images, and process the count on the device, so only anonymous numbers leave the sensor.'),
         ('How does a people counter know direction?', 'Sensors track a person as they cross a line or move through a zone, so they record entries and exits separately and can measure flow between areas.'),
         ('How quickly does the data update?', 'Counts usually appear in the platform within a few seconds, which is what makes live occupancy and capacity alerts possible.')],
        'How people counting works | Place Performance',
        'How modern people counting works: anonymous on-device counting by shape and movement, real-time occupancy, and what keeps the numbers accurate, explained in plain English.')

article('lidar-vs-camera-people-counting', 'Guide', 'LiDAR vs camera people counting',
        'The main ways to count people differ on accuracy, privacy, light and the outdoors. Here is how to tell them apart.',
        [('', 'Most people counting uses one of a few sensing technologies. They are not equally good at every job, and the right choice depends on where you are counting and how much privacy matters.'),
         ('3D LiDAR and depth sensors', 'These map a space in three dimensions and count people by shape and height, not by their faces. They are highly accurate, work in any light including darkness, handle groups and tailgating well, and do not capture recognisable images, which suits privacy-sensitive places.'),
         ('Cameras and video analytics', 'Camera-based counting runs analytics on a video image. It can be inexpensive where cameras already exist, but accuracy depends on lighting and angle, and because it works from the image itself it raises more privacy considerations.'),
         ('Radar and mmWave', 'Radar detects people and vehicles by their movement. It works outdoors in all weather, sees through rain and glare, and can run on battery, solar and mobile data, which makes it well suited to streets, parks, temporary sites and single events.'),
         ('Wi-Fi and device counting', 'Counting phones and Wi-Fi signals is cheap to deploy but estimates people indirectly. It misses anyone without a discoverable device and is affected by privacy controls in modern phones, so it is better for rough trends than exact counts.'),
         ('Which to choose', 'There is rarely a single best sensor. Indoor entrances and zones often suit overhead depth sensing, outdoor and mixed traffic suit radar, and the strongest deployments match the technology to each site. That is the approach Place Performance takes.')],
        [('sensors/', 'Sensors', 'The sensors and how we choose them'), ('compare/', 'Compare systems', 'Approaches compared'), ('privacy-by-design/', 'Privacy by design', 'Anonymous counting'), ('glossary/', 'Glossary', 'Key terms defined')],
        [('Is LiDAR better than a camera for people counting?', 'For accuracy, privacy and working in any light, depth and LiDAR sensors have clear advantages because they count by shape rather than from a recognisable image. Cameras can be cost-effective where they already exist but depend more on lighting and raise more privacy considerations.'),
         ('What counts people outdoors?', 'Radar and mmWave sensors are well suited to the outdoors. They work in all weather and can run on battery, solar and mobile data, so they suit streets, parks and temporary sites.'),
         ('Is Wi-Fi tracking accurate for counting people?', 'Wi-Fi counting estimates people indirectly from devices, misses anyone without a discoverable phone, and is affected by modern privacy controls, so it is better for rough trends than exact counts.')],
        'LiDAR vs camera people counting | Place Performance',
        'LiDAR, camera, radar and Wi-Fi people counting compared on accuracy, privacy, light and outdoor use, so you can match the right sensing technology to each site.')

article('how-accurate-are-people-counters', 'Guide', 'How accurate are people counters?',
        'Accuracy is the first question buyers ask. Here is what drives it, how it is measured, and how to keep counts reliable.',
        [('', 'A people counter is only useful if you trust the number. Good systems are accurate, but accuracy is not a single fixed figure. It depends on the sensor, the installation and how the system is looked after.'),
         ('What accuracy means', 'Accuracy is how closely the automated count matches the true number of people. Well-installed 3D and depth sensors commonly reach the high nineties in percentage terms, while simpler methods such as single beams or Wi-Fi estimates sit lower.'),
         ('What affects accuracy', 'Placement and field of view, calibration, how busy the space is, groups and tailgating, and lighting all affect the result. A sensor that is well chosen for the site and carefully commissioned will hold accuracy that a poorly placed one never reaches.'),
         ('How accuracy is measured', 'Accuracy is checked by comparing the sensor count against a known ground truth, usually a manual count over a set period, at the site itself. A figure proven in your own space matters far more than a number on a brochure.'),
         ('Keeping accuracy high over time', 'Counts drift if a sensor is knocked, obscured or goes offline. Continuous device health monitoring flags problems early, and periodic validation confirms the numbers are still right, so the data stays dependable long after installation.')],
        [('compare/', 'Compare systems', 'Approaches compared'), ('sensors/', 'Sensors', 'The sensors and how we choose them'), ('platform/', 'Platform', 'From sensor to decision'), ('glossary/', 'Glossary', 'Key terms defined')],
        [('How accurate is people counting?', 'Accuracy depends on the sensor and on how well it is installed and calibrated. Well-installed 3D and depth sensors commonly reach the high nineties in percentage terms, validated against a manual count on site, with device health monitoring to keep them reliable.'),
         ('How is people counting accuracy tested?', 'By comparing the sensor count against a manual ground-truth count over a set period at the site itself, which proves accuracy in the real environment rather than in a lab.'),
         ('Why do people counts drift over time?', 'A sensor can be knocked, obscured or go offline. Continuous device health monitoring catches these early and periodic validation confirms the counts are still accurate.')],
        'How accurate are people counters? | Place Performance',
        'What drives people counting accuracy, how it is measured against a ground-truth count on site, and how device health monitoring keeps counts reliable over time.')

guides_body = (
    page_hero('Guides', 'Understand people counting and place analytics',
              'Short, practical explainers on how counting works, how the technologies compare, and how to trust the numbers.',
              '', [('Home', '{R}'), ('Guides', None)], ctas=False) +
    section(cards([
        ('How people counting works', 'From the sensor on the wall to the number on your dashboard, in plain English.', '{R}guides/how-people-counting-works/'),
        ('LiDAR vs camera people counting', 'How the main sensing technologies differ on accuracy, privacy, light and the outdoors.', '{R}guides/lidar-vs-camera-people-counting/'),
        ('How accurate are people counters?', 'What drives accuracy, how it is measured, and how to keep counts reliable.', '{R}guides/how-accurate-are-people-counters/'),
        ('Glossary', 'Plain-English definitions of the key people counting and place analytics terms.', '{R}glossary/'),
    ], cols=2))
)
page('guides', 'Guides: how people counting and place analytics work | Place Performance',
     'Practical guides to people counting and place analytics: how counting works, LiDAR versus cameras, how accurate people counters are, and a glossary of key terms.',
     guides_body, None, [('Home', ''), ('Guides', 'guides/')])

# --------------------------------------------------------------------------
# Render
# --------------------------------------------------------------------------
TEMPLATE = '''<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Place Performance">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{base}assets/screens/home.jpg">
<meta property="og:locale" content="en_AU">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{base}assets/screens/home.jpg">
<meta name="theme-color" content="#0a2540">
<link rel="icon" href="{R}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="{R}styles.css">
<script type="application/ld+json">
{jsonld}
</script>
</head>
<body>
{nav}
<main id="top">
{body}
{faq}
{cta}
</main>
{footer}
<script src="{R}main.js"></script>
</body>
</html>
'''


def render(p):
    depth = p['slug'].count('/') + 1 if p['slug'] else 0
    R = '../' * depth
    url = BASE + (p['slug'] + '/' if p['slug'] else '')
    faq = faq_html(p['faqs']) if p['faqs'] and p['slug'] != 'faq' else ''
    html = TEMPLATE.format(title=escape(strip(p['title'])), desc=escape(p['desc']), url=url, base=BASE, R='{R}',
                           jsonld=jsonld(p, url), nav=nav(p['nav_key']), body=p['body'] + GUIDES.get(p['slug'], ''), faq=faq,
                           cta=cta_band() if p['slug'] != 'contact' else '', footer=FOOTER)
    html = html.replace('{APP}', APP_URL).replace('{R}', R)
    path = os.path.join(OUT, p['slug'], 'index.html') if p['slug'] else os.path.join(OUT, 'index.html')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)
    return url


urls = [render(p) for p in PAGES]


def write_redirect(old_slug, target_slug):
    """Emit a meta-refresh redirect stub so old /solutions/ URLs still resolve."""
    target = BASE + (target_slug + '/' if target_slug else '')
    html = ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
            '<title>Redirecting</title><link rel="canonical" href="%s">'
            '<meta http-equiv="refresh" content="0; url=%s">'
            '<meta name="robots" content="noindex"></head>'
            '<body><p>This page has moved to <a href="%s">%s</a>.</p></body></html>\n') % (
        target, target, target, target)
    path = os.path.join(OUT, old_slug, 'index.html')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)


write_redirect('solutions', 'industries')
for _s, _n, _d, _img in SOLUTIONS:
    write_redirect('solutions/' + _s, 'industries/' + _s)
write_redirect('hardware', 'sensors')

with open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u, p in zip(urls, PAGES):
        f.write('  <url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n' % (u, TODAY, '1.0' if not p['slug'] else '0.8'))
    f.write('</urlset>\n')

with open(os.path.join(OUT, 'robots.txt'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n' % BASE)

with open(os.path.join(OUT, 'llms.txt'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('# Place Performance\n\n> End-to-end people counting and place analytics for councils, universities, government and property owners in Australia: privacy-safe 3D people counting sensors, design, installation and local support by Place Performance, and a real-time analytics and AI platform built on Rayven.\n\n')
    f.write('Key facts:\n- Measures visitors, entries and exits, live occupancy vs capacity, peak periods, dwell time, repeat visitation, movement between zones, and outdoors pedestrians, cyclists and vehicles.\n- Real-time occupancy refreshes every few seconds; alerts by email, SMS, Microsoft Teams and in-app.\n- Reporting, forecasting, scenario planning, AI insights and a plain-English Place Assistant.\n- Privacy by design: processing on the device, data masked at source, no facial recognition, no personal information collected.\n- Four plan levels: Essentials, Insights, Professional, Executive. Every plan includes sensors, installation, platform and support.\n\n')
    f.write('## Pages\n')
    for u, p in zip(urls, PAGES):
        f.write('- [%s](%s): %s\n' % (strip(p['title']).split(' | ')[0], u, p['desc']))
    f.write('\n## Questions and answers\n')
    seen = set()
    for p in PAGES:
        for q, a in p['faqs']:
            if q in seen:
                continue
            seen.add(q)
            f.write('\n### %s\n%s\n' % (strip(q), strip(a).replace('{R}', '')))

print('built %d pages' % len(PAGES))
for u in urls:
    print(' ', u)
