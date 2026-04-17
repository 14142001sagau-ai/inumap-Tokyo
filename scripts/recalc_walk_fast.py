# Fast walk-score-only recalculation using shapefile (no OSM requests)
# Updates walk and dogruns fields in data/stations.json in-place
import json, math, shapefile

def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    p = math.pi / 180
    dLat = (lat2 - lat1) * p
    dLng = (lng2 - lng1) * p
    a = math.sin(dLat/2)**2 + math.cos(lat1*p)*math.cos(lat2*p)*math.sin(dLng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

_DOGRUN_PARKS = {
    '蘆花恒春園', '城北中央公園', '舎人公園', '水元公園', '篠崎公園',
    '代々木公園', '木場公園', '駒沢オリンピック公園', '石神井公園',
    '小山内裏公園', '桜ヶ丘公園', '小金井公園', '神代植物公園',
}

WALK_BASE_DEFAULT = 60

WALK_STATION = {
    'お台場海浜公園':69,'お花茶屋':52,'とうきょうスカイツリー':80,'ときわ台':61,
    'テレコムセンター':57,'モノレール浜松町':82,'一之江':52,'三ノ輪':50,
    '三ノ輪橋':46,'三河島':57,'三田':77,'三越前':48,'三軒茶屋':65,
    '上中里':76,'上井草':64,'上北沢':57,'上板橋':76,'上町':48,'上石神井':58,
    '上野':83,'上野広小路':65,'上野御徒町':65,'上野毛':64,'下井草':62,
    '下高井戸':69,'下赤塚':48,'中延':62,'中板橋':68,'中野':62,'中野富士見町':65,
    '中野坂上':58,'中野新橋':63,'九品仏':69,'五反田':72,'今泉':65,'代々木':57,
    '代々木公園':85,'代々木上原':66,'代々木八幡':82,'仙川':67,'伊勢丹前':60,
    '低草':48,'元住吉':59,'光が丘':85,'八幡山':68,'円山町':62,'南千住':67,
    '南新宿':62,'南砂町':62,'南荻窪':72,'南阿佐ヶ谷':72,'反町':58,
    '古市場':52,'古川橋':52,'台場':69,'参宮橋':74,'吉祥寺':65,
    '名古屋':60,'和泉多摩川':57,'国分寺':55,'国立':55,'地下鉄成増':41,
    '地下鉄赤塚':62,'坂の上':60,'堀切菖蒲園':55,'塚田':48,'大井町':67,
    '大井競馬場前':62,'大泉学園':48,'大森':70,'大森海岸':67,'天空橋':57,
    '天王洲アイル':57,'太子堂':62,'奥沢':72,'学芸大学':72,'宮ノ前':60,
    '宮の坂':65,'富士見ヶ丘':67,'小川':52,'小竹向原':62,'小平':50,
    '尾山台':72,'山下':52,'岐阜':60,'岩本町':57,'島':60,'平和台':67,
    '平間':57,'成増':42,'戸越':67,'戸越銀座':67,'所沢':52,'扇大橋':55,
    '新御茶ノ水':41,'新宿':62,'新宿三丁目':62,'新桜台':62,'新江古田':65,
    '新高島平':67,'東十条':67,'東大前':50,'東急多摩川':62,'東銀座':67,
    '板橋':70,'板橋区役所前':72,'板橋本町':67,'林間':57,'根津':65,
    '桜台':62,'桜木町':72,'武蔵境':57,'武蔵小金井':55,'武蔵野台':55,
    '池尻大橋':67,'池袋':67,'洗足池':72,'海浜幕張':62,'浮間舟渡':67,
    '浜松町':77,'清瀬':52,'清澄白河':67,'渋谷':62,'濡れ衣':60,
    '烏丸':60,'田園調布':77,'田都市':62,'白金台':72,'白金高輪':72,
    '石神井公園':62,'神楽坂':60,'空港第2ビル':57,'竹ノ塚':57,'竹橋':55,
    '等々力':72,'糀谷':57,'練馬':65,'練馬春日町':62,'練馬高野台':62,
    '終':48,'羽田空港':57,'花小金井':48,'芝公園':77,'荒川一中前':55,
    '荒川二丁目':69,'荒川区役所前':55,'荒川遊園地前':57,'西巣鴨':62,
    '西大井':67,'西大島':62,'西永福':76,'西調布':57,'西高島平':60,
    '谷在家':75,'赤坂':67,'赤坂見附':62,'都立家政':67,'野方':62,
    '長原':67,'門前仲町':67,'雑色':57,'雪が谷大塚':72,'飛田給':57,
    '飯田橋':57,'高円寺':67,'高島平':67,'高田馬場':62,'高輪ゲートウェイ':62,
    '鬼子母神前':62,'駒込':72,'駒沢大学':72,'鷺ノ宮':65,'麻布十番':72,
    '黒川':57,'沼袋':78,'永福町':73,'祖師ヶ谷大蔵':57,'喜多見':57,
    '氷川台':70,'新高島平':67,'西高島平':60,'成増':42,'野方':62,
    '明治神宮前':58,'吉祥寺':65,'花小金井':48,
}

STATION_OVERRIDE = {
    '代々木公園_5a2091':  {'walk_base':85},
    '代々木八幡_80028d':  {'walk_base':82},
    '代々木_a00496':       {'walk_base':70},
    '明治神宮前_f3ebe8':   {'walk_base':70},
    '参宮橋_10a2cd':       {'walk_base':65},
    '千駄ヶ谷_a63c5c':     {'walk_base':60},
    '北千住_93f4e2':       {'walk_base':54},
    '木場_a4a435':         {'walk_base':56},
    '下赤塚_687399':       {'walk_base':62},
    '地下鉄赤塚_cc2b86':   {'walk_base':62},
    '金町_f7f426':         {'walk_base':62},
    '光が丘_21fde0':       {'walk_base':85},
    '石神井公園_d3b96b':   {'walk_base':69},
    '渋谷_31a4ea':         {'walk_base':62},
    '二子玉川_e3b826':     {'walk_base':85},
    '足立小台_5064bc':     {'walk_base':85},
    '谷在家_861183':       {'walk_base':75},
    '見沼代親水公園_9f8565':{'walk_base':62},
    '春日_3187bc':         {'walk_base':67},
    '王子駅前_36ace5':     {'walk_base':67},
    '飛鳥山_3b08c6':       {'walk_base':67},
    '町屋_20cc14':         {'walk_base':68},
    '秋葉原_4b226d':       {'walk_base':57},
    '東日本橋_c35183':     {'walk_base':63},
    '荒川二丁目_3f1ecf':   {'walk_base':69},
    '新御茶ノ水_a485f1':   {'walk_base':41},
    '京成上野_fabb1f':     {'walk_base':75},
    '上野広小路_cfe21b':   {'walk_base':65},
    '上野御徒町_4bc376':   {'walk_base':65},
    '御徒町_1d1560':       {'walk_base':65},
    '新御徒町_92e5e3':     {'walk_base':60},
    '東大前_df831c':       {'walk_base':50},
    '砧公園_4df82e':       {'walk_base':85},
    '用賀_6a0e77':         {'walk_base':75},
    '都庁前_e2172b':       {'walk_max': 55},
}

NON_RESIDENTIAL_STATIONS = {
    '羽田空港第1・第2ターミナル', '羽田空港第3ターミナル',
    '天空橋', 'テレコムセンター', 'お台場海浜公園', '台場',
    '東京テレポート', '新木場', '葛西臨海公園',
    '海浜幕張', '舞浜', '成田空港', '空港第2ビル',
}

PARK_ENTRANCES = {
    '代々木公園': [(35.6715,139.6993),(35.6804,139.6970),(35.6700,139.6918),(35.6719,139.6850)],
    '明治神宮':   [(35.6763,139.6993),(35.6830,139.6986)],
    '砧公園':     [(35.6291,139.6216),(35.6220,139.6280)],
    '上野恩賜公園':[(35.7138,139.7742),(35.7220,139.7780),(35.7100,139.7700)],
    '光が丘公園': [(35.7590,139.6285),(35.7690,139.6270),(35.7633,139.6390),(35.7635,139.6185)],
    '赤塚公園':   [(35.7699,139.6293)],
}

def _load_parks_data():
    try:
        sf = shapefile.Reader('data/parks/P13-11_13.shp', encoding='shift_jis')
        fields = [f[0] for f in sf.fields[1:]]
        result = []
        for sr in sf.shapeRecords():
            rec = dict(zip(fields, sr.record))
            name = rec.get('P13_003', '')
            area = rec.get('P13_008', 0)
            if not name:
                continue
            lng, lat = sr.shape.points[0]
            result.append({'name': name, 'lat': lat, 'lng': lng,
                           'area': int(area) if area else 0,
                           'dogrun': name in _DOGRUN_PARKS})
        print(f'Parks loaded: {len(result)}')
        return result
    except Exception as e:
        print(f'Park load error: {e}')
        return []

PARKS_DATA = _load_parks_data()

def min_dist_to_park(park_name, centroid_lat, centroid_lng, st_lat, st_lng):
    points = [(centroid_lat, centroid_lng)] + PARK_ENTRANCES.get(park_name, [])
    return min(haversine(st_lat, st_lng, p[0], p[1]) for p in points)

def get_nearby_parks(lat, lng, radius=1600):
    return [p for p in PARKS_DATA
            if min_dist_to_park(p['name'], p['lat'], p['lng'], lat, lng) <= radius]

def calc_walk_score(nearby_parks, base, base_is_override=False, walk_max=None):
    park_score   = min(len(nearby_parks) * 10, 50)
    dogrun_score = 40 if any(p['dogrun'] for p in nearby_parks) else 0
    big_parks    = [p for p in nearby_parks if p['area'] >= 100000]
    bonus        = min(len(big_parks) * 15, 30)
    osm_score    = min(park_score + dogrun_score + bonus, 90)
    if osm_score == 0:
        walk = base
    elif osm_score < base * 0.5:
        walk = round(osm_score * 0.4 + base * 0.6)
    else:
        walk = round(osm_score * 0.7 + base * 0.3)
    if base_is_override:
        walk = max(walk, base)
    if walk_max is not None:
        walk = min(walk, walk_max)
    return walk

stations = json.load(open('data/stations.json', encoding='utf-8'))
changed = 0
for st in stations:
    if st['walk'] is None:
        continue
    sid = st['id']
    ov = STATION_OVERRIDE.get(sid, {})
    walk_base = ov.get('walk_base', WALK_STATION.get(st['name'], WALK_BASE_DEFAULT))
    walk_is_override = 'walk_base' in ov
    walk_max = ov.get('walk_max', None)

    nearby = get_nearby_parks(st['lat'], st['lng'])
    new_walk = calc_walk_score(nearby, walk_base, base_is_override=walk_is_override, walk_max=walk_max)
    new_dogruns = [p['name'] for p in nearby if p.get('dogrun')][:3]

    if new_walk != st['walk'] or new_dogruns != st.get('dogruns', []):
        print(f"{st['name']}: walk {st['walk']}->{new_walk}, dogruns {st.get('dogruns',[])} -> {new_dogruns}")
        changed += 1
    st['walk'] = new_walk
    st['dogruns'] = new_dogruns
    st['parks'] = [p['name'] for p in nearby[:5]]

with open('data/stations.json', 'w', encoding='utf-8') as f:
    json.dump(stations, f, ensure_ascii=False, indent=2)
print(f'Done: {changed} stations updated out of {len(stations)}')
