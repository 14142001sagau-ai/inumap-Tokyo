import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests, json, time

OVERPASS = 'https://overpass-api.de/api/interpreter'
query = """[out:json][timeout:120];
area["name"="東京都"]["admin_level"="4"]->.tokyo;
(
  node["amenity"="veterinary"](area.tokyo);
  way["amenity"="veterinary"](area.tokyo);
  relation["amenity"="veterinary"](area.tokyo);
);
out center;
"""

print("Overpass APIに接続中...")
headers = {'User-Agent': 'inumap-vet-fetcher/1.0'}
response = requests.post(OVERPASS, data={'data': query}, headers=headers, timeout=150)
response.raise_for_status()
data = response.json()

vets = []
for el in data['elements']:
    lat = el.get('lat') or el.get('center', {}).get('lat')
    lng = el.get('lon') or el.get('center', {}).get('lon')
    name = el.get('tags', {}).get('name', '')
    if lat and lng:
        vets.append({'name': name, 'lat': lat, 'lng': lng})

with open('data/vets.json', 'w', encoding='utf-8') as f:
    json.dump(vets, f, ensure_ascii=False, indent=2)

print(f'取得件数: {len(vets)}件')
print('\nサンプル5件:')
for v in vets[:5]:
    print(f"  {v['name'] or '(名称なし)':30} lat={v['lat']:.4f} lng={v['lng']:.4f}")
