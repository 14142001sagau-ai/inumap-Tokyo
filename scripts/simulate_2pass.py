import sys
sys.stdout.reconfigure(encoding='utf-8')
import json

with open('C:/inumap-repo2/scripts/fetch_geojson.py', encoding='utf-8') as f:
    src = f.read()

lines = src.split('\n')
stop_idx = next(i for i, l in enumerate(lines) if l.strip() == 'stations = load_stations()')
exec_globals = {'__name__': '__simulation__'}
exec(compile('\n'.join(lines[:stop_idx]), 'fetch_geojson.py', 'exec'), exec_globals)
print("Definitions loaded OK")

load_stations            = exec_globals['load_stations']
get_nearby_parks         = exec_globals['get_nearby_parks']
calc_osm_score           = exec_globals['calc_osm_score']
_classify_park           = exec_globals['_classify_park']
_distance_factor         = exec_globals['_distance_factor']
_park_base_score         = exec_globals['_park_base_score']
min_dist_to_park         = exec_globals['min_dist_to_park']
get_river_bonus          = exec_globals['get_river_bonus']
NON_RESIDENTIAL_STATIONS = exec_globals['NON_RESIDENTIAL_STATIONS']
WALK_WARD_DEFAULT        = exec_globals['WALK_WARD_DEFAULT']
STATION_OVERRIDE         = exec_globals['STATION_OVERRIDE']
haversine                = exec_globals['haversine']
MIN_WALK                 = exec_globals['MIN_WALK']

stations = load_stations()
print(f"Stations loaded: {len(stations)}")

# Pass 1
osm_cache = {}
for st in stations:
    nearby = get_nearby_parks(st['lat'], st['lng'])
    osm_cache[st['id']] = calc_osm_score(nearby, st['lat'], st['lng'])
print(f"Pass1 complete: {len(osm_cache)} cached\n")

# Old scores
with open('C:/inumap-repo2/data/stations.json', encoding='utf-8') as f:
    old_data = json.load(f)
old_walk = {feat['id']: feat.get('walk', '?') for feat in old_data}

TARGETS = [
    '舎人公園', '西新井大師西', '光が丘', '代々木公園', '原宿',
    '芦花公園', '千歳烏山', '石神井公園', '大泉学園', '北千住', '駒沢大学',
]

for st in stations:
    if st['name'] not in TARGETS:
        continue
    sid  = st['id']
    ku   = st['ku']
    ov   = STATION_OVERRIDE.get(sid, {})
    osm  = osm_cache.get(sid, 0)
    walk_max = ov.get('walk_max', None)

    if osm > 0:
        walk = osm
    else:
        nearby_osm = [
            osm_cache[s['id']] for s in stations
            if s['id'] != sid
            and s['name'] not in NON_RESIDENTIAL_STATIONS
            and haversine(st['lat'], st['lng'], s['lat'], s['lng']) <= 2000
            and osm_cache.get(s['id'], 0) > 0
        ]
        base = round(sum(nearby_osm)/len(nearby_osm)) if nearby_osm else WALK_WARD_DEFAULT.get(ku, 40)
        walk = base
    walk = max(walk, MIN_WALK)
    if walk_max:
        walk = min(walk, walk_max)

    old_w = old_walk.get(sid, '?')
    diff  = (walk - old_w) if isinstance(old_w, int) else '?'
    diff_str = f"{diff:+d}" if isinstance(diff, int) else str(diff)

    print(f"=== {st['name']} ({ku}) osm={osm} walk={walk} 旧={old_w} ({diff_str}) ===")

    # 公園内訳
    nearby = get_nearby_parks(st['lat'], st['lng'])
    river  = get_river_bonus(st['lat'], st['lng'])
    if river:
        print(f"  [河川] +{river}pt (500m以内)")
    for p in nearby:
        dist = min_dist_to_park(p['name'], p['lat'], p['lng'], st['lat'], st['lng'])
        f    = _distance_factor(dist)
        cls  = _classify_park(p)
        if p.get('type') == 'greenway':
            if p['area'] >= 100000:   gw_base = 20
            elif p['area'] >= 10000:  gw_base = 8
            else: continue
            pts = round(gw_base * f)
            print(f"  [緑地] {p['name']:20} dist={dist:5.0f}m f={f:.2f} base={gw_base} pts={pts}")
        else:
            base_s = _park_base_score(p)
            pts = round(base_s * f)
            if pts == 0 and base_s == 0:
                continue
            dr = '★DR' if p['dogrun'] else ''
            print(f"  [{cls:14}] {p['name']:20} dist={dist:5.0f}m f={f:.2f} base={base_s} pts={pts} {dr}")
    print()
