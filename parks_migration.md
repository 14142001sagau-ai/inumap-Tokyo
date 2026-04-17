# walkスコア計算をOSM廃止・国土数値情報ベースに移行

## 【作業1：国土数値情報の公園データを読み込むモジュール作成】
C:\inumap-repo2\data\parks\P13-11_13.shp を読み込み、
以下の形式でPythonのリストに変換する処理を
fetch_geojson.py に追加してください。

読み込み方法：
```python
import shapefile
sf = shapefile.Reader('data/parks/P13-11_13.shp', encoding='shift_jis')
fields = [f[0] for f in sf.fields[1:]]
# P13_003=公園名, P13_008=面積(㎡), 座標=shape.points[0](経度,緯度の順)
```

変換後の形式：
```python
PARKS_DATA = [
    {
        'name': '駒沢オリンピック公園',
        'lat': 35.624,
        'lng': 139.660,
        'area': 413573,
        'dogrun': False
    },
    ...
]
```

## 【作業2：ドッグランフラグの設定】
以下の公園にdogrun=Trueを設定してください：
蘆花恒春園・城北中央公園・舎人公園・
水元公園・篠崎公園・代々木公園・
木場公園・駒沢オリンピック公園・
光が丘公園・石神井公園

## 【作業3：walkスコア計算をOSM廃止・PARKS_DATAベースに変更】
現在のget_fac()によるOverpass APIの公園クエリを廃止し、
PARKS_DATAから駅周辺の公園を取得する方式に変更：

```python
def get_nearby_parks(lat, lng, radius=1600):
    return [p for p in PARKS_DATA
            if haversine(lat, lng, p['lat'], p['lng']) <= radius]
```

walkスコア計算：
```python
nearby_parks = get_nearby_parks(st_lat, st_lng)
park_score   = min(len(nearby_parks) * 10, 50)
dogrun_score = 40 if any(p['dogrun'] for p in nearby_parks) else 0
big_parks    = [p for p in nearby_parks if p['area'] >= 100000]
bonus        = min(len(big_parks) * 15, 30)
osm_score    = min(park_score + dogrun_score + bonus, 90)
base         = WALK_STATION.get(name, WALK_WARD.get(ku, 50))

if osm_score == 0:
    walk = base
elif osm_score < base * 0.5:
    walk = round(osm_score * 0.4 + base * 0.6)
else:
    walk = round(osm_score * 0.7 + base * 0.3)
```

## 【作業4：housing・medical・mobilityスコアは現状維持】
walkスコア計算のみ変更する。
他のスコアはget_fac()から取得している
carshares・car_rentals・vets等をそのまま使うこと。

get_fac()のOverpassクエリからparks関連のクエリのみ削除してください。

## 【作業5：requirements.txtにpyshpを追加】
requirements.txt に以下を追加：
pyshp

## 【作業6：テスト実行・スコア確認】
修正後、fetch_geojson.py を実行して
以下の駅のwalkスコアを確認してください：
原宿・代々木・明治神宮前・参宮橋・
上野・京成上野・根津・
石神井公園・光が丘・
高島平・西高島平・新高島平・
成増・地下鉄成増・
中目黒・恵比寿・代官山・
沼袋・野方・
駒沢大学・二子玉川

## 【作業7：Git push】
```
git add -A
git commit -m "feat: walkスコア計算をOSM廃止→国土数値情報公園データベースに移行"
git push
```
