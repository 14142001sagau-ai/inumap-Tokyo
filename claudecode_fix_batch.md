# INUMAP 修正バッチ指示

## 作業1：赤塚・赤堤の恒久削除
fetch_geojson.py のマスターデータ読み込み部分に
除外リストを追加：

EXCLUDED_STATIONS = {'赤塚', '赤堤'}

駅リスト生成時に以下を追加：
stations = [s for s in stations
            if s['name'] not in EXCLUDED_STATIONS]

## 作業2：非居住駅（湾岸部）の恒久修正
NON_RESIDENTIAL_STATIONSが毎回正しく適用されているか確認し、
stations.json生成後に必ず13駅の
walk/housing/medical/mobilityをnullに上書きする処理を追加。

## 作業3：国際展示場と有明のhousingを統一
HOUSING_STATIONで両駅を有明の値（71）に統一：
'国際展示場': 71

## 作業4：江東区エリアのwalkスコア確認
木場・東陽町・門前仲町・越中島・清澄白河・
森下・菊川・住吉・大島・東大島の
walkスコアとosm内訳を表示。
walk=90の原因を特定。

## 作業5：河川ボーナスを大型河川相当に強化
LARGE_RIVER_BONUS を以下に変更：

LARGE_RIVER_BONUS = {
    '多摩川': 40,
    '荒川':   40,
    '江戸川': 20,
    '隅田川': 20,
    '綾瀬川': 10,
    '神田川': 10,
    '目黒川': 10,
    '石神井川': 10,
    '白子川': 10,
    '善福寺川': 10,
}

get_river_bonus()を以下に修正：
def get_river_bonus(lat, lng):
    max_bonus = 0
    for name, points in RIVER_DATA.items():
        if name not in LARGE_RIVER_BONUS:
            continue
        for point in points:
            if haversine(lat, lng, point[0], point[1]) <= 500:
                bonus = LARGE_RIVER_BONUS.get(name, 10)
                max_bonus = max(max_bonus, bonus)
    return max_bonus

## 作業6：三軒茶屋のwalkスコア内訳確認
三軒茶屋のwalkスコアの内訳
（どの公園が何点寄与しているか）を表示。

## 作業7：B×Yのウェイト修正
app.jsのB×Yペルソナのウェイトを変更：
変更前：walk:45, housing:34, medical:8, mobility:13
変更後：walk:42, housing:36, medical:9, mobility:13
合計が100になることを確認。

## 作業8：小岩・江戸川と篠崎公園の距離確認
小岩駅・江戸川駅から篠崎公園までの
距離と距離係数を表示。

## 作業9：スコア再計算・Git push
fetch_geojson.py を実行してスコアを更新

git add -A
git commit -m "fix: 赤塚赤堤恒久削除・湾岸マーカー恒久修正・河川ボーナス強化・国際展示場housing修正・BY重み修正"
git push
