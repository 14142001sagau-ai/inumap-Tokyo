"""
boundary_points追加後のwalkスコア再計算（Overpass API不使用・既存stations.jsonデータ使用）
作業5・6用
"""
import json, math, sys, os
sys.path.insert(0, os.path.dirname(__file__))

# fetch_geojson.pyからLARGE_PARKS, WALK_STATION, STATION_OVERRIDE等をインポート
# 直接importするため、fetch_geojson.pyの実行可能部分をブロックする必要がある
# → 代わりに必要部分をここで再定義する

RADIUS = 1600

def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    p = math.pi / 180
    a = math.sin((lat2-lat1)*p/2)**2 + math.cos(lat1*p)*math.cos(lat2*p)*math.sin((lng2-lng1)*p/2)**2
    return R * 2 * math.asin(math.sqrt(a))

# fetch_geojson.pyをテキストとして読み込み、LARGE_PARKS, WALK_STATION, STATION_OVERRIDEを抽出
import importlib.util, types

# fetch_geojson.pyをモジュールとして読み込む（メイン処理を実行しないよう工夫）
src_path = os.path.join(os.path.dirname(__file__), 'fetch_geojson.py')
with open(src_path, encoding='utf-8') as f:
    src = f.read()

# メイン処理部分（stations = load_stations()以降）を削除してインポート
cut = src.find('\nstations = load_stations()')
if cut == -1:
    cut = src.find('\nresults = []')
trimmed = src[:cut]

mod = types.ModuleType('fetch_geojson_trimmed')
exec(compile(trimmed, src_path, 'exec'), mod.__dict__)

LARGE_PARKS = mod.LARGE_PARKS
WALK_STATION = mod.WALK_STATION
STATION_OVERRIDE = mod.STATION_OVERRIDE
WALK_BASE_DEFAULT = mod.WALK_BASE_DEFAULT
BIG_PARK_KEYWORDS = mod.BIG_PARK_KEYWORDS

def min_park_dist(st_lat, st_lng, p):
    points = list(p.get('boundary_points', []))
    points += list(p.get('entrances', []))
    points.append((p['lat'], p['lng']))
    return min(haversine(st_lat, st_lng, la, lo) for la, lo in points)

def calc_walk_score(fac, base, st_lat=None, st_lng=None, base_is_override=False):
    park_score   = min(len(fac['parks']) * 10, 50)
    dogrun_score = 40 if fac['dogruns'] else 0
    big_parks    = [p for p in fac['parks'] if any(k in p for k in BIG_PARK_KEYWORDS)]
    bonus        = min(len(big_parks) * 15, 30)
    if st_lat and st_lng:
        near_large = [p for p in LARGE_PARKS
                      if min_park_dist(st_lat, st_lng, p) <= 1600]
        if near_large:
            max_area = max(p['area'] for p in near_large)
            if max_area >= 100000: bonus = max(bonus, 30)
            elif max_area >= 30000: bonus = max(bonus, 20)
            elif max_area >= 10000: bonus = max(bonus, 10)
            if not fac['dogruns']:
                dogrun_parks = [p for p in near_large if 'ドッグ' in p['name'] or p.get('dogrun', False)]
                if dogrun_parks: dogrun_score = 40
    osm_score    = min(park_score + dogrun_score + bonus, 90)
    no_osm_data  = not fac['parks'] and not fac['dogruns'] and not (st_lat and any(
            min_park_dist(st_lat, st_lng, p) <= 1600 for p in LARGE_PARKS))
    if no_osm_data:
        return base
    if osm_score == 0:
        blended = base
    elif osm_score < base * 0.5:
        blended = round(osm_score * 0.4 + base * 0.6)
    else:
        blended = round(osm_score * 0.7 + base * 0.3)
    if base_is_override:
        return max(blended, base)
    return blended

# stations.json読み込み
with open('data/stations.json', encoding='utf-8') as f:
    stations = json.load(f)

changes = []
TARGET = {'高島平','西高島平','新高島平','成増','地下鉄成増',
          '沼袋','野方','新井薬師前',
          '中目黒','恵比寿','神泉',
          '高輪ゲートウェイ','泉岳寺',
          '外苑前','青山一丁目','表参道',
          '国会議事堂前','飯田橋','神楽坂',
          '早稲田','雑司ヶ谷','護国寺'}

target_results = {}

for st in stations:
    name = st['name']
    sid  = st['id']
    lat, lng = st['lat'], st['lng']
    old_walk = st.get('walk')
    if old_walk is None:
        continue

    fac = {
        'parks':   st.get('parks', []),
        'dogruns': st.get('dogruns', []),
        'vets':    st.get('vets', []),
        'vets_emergency': st.get('vets_emergency', []),
        'dog_cafes': st.get('dog_cafes', []),
        'groomings': st.get('groomings', []),
        'carshares': st.get('carshares', []),
        'car_rentals': st.get('car_rentals', []),
    }

    ov = STATION_OVERRIDE.get(sid, {})
    walk_base = ov.get('walk_base', WALK_STATION.get(name, WALK_BASE_DEFAULT))
    walk_is_override = 'walk_base' in ov
    new_walk = calc_walk_score(fac, walk_base, lat, lng, base_is_override=walk_is_override)

    if new_walk != old_walk:
        changes.append((name, old_walk, new_walk, sid))

    if name in TARGET:
        target_results[name] = (old_walk, new_walk)

print(f'\n=== walkスコア変化駅数: {len(changes)} ===\n')

print('=== 指定駅の変化前後 ===')
for t in ['高島平','西高島平','新高島平','成増','地下鉄成増',
          '沼袋','野方','新井薬師前',
          '中目黒','恵比寿','神泉',
          '高輪ゲートウェイ','泉岳寺',
          '外苑前','青山一丁目','表参道',
          '国会議事堂前','飯田橋','神楽坂',
          '早稲田','雑司ヶ谷','護国寺']:
    if t in target_results:
        old, new = target_results[t]
        mark = '★変化' if old != new else '  同値'
        print(f'{mark} {t}: {old} → {new}')
    else:
        print(f'  NOT FOUND: {t}')

print('\n=== 全変化駅一覧 ===')
for name, old, new, sid in sorted(changes, key=lambda x: x[0]):
    print(f'  {name}: {old} → {new}  (sid={sid})')

print('\n=== 作業5: STATION_OVERRIDE見直し候補 ===')
print('（自動計算値 >= OVERRIDE値になった駅）')
for name, old, new, sid in changes:
    ov = STATION_OVERRIDE.get(sid, {})
    if 'walk_base' in ov:
        ov_val = ov['walk_base']
        # 新しい計算値がOVERRIDE値と同等以上なら削除候補
        # ただし base_is_override=Falseで計算した場合の値と比較
        fac_st = next((s for s in stations if s['id'] == sid), None)
        if fac_st:
            fac = {
                'parks':   fac_st.get('parks', []),
                'dogruns': fac_st.get('dogruns', []),
                'vets':    [], 'vets_emergency': [], 'dog_cafes': [],
                'groomings': [], 'carshares': [], 'car_rentals': [],
            }
            walk_base_no_ov = WALK_STATION.get(name, WALK_BASE_DEFAULT)
            calc_no_ov = calc_walk_score(fac, walk_base_no_ov, fac_st['lat'], fac_st['lng'], base_is_override=False)
            if calc_no_ov >= ov_val:
                print(f'  削除候補: {name} (OVERRIDE={ov_val}, 自動計算={calc_no_ov}, sid={sid})')
