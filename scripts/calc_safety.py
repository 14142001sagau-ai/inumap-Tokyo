import sys
sys.stdout.reconfigure(encoding='utf-8')
import pandas as pd, json, math, numpy as np

WARDS = ['千代田区','中央区','港区','新宿区','文京区','台東区','墨田区','江東区',
         '品川区','目黒区','大田区','世田谷区','渋谷区','中野区','杉並区','豊島区',
         '北区','荒川区','板橋区','練馬区','足立区','葛飾区','江戸川区']

def haversine(la1,ln1,la2,ln2):
    R=6371000; p=math.pi/180
    return 2*R*math.asin(math.sqrt(
        math.sin((la2-la1)*p/2)**2+
        math.cos(la1*p)*math.cos(la2*p)*math.sin((ln2-ln1)*p/2)**2))

# 位置参照情報読み込み
loc = pd.read_csv('data/13_2024.csv', encoding='shift_jis')
loc = loc[loc['市区町村名'].isin(WARDS)].copy()
print(f'位置参照: {len(loc)}町丁')

# 犯罪データ読み込み
crime = pd.read_csv('data/R6__1_.csv', encoding='shift_jis')
print(f'犯罪データ列: {list(crime.columns)}')
crime['区'] = crime['市区町丁'].apply(
    lambda x: next((w for w in WARDS if str(x).startswith(w)), None))
crime = crime[
    crime['区'].notna() &
    ~crime['市区町丁'].str.endswith('計') &
    ~crime['市区町丁'].str.match(r'^.{2,3}区$')
].copy()
print(f'犯罪データ（町丁レベル）: {len(crime)}行')

# 町丁目名の正規化
KAN = {'一':'1','二':'2','三':'3','四':'4','五':'5',
       '六':'6','七':'7','八':'8','九':'9'}
def norm(ward, name):
    s = name
    for k,v in KAN.items():
        s = s.replace(k+'丁目', v+'丁目')
    s = s.translate(str.maketrans('１２３４５６７８９０', '1234567890'))
    return ward + s

loc['key'] = loc.apply(
    lambda r: norm(r['市区町村名'], r['大字町丁目名']), axis=1)
crime['key'] = crime['市区町丁'].apply(
    lambda x: norm(
        next((w for w in WARDS if x.startswith(w)), ''),
        x[len(next((w for w in WARDS if x.startswith(w)), '')):]
    )
)

# 重み付きスコア（列名確認して適用）
cols = crime.columns.tolist()
print(f'犯罪列確認: {[c for c in cols if "犯" in c or "窃" in c or "盗" in c]}')

def get_col(df, *candidates):
    for c in candidates:
        if c in df.columns: return c
    return None

c_kyoaku  = get_col(crime, '凶悪犯計', '凶悪犯')
c_sobo    = get_col(crime, '粗暴犯計', '粗暴犯')
c_shinyu  = get_col(crime, '侵入窃盗計', '侵入窃盗')
c_jitensha= get_col(crime, '非侵入窃盗自転車盗', '自転車盗')

print(f'使用列: 凶悪={c_kyoaku} 粗暴={c_sobo} 侵入={c_shinyu} 自転車={c_jitensha}')

crime['weighted'] = (
    (crime[c_kyoaku].fillna(0)  if c_kyoaku   else 0) * 10 +
    (crime[c_sobo].fillna(0)    if c_sobo     else 0) * 6  +
    (crime[c_shinyu].fillna(0)  if c_shinyu   else 0) * 4  +
    (crime[c_jitensha].fillna(0)if c_jitensha else 0) * 1
)

# マージ
merged = loc.merge(crime[['key','weighted']], on='key', how='left')
merged['weighted'] = merged['weighted'].fillna(0)
towns = merged[['key','緯度','経度','weighted']].to_dict('records')
print(f'マージ後: {len(towns)}町丁 / マッチ率: {merged["weighted"].gt(0).sum()}/{len(merged)}')

# 正規化
all_w = np.array([t['weighted'] for t in towns])
p75 = np.percentile(all_w, 75)
p95 = np.percentile(all_w, 95)
w_max = all_w.max()
print(f'weighted: p75={p75:.1f} p95={p95:.1f} max={w_max:.1f}')

def to_safety(w):
    if w <= 0:   return 85
    if w <= p75: return round(85 - (w/p75) * 15)
    if w <= p95: return round(70 - ((w-p75)/(p95-p75)) * 25)
    return max(30, round(45 - ((w-p95)/(w_max-p95)) * 15))

# stations.jsonの各駅にsafetyを計算
with open('data/stations.json', encoding='utf-8') as f:
    stations = json.load(f)

RADIUS = 800

updated = 0
for st in stations:
    if st.get('walk') is None:
        continue
    lat, lng = st['lat'], st['lng']
    nearby = [t for t in towns
              if haversine(lat, lng, t['緯度'], t['経度']) <= RADIUS]
    if nearby:
        total_w = sum(max(0.1, 1 - haversine(lat,lng,t['緯度'],t['経度'])/RADIUS)
                      for t in nearby)
        avg = sum(t['weighted'] *
                  max(0.1, 1 - haversine(lat,lng,t['緯度'],t['経度'])/RADIUS)
                  for t in nearby) / total_w
        safety = to_safety(avg)
    else:
        safety = 65
    st['safety'] = safety
    updated += 1

with open('data/stations.json', 'w', encoding='utf-8') as f:
    json.dump(stations, f, ensure_ascii=False)

print(f'\n更新完了: {updated}駅')
safeties = [st['safety'] for st in stations if st.get('safety') and st.get('walk')]
print(f'safety分布: min={min(safeties)} max={max(safeties)} mean={sum(safeties)/len(safeties):.1f}')

# 分布
from collections import Counter
brackets = [(0,39),(40,49),(50,59),(60,69),(70,79),(80,89),(90,100)]
for lo,hi in brackets:
    n = sum(1 for v in safeties if lo<=v<=hi)
    print(f'  {lo}〜{hi}: {n}駅')
