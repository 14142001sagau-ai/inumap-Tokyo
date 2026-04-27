# safetyスコア再計算指示

## 概要
町丁目レベルの犯罪データ（R6警視庁）と位置参照情報を使って
各駅のsafetyスコアを計算しなおす。

## 使用ファイル
- data/R6__1_.csv（犯罪データ）← アップロードして data/ に配置すること
- data/13_2024.csv（位置参照情報）← アップロードして data/ に配置すること

## 作業1：scripts/calc_safety.py を新規作成

```python
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

# 犯罪データ読み込み
crime = pd.read_csv('data/R6__1_.csv', encoding='shift_jis')
crime['区'] = crime['市区町丁'].apply(
    lambda x: next((w for w in WARDS if str(x).startswith(w)), None))
crime = crime[
    crime['区'].notna() &
    ~crime['市区町丁'].str.endswith('計') &
    ~crime['市区町丁'].str.match(r'^.{2,3}区$')
].copy()

# 町丁目名の正規化（漢数字→算用数字、全角→半角）
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

# 居住者目線の重み付きスコア
crime['weighted'] = (
    crime['凶悪犯計'] * 10 +
    crime['粗暴犯計'] * 6 +
    crime['侵入窃盗計'] * 4 +
    crime['非侵入窃盗自転車盗'] * 1
)

# マージ
merged = loc.merge(crime[['key','weighted']], on='key', how='left')
merged['weighted'] = merged['weighted'].fillna(0)
towns = merged[['key','緯度','経度','weighted']].to_dict('records')

# 正規化パラメータ
all_w = np.array([t['weighted'] for t in towns])
p75 = np.percentile(all_w, 75)
p95 = np.percentile(all_w, 95)
w_max = all_w.max()

def to_safety(w):
    if w <= 0:   return 85
    if w <= p75: return round(85 - (w/p75) * 15)       # 85→70
    if w <= p95: return round(70 - ((w-p75)/(p95-p75)) * 25)  # 70→45
    return max(30, round(45 - ((w-p95)/(w_max-p95)) * 15))    # 45→30

# stations.jsonの各駅にsafetyを計算
with open('data/stations.json', encoding='utf-8') as f:
    stations = json.load(f)

RADIUS = 800  # 800m以内の町丁を対象

updated = 0
for st in stations:
    if st.get('walk') is None:
        continue  # 非居住駅はスキップ
    
    lat, lng = st['lat'], st['lng']
    nearby = [t for t in towns
              if haversine(lat, lng, t['緯度'], t['経度']) <= RADIUS]
    
    if nearby:
        # 距離による逆距離加重
        total_w = sum(max(0.1, 1 - haversine(lat,lng,t['緯度'],t['経度'])/RADIUS)
                      for t in nearby)
        avg = sum(t['weighted'] *
                  max(0.1, 1 - haversine(lat,lng,t['緯度'],t['経度'])/RADIUS)
                  for t in nearby) / total_w
        safety = to_safety(avg)
    else:
        # 周辺に町丁データなし→区デフォルト
        ku = st.get('ku', '')
        safety = 65  # デフォルト
    
    st['safety'] = safety
    updated += 1

with open('data/stations.json', 'w', encoding='utf-8') as f:
    json.dump(stations, f, ensure_ascii=False)

print(f'更新完了: {updated}駅')

# 分布確認
safeties = [st['safety'] for st in stations if st.get('safety') and st.get('walk')]
print(f'safety分布: min={min(safeties)} max={max(safeties)} mean={sum(safeties)/len(safeties):.1f}')
```

## 作業2：スクリプト実行
```
py scripts/calc_safety.py
```

## 作業3：代表駅のsafetyを確認
以下の駅のsafetyを表示：
新宿西口・新大久保・池袋・六本木・渋谷・
北千住・西葛西・駒沢大学・用賀・
世田谷・等々力・本駒込・荒川区役所前

## 作業4：fetch_geojson.pyのSAFETY_STATIONを廃止
stations.jsonにsafetyが直接入ったので
fetch_geojson.pyのSAFETY_STATION参照を
stations.jsonのsafety値を使うよう変更：

変更前：
safety_val = SAFETY_STATION.get(st['name'], SAFETY_WARD.get(ku, 70))

変更後：
safety_val = st.get('safety', SAFETY_WARD.get(ku, 70))

## 作業5：housingスコアの計算式を更新
housing = 地価30% + 治安70% の計算を適用：

rent_score = HOUSING_STATION.get(st['name'], HOUSING_WARD.get(ku, 65))
safety_val = st.get('safety', SAFETY_WARD.get(ku, 70))
housing_val = round(rent_score * 0.3 + safety_val * 0.7)

## 作業6：fetch_geojson.py実行
py scripts/fetch_geojson.py

## 作業7：Git push
まずcalc_safety.pyの実行結果と
代表駅のスコアを報告してから
問題なければ：
git add -A
git commit -m "feat: safetyスコアを町丁レベル犯罪データで再計算・housing=地価30%+治安70%"
git push
