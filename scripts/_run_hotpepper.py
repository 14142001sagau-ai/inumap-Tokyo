import sys, requests, json, time
sys.stdout.reconfigure(encoding='utf-8')

API_KEY = '6afd93591758fd72'

with open('data/stations.json', encoding='utf-8') as f:
    stations = json.load(f)

GOURMET_URL = 'https://webservice.recruit.co.jp/hotpepper/gourmet/v1/'

all_results = []
active = [s for s in stations if s.get('walk') is not None]
print(f'対象: {len(active)}駅', flush=True)

for i, st in enumerate(active):
    lat, lng = st['lat'], st['lng']
    try:
        r = requests.get(GOURMET_URL, params={
            'key': API_KEY, 'lat': lat, 'lng': lng,
            'range': 4, 'pet': 1, 'format': 'json', 'count': 100,
        }, timeout=15)
        for shop in r.json().get('results', {}).get('shop', []):
            all_results.append({'name': shop['name'], 'lat': float(shop['lat']), 'lng': float(shop['lng'])})
    except Exception as e:
        print(f'  エラー {st["name"]}: {e}', flush=True)
    time.sleep(0.3)
    if (i + 1) % 50 == 0:
        print(f'{i+1}/{len(active)}駅完了 raw:{len(all_results)}件', flush=True)

def dedup(places):
    seen_set, unique = set(), []
    for p in places:
        k = (round(p['lat'], 4), round(p['lng'], 4))
        if k not in seen_set:
            seen_set.add(k)
            unique.append(p)
    return unique

unique = dedup(all_results)
with open('data/pet_cafe.json', 'w', encoding='utf-8') as f:
    json.dump(unique, f, ensure_ascii=False, indent=2)
print(f'完了: raw={len(all_results)} → 重複除去後={len(unique)}件', flush=True)
