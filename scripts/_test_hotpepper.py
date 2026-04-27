import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests, json

API_KEY = '6afd93591758fd72'

BEAUTY_URL  = 'https://webservice.recruit.co.jp/hotpepper/beauty/v1/'
GOURMET_URL = 'https://webservice.recruit.co.jp/hotpepper/gourmet/v1/'

# 西葛西駅
lat, lng = 35.6716, 139.8574
name = '西葛西'

print(f'=== {name} テスト (lat={lat}, lng={lng}) ===\n')

# Beauty API
print('--- ホットペッパービューティー (range=4/2km) ---')
r = requests.get(BEAUTY_URL, params={
    'key': API_KEY, 'lat': lat, 'lng': lng,
    'range': 4, 'format': 'json', 'count': 100,
}, timeout=15)
print(f'status: {r.status_code}')
data = r.json()
results_info = data.get('results', {})
print(f'available_count: {results_info.get("results_available", "?")}')
salons = results_info.get('salon', [])
print(f'returned: {len(salons)}件')
for s in salons[:5]:
    print(f'  {s.get("name",""):30} lat={s.get("lat")} lng={s.get("lng")}')

print()

# Gourmet API
print('--- ホットペッパーグルメ ペット可 (range=4/2km) ---')
r = requests.get(GOURMET_URL, params={
    'key': API_KEY, 'lat': lat, 'lng': lng,
    'range': 4, 'pet': 1, 'format': 'json', 'count': 100,
}, timeout=15)
print(f'status: {r.status_code}')
data = r.json()
results_info = data.get('results', {})
print(f'available_count: {results_info.get("results_available", "?")}')
shops = results_info.get('shop', [])
print(f'returned: {len(shops)}件')
for s in shops[:5]:
    print(f'  {s.get("name",""):30} lat={s.get("lat")} lng={s.get("lng")}')
