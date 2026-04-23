import sys
sys.stdout.reconfigure(encoding='utf-8')
import json

with open('C:/inumap-repo2/scripts/fetch_geojson.py', encoding='utf-8') as f:
    src = f.read()
lines = src.split('\n')
stop_idx = next(i for i, l in enumerate(lines) if l.strip() == 'EXCLUDED_STATIONS = {\'赤塚\', \'赤堤\'}')
exec_globals = {'__name__': '__sim__'}
exec(compile('\n'.join(lines[:stop_idx]), 'fetch_geojson.py', 'exec'), exec_globals)

load_stations            = exec_globals['load_stations']
get_nearby_parks         = exec_globals['get_nearby_parks']
calc_osm_score           = exec_globals['calc_osm_score']
_classify_park           = exec_globals['_classify_park']
_distance_factor         = exec_globals['_distance_factor']
_park_base_score         = exec_globals['_park_base_score']
min_dist_to_park         = exec_globals['min_dist_to_park']
get_river_bonus          = exec_globals['get_river_bonus']
LARGE_RIVER_BONUS        = exec_globals['LARGE_RIVER_BONUS']
RIVER_DATA               = exec_globals['RIVER_DATA']
NON_RESIDENTIAL_STATIONS = exec_globals['NON_RESIDENTIAL_STATIONS']
haversine                = exec_globals['haversine']
PARKS_DATA               = exec_globals['PARKS_DATA']

stations = load_stations()
stations = [s for s in stations if s['name'] not in {'赤塚', '赤堤'}]

osm_cache = {}
for st in stations:
    nearby = get_nearby_parks(st['lat'], st['lng'])
    osm_cache[st['id']] = calc_osm_score(nearby, st['lat'], st['lng'])
print(f"Pass1 complete: {len(osm_cache)} cached\n")

with open('C:/inumap-repo2/data/stations.json', encoding='utf-8') as f:
    old_data = json.load(f)
old_walk = {d['id']: d.get('walk') for d in old_data}

def show_breakdown(name_list, title):
    print(f"{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")
    for st in stations:
        if st['name'] not in name_list:
            continue
        sid = st['id']
        osm = osm_cache.get(sid, 0)
        old_w = old_walk.get(sid, '?')
        river = get_river_bonus(st['lat'], st['lng'])
        print(f"\n--- {st['name']} ({st['ku']}) osm={osm} 旧walk={old_w} river={river} ---")
        nearby = get_nearby_parks(st['lat'], st['lng'])
        for p in nearby:
            dist = min_dist_to_park(p['name'], p['lat'], p['lng'], st['lat'], st['lng'])
            f    = _distance_factor(dist)
            cls  = _classify_park(p)
            if p.get('type') == 'greenway':
                if p['area'] >= 100000:   gw_base = 20
                elif p['area'] >= 10000:  gw_base = 8
                else: continue
                pts = round(gw_base * f)
                if pts == 0: continue
                print(f"  [緑地] {p['name']:20} {dist:5.0f}m f={f:.2f} pts={pts}")
            else:
                base_s = _park_base_score(p)
                pts = round(base_s * f)
                if pts == 0 and base_s == 0: continue
                dr = '★DR' if p['dogrun'] else ''
                print(f"  [{cls:14}] {p['name']:20} {dist:5.0f}m f={f:.2f} base={base_s} pts={pts} {dr}")

# 作業4: 江東区エリア
show_breakdown(
    {'木場','東陽町','門前仲町','越中島','清澄白河','森下','菊川','住吉','大島','東大島'},
    "作業4: 江東区エリア walk内訳"
)

# 作業6: 三軒茶屋
show_breakdown({'三軒茶屋'}, "作業6: 三軒茶屋 walk内訳")

# 作業8: 小岩・江戸川 → 篠崎公園距離
print(f"\n{'='*60}")
print(" 作業8: 小岩・江戸川 → 篠崎公園 距離確認")
print(f"{'='*60}")
# 篠崎公園を探す
shinozaki = next((p for p in PARKS_DATA if '篠崎' in p['name'] and p['area'] > 100000), None)
if not shinozaki:
    shinozaki = next((p for p in PARKS_DATA if '篠崎' in p['name']), None)
print(f"篠崎公園: {shinozaki['name'] if shinozaki else 'NOT FOUND'} lat={shinozaki['lat'] if shinozaki else '-'} lng={shinozaki['lng'] if shinozaki else '-'} area={shinozaki['area'] if shinozaki else '-'}")
for st in stations:
    if st['name'] in {'小岩', '江戸川'}:
        if shinozaki:
            dist = min_dist_to_park(shinozaki['name'], shinozaki['lat'], shinozaki['lng'], st['lat'], st['lng'])
            f = _distance_factor(dist)
        else:
            dist, f = None, None
        print(f"  {st['name']:8} → 篠崎公園 dist={dist:.0f}m f={f:.2f}" if dist else f"  {st['name']} → 公園未検出")
