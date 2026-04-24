import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests, json, time

API_KEY = input("API Key: ").strip()

with open('data/stations.json', encoding='utf-8') as f:
    stations = json.load(f)

GOURMET_URL = 'https://webservice.recruit.co.jp/hotpepper/gourmet/v1/'

PET_KEYWORDS = [
    'ペット可',
    'ペット同伴',
    'ペットOK',
    'ペットok',
    '犬OK',
    '犬ok',
    '犬可',
    'ワンちゃんOK',
    'わんちゃんOK',
    'ドッグOK',
    'dog ok',
    'pet ok',
    'ペットウェルカム',
]

def fetch_shops(lat, lng, extra_params):
    try:
        r = requests.get(GOURMET_URL, params={
            'key': API_KEY, 'lat': lat, 'lng': lng,
            'range': 4, 'format': 'json', 'count': 100,
            **extra_params,
        }, timeout=15)
        return r.json().get('results', {}).get('shop', [])
    except Exception as e:
        return []

all_results = []

active = [s for s in stations if s.get('walk') is not None]
print(f'対象駅数: {len(active)}駅 / クエリ数: {len(active) * (1 + len(PET_KEYWORDS))}')

for i, st in enumerate(active):
    lat, lng = st['lat'], st['lng']

    # pet=1 フラグ検索
    for shop in fetch_shops(lat, lng, {'pet': 1}):
        all_results.append({'name': shop['name'], 'lat': float(shop['lat']), 'lng': float(shop['lng'])})
    time.sleep(0.15)

    # freeword検索
    for kw in PET_KEYWORDS:
        for shop in fetch_shops(lat, lng, {'freeword': kw}):
            all_results.append({'name': shop['name'], 'lat': float(shop['lat']), 'lng': float(shop['lng'])})
        time.sleep(0.15)

    if (i + 1) % 50 == 0:
        print(f'  {i+1}/{len(active)}駅完了 (累計raw: {len(all_results)}件)')

print(f'\nraw合計: {len(all_results)}件')

# 座標ベース重複除去
def dedup(places):
    seen, unique = set(), []
    for p in places:
        key = (round(p['lat'], 4), round(p['lng'], 4))
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique

unique = dedup(all_results)

with open('data/pet_cafe.json', 'w', encoding='utf-8') as f:
    json.dump(unique, f, ensure_ascii=False, indent=2)

print(f'重複除去後: {len(unique)}件')
print('\nサンプル5件:')
for p in unique[:5]:
    print(f"  {p['name']:35} ({p['lat']:.4f},{p['lng']:.4f})")
