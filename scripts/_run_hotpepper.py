import sys, requests, json, time
sys.stdout.reconfigure(encoding='utf-8')

API_KEY = '6afd93591758fd72'

with open('data/stations.json', encoding='utf-8') as f:
    stations = json.load(f)

GOURMET_URL = 'https://webservice.recruit.co.jp/hotpepper/gourmet/v1/'
PET_KEYWORDS = [
    'ペット可','ペット同伴','ペットOK','ペットok',
    '犬OK','犬ok','犬可','ワンちゃんOK','わんちゃんOK',
    'ドッグOK','dog ok','pet ok','ペットウェルカム',
]

def fetch_shops(lat, lng, extra):
    try:
        r = requests.get(GOURMET_URL, params={
            'key':API_KEY,'lat':lat,'lng':lng,
            'range':4,'format':'json','count':100,**extra
        }, timeout=15)
        return r.json().get('results',{}).get('shop',[])
    except:
        return []

all_results = []
active = [s for s in stations if s.get('walk') is not None]
print(f'対象: {len(active)}駅', flush=True)

for i, st in enumerate(active):
    lat, lng = st['lat'], st['lng']
    for shop in fetch_shops(lat, lng, {'pet':1}):
        all_results.append({'name':shop['name'],'lat':float(shop['lat']),'lng':float(shop['lng'])})
    time.sleep(0.15)
    for kw in PET_KEYWORDS:
        for shop in fetch_shops(lat, lng, {'freeword':kw}):
            all_results.append({'name':shop['name'],'lat':float(shop['lat']),'lng':float(shop['lng'])})
        time.sleep(0.15)
    if (i+1) % 50 == 0:
        print(f'{i+1}/{len(active)}駅完了 raw:{len(all_results)}件', flush=True)

def dedup(places):
    seen_set, unique = set(), []
    for p in places:
        k = (round(p['lat'],4), round(p['lng'],4))
        if k not in seen_set:
            seen_set.add(k)
            unique.append(p)
    return unique

unique = dedup(all_results)
with open('data/pet_cafe.json', 'w', encoding='utf-8') as f:
    json.dump(unique, f, ensure_ascii=False, indent=2)
print(f'完了: raw={len(all_results)} → 重複除去後={len(unique)}件', flush=True)
