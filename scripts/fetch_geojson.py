import requests, json, os, time, openpyxl

OVERPASS = 'https://overpass-api.de/api/interpreter'
EXCEL = 'data/master.xlsx'
RADIUS = 1300

# ============================================================
# 固定スコア値
# ============================================================

HOUSING = {
    'nishikasai':68,'kasai':65,'kasairinkai':46,'funabori':65,
    'ichinoe':69,'mizue':64,'shinozaki':67,'koiwa':53,
    'shinkoiwa':56,'hirai':58,'edogawa':55,'keiseikoiwa':72
}
SAFETY = {
    'nishikasai':59,'kasai':64,'kasairinkai':74,'funabori':70,
    'ichinoe':80,'mizue':70,'shinozaki':77,'koiwa':55,
    'shinkoiwa':64,'hirai':67,'edogawa':75,'keiseikoiwa':73
}
COMMUNITY = {
    'nishikasai':71,'kasai':69,'kasairinkai':65,'funabori':67,
    'ichinoe':69,'mizue':70,'shinozaki':79,'koiwa':70,
    'shinkoiwa':68,'hirai':72,'edogawa':68,'keiseikoiwa':67
}

# WALK旧手動値（加重平均のベースに使用）
WALK_BASE = {
    'nishikasai':80,'kasai':80,'kasairinkai':80,'funabori':80,
    'ichinoe':40,'mizue':80,'shinozaki':80,'koiwa':40,
    'shinkoiwa':80,'hirai':80,'edogawa':40,'keiseikoiwa':80
}

# MEDICAL旧手動値（加重平均のベースに使用）
MEDICAL_BASE = {
    'nishikasai':78,'kasai':90,'kasairinkai':30,'funabori':78,
    'ichinoe':30,'mizue':66,'shinozaki':66,'koiwa':30,
    'shinkoiwa':81,'hirai':69,'edogawa':30,'keiseikoiwa':95
}

# ============================================================
# カーシェアステーション緯度経度リスト（月次更新）
# (サービス名, 緯度, 経度, 犬OK)
# 犬OK: MaaS Car=✅, EARTH CAR=✅, EveryGo=✅, その他=❌
# 出典: 各公式サイト・住所→国土地理院API変換
# 更新日: 2025年取得
# ============================================================
CARSHARE_STATIONS = [
    # --- MaaS Car（犬OK・ケージ持参）---
    ('MaaS Car', 35.693058, 139.893829, True),   # Dパーキング瑞江4丁目第2
    ('MaaS Car', 35.683475, 139.865875, True),   # Dパーキング船堀4丁目第1
    ('MaaS Car', 35.684795, 139.862701, True),   # イオンフードスタイル船堀店 屋上階
    ('MaaS Car', 35.669868, 139.858429, True),   # イオン葛西店 立体駐車場M5F
    ('MaaS Car', 35.711773, 139.864899, True),   # クレスト江戸川中央第3
    ('MaaS Car', 35.707924, 139.908157, True),   # 篠崎町2丁目
    # --- EARTH CAR（犬NG・一般カーシェアとしてOSMで自動取得）---
    # ('EARTH CAR', 35.670399, 139.879639, False),  # OSMで取得されるため手動リスト不要
    # ('EARTH CAR', 35.682373, 139.866043, False),
    # --- EveryGo（江戸川区は現時点でなし・23区拡大時に追加）---
    # --- 以下は犬NG（生活利便性として小さく加算）---
    # タイムズ・dカーシェア・三井・オリックス等326+112+73+36+1+1件は
    # fetch_geojson.pyのOSMクエリ（amenity=car_sharing）で自動取得するため
    # ここには記載しない
]

def haversine(lat1, lng1, lat2, lng2):
    import math
    R = 6371000
    p = math.pi / 180
    a = math.sin((lat2-lat1)*p/2)**2 + math.cos(lat1*p)*math.cos(lat2*p)*math.sin((lng2-lng1)*p/2)**2
    return R * 2 * math.asin(math.sqrt(a))

# 月極駐車場料金スコア（地価から推定・高地価=高料金=低スコア・反転済み）
PARKING_SCORE = {
    'nishikasai':52,'kasai':48,'kasairinkai':60,'funabori':54,
    'ichinoe':68,'mizue':66,'shinozaki':70,'koiwa':44,
    'shinkoiwa':44,'hirai':42,'edogawa':64,'keiseikoiwa':72
}

NAME_TO_ID = {
    '西葛西':'nishikasai','葛西':'kasai','葛西臨海公園':'kasairinkai',
    '船堀':'funabori','一之江':'ichinoe','瑞江':'mizue','篠崎':'shinozaki',
    '小岩':'koiwa','新小岩':'shinkoiwa','平井':'hirai',
    '江戸川':'edogawa','京成小岩':'keiseikoiwa'
}

def load_stations():
    wb = openpyxl.load_workbook(EXCEL)
    results = []
    for ws in wb.worksheets:
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row[0]: continue
            ku, name, line, lat, lng, fl = row[0],row[1],row[2],row[3],row[4],row[5]
            sid = NAME_TO_ID.get(name, name)
            results.append({'id':sid,'name':name,'line':line,'lat':lat,'lng':lng,'fl':fl,'ku':ku})
    return results

def get_fac(lat, lng):
    a = str(RADIUS)
    c = str(lat) + ',' + str(lng)
    q = (
        '[out:json][timeout:60];('
        'node[leisure=park](around:'+a+','+c+');'
        'way[leisure=park](around:'+a+','+c+');'
        'node[leisure=dog_park](around:'+a+','+c+');'
        'way[leisure=dog_park](around:'+a+','+c+');'
        'node[amenity=veterinary](around:'+a+','+c+');'
        'node[shop=pet](around:'+a+','+c+');'
        'node[shop=pet_grooming](around:'+a+','+c+');'
        'node[shop=grooming](around:'+a+','+c+');'
        'node[amenity=animal_boarding](around:'+a+','+c+');'
        'node[shop=pet][boarding=yes](around:'+a+','+c+');'
        'node[amenity=cafe][dogs=yes](around:'+a+','+c+');'
        'node[amenity=cafe][dog=yes](around:'+a+','+c+');'
        'node[amenity=restaurant][dogs=yes](around:'+a+','+c+');'
        'node[amenity=restaurant][dog=yes](around:'+a+','+c+');'
        'node[amenity=car_sharing](around:'+a+','+c+');'
        'node[amenity=car_rental](around:'+a+','+c+');'
        ');out center;'
    )
    try:
        r = requests.post(OVERPASS, data={'data': q}, timeout=60)
        els = r.json().get('elements', [])
        parks, vets, vets_emergency, dogruns = [], [], [], []
        pets, groomings, dog_cafes = [], [], []
        carshares, car_rentals = [], []
        for el in els:
            tags = el.get('tags', {})
            n = tags.get('name', '')
            if not n: continue
            leisure = tags.get('leisure', '')
            amenity = tags.get('amenity', '')
            shop    = tags.get('shop', '')
            dogs    = tags.get('dogs', tags.get('dog', ''))
            hours   = tags.get('opening_hours', '')
            emerg   = tags.get('emergency', '')
            if leisure == 'park': parks.append(n)
            elif leisure == 'dog_park': dogruns.append(n)
            elif amenity == 'veterinary':
                vets.append(n)
                if '24/7' in hours or 'emergency' in emerg or '夜間' in n or '救急' in n or '24時間' in n:
                    vets_emergency.append(n)
            elif shop == 'pet': pets.append(n)
            elif shop in ('pet_grooming','grooming') or amenity == 'animal_boarding' or (shop=='pet' and tags.get('boarding')=='yes'):
                groomings.append(n)
            elif amenity in ('cafe','restaurant') and dogs in ('yes','permitted','leashed'):
                dog_cafes.append(n)
            elif amenity == 'car_sharing': carshares.append(n)
            elif amenity == 'car_rental':  car_rentals.append(n)
        return {
            'parks':parks[:5],'dogruns':dogruns[:3],'vets':vets[:5],
            'vets_emergency':vets_emergency[:2],'pets':pets[:3],
            'groomings':groomings[:3],'dog_cafes':dog_cafes[:3],
            'carshares':carshares[:3],'car_rentals':car_rentals[:3],
        }
    except Exception as e:
        print(f'  OSMエラー: {e}')
        return {'parks':[],'dogruns':[],'vets':[],'vets_emergency':[],
                'pets':[],'groomings':[],'dog_cafes':[],'carshares':[],'car_rentals':[]}

def calc_walk_score(fac, base):
    """
    WALKスコア動的計算
    公園数(40%) + ドッグラン有無(30%) + 大型公園ボーナス(30%)
    旧手動値(30%)と加重平均してならす
    """
    park_score  = min(len(fac['parks']) * 10, 50)       # 公園1件=10点、最大50
    dogrun_score= 40 if fac['dogruns'] else 0            # ドッグランあり=40点
    # 大型公園ボーナス：江戸川区の主要大型公園名で判定
    BIG_PARK_KEYWORDS = [
        '臨海公園','総合レクリエーション','行船公園','宇喜田公園',
        '篠崎公園','大島小松川','新左近川','小岩公園','親水公園','河川敷'
    ]
    big_parks = [p for p in fac['parks'] if any(k in p for k in BIG_PARK_KEYWORDS)]
    bonus = min(len(big_parks) * 15, 30)
    osm_score = min(park_score + dogrun_score + bonus, 90)
    # OSMデータなし時はベース値のみ
    if not fac['parks'] and not fac['dogruns']:
        return base
    # 加重平均（OSM70% + 旧手動30%）
    return round(osm_score * 0.7 + base * 0.3)

def calc_medical_score(fac, base):
    """
    MEDICALスコア動的計算
    動物病院数(40%) + 夜間救急(25%) + 犬OKカフェ(20%) + トリミング(15%)
    旧手動値(30%)と加重平均してならす
    """
    vet_score   = min(len(fac['vets']) * 15, 60)
    emerg_score = 30 if fac['vets_emergency'] else 0
    cafe_score  = min(len(fac['dog_cafes']) * 8, 24)
    groom_score = min(len(fac['groomings']) * 5, 15)
    pet_score   = min(len(fac['pets']) * 5, 10)
    osm_raw = vet_score + emerg_score + cafe_score + groom_score + pet_score
    osm_score = round(30 + (osm_raw / 139) * 60)
    if len(fac['vets']) == 0 and len(fac['dog_cafes']) == 0:
        return base
    # 加重平均（OSM70% + 旧手動30%）で極端な値をならす
    return max(30, min(90, round(osm_score * 0.7 + base * 0.3)))

def calc_mobility_score(fac, sid, st_lat, st_lng):
    """
    MOBILITYスコア（緯度経度ベース）
    犬OK(MaaS Car/EveryGo/EARTH CAR): 10点/件 最大20点
    一般カーシェア(タイムズ等OSM):     4点/件 最大20点
    レンタカー:                        7点/件 最大14点
    駐車料金スコア(反転済み):          ×0.3
    """
    # 緯度経度リストから犬OKカーシェア数を集計
    pet_ok = sum(1 for _, la, lo, ok in CARSHARE_STATIONS
                 if ok and haversine(st_lat, st_lng, la, lo) <= 1300)
    pet_cs_score = min(pet_ok * 10, 20)
    # OSMの一般カーシェア（タイムズ等）
    gen_cs_score = min(len(fac['carshares']) * 4, 20)
    # レンタカー
    rental_score = min(len(fac['car_rentals']) * 7, 14)
    # 駐車料金
    park_contrib = PARKING_SCORE.get(sid, 55) * 0.3
    raw = pet_cs_score + gen_cs_score + rental_score + park_contrib
    normalized = round(30 + (raw / 73) * 50)
    return max(30, min(80, normalized))

# ============================================================
# メイン処理
# ============================================================
stations = load_stations()
print(f'読み込み完了: {len(stations)}駅')

results = []
for st in stations:
    print(f'📍 {st["name"]}')
    fac = get_fac(st['lat'], st['lng'])
    time.sleep(1.5)
    sid = st['id']
    walk = calc_walk_score(fac, WALK_BASE.get(sid, 60))
    med  = calc_medical_score(fac, MEDICAL_BASE.get(sid, 50))
    mob  = calc_mobility_score(fac, sid, st['lat'], st['lng'])
    results.append({
        'id':sid,'name':st['name'],'line':st['line'],
        'lat':st['lat'],'lng':st['lng'],
        'walk':walk,'housing':HOUSING.get(sid,65),
        'medical':med,'mobility':mob,
        'community':COMMUNITY.get(sid,68),
        'safety':SAFETY.get(sid,70),
        'fl':st['fl'],
        'parks':fac['parks'],'dogruns':fac['dogruns'],
        'vets':fac['vets'],'vets_emergency':fac['vets_emergency'],
        'groomings':fac['groomings'],'dog_cafes':fac['dog_cafes'],
        'carshares':fac['carshares'],'car_rentals':fac['car_rentals'],
    })

os.makedirs('data', exist_ok=True)
with open('data/stations.json','w',encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f'✅ {len(results)}駅保存完了')
