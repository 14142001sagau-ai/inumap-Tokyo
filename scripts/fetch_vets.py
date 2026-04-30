import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests, json

OVERPASS = 'https://overpass-api.de/api/interpreter'
BBOX = '35.50,139.60,35.85,139.95'

NAME_KEYWORDS = [
    '動物病院','どうぶつクリニック','動物医療','犬猫病院',
    '動物診療','動物総合病院','どうぶつ医療','ペットクリニック',
]

def build_query():
    lines = ['[out:json][timeout:180];', '(']
    for typ in ('node', 'way', 'relation'):
        lines.append(f'  {typ}["amenity"="veterinary"]({BBOX});')
        lines.append(f'  {typ}["healthcare"="veterinary"]({BBOX});')
        for kw in NAME_KEYWORDS:
            lines.append(f'  {typ}["name"~"{kw}"]({BBOX});')
    lines.append(');')
    lines.append('out center;')
    return '\n'.join(lines)

query = build_query()

print('Overpass APIに接続中...')
headers = {'User-Agent': 'inumap-vet-fetcher/1.0'}
response = requests.post(OVERPASS, data={'data': query}, headers=headers, timeout=180)
response.raise_for_status()
data = response.json()

seen = set()
vets = []
for el in data['elements']:
    lat = el.get('lat') or el.get('center', {}).get('lat')
    lng = el.get('lon') or el.get('center', {}).get('lon')
    name = el.get('tags', {}).get('name', '')
    if not lat or not lng:
        continue
    key = (round(lat, 5), round(lng, 5))
    if key in seen:
        continue
    seen.add(key)
    vets.append({'name': name, 'lat': lat, 'lng': lng})

with open('data/vets.json', 'w', encoding='utf-8') as f:
    json.dump(vets, f, ensure_ascii=False, indent=2)

print(f'取得件数: {len(vets)}件')
print('\nサンプル5件:')
for v in vets[:5]:
    print(f"  {v['name'] or '(名称なし)':30} lat={v['lat']:.4f} lng={v['lng']:.4f}")
