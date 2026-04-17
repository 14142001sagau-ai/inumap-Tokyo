#!/usr/bin/env python3
"""Walk score analysis: near-pair anomalies + LARGE_PARKS inversion check"""
import json, math

def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    p = math.pi / 180
    a = math.sin((lat2-lat1)*p/2)**2 + math.cos(lat1*p)*math.cos(lat2*p)*math.sin((lng2-lng1)*p/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def min_park_dist(st_lat, st_lng, p):
    entrances = p.get('entrances', [])
    if entrances:
        return min(haversine(st_lat, st_lng, la, lo) for la, lo in entrances)
    return haversine(st_lat, st_lng, p['lat'], p['lng'])

LARGE_PARKS = [
    {'name':'駒沢オリンピック公園','lat':35.6242,'lng':139.6602,'area':413573},
    {'name':'林試の森公園','lat':35.6252,'lng':139.7015,'area':120763},
    {'name':'大島小松川公園','lat':35.6921,'lng':139.8501,'area':249283},
    {'name':'明治公園','lat':35.6760,'lng':139.7130,'area':57309},
    {'name':'日比谷公園','lat':35.6738,'lng':139.7560,'area':161637},
    {'name':'浜離宮恩賜庭園','lat':35.6627,'lng':139.7632,'area':250216},
    {'name':'芝公園','lat':35.6551,'lng':139.7478,'area':136023},
    {'name':'旧芝離宮恩賜庭園','lat':35.6549,'lng':139.7594,'area':43175},
    {'name':'台場公園','lat':35.6336,'lng':139.7720,'area':29963},
    {'name':'青山公園','lat':35.6637,'lng':139.7247,'area':38465},
    {'name':'戸山公園','lat':35.7043,'lng':139.7135,'area':186807},
    {'name':'小石川後楽園','lat':35.7055,'lng':139.7496,'area':70847},
    {'name':'六義園','lat':35.7323,'lng':139.7463,'area':87809},
    {'name':'上野恩賜公園','lat':35.7138,'lng':139.7742,'area':538507},
    {'name':'旧岩崎邸庭園','lat':35.7095,'lng':139.7674,'area':18235},
    {'name':'横網町公園','lat':35.6994,'lng':139.7964,'area':19580},
    {'name':'向島百花園','lat':35.7231,'lng':139.8155,'area':10886},
    {'name':'東白鬚公園','lat':35.7331,'lng':139.8145,'area':103128},
    {'name':'猿江恩賜公園','lat':35.6907,'lng':139.8191,'area':145088},
    {'name':'清澄庭園','lat':35.6801,'lng':139.7965,'area':81091},
    {'name':'夢の島公園','lat':35.6497,'lng':139.8233,'area':433212},
    {'name':'木場公園','lat':35.6773,'lng':139.8086,'area':241603},
    {'name':'潮風公園','lat':35.6239,'lng':139.7688,'area':154940},
    {'name':'蘆花恒春園','lat':35.6616,'lng':139.6124,'area':80304},
    {'name':'亀戸中央公園','lat':35.7010,'lng':139.8362,'area':103027},
    {'name':'砧公園','lat':35.6291,'lng':139.6216,'area':391777},
    {'name':'祖師谷公園','lat':35.6540,'lng':139.5989,'area':88694},
    {'name':'光が丘公園','lat':35.7631,'lng':139.6284,'area':607824},
    {'name':'浮間公園','lat':35.7944,'lng':139.6926,'area':117330},
    {'name':'城北中央公園','lat':35.7568,'lng':139.6728,'area':260338},
    {'name':'代々木公園','lat':35.6719,'lng':139.6918,'area':540529,
     'entrances':[(35.6715,139.6993),(35.6804,139.6970)]},
    {'name':'明治神宮','lat':35.6763,'lng':139.6993,'area':720000,
     'entrances':[(35.6763,139.6993),(35.6830,139.6986)]},
    {'name':'新宿御苑','lat':35.6850,'lng':139.7101,'area':580000,
     'entrances':[(35.6863,139.7101),(35.6837,139.7156)]},
    {'name':'善福寺公園','lat':35.7149,'lng':139.5905,'area':78622},
    {'name':'善福寺川緑地','lat':35.6951,'lng':139.6327,'area':184083},
    {'name':'和田堀公園','lat':35.6843,'lng':139.6414,'area':227510},
    {'name':'旧古河庭園','lat':35.7425,'lng':139.7463,'area':30781},
    {'name':'尾久の原公園','lat':35.7515,'lng':139.7757,'area':61841},
    {'name':'汐入公園','lat':35.7366,'lng':139.8096,'area':129034},
    {'name':'赤塚公園','lat':35.7847,'lng':139.6566,'area':254185},
    {'name':'石神井公園','lat':35.7389,'lng':139.5977,'area':201375},
    {'name':'大泉中央公園','lat':35.7748,'lng':139.5976,'area':103000},
    {'name':'東綾瀬公園','lat':35.7703,'lng':139.8321,'area':158970},
    {'name':'舎人公園','lat':35.7970,'lng':139.7683,'area':612717},
    {'name':'中川公園','lat':35.7758,'lng':139.8455,'area':120699},
    {'name':'水元公園','lat':35.7851,'lng':139.8695,'area':878996},
    {'name':'篠崎公園','lat':35.7157,'lng':139.8992,'area':299371},
    {'name':'葛西臨海公園','lat':35.6425,'lng':139.8599,'area':805861},
    {'name':'宇喜田公園','lat':35.6743,'lng':139.8606,'area':58227},
    {'name':'清水谷公園','lat':35.6815,'lng':139.7359,'area':10701},
    {'name':'千鳥ヶ淵公園','lat':35.6843,'lng':139.7446,'area':15845},
    {'name':'外濠公園','lat':35.6944,'lng':139.7394,'area':38794},
    {'name':'築地公園','lat':35.6680,'lng':139.7749,'area':14039},
    {'name':'新月島公園','lat':35.6594,'lng':139.7872,'area':18949},
    {'name':'あかつき公園','lat':35.6663,'lng':139.7765,'area':12174},
    {'name':'石川島公園','lat':35.6712,'lng':139.7859,'area':32433},
    {'name':'隅田川公園','lat':35.6883,'lng':139.7890,'area':46899},
    {'name':'佃・新川公園','lat':35.6758,'lng':139.7861,'area':27314},
    {'name':'豊海運動公園','lat':35.6533,'lng':139.7719,'area':19549},
    {'name':'有栖川宮記念公園','lat':35.6523,'lng':139.7258,'area':67131},
    {'name':'檜町公園','lat':35.6669,'lng':139.7313,'area':16370},
    {'name':'港南緑水公園','lat':35.6282,'lng':139.7514,'area':19859},
    {'name':'お台場レインボー公園','lat':35.6329,'lng':139.7781,'area':11000},
    {'name':'西戸山公園','lat':35.7076,'lng':139.7010,'area':22430},
    {'name':'西落合公園','lat':35.7196,'lng':139.6773,'area':11560},
    {'name':'新宿中央公園','lat':35.6888,'lng':139.6893,'area':88066},
    {'name':'おとめ山公園','lat':35.7177,'lng':139.7017,'area':15054},
    {'name':'甘泉園公園','lat':35.7114,'lng':139.7159,'area':14235},
    {'name':'落合中央公園','lat':35.7128,'lng':139.6932,'area':21073},
    {'name':'大塚公園','lat':35.7239,'lng':139.7318,'area':15377},
    {'name':'江戸川公園','lat':35.7105,'lng':139.7270,'area':13204},
    {'name':'新江戸川公園','lat':35.7129,'lng':139.7228,'area':18547},
    {'name':'六義公園','lat':35.7331,'lng':139.7465,'area':12188},
    {'name':'教育の森公園','lat':35.7199,'lng':139.7363,'area':21171},
    {'name':'目白台運動公園','lat':35.7153,'lng':139.7218,'area':30381},
    {'name':'隅田公園','lat':35.7159,'lng':139.8036,'area':106615},
    {'name':'旧安田庭園','lat':35.6982,'lng':139.7937,'area':14242},
    {'name':'錦糸公園','lat':35.6990,'lng':139.8164,'area':56124},
    {'name':'銅像堀公園','lat':35.7213,'lng':139.8100,'area':12702},
    {'name':'隅田川緑道','lat':35.7040,'lng':139.7960,'area':23182},
    {'name':'堤通公園','lat':35.7239,'lng':139.8108,'area':13586},
    {'name':'荒川四ツ木橋緑地','lat':35.7340,'lng':139.8244,'area':107001},
    {'name':'大横川親水公園','lat':35.7083,'lng':139.8074,'area':63344},
    {'name':'竪川親水公園','lat':35.6933,'lng':139.8159,'area':12300},
    {'name':'東墨田公園','lat':35.7194,'lng':139.8351,'area':12528},
    {'name':'深川','lat':35.6729,'lng':139.7973,'area':16740},
    {'name':'古石場川親水','lat':35.6676,'lng':139.7993,'area':16362},
    {'name':'越中島','lat':35.6707,'lng':139.7889,'area':16346},
    {'name':'豊洲','lat':35.6535,'lng':139.7925,'area':24303},
    {'name':'豊洲三丁目','lat':35.6584,'lng':139.7961,'area':10000},
    {'name':'豊洲六丁目','lat':35.6464,'lng':139.7911,'area':16190},
    {'name':'東雲水辺','lat':35.6469,'lng':139.8054,'area':16881},
    {'name':'潮見運動','lat':35.6559,'lng':139.8099,'area':40081},
    {'name':'横十間川親水','lat':35.6771,'lng':139.8204,'area':50583},
    {'name':'木場親水','lat':35.6747,'lng':139.8060,'area':18912},
    {'name':'豊住','lat':35.6745,'lng':139.8113,'area':19338},
    {'name':'竪川河川敷','lat':35.6935,'lng':139.8263,'area':52834},
    {'name':'仙台堀川','lat':35.6853,'lng':139.8391,'area':103850},
    {'name':'城東','lat':35.6783,'lng':139.8382,'area':10054},
    {'name':'荒川・砂町水辺','lat':35.6810,'lng':139.8447,'area':82635},
    {'name':'南砂緑道','lat':35.6731,'lng':139.8211,'area':12691},
    {'name':'南砂三丁目','lat':35.6684,'lng':139.8325,'area':38646},
    {'name':'若洲','lat':35.6189,'lng':139.8339,'area':89683},
    {'name':'戸越公園','lat':35.6102,'lng':139.7214,'area':18255},
    {'name':'大井水神公園','lat':35.5926,'lng':139.7309,'area':12856},
    {'name':'天王洲公園','lat':35.6202,'lng':139.7501,'area':30042},
    {'name':'鮫洲運動公園','lat':35.6058,'lng':139.7445,'area':14191},
    {'name':'西大井広場公園','lat':35.6020,'lng':139.7232,'area':13457},
    {'name':'しながわ区民公園','lat':35.5896,'lng':139.7383,'area':127419},
    {'name':'八潮公園','lat':35.6007,'lng':139.7526,'area':24918},
    {'name':'しおじ公園','lat':35.5965,'lng':139.7493,'area':10233},
    {'name':'東品川海上公園','lat':35.6175,'lng':139.7497,'area':19477},
    {'name':'しながわ中央公園','lat':35.6096,'lng':139.7280,'area':21083},
    {'name':'駒場野公園','lat':35.6581,'lng':139.6802,'area':39025},
    {'name':'駒場公園','lat':35.6616,'lng':139.6803,'area':40396},
]

# Compute bonus a park gives
def park_bonus(area):
    if area >= 100000: return 30
    if area >= 30000:  return 20
    if area >= 10000:  return 10
    return 0

# Compute the LARGE_PARKS-based bonus for a station
def compute_park_bonus_for_station(lat, lng):
    best = 0
    matched = []
    for p in LARGE_PARKS:
        d = min_park_dist(lat, lng, p)
        if d <= 1600:
            b = park_bonus(p['area'])
            if b > best:
                best = b
            matched.append((p['name'], int(d), b))
    return best, matched

with open('C:/inumap-repo2/data/stations.json', encoding='utf-8') as f:
    stations = json.load(f)

# Filter to scored-only stations
scored = [s for s in stations if s.get('walk') is not None]
print(f"Total stations: {len(stations)}, scored: {len(scored)}\n")

# ── 作業1: Near pairs (≤800m, walk diff ≥15) ──────────────────────────────
print("="*70)
print("【作業1】近接駅ペア（800m以内・walkスコア差15以上）")
print("="*70)

pairs = []
for i in range(len(scored)):
    for j in range(i+1, len(scored)):
        a, b = scored[i], scored[j]
        d = haversine(a['lat'], a['lng'], b['lat'], b['lng'])
        if d > 800:
            continue
        diff = abs(a['walk'] - b['walk'])
        if diff >= 15:
            pairs.append((diff, int(d), a, b))

pairs.sort(key=lambda x: -x[0])

print(f"検出数: {len(pairs)}件\n")
print(f"{'差':>3}  {'距離':>5}  {'高スコア駅':20}  walk  {'低スコア駅':20}  walk")
print("-"*70)
for diff, dist, a, b in pairs:
    hi, lo = (a, b) if a['walk'] > b['walk'] else (b, a)
    print(f" {diff:>2}  {dist:>4}m  {hi['name']:20s}  {hi['walk']:>4}  {lo['name']:20s}  {lo['walk']:>4}")

# ── 作業2: LARGE_PARKS逆転チェック ──────────────────────────────────────────
print()
print("="*70)
print("【作業2】LARGE_PARKS逆転チェック（公園に近いのにスコアが低い）")
print("="*70)

# For each large park (with significant bonus potential), find stations within 2000m
# and check if distance-ordering is violated
INVERSION_THRESHOLD = 15   # minimum walk diff to flag
inversions = []

# Only check parks that actually give a bonus
bonus_parks = [p for p in LARGE_PARKS if park_bonus(p['area']) > 0]

for park in bonus_parks:
    # Find all scored stations within 2000m
    nearby = []
    for s in scored:
        d = min_park_dist(s['lat'], s['lng'], park)
        if d <= 2000:
            nearby.append((d, s))
    if len(nearby) < 2:
        continue
    nearby.sort(key=lambda x: x[0])

    # Check all pairs: if closer station has much lower score → inversion
    for i in range(len(nearby)):
        di, si = nearby[i]
        for j in range(i+1, len(nearby)):
            dj, sj = nearby[j]
            # sj is farther but has higher walk score
            walk_diff = sj['walk'] - si['walk']
            if walk_diff >= INVERSION_THRESHOLD:
                inversions.append({
                    'park': park['name'],
                    'park_bonus': park_bonus(park['area']),
                    'near_name': si['name'],
                    'near_id': si['id'],
                    'near_dist': int(di),
                    'near_walk': si['walk'],
                    'far_name': sj['name'],
                    'far_id': sj['id'],
                    'far_dist': int(dj),
                    'far_walk': sj['walk'],
                    'walk_diff': walk_diff,
                    'dist_diff': int(dj - di),
                })

# Deduplicate: keep only the most severe inversion per (near_id, far_id) pair
seen = {}
for inv in inversions:
    key = tuple(sorted([inv['near_id'], inv['far_id']]))
    if key not in seen or inv['walk_diff'] > seen[key]['walk_diff']:
        seen[key] = inv
inversions = sorted(seen.values(), key=lambda x: -x['walk_diff'])

print(f"検出数: {len(inversions)}件\n")
print(f"{'公園':18} {'距近駅':18} {'dist':>5} {'walk':>4}  {'距遠駅':18} {'dist':>5} {'walk':>4}  {'差':>3}")
print("-"*90)
for inv in inversions[:40]:
    print(f"{inv['park']:18s} {inv['near_name']:18s} {inv['near_dist']:>5}m {inv['near_walk']:>4}  "
          f"{inv['far_name']:18s} {inv['far_dist']:>5}m {inv['far_walk']:>4}  +{inv['walk_diff']:>2}")

# ── 作業3: STATION_OVERRIDE候補 ─────────────────────────────────────────────
print()
print("="*70)
print("【作業3】STATION_OVERRIDEで修正すべき駅（候補）")
print("="*70)

# Collect under-scored stations: appears in pairs AND/OR inversions
candidates = {}

for diff, dist, a, b in pairs:
    hi, lo = (a, b) if a['walk'] > b['walk'] else (b, a)
    sid = lo['id']
    if sid not in candidates:
        candidates[sid] = {'name': lo['name'], 'current_walk': lo['walk'],
                           'reasons': [], 'suggested': lo['walk']}
    reason = f"近接ペア({hi['name']} walk={hi['walk']}, {int(dist)}m)"
    candidates[sid]['reasons'].append(reason)
    candidates[sid]['suggested'] = max(candidates[sid]['suggested'],
                                       hi['walk'] - 5)  # leave 5pt margin

for inv in inversions[:40]:
    sid = inv['near_id']
    if sid not in candidates:
        candidates[sid] = {'name': inv['near_name'], 'current_walk': inv['near_walk'],
                           'reasons': [], 'suggested': inv['near_walk']}
    reason = f"公園逆転({inv['park']}: {inv['far_name']} walk={inv['far_walk']}, dist={inv['near_dist']}m)"
    candidates[sid]['reasons'].append(reason)
    candidates[sid]['suggested'] = max(candidates[sid]['suggested'],
                                       inv['far_walk'] - 5)

# Filter: only show where suggested > current
overrides = [(v['suggested'], k, v) for k, v in candidates.items()
             if v['suggested'] > v['current_walk']]
overrides.sort(key=lambda x: -(x[0] - x[2]['current_walk']))

print(f"\n修正候補: {len(overrides)}駅\n")
print(f"{'駅名':20} {'ID':30} {'現在':>4} {'推奨下限':>6}  理由")
print("-"*90)
for sug, sid, v in overrides:
    print(f"{v['name']:20s} {sid:30s} {v['current_walk']:>4} → {sug:>4}  {v['reasons'][0]}")

print()
print("# STATION_OVERRIDEコード候補（fetch_geojson.py に追加）:")
print()
for sug, sid, v in overrides:
    print(f"    '{sid}': {{'walk_base':{sug}}},  # {v['name']} ({v['current_walk']}→{sug})")
