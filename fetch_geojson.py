import requests, json, os, time, math, openpyxl, hashlib, re, unicodedata

OVERPASS = 'https://overpass-api.de/api/interpreter'
EXCEL    = 'data/master.xlsx'
RADIUS   = 1300

# ============================================================
# 区別スコア（CSVから計算済み）
# ============================================================

# SAFETY: R6警視庁犯罪CSV 凶悪犯×5・粗暴犯×3・侵入窃盗×2・自転車盗×1・詐欺×1.5 の重み付き町丁あたりスコア
# 集計行除外・低犯罪率=高スコア（35〜85）
SAFETY_WARD = {
    '千代田区':77,'中央区':79,'港区':59,'新宿区':35,'文京区':76,'台東区':67,
    '墨田区':76,'江東区':79,'品川区':82,'目黒区':83,'大田区':77,'世田谷区':84,
    '渋谷区':37,'中野区':66,'杉並区':81,'豊島区':40,'北区':78,'荒川区':70,
    '板橋区':69,'練馬区':80,'足立区':85,'葛飾区':78,'江戸川区':75,
}

# HOUSING: R7地価公示 地価中央値から計算（低地価=家賃安い=高スコア）
HOUSING_WARD = {
    '千代田区':45,'中央区':47,'港区':47,'新宿区':64,'文京区':67,'台東区':67,
    '墨田区':72,'江東区':72,'品川区':68,'目黒区':68,'大田区':73,'世田谷区':71,
    '渋谷区':60,'中野区':71,'杉並区':72,'豊島区':69,'北区':72,'荒川区':72,
    '板橋区':74,'練馬区':74,'足立区':75,'葛飾区':75,'江戸川区':74,
}

# PARKING_SCORE: 地価から月極駐車料金を推定（低地価=安い駐車場=高スコア）
PARKING_WARD = {
    '千代田区':35,'中央区':37,'港区':38,'新宿区':60,'文京区':64,'台東区':64,
    '墨田区':72,'江東区':72,'品川区':66,'目黒区':66,'大田区':72,'世田谷区':70,
    '渋谷区':54,'中野区':69,'杉並区':71,'豊島区':67,'北区':71,'荒川区':72,
    '板橋区':73,'練馬区':74,'足立区':75,'葛飾区':75,'江戸川区':74,
}

SAFETY_STATION = {
    'お台場海浜公園':82,
    'お花茶屋':79,
    'とうきょうスカイツリー':74,
    'ときわ台':78,
    'テレコムセンター':84,
    'モノレール浜松町':75,
    '一之江':83,
    '三ノ輪':75,
    '三ノ輪橋':77,
    '三河島':75,
    '三田':79,
    '三越前':68,
    '三軒茶屋':78,
    '上中里':79,
    '上井草':82,
    '上北沢':82,
    '上板橋':79,
    '上町':81,
    '上石神井':82,
    '上野':66,
    '上野広小路':61,
    '上野御徒町':61,
    '上野毛':81,
    '下丸子':82,
    '下井草':81,
    '下北沢':77,
    '下板橋':75,
    '下神明':77,
    '下落合':75,
    '下赤塚':81,
    '下高井戸':80,
    '不動前':80,
    '世田谷':80,
    '世田谷代田':78,
    '両国':75,
    '中井':76,
    '中延':80,
    '中村橋':80,
    '中板橋':77,
    '中目黒':76,
    '中野':72,
    '中野坂上':73,
    '中野富士見町':78,
    '中野新橋':77,
    '丸の内':65,
    '乃木坂':79,
    '久が原':82,
    '久我山':83,
    '九品仏':81,
    '九段下':79,
    '亀戸':72,
    '亀戸水神':75,
    '亀有':78,
    '二子玉川':81,
    '二重橋前':67,
    '五反田':78,
    '五反野':80,
    '井荻':82,
    '京急蒲田':70,
    '京急長浜':75,
    '京成上野':65,
    '京成小岩':79,
    '京成曳舟':78,
    '京成立石':81,
    '京成金町':80,
    '京成関屋':77,
    '京成高砂':82,
    '京橋':64,
    '人形町':74,
    '代々木':62,
    '代々木上原':80,
    '代々木八幡':75,
    '代々木公園':75,
    '代官山':73,
    '代田橋':75,
    '仲御徒町':59,
    '住吉':72,
    '信濃町':82,
    '光が丘':79,
    '入谷':71,
    '八丁堀':74,
    '八幡山':81,
    '八広':83,
    '六本木':78,
    '六本木一丁目':76,
    '六町':82,
    '六郷土手':85,
    '内幸町':66,
    '初台':76,
    '勝どき':80,
    '北千住':78,
    '北千束':81,
    '北参道':75,
    '北品川':77,
    '北池袋':62,
    '北綾瀬':81,
    '北赤羽':83,
    '北青山':78,
    '十条':77,
    '千住大橋':74,
    '千川':77,
    '千歳烏山':81,
    '千歳船橋':80,
    '千石':77,
    '千駄ヶ谷':75,
    '千駄木':78,
    '千鳥町':81,
    '半蔵門':82,
    '南千住':77,
    '南新宿':53,
    '南砂町':80,
    '南阿佐ヶ谷':79,
    '原宿':69,
    '参宮橋':78,
    '台場':83,
    '向原':64,
    '品川':79,
    '品川シーサイド':81,
    '喜多見':84,
    '四ツ木':83,
    '四ツ谷':81,
    '四谷三丁目':77,
    '国会議事堂前':78,
    '国立競技場':76,
    '国際展示場':83,
    '地下鉄成増':80,
    '地下鉄赤塚':81,
    '堀切':80,
    '堀切菖蒲園':81,
    '外苑前':75,
    '多摩川':83,
    '大久保':41,
    '大井町':78,
    '大井競馬場前':82,
    '大塚':68,
    '大塚駅前':69,
    '大山':76,
    '大岡山':81,
    '大島':74,
    '大崎':80,
    '大崎広小路':80,
    '大師前':78,
    '大手町':70,
    '大森':76,
    '大森海岸':76,
    '大森町':77,
    '大泉学園':80,
    '大門':75,
    '大鳥居':79,
    '天王洲アイル':82,
    '天空橋':83,
    '太子堂':78,
    '奥沢':80,
    '学習院下':70,
    '学芸大学':80,
    '宝町':64,
    '宮の坂':79,
    '宮ノ前':80,
    '富士見ヶ丘':82,
    '富士見台':80,
    '小伝馬町':67,
    '小台':80,
    '小山':80,
    '小岩':78,
    '小川町':67,
    '小村井':77,
    '小竹向原':79,
    '小菅':78,
    '尾久':80,
    '尾山台':82,
    '山下':79,
    '岩本町':63,
    '巣鴨':76,
    '巣鴨新田':69,
    '市ケ谷':81,
    '市場前':81,
    '幡ヶ谷':78,
    '平井':80,
    '平和台':79,
    '平和島':77,
    '広尾':77,
    '庚申塚':75,
    '後楽園':78,
    '御嶽山':82,
    '御徒町':61,
    '御成門':73,
    '御茶ノ水':64,
    '志村三丁目':80,
    '志村坂上':80,
    '志茂':76,
    '恵比寿':75,
    '成城学園前':81,
    '成増':80,
    '戸越':80,
    '戸越公園':78,
    '戸越銀座':80,
    '扇大橋':82,
    '押上':74,
    '整備場':84,
    '新三河島':76,
    '新中野':74,
    '新井薬師前':77,
    '新代田':76,
    '新大久保':38,
    '新大塚':74,
    '新宿':39,
    '新宿三丁目':40,
    '新宿御苑前':43,
    '新宿西口':35,
    '新富町':69,
    '新小岩':77,
    '新庚申塚':77,
    '新御徒町':61,
    '新御茶ノ水':66,
    '新整備場':84,
    '新日本橋':63,
    '新木場':84,
    '新板橋':77,
    '新柴又':82,
    '新桜台':79,
    '新橋':65,
    '新江古田':79,
    '新豊洲':80,
    '新馬場':78,
    '新高円寺':77,
    '新高島平':81,
    '方南町':80,
    '旗の台':81,
    '日の出':80,
    '日暮里':77,
    '日本橋':69,
    '日比谷':63,
    '早稲田':77,
    '明大前':80,
    '明治神宮前':64,
    '春日':78,
    '昭和島':83,
    '曙橋':74,
    '曳舟':78,
    '月島':78,
    '有明':83,
    '有明テニスの森':82,
    '有楽町':62,
    '木場':79,
    '末広町':61,
    '本所吾妻橋':73,
    '本蓮沼':79,
    '本郷三丁目':71,
    '本駒込':80,
    '東あずま':77,
    '東中野':77,
    '東京':66,
    '東京テレポート':83,
    '東京ビッグサイト':81,
    '東京国際クルーズターミナル':83,
    '東北沢':77,
    '東十条':77,
    '東向島':80,
    '東大前':80,
    '東大島':78,
    '東尾久三丁目':78,
    '東新宿':41,
    '東日本橋':71,
    '東松原':78,
    '東武練馬':79,
    '東池袋':60,
    '東池袋四丁目':60,
    '東銀座':66,
    '東長崎':78,
    '東陽町':79,
    '東雲':82,
    '東高円寺':75,
    '松原':80,
    '松陰神社前':79,
    '板橋':76,
    '板橋区役所前':76,
    '板橋本町':77,
    '柴又':82,
    '栄町':80,
    '根津':73,
    '桜上水':82,
    '桜台':78,
    '桜新町':80,
    '桜田門':75,
    '梅ヶ丘':80,
    '梅屋敷':72,
    '梅島':78,
    '梶原':80,
    '森下':78,
    '椎名町':76,
    '武蔵小山':81,
    '武蔵新田':81,
    '武蔵関':83,
    '水天宮前':76,
    '水道橋':76,
    '氷川台':80,
    '永田町':80,
    '永福町':80,
    '汐留':66,
    '江北':80,
    '江古田':79,
    '江戸川':82,
    '江戸川橋':79,
    '池ノ上':79,
    '池上':80,
    '池尻大橋':77,
    '池袋':57,
    '沼袋':79,
    '沼部':83,
    '泉岳寺':78,
    '洗足':80,
    '洗足池':81,
    '流通センター':83,
    '浅草':73,
    '浅草橋':71,
    '浜松町':79,
    '浜田山':83,
    '浜町':75,
    '浮間舟渡':83,
    '淡路町':68,
    '清澄白河':78,
    '渋谷':62,
    '湯島':60,
    '溜池山王':78,
    '滝野川一丁目':78,
    '潮見':82,
    '熊野前':80,
    '牛田':77,
    '牛込柳町':76,
    '牛込神楽坂':79,
    '王子':80,
    '王子神谷':78,
    '王子駅前':79,
    '瑞江':80,
    '用賀':81,
    '田原町':69,
    '田園調布':83,
    '田町':80,
    '田端':77,
    '町屋':78,
    '町屋二丁目':79,
    '町屋駅前':79,
    '白山':80,
    '白金台':79,
    '白金高輪':79,
    '目白':69,
    '目黒':82,
    '矢口渡':78,
    '石川台':81,
    '石神井公園':81,
    '祐天寺':79,
    '祖師ヶ谷大蔵':81,
    '神保町':74,
    '神楽坂':78,
    '神泉':65,
    '神田':62,
    '神谷町':74,
    '秋葉原':61,
    '稲荷町':62,
    '穴守稲荷':83,
    '立会川':78,
    '竹ノ塚':77,
    '竹橋':75,
    '竹芝':80,
    '笹塚':76,
    '等々力':82,
    '築地':69,
    '築地市場':65,
    '篠崎':80,
    '糀谷':77,
    '経堂':80,
    '綾瀬':79,
    '緑が丘':79,
    '練馬':77,
    '練馬春日町':81,
    '練馬高野台':80,
    '羽田空港第1ターミナル':84,
    '羽田空港第2ターミナル':84,
    '羽田空港第3ターミナル':84,
    '自由が丘':81,
    '舎人':82,
    '舎人公園':81,
    '船堀':80,
    '芝公園':78,
    '芝浦ふ頭':81,
    '芦花公園':81,
    '若松河田':64,
    '若林':79,
    '若洲':85,
    '茅場町':72,
    '茗荷谷':80,
    '荏原中延':80,
    '荏原町':81,
    '荒川一中前':76,
    '荒川七丁目':78,
    '荒川二丁目':78,
    '荒川区役所前':77,
    '荒川車庫前':81,
    '荒川遊園地前':81,
    '荻窪':79,
    '菊川':74,
    '落合':77,
    '落合南長崎':79,
    '葛西':76,
    '葛西臨海公園':84,
    '蒲田':71,
    '蓮根':80,
    '蓮沼':71,
    '蔵前':70,
    '虎ノ門':69,
    '虎ノ門ヒルズ':74,
    '表参道':70,
    '西ケ原':79,
    '西ケ原四丁目':77,
    '西台':79,
    '西大井':79,
    '西大島':70,
    '西太子堂':79,
    '西小山':80,
    '西巣鴨':76,
    '西新井':79,
    '西新井大師西':80,
    '西新宿':40,
    '西新宿五丁目':70,
    '西日暮里':77,
    '西早稲田':72,
    '西武新宿':37,
    '西永福':82,
    '西荻窪':82,
    '西葛西':78,
    '西馬込':81,
    '西高島平':82,
    '要町':62,
    '見沼代親水公園':84,
    '護国寺':77,
    '谷在家':81,
    '豊島園':78,
    '豊洲':80,
    '豪徳寺':80,
    '赤土小学校前':78,
    '赤坂':78,
    '赤坂見附':79,
    '赤堤':80,
    '赤塚':83,
    '赤羽':75,
    '赤羽岩淵':77,
    '赤羽橋':77,
    '越中島':78,
    '足立小台':82,
    '辰巳':82,
    '都庁前':47,
    '都立大学':81,
    '都立家政':79,
    '都電雑司ヶ谷':61,
    '野方':78,
    '金町':80,
    '銀座':61,
    '銀座一丁目':61,
    '錦糸町':69,
    '鐘ヶ淵':81,
    '長原':80,
    '門前仲町':79,
    '阿佐ヶ谷':78,
    '雑司が谷':70,
    '雑色':83,
    '雪が谷大塚':82,
    '霞ケ関':68,
    '青井':79,
    '青山一丁目':78,
    '青海':83,
    '青物横丁':78,
    '青砥':80,
    '面影橋':77,
    '飛鳥山':79,
    '飯田橋':79,
    '馬喰横山':68,
    '馬喰町':67,
    '馬込':81,
    '駒場東大前':69,
    '駒沢大学':81,
    '駒込':80,
    '高井戸':82,
    '高円寺':74,
    '高島平':79,
    '高田馬場':74,
    '高輪ゲートウェイ':78,
    '高輪台':79,
    '高野':82,
    '鬼子母神前':62,
    '鮫洲':78,
    '鵜の木':83,
    '鶯谷':71,
    '鷺ノ宮':80,
    '麹町':82,
    '麻布十番':80,
}

# MEDICAL_BASE・WALK_BASE: 新駅はOSMが上書きするため一律デフォルト値
# 江戸川区12駅は実データから引き継ぎ（STATION_OVERRIDEで上書き）
MEDICAL_BASE_DEFAULT = 55
WALK_BASE_DEFAULT    = 60

STATION_OVERRIDE = {
    # 江戸川区12駅（実測値）
    'nishikasai': {'medical_base':78, 'walk_base':80},
    'kasai':      {'medical_base':90, 'walk_base':80},
    'kasairinkai':{'medical_base':30, 'walk_base':80},
    'funabori':   {'medical_base':78, 'walk_base':80},
    'ichinoe':    {'medical_base':30, 'walk_base':40},
    'mizue':      {'medical_base':66, 'walk_base':80},
    'shinozaki':  {'medical_base':66, 'walk_base':80},
    'koiwa':      {'medical_base':30, 'walk_base':40},
    'shinkoiwa':  {'medical_base':81, 'walk_base':80},
    'hirai':      {'medical_base':69, 'walk_base':80},
    'edogawa':    {'medical_base':30, 'walk_base':40},
    'keiseikoiwa':{'medical_base':95, 'walk_base':80},
}

# ============================================================
# カーシェアステーション座標リスト（ペット可/不可）
# ============================================================
CARSHARE_STATIONS = [
    # --- MaaS Car（犬OK・ケージ必須）---
    ('MaaS Car', 35.693058, 139.893829, True),
    ('MaaS Car', 35.683475, 139.865875, True),
    ('MaaS Car', 35.684795, 139.862701, True),
    ('MaaS Car', 35.669868, 139.858429, True),
    ('MaaS Car', 35.711773, 139.864899, True),
    ('MaaS Car', 35.707924, 139.908157, True),
    # --- EARTH CAR（犬OK扱い）---
    ('EARTH CAR', 35.670399, 139.879639, True),
    ('EARTH CAR', 35.682373, 139.866043, True),
    # --- EveryGo（江戸川区なし・23区拡大時に追加）---
    # --- 以下はOSM(amenity=car_sharing)で自動取得 ---
]

def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    p = math.pi / 180
    a = math.sin((lat2-lat1)*p/2)**2 + math.cos(lat1*p)*math.cos(lat2*p)*math.sin((lng2-lng1)*p/2)**2
    return R * 2 * math.asin(math.sqrt(a))

# ============================================================
# ID生成
# ============================================================
EXISTING_IDS = {
    '江戸川区': {
        '西葛西':'nishikasai','葛西':'kasai','葛西臨海公園':'kasairinkai',
        '船堀':'funabori','一之江':'ichinoe','瑞江':'mizue','篠崎':'shinozaki',
        '小岩':'koiwa','新小岩':'shinkoiwa','平井':'hirai',
        '江戸川':'edogawa','京成小岩':'keiseikoiwa'
    }
}

def make_id(ku, name):
    if ku in EXISTING_IDS and name in EXISTING_IDS[ku]:
        return EXISTING_IDS[ku][name]
    key = ku + name
    h = hashlib.md5(key.encode()).hexdigest()[:6]
    clean = unicodedata.normalize('NFKC', name)
    clean = re.sub(r'[^\w]', '', clean)
    return clean + '_' + h

# ============================================================
# Excel読み込み
# ============================================================
def load_stations():
    wb = openpyxl.load_workbook(EXCEL)
    results = []
    for ws in wb.worksheets:
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row[0]: continue
            ku, name, line, lat, lng, fl = row[0],row[1],row[2],row[3],row[4],row[5]
            if not lat or not lng: continue
            sid = make_id(ku, name)
            results.append({'id':sid,'name':name,'line':line,
                            'lat':float(lat),'lng':float(lng),'fl':int(fl or 2),'ku':ku})
    return results

# ============================================================
# OSMクエリ
# ============================================================
def get_fac(lat, lng):
    a, c = str(RADIUS), f'{lat},{lng}'
    q = (
        '[out:json][timeout:60];('
        f'node[leisure=park](around:{a},{c});'
        f'way[leisure=park](around:{a},{c});'
        f'node[leisure=dog_park](around:{a},{c});'
        f'way[leisure=dog_park](around:{a},{c});'
        f'node[amenity=veterinary](around:{a},{c});'
        f'node[shop=pet](around:{a},{c});'
        f'node[shop=pet_grooming](around:{a},{c});'
        f'node[amenity=animal_boarding](around:{a},{c});'
        f'node[amenity=cafe][dogs=yes](around:{a},{c});'
        f'node[amenity=cafe][dog=yes](around:{a},{c});'
        f'node[amenity=restaurant][dogs=yes](around:{a},{c});'
        f'node[amenity=restaurant][dog=yes](around:{a},{c});'
        f'node[amenity=car_sharing](around:{a},{c});'
        f'node[amenity=car_rental](around:{a},{c});'
        ');out center;'
    )
    try:
        r = requests.post(OVERPASS, data={'data': q}, timeout=60)
        els = r.json().get('elements', [])
        parks, vets, vets_emergency, dogruns = [], [], [], []
        groomings, dog_cafes, carshares, car_rentals = [], [], [], []
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
            if leisure == 'park':
                parks.append(n)
            elif leisure == 'dog_park':
                dogruns.append(n)
            elif amenity == 'veterinary':
                vets.append(n)
                if '24/7' in hours or 'emergency' in emerg or '夜間' in n or '救急' in n:
                    vets_emergency.append(n)
            elif shop in ('pet_grooming','grooming') or amenity == 'animal_boarding':
                groomings.append(n)
            elif amenity in ('cafe','restaurant') and dogs in ('yes','permitted','leashed'):
                dog_cafes.append(n)
            elif amenity == 'car_sharing':
                carshares.append(n)
            elif amenity == 'car_rental':
                car_rentals.append(n)
        return {
            'parks':parks[:5],'dogruns':dogruns[:3],'vets':vets[:5],
            'vets_emergency':vets_emergency[:2],'groomings':groomings[:3],
            'dog_cafes':dog_cafes[:3],'carshares':carshares[:3],'car_rentals':car_rentals[:3],
        }
    except Exception as e:
        print(f'  OSMエラー: {e}')
        return {'parks':[],'dogruns':[],'vets':[],'vets_emergency':[],
                'groomings':[],'dog_cafes':[],'carshares':[],'car_rentals':[]}

# ============================================================
# スコア計算
# ============================================================
BIG_PARK_KEYWORDS = [
    '臨海公園','総合レクリエーション','行船公園','宇喜田公園',
    '篠崎公園','大島小松川','新左近川','小岩公園','親水公園','河川敷',
    '代々木公園','明治神宮','新宿御苑','浜離宮','芝公園','上野公園',
    '井の頭公園','石神井公園','赤塚公園','光が丘公園','舎人公園',
    '砧公園','駒沢公園','多摩川','荒川','隅田公園','木場公園',
]

def calc_walk_score(fac, base):
    park_score   = min(len(fac['parks']) * 10, 50)
    dogrun_score = 40 if fac['dogruns'] else 0
    big_parks    = [p for p in fac['parks'] if any(k in p for k in BIG_PARK_KEYWORDS)]
    bonus        = min(len(big_parks) * 15, 30)
    osm_score    = min(park_score + dogrun_score + bonus, 90)
    if not fac['parks'] and not fac['dogruns']:
        return base
    return round(osm_score * 0.7 + base * 0.3)

def calc_medical_score(fac, base):
    vet_score   = min(len(fac['vets']) * 15, 60)
    emerg_score = 30 if fac['vets_emergency'] else 0
    cafe_score  = min(len(fac['dog_cafes']) * 8, 24)
    groom_score = min(len(fac['groomings']) * 5, 15)
    osm_raw     = vet_score + emerg_score + cafe_score + groom_score
    osm_score   = round(30 + (osm_raw / 129) * 60)
    if len(fac['vets']) == 0 and len(fac['dog_cafes']) == 0:
        return base
    return max(30, min(90, round(osm_score * 0.7 + base * 0.3)))

def calc_mobility_score(fac, sid, st_lat, st_lng, ku):
    pet_ok = sum(1 for _, la, lo, ok in CARSHARE_STATIONS
                 if ok and haversine(st_lat, st_lng, la, lo) <= RADIUS)
    pet_cs_score = min(pet_ok * 10, 20)
    gen_cs_score = min(len(fac['carshares']) * 4, 20)
    rental_score = min(len(fac['car_rentals']) * 7, 14)
    park_contrib = PARKING_WARD.get(ku, 55) * 0.3
    raw          = pet_cs_score + gen_cs_score + rental_score + park_contrib
    normalized   = round(30 + (raw / 73) * 50)
    return max(30, min(80, normalized))

# ============================================================
# メイン処理
# ============================================================
stations = load_stations()
print(f'読み込み完了: {len(stations)}駅')

results = []
for st in stations:
    print(f'📍 {st["ku"]} {st["name"]}')
    fac = get_fac(st['lat'], st['lng'])
    time.sleep(1.5)

    sid = st['id']
    ku  = st['ku']
    ov  = STATION_OVERRIDE.get(sid, {})

    walk  = calc_walk_score(fac, ov.get('walk_base', WALK_BASE_DEFAULT))
    med   = calc_medical_score(fac, ov.get('medical_base', MEDICAL_BASE_DEFAULT))
    mob   = calc_mobility_score(fac, sid, st['lat'], st['lng'], ku)

    results.append({
        'id': sid, 'name': st['name'], 'line': st['line'],
        'lat': st['lat'], 'lng': st['lng'],
        'walk':     walk,
        'housing':  HOUSING_WARD.get(ku, 65),
        'medical':  med,
        'mobility': mob,
        'safety':   SAFETY_STATION.get(st['name'], SAFETY_WARD.get(ku, 70)),
        'fl':       st['fl'],
        'parks':    fac['parks'],
        'dogruns':  fac['dogruns'],
        'vets':     fac['vets'],
        'vets_emergency': fac['vets_emergency'],
        'groomings':fac['groomings'],
        'dog_cafes':fac['dog_cafes'],
        'carshares':fac['carshares'],
        'car_rentals':fac['car_rentals'],
    })

os.makedirs('data', exist_ok=True)
with open('data/stations.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f'✅ {len(results)}駅保存完了')
