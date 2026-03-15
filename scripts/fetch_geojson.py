import requests, json, os, time

OVERPASS = 'https://overpass-api.de/api/interpreter'

STATIONS = [
    {'id':'nishikasai',  'name':'西葛西',      'line':'東京メトロ東西線', 'fl':4},
    {'id':'kasai',       'name':'葛西',        'line':'東京メトロ東西線', 'fl':3},
    {'id':'kasairinkai', 'name':'葛西臨海公園', 'line':'JR京葉線',        'fl':5},
    {'id':'funabori',    'name':'船堀',        'line':'都営新宿線',       'fl':3},
    {'id':'ichinoe',     'name':'一之江',      'line':'都営新宿線',       'fl':3},
    {'id':'mizue',       'name':'瑞江',        'line':'都営新宿線',       'fl':2},
    {'id':'shinozaki',   'name':'篠崎',        'line':'都営新宿線',       'fl':2},
    {'id':'koiwa',       'name':'小岩',        'line':'JR総武線',         'fl':2},
    {'id':'shinkoiwa',   'name':'新小岩',      'line':'JR総武線',         'fl':2},
    {'id':'hirai',       'name':'平井',        'line':'JR総武線',         'fl':1},
]

RADIUS = 1000
BBOX = '35.63,139.82,35.75,139.95'

def get_station_coord(name):
    q = '[out:json][timeout:30];node[railway=station][name=' + chr(34) + name + chr(34) + '](' + BBOX + ');out 1;'
    try:
        r = requests.post(OVERPASS, data={'data': q}, timeout=30)
        els = r.json().get('elements', [])
        if els:
            return els[0]['lat'], els[0]['lon']
    except Exception as e:
        print('  座標取得エラー ' + name + ': ' + str(e))
    return None, None

def get_facilities(lat, lng):
    a = str(RADIUS)
    c = str(lat) + ',' + str(lng)
    q = '[out:json][timeout:45];(node[leisure=park](around:' + a + ',' + c + ');way[leisure=park](around:' + a + ',' + c + ');node[shop=supermarket](around:' + a + ',' + c + ');node[amenity=veterinary](around:' + a + ',' + c + ');node[leisure=dog_park](around:' + a + ',' + c + ');node[shop=pet](around:' + a + ',' + c + ');node[amenity=car_sharing](around:' + a + ',' + c + '););out center;'
    try:
        r = requests.post(OVERPASS, data={'data': q}, timeout=45)
        els = r.json().get('elements', [])
        parks,shops,vets,cafes,dogruns,pets,carshares=[],[],[],[],[],[],[]
        for el in els:
            tags = el.get('tags', {})
            n = tags.get('name', '')
            if not n:
                continue
            if tags.get('leisure') == 'park': parks.append(n)
            elif tags.get('leisure') == 'dog_park': dogruns.append(n)
            elif tags.get('shop') == 'supermarket': shops.append(n)
            elif tags.get('amenity') == 'veterinary': vets.append(n)
            elif tags.get('amenity') == 'cafe': cafes.append(n)
            elif tags.get('shop') == 'pet': pets.append(n)
            elif tags.get('amenity') == 'car_sharing': carshares.append(n)
        return {'parks':parks[:5],'shops':shops[:5],'vets':vets[:5],'cafes':cafes[:3],'dogruns':dogruns[:3],'pets':pets[:3],'carshares':carshares[:3]}
    except Exception as e:
        print('  施設取得エラー: ' + str(e))
        return {'parks':[],'shops':[],'vets':[],'cafes':[],'dogruns':[],'pets':[],'carshares':[]}

HOUSING   = {'nishikasai':62,'kasai':63,'kasairinkai':50,'funabori':66,'ichinoe':68,'mizue':72,'shinozaki':76,'koiwa':70,'shinkoiwa':68,'hirai':70}
SAFETY    = {'nishikasai':78,'kasai':74,'kasairinkai':82,'funabori':72,'ichinoe':74,'mizue':76,'shinozaki':82,'koiwa':55,'shinkoiwa':54,'hirai':70}
COMMUNITY = {'nishikasai':71,'kasai':69,'kasairinkai':65,'funabori':67,'ichinoe':69,'mizue':70,'shinozaki':79,'koiwa':70,'shinkoiwa':68,'hirai':72}

def main():
    print('INUMAP データ収集開始')
    results = []
    for st in STATIONS:
        print('📍 ' + st['name'] + '駅...')
        lat, lng = get_station_coord(st['name'])
        if lat is None:
            print('  スキップ')
            continue
        print('  座標: ' + str(lat) + ', ' + str(lng))
        time.sleep(1)
        fac = get_facilities(lat, lng)
        print('  公園:' + str(len(fac['parks'])) + ' 動物病院:' + str(len(fac['vets'])))
        time.sleep(1.5)
        walk     = min(100, 40 + len(fac['parks'])*8 + len(fac['dogruns'])*15)
        medical  = min(100, 30 + len(fac['vets'])*12 + len(fac['cafes'])*8 + len(fac['pets'])*5)
        mobility = min(100, 50 + len(fac['carshares'])*10)
        results.append({'id':st['id'],'name':st['name'],'line':st['line'],'lat':lat,'lng':lng,'walk':walk,'housing':HOUSING.get(st['id'],65),'medical':medical,'mobility':mobility,'community':COMMUNITY.get(st['id'],68),'safety':SAFETY.get(st['id'],70),'fl':st['fl'],'parks':fac['parks'],'shops':fac['shops'],'vets':fac['vets'],'cafes':fac['cafes'],'dogruns':fac['dogruns'],'carshares':fac['carshares']})
    os.makedirs('data', exist_ok=True)
    with open('data/stations.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print('✅ ' + str(len(results)) + '駅保存完了')

if __name__ == '__main__':
    main()
