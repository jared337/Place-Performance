# Place-type landing pages (/places/<slug>/) and the Places hub.
# Executed by build.py after content_guides.py; uses L(), R(), P, guide(), section(), page().

PLACES = [
    # slug, card name, city, tag, photo, alt
    ('campuses', 'Campuses', 'Sydney, NSW', 'Room &amp; space utilisation', 'university', 'Sandstone university quadrangle in Sydney'),
    ('libraries', 'Libraries', 'Melbourne, VIC', 'Live zone occupancy', 'library', 'Domed reading room of a state library in Melbourne'),
    ('shopping-centres', 'Shopping centres', 'Sydney, NSW', 'Footfall &amp; dwell time', 'food-hall', 'Shopping centre atrium with escalators in Sydney'),
    ('stadiums-and-venues', 'Stadiums &amp; venues', 'Melbourne, VIC', 'Crowd capacity alerts', 'crowd', 'Crowd filling a stadium in Melbourne'),
    ('streets-and-laneways', 'Streets &amp; laneways', 'Melbourne, VIC', 'Pedestrian counts', 'city', 'Busy Melbourne laneway with cafes'),
    ('parks-and-foreshores', 'Parks &amp; foreshores', 'Sydney, NSW', 'Visitation trends', 'parks', 'People relaxing on a harbourside lawn near the Sydney Harbour Bridge'),
    ('office-towers', 'Office towers', 'Sydney, NSW', 'Floor &amp; desk utilisation', 'towers', 'Aerial view of the Sydney CBD office towers'),
    ('government-buildings', 'Government', 'Canberra, ACT', 'Portfolio occupancy', 'government', 'Parliament House in Canberra'),
]
PLACE_BY = {p[0]: p for p in PLACES}

EXTRA_BLOCKS = {
    'campuses': ('Typical uses on campus', 'Estates teams use utilisation data to consolidate under-used rooms, timetabling teams to match class sizes to rooms, library teams to plan exam-period hours, and student services to publish live study space. Facilities teams use visit counts to schedule cleaning in high-traffic buildings, and safety teams use live occupancy for large lecture theatres and event spaces.'),
    'libraries': ('Typical uses in libraries', 'Branch managers use peak-period data to set rosters, program teams measure attendance at story time and events, facilities teams schedule cleaning after busy periods, and library leaders compare branches to decide where to invest. In university libraries, live occupancy helps students find a seat during exam weeks.'),
    'shopping-centres': ('Typical uses in centres', 'Centre managers report footfall to owners, leasing teams use zone data in tenant negotiations, marketing teams measure campaign uplift, operations teams roster cleaning and security to peaks, and asset managers compare centres across a portfolio.'),
    'stadiums-and-venues': ('Typical uses at venues', 'Operations teams watch live attendance and gate pressure on event days, safety officers receive alerts when zones approach their limits, planners compare attendance and peak arrival times across events, and commercial teams measure how crowds use bars, retail and function spaces.'),
    'streets-and-laneways': ('Typical uses in streets', 'Place managers report on town centre activity, economic development teams track the recovery or growth of precincts, event teams measure festival attendance, and transport planners use pedestrian volumes to prioritise crossings, footpath widening and lighting.'),
    'parks-and-foreshores': ('Typical uses in open space', 'Open space planners measure demand for new facilities, maintenance teams schedule cleaning and bin collection around peak use, active transport teams track cyclist growth on shared paths, and event teams measure the attendance of outdoor festivals and markets.'),
    'office-towers': ('Typical uses in office towers', 'Facilities managers trigger cleaning by use, engineers feed occupancy into HVAC controls, workplace strategists study hybrid attendance, leasing teams give tenants evidence about their space, and asset managers measure the effect of lobby and amenity upgrades.'),
    'government-buildings': ('Typical uses in government', 'Property teams identify consolidation opportunities, workplace teams plan for hybrid attendance, service delivery teams monitor shopfront queues against targets, security teams use live occupancy for emergency management, and executives receive regular utilisation reporting.'),
}
EXTRA_FAQS = {
    'campuses': [('Can it measure lecture theatres and labs as well as study spaces?', 'Yes. Any room or zone can be measured, from large lecture theatres to labs, tutorial rooms, libraries and informal study areas, with each one shown on its building floorplan.'),
                 ('How long before utilisation data is useful?', 'Live occupancy is available as soon as sensors are commissioned. Patterns become clear within a few weeks, and a full semester gives a reliable picture for timetabling and estate planning.')],
    'libraries': [('Can it count attendance at library programs and events?', "Yes. Zone sensors in program rooms and children's areas measure attendance and occupancy during story time, workshops and events."),
                  ('Can several branches be compared?', 'Yes. Multi-site views compare visitation, occupancy and peak periods across branches so investment and staffing can be prioritised.')],
    'shopping-centres': [('Can footfall be reported to owners automatically?', 'Yes. Scheduled reports deliver footfall, dwell and zone performance to owners and managers weekly, monthly or quarterly.'),
                         ('Can it compare centres in a portfolio?', 'Yes. Portfolio views rank centres and zones by footfall and performance and flag outliers.')],
    'stadiums-and-venues': [('Can it show which gates are busiest?', 'Yes. Entry counts and arrival rates by gate show where pressure is building, so staff can be redeployed or patrons redirected.'),
                            ('Can attendance be compared across events?', 'Yes. Every event is stored, so attendance, peak arrival times and zone occupancy can be compared to plan future events.')],
    'streets-and-laneways': [('How many counting points does a street need?', 'It depends on the questions you want to answer. A site survey identifies the points that capture the main pedestrian flows, often entrances to a precinct and key intersections.'),
                             ('Can street counts be compared with nearby centres?', 'Yes. Street counts sit alongside shopping centre footfall and park visitation in one platform, so the whole precinct can be compared.')],
    'parks-and-foreshores': [('Can it count cyclists separately from pedestrians?', 'Yes. Where needed, technology is selected that distinguishes cyclists from pedestrians and records their direction.'),
                             ('Can sensors be installed temporarily for a festival?', 'Yes. Temporary deployments are available for events and short studies, alongside permanent installations.')],
    'office-towers': [('Can it measure meeting room use?', 'Yes. Sensors in meeting rooms measure actual occupancy, which can be compared with bookings to identify rooms that are booked but empty or the wrong size.'),
                      ('Does it track individual employees?', 'No. Counting is anonymous, with processing on the device and no images or personal information collected.')],
    'government-buildings': [('Can it support evacuation and emergency management?', 'Live occupancy shows how many people are in each building and floor at any moment, supporting capacity limits and emergency management.'),
                             ('Can reports go to executives automatically?', 'Yes. Scheduled reports and board packs summarise attendance, utilisation and trends without manual data gathering.')],
}


def place_page(slug, h1, lead, seo_title, desc, why_h2, why, measures, shot_spec, install, related, faqs, service):
    _, name, city, tag, img, alt = PLACE_BY[slug]
    s_src, s_alt, s_h3, s_p = shot_spec
    why = why + [EXTRA_BLOCKS[slug]]
    faqs = faqs + EXTRA_FAQS[slug]
    body = (
        page_hero(name, h1, lead, photo(img, alt, (tag, 'Pictured: ' + city)), [('Home', '{R}'), ('Places', '{R}places/'), (name, None)]) +
        guide('Why measure', why_h2, why, related[:5]) +
        section(head('What you can measure', 'The numbers that matter here.') + cards(measures), 'sec-tint') +
        section(split(shot(s_src, s_alt), copy('In the platform', s_h3, s_p))) +
        section('<div class="install-grid reveal"><div>' + head('How it is installed', 'From site survey to live data.', 'Our Australian team designs, installs and supports every deployment, so you deal with one partner from the first survey to ongoing maintenance.') +
                '<p><a class="link-arrow" href="{R}platform/">How the platform works</a></p></div><ol class="steps-list">' +
                ''.join('<li><b>%s</b> %s</li>' % s for s in install) + '</ol></div>', 'sec-tint') +
        section(head('Explore more', 'Related solutions and places.') + cards([(t, d, '{R}' + p) for p, t, d in related[5:]]))
    )
    page('places/' + slug, seo_title + ' | Place Performance', desc, body, faqs,
         [('Home', ''), ('Places', 'places/'), (strip(name), 'places/%s/' % slug)], service=service, nav_key='solutions')


INSTALL_INDOOR = [('Survey.', 'We assess entrances, ceiling heights, layout, lighting, power, network and privacy needs.'),
                  ('Design.', 'A sensor plan places FootfallCam 3D counters at entrances and over the zones you want to measure.'),
                  ('Install and calibrate.', 'Devices are installed, commissioned and checked for accuracy against manual counts.'),
                  ('Support.', 'Every device reports a heartbeat, and our team is alerted if one needs attention.')]

place_page('campuses', 'Space utilisation for university campuses.',
           'See how lecture theatres, labs, libraries and study spaces are really used, compare bookings with reality and plan the estate on evidence.',
           'Campus space utilisation monitoring',
           'Measure room and space utilisation across university campuses: occupancy vs bookings, live study space, peak periods and evidence for capital planning.',
           'Bookings show intent. Sensors show reality.', [
    (None, 'Most campus space decisions are made from timetables and booking systems, which record what was reserved rather than what was used. Rooms booked for a class of eighty may regularly hold thirty, while popular study spaces overflow at exam time. Measuring actual occupancy closes that gap.'),
    ('Utilisation room by room', 'Sensors measure how many people are in each lecture theatre, tutorial room, lab and study area throughout the day. Combined with capacity, that gives true utilisation by room, building and time of week, which timetabling and estates teams can use to right-size allocations. Read more about ' + L('universities', 'space utilisation for universities') + '.'),
    ('Helping students find space', 'Live occupancy on ' + L('realtime', 'interactive floorplans') + ' can show students which study rooms and library areas have space right now, spreading demand across buildings. Campus ' + L('libraries', 'libraries') + ' use the same data for staffing and opening hours.'),
    ('Planning the estate', 'Semester-on-semester trends and ' + L('ai', 'demand forecasts') + ' show whether a new building is really needed, or whether better use of existing space would meet demand. All counting is anonymous, as explained in ' + L('privacy', 'privacy by design') + '.'),
], [('Utilisation %', 'Frequency and occupancy combined, per room and building.', '{R}solutions/universities/'),
    ('Booked vs used', 'Rooms reserved but empty, and classes that need a different size.', None),
    ('Live study space', 'Free and busy study areas right now, on floorplans.', '{R}real-time/'),
    ('Peak periods', 'Busiest hours by weekday, week of semester and exam period.', None),
    ('Dwell time', 'How long students stay in each study space.', None),
    ('Semester trends', 'Week, month and year comparisons across the academic calendar.', '{R}ai-forecasting/')],
   ('occupancy-history', 'Occupancy history for a campus building across a week', 'See a whole week at a glance.', 'Occupancy history by hour and day shows how each building and room is used across the week, with comfort thresholds marked, so under-used and over-crowded spaces stand out immediately.'),
   INSTALL_INDOOR,
   [R('universities', 'Universities', 'Space utilisation analytics'), R('libraries', 'Libraries', 'Study space and help desks'), R('ai', 'AI &amp; forecasting', 'Plan capital works'),
    R('realtime', 'Real time', 'Live study space'), R('privacy', 'Privacy by design', 'No students identified'),
    R('universities', 'Universities', 'How universities use the platform'), R('libraries', 'Libraries', 'Zone occupancy in reading rooms'), R('offices', 'Office towers', 'Floor and desk utilisation')],
   [('How do you measure space utilisation on a university campus?', 'Sensors count how many people are in each room or zone throughout the day. Comparing measured occupancy with each room\'s capacity and its bookings shows true utilisation by room, building and time of week.'),
    ('Can students see which study spaces are free?', 'Yes. Live occupancy can be shown on floorplans so students and staff can see which study rooms and library areas have space right now.'),
    ('Does campus people counting identify students?', 'No. Counting is processed on the device and only anonymous numbers are sent, with no images or personal information collected.'),
    ('Can utilisation data support capital planning?', 'Yes. Trends and forecasts show whether more space is genuinely needed or existing space could be used better, before committing to new buildings.')],
   'Campus space utilisation monitoring')

place_page('libraries', 'People counting and live occupancy for libraries.',
           'Count visits, see live occupancy in reading rooms, children\'s areas and study spaces, and plan hours and staffing around real demand.',
           'Library people counting &amp; occupancy',
           'People counting for public, state and university libraries: visits, live zone occupancy, peak periods, dwell time, capacity alerts and visitation reports.',
           'The busiest public buildings deserve the best data.', [
    (None, 'Libraries are among the most visited public buildings in Australia, used for study, events, children\'s programs, computer access and simply a quiet place to sit. Visitor counts are a core performance measure, but a single number at the door does not show how each part of the building is used.'),
    ('Every zone, live', 'Entrance counters measure visits, while zone sensors show live occupancy in reading rooms, children\'s areas, study rooms and maker spaces. ' + L('realtime', 'Alerts') + ' tell staff before a space reaches its limit, for example when story time fills the children\'s area, so an overflow room can be opened in time.'),
    ('Hours and staffing that match demand', 'Peak-period grids show the busiest and quietest hours of each day, so opening hours, rosters and programs line up with when the community actually visits. ' + L('ai', 'Forecasts') + ' anticipate school holidays and exam periods.'),
    ('Evidence for funding', 'Automated visitation reports provide consistent numbers for annual reports, funding submissions and council briefings. Read how ' + L('councils', 'councils') + ' and ' + L('universities', 'universities') + ' use library data, and how counting stays anonymous in ' + L('privacy', 'privacy by design') + '.'),
], [('Visits', 'Daily, weekly and seasonal visitation per branch.', None),
    ('Live zone occupancy', 'Reading rooms, children\'s areas and study spaces right now.', '{R}real-time/'),
    ('Capacity alerts', 'Notifications before a zone reaches its limit.', '{R}real-time/'),
    ('Peak periods', 'Busiest and quietest hours by day.', None),
    ('Dwell time', 'How long visitors stay in each area.', None),
    ('Forecasts', 'Expected demand for holidays and programs.', '{R}ai-forecasting/')],
   ('heatmap', 'Heat map of a library children\'s area', 'See where people gather.', 'Heat maps show where visitors concentrate within a zone and replay the day hour by hour, so layouts, seating and programs can be planned around real behaviour.'),
   INSTALL_INDOOR,
   [R('councils', 'Councils &amp; civic', 'Community facilities'), R('universities', 'Universities', 'University libraries'), R('realtime', 'Real time', 'Live floorplans and alerts'),
    R('ai', 'AI &amp; forecasting', 'Forecast busy days'), R('privacy', 'Privacy by design', 'Anonymous counting'),
    R('councils', 'Councils &amp; civic', 'How councils use people counting'), R('campuses', 'Campuses', 'Study space utilisation'), R('govbuildings', 'Government', 'Public-facing buildings')],
   [('How do libraries count visitors?', 'Ceiling-mounted 3D sensors at each entrance count people in and out. Additional sensors over key zones measure live occupancy in areas such as reading rooms and children\'s spaces.'),
    ('Can a library see how full each area is right now?', 'Yes. Each zone is drawn on a floorplan and shows its live headcount, coloured by how full it is, with alerts before limits are reached.'),
    ('Is library people counting anonymous?', 'Yes. Processing happens on the device and no images or personal information are collected, only anonymous counts.'),
    ('Can visitation data be used for funding reports?', 'Yes. Scheduled reports provide consistent, independent visitation numbers for annual reports, grant applications and briefings.')],
   'Library people counting')

place_page('shopping-centres', 'Footfall analytics for shopping centres.',
           'Measure footfall by entrance, zone and hour, connect visits to sales, and staff, clean and secure the centre for its busiest times.',
           'Shopping centre footfall counting',
           'Footfall counting for shopping centres: entries by door and hour, dwell time, zone and tenant ranking, conversion with POS data and queue monitoring.',
           'Footfall is the heartbeat of a centre.', [
    (None, 'Footfall tells centre managers whether marketing works, which entrances matter, how tenants perform and when to staff. Reliable counting at every entrance, plus sensors in key zones, turns that into a complete picture.'),
    ('Entrances, malls and food courts', 'Entrance counters measure footfall by door and hour. Zone sensors show how visitors spread through malls, wings and food courts, and ' + L('realtime', 'live occupancy') + ' helps cleaning and security respond to busy periods as they happen.'),
    ('Sales and tenant performance', 'Integrating point-of-sale data turns footfall into conversion and sales per visitor, and zone ranking highlights strong and weak areas for leasing. Read more about ' + L('retail', 'footfall analytics for retail and precincts') + '.'),
    ('Campaigns and planning', 'Comparing a promotion with the expected baseline shows the uplift it created, and ' + L('ai', 'scenario planning') + ' tests changes such as extended trading hours. Outdoor counting extends the picture to surrounding ' + L('streets', 'streets and laneways') + '.'),
], [('Footfall', 'Entries by door, hour and day.', None), ('Dwell time', 'How long shoppers stay.', None),
    ('Zone ranking', 'Performance by mall, wing and tenant.', '{R}solutions/retail/'), ('Conversion', 'Sales per visitor with POS data.', None),
    ('Queues &amp; wait', 'Food court and service desk waits.', '{R}real-time/'), ('Campaign uplift', 'Change during promotions and events.', '{R}ai-forecasting/')],
   ('peak-periods', 'Peak period heat grid for a shopping centre', 'Know the busiest hour of every day.', 'Peak-period grids show footfall by hour and weekday, so rosters, cleaning and security match the rhythm of the centre.'),
   INSTALL_INDOOR,
   [R('retail', 'Retail &amp; precincts', 'Footfall and conversion'), R('streets', 'Streets &amp; laneways', 'Precinct counting'), R('ai', 'AI &amp; forecasting', 'Campaign analysis'),
    R('realtime', 'Real time', 'Live occupancy and queues'), R('plans', 'Plans', 'Integrations at Professional'),
    R('retail', 'Retail &amp; precincts', 'How centres use footfall data'), R('streets', 'Streets &amp; laneways', 'Pedestrian counts around the centre'), R('venues', 'Stadiums &amp; venues', 'Event crowds')],
   [('How is footfall measured in a shopping centre?', '3D people counters above each entrance count people in and out, and sensors in key zones measure occupancy and movement through the centre.'),
    ('Can footfall be linked to sales?', 'Yes. Point-of-sale integrations combine visits with sales to calculate conversion and sales per visitor by zone.'),
    ('Can it monitor food court queues?', 'Yes. Queue sensors measure queue length and wait time, with alerts when service targets are at risk.'),
    ('Does footfall counting identify shoppers?', 'No. Counting is anonymous and processed on the device, with no images or personal information collected.')],
   'Shopping centre footfall analytics')

place_page('stadiums-and-venues', 'Crowd capacity monitoring for stadiums and venues.',
           'Track entries and live crowd numbers against venue limits, get alerted before areas fill, and use attendance data to plan the next event.',
           'Crowd capacity monitoring for venues',
           'Crowd capacity monitoring for stadiums, arenas and event venues: live attendance, entry flow by gate, zone occupancy vs limits and alerts.',
           'Safe crowds start with accurate numbers.', [
    (None, 'Stadiums, arenas, showgrounds and event spaces have to know how many people are inside, where they are, and how fast more are arriving. Accurate live numbers support safety decisions, while history supports planning and reporting.'),
    ('Entry flow and live attendance', 'Counters at gates and entries measure inflow and outflow, giving a live attendance figure and entry rate by gate. Operations teams can see which gates are under pressure and redirect staff or patrons.'),
    ('Zones against their limits', 'Concourses, bars, function rooms and fan zones each have their own limits. Zone occupancy against those limits, with ' + L('realtime', 'alerts by SMS, Teams or email') + ', helps staff act before an area becomes unsafe.'),
    ('Temporary and permanent deployments', 'Permanent systems suit venues with regular events, while temporary counting can be deployed for festivals and one-off events, a common need for ' + L('councils', 'councils') + '. After the event, reports and ' + L('ai', 'forecasts') + ' inform staffing and layout for the next one.'),
], [('Live attendance', 'People inside now, against venue capacity.', '{R}real-time/'), ('Entry rate', 'Arrivals per minute by gate.', None),
    ('Zone occupancy', 'Concourses, bars and fan zones vs their limits.', None), ('Capacity alerts', 'Escalating notifications before limits.', '{R}real-time/'),
    ('Event comparison', 'Attendance and peaks across events.', None), ('Forecasts', 'Expected arrivals for planning.', '{R}ai-forecasting/')],
   ('alerts', 'Alerts feed showing capacity and queue alerts', 'Alerts that reach the right person.', 'Threshold rules watch occupancy, entry rates and sensor health. Alerts go to the right team by SMS, Teams, email or in-app, and escalate if nobody responds.'),
   [('Survey.', 'We map gates, concourses and zones, and agree capacity limits and alert recipients.'),
    ('Design.', 'Counters are planned for each gate and zone, permanent or temporary for a single event.'),
    ('Install and test.', 'Devices are installed and tested against manual counts before doors open.'),
    ('Support on the day.', 'Device health is monitored throughout, and alerts go straight to your operations team.')],
   [R('councils', 'Councils &amp; civic', 'Events and community venues'), R('realtime', 'Real time', 'Alerts and live numbers'), R('parks', 'Parks, trails &amp; streets', 'Outdoor events'),
    R('ai', 'AI &amp; forecasting', 'Plan the next event'), R('privacy', 'Privacy by design', 'Anonymous counting'),
    R('councils', 'Councils &amp; civic', 'How councils manage event crowds'), R('foreshores', 'Parks &amp; foreshores', 'Outdoor event spaces'), R('shopping', 'Shopping centres', 'Peak crowd management')],
   [('How do venues monitor crowd capacity in real time?', 'Counters at each gate measure people entering and leaving, giving a live attendance figure. Zone sensors compare occupancy in each area with its limit and raise alerts before limits are reached.'),
    ('Can counting be set up for a one-off event?', 'Yes. Temporary deployments are available for festivals and single events, as well as permanent systems for venues.'),
    ('Who receives capacity alerts?', 'Alerts can go to individuals or teams by SMS, Microsoft Teams, email or in-app, with escalation if an alert is not acknowledged.'),
    ('Is venue crowd counting anonymous?', 'Yes. Processing happens on the device and only anonymous counts are sent.')],
   'Crowd capacity monitoring')

place_page('streets-and-laneways', 'Pedestrian counting for streets and laneways.',
           'Measure pedestrian activity in streets, laneways, plazas and town centres, hour by hour, and see how places change over time.',
           'Pedestrian counting for streets',
           'Pedestrian counting for streets, laneways, plazas and town centres: hourly activity, peak periods, seasonal trends, events and before-and-after studies.',
           'Busy streets are the sign of a healthy place.', [
    (None, 'Pedestrian activity is one of the clearest signs of a thriving town centre or precinct. Councils, place managers and business associations use it to understand how streets are used, measure the effect of events and investment, and support economic development.'),
    ('Activity by hour, day and season', 'Sensors at key points count pedestrians and their direction, showing how activity varies through the day, across the week and between seasons. Peak-period views show the busiest times for cleaning, safety and events.'),
    ('Events and change', 'Comparing activity during events, festivals or promotions with normal patterns shows their impact. Measuring before and after streetscape works shows how a project changed the way people use an area. Read more about ' + L('parks', 'counting in parks, trails and streets') + '.'),
    ('Connected to the wider precinct', 'Street counts sit alongside ' + L('shopping', 'shopping centre') + ' footfall and ' + L('foreshores', 'park visitation') + ' in one ' + L('platform', 'platform') + ', so precinct managers and ' + L('councils', 'councils') + ' can see the whole picture.'),
], [('Pedestrian counts', 'Volumes by location and direction.', None), ('Peak periods', 'Busiest hours by day.', None),
    ('Seasonal trends', 'Change across months and years.', '{R}ai-forecasting/'), ('Event impact', 'Activity during events vs normal.', None),
    ('Before and after', 'The effect of streetscape projects.', '{R}solutions/parks-and-streets/'), ('Cyclists &amp; vehicles', 'Optional counting where needed.', '{R}solutions/parks-and-streets/')],
   ('occupancy-history', 'Activity trend for a street location across a week', 'Patterns you can plan around.', 'Hour-by-hour history shows the rhythm of each street, from the morning commute to the evening dining peak, and how it shifts across the week.'),
   [('Survey.', 'We identify counting points, mounting options, power and connectivity for each street location.'),
    ('Select.', 'The right sensor is chosen for the environment, including options for poles, awnings and building facades.'),
    ('Install and calibrate.', 'Devices are installed and checked against manual counts.'),
    ('Support.', 'Device health is monitored remotely, with local support when something needs attention.')],
   [R('parks', 'Parks, trails &amp; streets', 'Outdoor counting'), R('councils', 'Councils &amp; civic', 'Town centres and events'), R('retail', 'Retail &amp; precincts', 'Precinct footfall'),
    R('ai', 'AI &amp; forecasting', 'Seasonal forecasts'), R('privacy', 'Privacy by design', 'Anonymous counting'),
    R('parks', 'Parks, trails &amp; streets', 'Pedestrian, cyclist and vehicle counting'), R('shopping', 'Shopping centres', 'Footfall inside the centre'), R('foreshores', 'Parks &amp; foreshores', 'Visitation outdoors')],
   [('How are pedestrians counted on a street?', 'Sensors mounted on poles, awnings or facades count pedestrians passing a point and their direction, using technology chosen for each location.'),
    ('Can it measure the impact of an event or streetscape project?', 'Yes. Comparing activity during an event, or before and after a project, with normal patterns shows the change it created.'),
    ('Does street counting record images of people?', 'No. Counting is processed on the device and only anonymous counts are transmitted.'),
    ('Can it count cyclists and vehicles too?', 'Yes. Cyclist and vehicle counting can be added at locations where it is needed.')],
   'Pedestrian counting')

place_page('parks-and-foreshores', 'Visitation counting for parks and foreshores.',
           'Understand how parks, foreshores, trails and open spaces are used across the day and the seasons, and measure the effect of new facilities.',
           'Park &amp; foreshore visitation counting',
           'Visitation counting for parks, foreshores, trails and open spaces: pedestrians and cyclists, peak periods, seasonal trends, events and project impact.',
           'Open spaces need evidence too.', [
    (None, 'Parks, foreshores and trails are some of the most valued places in Australian cities, yet their use is rarely measured. Visitation data helps councils and land managers plan maintenance, programs, facilities and investment, and demonstrate the value of open space.'),
    ('People and bikes on paths and trails', 'Counters on paths, trails and entries measure pedestrians and cyclists and their direction, showing how visitation changes by hour, day and season. Read more about ' + L('parks', 'counting in parks, trails and streets') + '.'),
    ('Events and seasonal peaks', 'Summer weekends, festivals and holidays bring very different crowds to weekday mornings. Peak-period views and ' + L('ai', 'forecasts') + ' help schedule cleaning, rangers and lifeguards, and temporary counting supports major events.'),
    ('Built for outdoor conditions', 'Each site is assessed for power and connectivity, and the technology suits coastal, urban or remote environments. Data sits alongside ' + L('streets', 'street counts') + ' and ' + L('libraries', 'community facilities') + ' for ' + L('councils', 'councils') + '.'),
], [('Visitation', 'People entering and using each area.', None), ('Cyclists', 'Volumes and direction on shared paths.', '{R}solutions/parks-and-streets/'),
    ('Peak periods', 'Busiest hours, days and seasons.', None), ('Seasonal trends', 'Year-on-year change.', '{R}ai-forecasting/'),
    ('Event attendance', 'Crowd numbers at outdoor events.', '{R}places/stadiums-and-venues/'), ('Project impact', 'Before and after new facilities.', None)],
   ('peak-periods', 'Peak periods by hour and day for a park', 'See when open spaces are busiest.', 'Peak-period grids show the busiest hours and days at each location, informing maintenance, staffing and safety planning across the seasons.'),
   [('Survey.', 'We identify entries, paths and counting points, and assess power and connectivity.'),
    ('Select.', 'Technology is chosen for pedestrians, cyclists or both, suited to the outdoor environment.'),
    ('Install.', 'Devices are mounted discreetly, permanently or temporarily for events and studies.'),
    ('Support.', 'Remote health monitoring and local support keep data flowing.')],
   [R('parks', 'Parks, trails &amp; streets', 'Outdoor counting'), R('councils', 'Councils &amp; civic', 'Open space planning'), R('ai', 'AI &amp; forecasting', 'Seasonal forecasts'),
    R('realtime', 'Real time', 'Live event numbers'), R('privacy', 'Privacy by design', 'Anonymous counting'),
    R('parks', 'Parks, trails &amp; streets', 'Pedestrian and cyclist counting'), R('streets', 'Streets &amp; laneways', 'Pedestrian counts in town centres'), R('venues', 'Stadiums &amp; venues', 'Outdoor events')],
   [('How do you count visitors in a park?', 'Sensors at entries, paths and key points count pedestrians and cyclists and their direction, using technology selected for each outdoor location.'),
    ('Can park counters run without mains power?', 'Power and connectivity are assessed for each site, and the technology is chosen to suit what is available, including remote locations.'),
    ('Can it measure the effect of a new facility?', 'Yes. Measuring before and after a new path, playground or facility shows how visitation changed.'),
    ('Is park visitation counting anonymous?', 'Yes. Only anonymous counts are collected, with processing on the device.')],
   'Park and foreshore visitation counting')

place_page('office-towers', 'Floor and amenity utilisation for office towers.',
           'See how every floor, meeting room and amenity is really used, operate the building on demand, and give tenants evidence about their workplace.',
           'Office occupancy monitoring',
           'Office occupancy monitoring for commercial towers: floor and meeting room utilisation, hybrid attendance, visitor flow, demand-based cleaning and BMS integration.',
           'Hybrid work changed the office. Measure the new normal.', [
    (None, 'Office attendance now varies by day, team and floor. Building owners and tenants need to know how space is really used to make good decisions on cleaning, energy, amenities and leasing.'),
    ('Floors, rooms and amenities', 'Sensors measure occupancy on each floor and in meeting rooms, kitchens and end-of-trip facilities. Comparing booked with actual use reveals rooms that are reserved but empty, and attendance by weekday shows hybrid patterns.'),
    ('Operate on demand', 'Occupancy shared with the building management system lets HVAC and lighting respond to real use, and demand-based cleaning is triggered by visits. Read more about ' + L('buildings', 'occupancy analytics for commercial buildings') + '.'),
    ('Evidence for tenants and owners', 'Tenants can see their own space, supporting workplace strategy and lease decisions, while owners use ' + L('ai', 'investment analysis') + ' to prove the value of refits. ' + L('government', 'Government agencies') + ' use the same data to right-size their office portfolios.'),
], [('Floor utilisation', 'Average and peak occupancy per floor.', None), ('Meeting rooms', 'Booked versus used, by room size.', None),
    ('Hybrid attendance', 'Patterns by weekday and team floor.', '{R}solutions/government/'), ('Visitor flow', 'Movement between lifts and amenities.', '{R}real-time/'),
    ('Cleaning triggers', 'Visits since the last clean.', '{R}solutions/buildings/'), ('Energy signal', 'Occupancy for HVAC and lighting.', None)],
   ('visitor-flow', 'Visitor flow between entrances and zones on an office floor', 'See how people move through a floor.', 'Visitor flow traces the most common paths between lifts, entrances and amenities, so pinch points can be fixed and services placed where people go.'),
   INSTALL_INDOOR,
   [R('buildings', 'Buildings &amp; property', 'Commercial property'), R('government', 'Government', 'Public sector offices'), R('realtime', 'Real time', 'Live floorplans'),
    R('ai', 'AI &amp; forecasting', 'Refit analysis'), R('plans', 'Plans', 'BMS integration at Professional'),
    R('buildings', 'Buildings &amp; property', 'How owners use occupancy data'), R('govbuildings', 'Government buildings', 'Agency portfolios'), R('campuses', 'Campuses', 'Room utilisation')],
   [('How is office occupancy measured?', 'Ceiling-mounted sensors count people entering floors and zones and measure how many are present, giving live and historical occupancy per floor, room and amenity.'),
    ('Can it show hybrid work attendance patterns?', 'Yes. Occupancy by floor and weekday shows hybrid patterns without tracking individuals.'),
    ('Does it integrate with the building management system?', 'Yes. Occupancy can be shared with HVAC and lighting controls so empty floors are not conditioned.'),
    ('Can tenants see their own data?', 'Yes. Access can be limited by site and tenancy.')],
   'Office occupancy monitoring')

place_page('government-buildings', 'Occupancy monitoring for government buildings.',
           'Measure how agency offices, service centres and public buildings are used, consolidate with confidence and report transparently.',
           'Government building occupancy',
           'Occupancy monitoring for government buildings: agency office utilisation, service centre queues, public building capacity and transparent reporting.',
           'Public property, measured with public accountability in mind.', [
    (None, 'Government agencies manage offices, service centres, courts, cultural institutions and other public buildings. Each must be used efficiently, kept safe and reported on transparently, which all depends on knowing how many people use it.'),
    ('Agency offices', 'Floor-by-floor occupancy over time shows average and peak use and identifies floors that are consistently under-used, supporting consolidation and workplace strategy. See ' + L('government', 'office occupancy analytics for government') + '.'),
    ('Service centres and public buildings', 'Queue and wait-time monitoring at shopfronts measures service against targets, and live occupancy supports capacity limits and emergency management at public-facing sites. Read about ' + L('realtime', 'real-time alerts') + '.'),
    ('Reporting and privacy', 'Board packs and scheduled reports go to executives and ministers automatically. Counting is anonymous and processed on the device, with role-based access and single sign-on, as described in ' + L('privacy', 'privacy by design') + '.'),
], [('Floor utilisation', 'Average and peak occupancy per floor.', '{R}places/office-towers/'), ('Portfolio ranking', 'Buildings compared by utilisation.', '{R}solutions/government/'),
    ('Queue &amp; wait', 'Service centre waits vs targets.', '{R}real-time/'), ('Live occupancy', 'People on site now for safety.', '{R}real-time/'),
    ('Attendance by weekday', 'Hybrid patterns across the week.', None), ('Board reporting', 'Executive packs, delivered automatically.', '{R}ai-forecasting/')],
   ('portfolio', 'Portfolio overview ranking buildings by utilisation on a map', 'Compare every building at once.', 'Portfolio views rank buildings by utilisation and performance, flag outliers and show where floors are consistently under-used.'),
   INSTALL_INDOOR,
   [R('government', 'Government', 'Agency property'), R('offices', 'Office towers', 'Floor utilisation'), R('privacy', 'Privacy by design', 'Anonymous counting'),
    R('ai', 'AI &amp; forecasting', 'Scenario planning'), R('plans', 'Plans', 'Executive reporting'),
    R('government', 'Government', 'Right-size the portfolio'), R('offices', 'Office towers', 'Hybrid attendance'), R('libraries', 'Libraries', 'Public buildings')],
   [('How can agencies measure office utilisation?', 'Sensors measure occupancy on every floor over time, showing average and peak utilisation by day and identifying under-used space.'),
    ('Can it monitor service centre queues?', 'Yes. Queue sensors measure queue length and wait time against service targets, with alerts when targets are at risk.'),
    ('Is the data anonymous?', 'Yes. Counting is processed on the device and no images or personal information are collected.'),
    ('Where is the data hosted?', 'Hosting arrangements can be discussed to meet your agency\'s data and security requirements.')],
   'Government building occupancy monitoring')

# ---------------- Places hub ----------------
places_hub = (
    page_hero('Places', 'Every kind of place, measured.',
              'Libraries, campuses, shopping centres, venues, streets, parks, office towers and government buildings. See what Place Performance measures in each, and how.',
              '', [('Home', '{R}'), ('Places', None)]) +
    section(photo_cards([(n, tag + ' &middot; pictured: ' + city, img, '{R}places/%s/' % s) for s, n, city, tag, img, _ in PLACES])) +
    guide('Guide', 'Why the type of place matters.', [
        (None, 'A library, a stadium and a shared path all need people counting, but the questions, the sensors and the way they are installed are different. Each place page explains what is measured, how sensors are installed and which features matter most.'),
        ('Indoor places', L('libraries', 'Libraries') + ', ' + L('campuses', 'campuses') + ', ' + L('shopping', 'shopping centres') + ', ' + L('offices', 'office towers') + ' and ' + L('govbuildings', 'government buildings') + ' typically use ceiling-mounted 3D counters at entrances and over key zones, with ' + L('realtime', 'live floorplans') + ' showing occupancy room by room.'),
        ('Outdoor places', L('streets', 'Streets and laneways') + ' and ' + L('foreshores', 'parks and foreshores') + ' use sensors chosen for each environment to count pedestrians, cyclists and, where needed, vehicles. See ' + L('parks', 'parks, trails and streets') + '.'),
        ('Events and venues', L('venues', 'Stadiums and venues') + ' combine gate counting with zone occupancy and capacity alerts, permanently or temporarily for a single event.'),
        ('One platform for all of them', 'Whatever the mix, everything appears in one ' + L('platform', 'platform') + ' with consistent metrics, so a council can compare its libraries, parks and town centre side by side. Browse by sector on the ' + L('solutions', 'solutions page') + '.'),
    ], [R('solutions', 'Solutions by sector', 'Councils, universities and more'), R('platform', 'Platform', 'How it works'), R('realtime', 'Real time', 'Live occupancy'), R('privacy', 'Privacy by design', 'Anonymous counting')])
)
PLACES_FAQS = [
    ('What kinds of places can Place Performance measure?', 'Indoor places such as libraries, university buildings, shopping centres, offices and government buildings, and outdoor places such as streets, laneways, parks, foreshores, trails and event spaces.'),
    ('Are different sensors used indoors and outdoors?', 'Yes. Indoors, FootfallCam 3D people counters are typically used at entrances and over zones. Outdoors, sensors are chosen for each environment to count pedestrians, cyclists and vehicles.'),
    ('How is a sensor plan chosen for each place?', 'Every location starts with a site survey covering entrances, layout, ceiling heights, mounting options, power, connectivity and privacy needs. The sensor plan is then designed around the questions you want to answer.'),
    ('Can temporary counting be used for events?', 'Yes. Temporary deployments suit festivals, markets and short studies, alongside permanent installations for ongoing monitoring.'),
    ('Can one organisation measure several types of place?', 'Yes. All places appear in one platform with consistent metrics, so different kinds of site can be compared side by side.'),
]
page('places', 'Places we measure | Place Performance',
     'People counting for libraries, campuses, shopping centres, stadiums, streets, parks, office towers and government buildings across Australia.',
     places_hub, PLACES_FAQS, [('Home', ''), ('Places', 'places/')], nav_key='solutions')
