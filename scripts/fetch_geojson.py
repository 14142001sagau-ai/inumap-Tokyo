import requests, json, os, time, math, openpyxl

OVERPASS = 'https://overpass-api.de/api/interpreter'
EXCEL = 'data/master.xlsx'
RADIUS = 1300

# ============================================================
# 固定スコア値（実データ反映済み）
# ============================================================

# HOUSING = ペット可10% + 賃料20%(R7地価公示・反転) + 治安30% + 商業40%
HOUSING = {
    'nishikasai':68,'kasai':65,'kasairinkai':46,'funabori':65,
    'ichinoe':69,'mizue':64,'shinozaki':67,'koiwa':53,
    'shinkoiwa':56,'hirai':58,'edogawa':55,'keiseikoiwa':72
}

# SAFETY = 凶悪犯x3 + 粗暴犯x2 + 侵入窃盗x1 + 軽犯罪x0.5（R6警視庁実データ・反転）
SAFETY = {
    'nishikasai':59,'kasai':64,'kasairinkai':74,'funabori':70,
    'ichinoe':80,'mizue':70,'shinozaki':77,'koiwa':55,
    'shinkoiwa':64,'hirai':67,'edogawa':75,'keiseikoiwa':73
}

# COMMUNITY = 手動推定値（Phase2 Step3で更新予定）
COMMUNITY = {
    'nishikasai':71,'kasai':69,'kasairinkai':65,'funabori':67,
    'ichinoe':69,'mizue':70,'shinozaki':79,'koiwa':70,
    'shinkoiwa':68,'hirai':72,'edogawa':68,'keiseikoiwa':67
}

# WALK = 公園・散歩環境スコア（固定値）
WALK = {
    'nishikasai':80,'kasai':80,'kasairinkai':80,'funabori':80,
    'ichinoe':40,'mizue':80,'shinozaki':80,'koiwa':40,
    'shinkoiwa':80,'hirai':80,'edogawa':40,'keiseikoiwa':80
}

# MOBILITY ベース値（OSMデータなし時のフォールバック）
MOBILITY_BASE = {
    'nishikasai':50,'kasai':60,'kasairinkai':50,'funabori':50,
    'ichinoe':50,'mizue':50,'shinozaki':50,'koiwa':50,
    'shinkoiwa':50,'hirai':50,'edogawa':50,'keiseikoiwa':50
}

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
            ku, name, line, lat, lng, fl = row[0], row[1], row[2], row[3], row[4], row[5]
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
            elif shop in ('pet_grooming', 'grooming'): groomings.append(n)
            elif amenity in ('cafe','restaurant') and dogs in ('yes','permitted','leashed'):
                dog_cafes.append(n)
            elif amenity == 'car_sharing': carshares.append(n)
            elif amenity == 'car_rental': car_rentals.append(n)
        return {
            'parks':parks[:5],'dogruns':dogruns[:3],'vets':vets[:5],
            'vets_emergency':vets_emergency[:2],'pets':pets[:3],
            'groomings':groomings[:3],'dog_cafes':dog_cafes[:3],
            'carshares':carshares[:3],'car_rentals':car_rentals[:3]
        }
    except Exception as e:
        print(f'  OSMエラー: {e}')
        return {'parks':[],'dogruns':[],'vets':[],'vets_emergency':[],
                'pets':[],'groomings':[],'dog_cafes':[],'carshares':[],'car_rentals':[]}

def calc_medical_score(fac, base):
    """
    MEDICALスコア動的計算
    動物病院数40% + 夜間救急25% + 犬OKカフェ20% + トリミング15%
    """
    vet_score   = min(len(fac['vets']) * 15, 60)
    emerg_score = 30 if fac['vets_emergency'] else 0
    cafe_score  = min(len(fac['dog_cafes']) * 8, 24)
    groom_score = min(len(fac['groomings']) * 5, 15)
    pet_score   = min(len(fac['pets']) * 5, 10)
    raw = vet_score + emerg_score + cafe_score + groom_score + pet_score
    normalized = round(30 + (raw / 139) * 60)
    if len(fac['vets']) == 0 and len(fac['dog_cafes']) == 0:
        return base  # OSMデータなし時はベース値
    return max(30, min(90, normalized))

def calc_mobility_score(fac, base, parking):
    """
    MOBILITYスコア動的計算
    カーシェア40% + レンタカー30% + 駐車料金スコア（反転済み）30%
    """
    cs_score     = min(len(fac['carshares']) * 12, 48)
    rental_score = min(len(fac['car_rentals']) * 15, 30)
    park_contrib = parking * 0.3
    raw = cs_score + rental_score + park_contrib
    normalized = round(30 + (raw / 100) * 50)
    if len(fac['carshares']) == 0 and len(fac['car_rentals']) == 0:
        return base
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
    med = calc_medical_score(fac, MOBILITY_BASE.get(sid, 50))
    mob = calc_mobility_score(fac, MOBILITY_BASE.get(sid, 50), PARKING_SCORE.get(sid, 50))
    results.append({
        'id': sid, 'name': st['name'], 'line': st['line'],
        'lat': st['lat'], 'lng': st['lng'],
        'walk':     WALK.get(sid, 40),
        'housing':  HOUSING.get(sid, 65),
        'medical':  med,
        'mobility': mob,
        'community':COMMUNITY.get(sid, 68),
        'safety':   SAFETY.get(sid, 70),
        'fl': st['fl'],
        'parks':         fac['parks'],
        'dogruns':       fac['dogruns'],
        'vets':          fac['vets'],
        'vets_emergency':fac['vets_emergency'],
        'groomings':     fac['groomings'],
        'dog_cafes':     fac['dog_cafes'],
        'carshares':     fac['carshares'],
        'car_rentals':   fac['car_rentals'],
    })

os.makedirs('data', exist_ok=True)
with open('data/stations.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f'✅ {len(results)}駅保存完了')
