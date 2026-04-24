import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests, json

OVERPASS = 'https://overpass-api.de/api/interpreter'
query = """[out:json][timeout:120];
(
  node["shop"="pet_grooming"](35.50,139.60,35.85,139.95);
  way["shop"="pet_grooming"](35.50,139.60,35.85,139.95);
  node["amenity"="veterinary"]["dog"="yes"](35.50,139.60,35.85,139.95);
  node["shop"="pet"](35.50,139.60,35.85,139.95);
);
out center;
"""

print("Overpass APIに接続中...")
headers = {'User-Agent': 'inumap-grooming-fetcher/1.0'}
response = requests.post(OVERPASS, data={'data': query}, headers=headers, timeout=150)
response.raise_for_status()
data = response.json()

grooming = []
for el in data['elements']:
    lat = el.get('lat') or el.get('center', {}).get('lat')
    lng = el.get('lon') or el.get('center', {}).get('lon')
    name = el.get('tags', {}).get('name', '')
    if lat and lng:
        grooming.append({'name': name, 'lat': lat, 'lng': lng})

with open('data/grooming.json', 'w', encoding='utf-8') as f:
    json.dump(grooming, f, ensure_ascii=False, indent=2)

print(f'取得件数: {len(grooming)}件')
print('\nサンプル5件:')
for g in grooming[:5]:
    print(f"  {g['name'] or '(名称なし)':30} ({g['lat']:.4f},{g['lng']:.4f})")
