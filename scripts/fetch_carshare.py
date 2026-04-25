import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests, json

OVERPASS = 'https://overpass-api.de/api/interpreter'
query = """[out:json][timeout:120];
(
  node["amenity"="car_sharing"](35.50,139.60,35.85,139.95);
  node["amenity"="car_rental"](35.50,139.60,35.85,139.95);
);
out center;
"""

headers = {'User-Agent': 'inumap-carshare-fetcher/1.0'}
print("Overpass APIに接続中...")
r = requests.post(OVERPASS, data={'data': query}, headers=headers, timeout=150)
r.raise_for_status()
data = r.json()

carshares, car_rentals = [], []
for el in data['elements']:
    lat  = el.get('lat') or el.get('center', {}).get('lat')
    lng  = el.get('lon') or el.get('center', {}).get('lon')
    name = el.get('tags', {}).get('name', '')
    amenity = el.get('tags', {}).get('amenity', '')
    if lat and lng:
        entry = {'name': name, 'lat': lat, 'lng': lng}
        if amenity == 'car_sharing':
            carshares.append(entry)
        else:
            car_rentals.append(entry)

with open('data/carshares.json', 'w', encoding='utf-8') as f:
    json.dump(carshares, f, ensure_ascii=False, indent=2)
with open('data/car_rentals.json', 'w', encoding='utf-8') as f:
    json.dump(car_rentals, f, ensure_ascii=False, indent=2)

print(f'カーシェア: {len(carshares)}件')
print(f'レンタカー: {len(car_rentals)}件')
