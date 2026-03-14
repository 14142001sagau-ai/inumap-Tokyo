import requests, json, os

OVERPASS = "https://overpass-api.de/api/interpreter"

query = """
[out:json][timeout:90];
area["name"="江戸川区"]["admin_level"="7"]->.ward;
relation["admin_level"="9"](area.ward);
out geom;
"""

def build_polygon(members):
    # wayのgeometryを順番に繋いでリングを作る
    ways = []
    for member in members:
        if member.get("role") == "outer" and "geometry" in member:
            ways.append([[p["lon"], p["lat"]] for p in member["geometry"]])
    
    if not ways:
        return None
    
    # 1つのwayだけの場合
    if len(ways) == 1:
        ring = ways[0]
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        return [ring]
    
    # 複数wayを繋ぎ合わせる
    result = list(ways[0])
    used = [False] * len(ways)
    used[0] = True
    
    for _ in range(len(ways) - 1):
        last = result[-1]
        for i, way in enumerate(ways):
            if used[i]:
                continue
            if way[0] == last or (abs(way[0][0]-last[0])<0.0001 and abs(way[0][1]-last[1])<0.0001):
                result.extend(way[1:])
                used[i] = True
                break
            elif way[-1] == last or (abs(way[-1][0]-last[0])<0.0001 and abs(way[-1][1]-last[1])<0.0001):
                result.extend(list(reversed(way))[1:])
                used[i] = True
                break
    
    if result[0] != result[-1]:
        result.append(result[0])
    
    return [result]

def fetch():
    try:
        r = requests.post(OVERPASS, data={"data": query}, timeout=90)
        data = r.json()
        elements = data.get("elements", [])
        print(f"取得件数: {len(elements)}")

        features = []
        for el in elements:
            if el.get("type") != "relation":
                continue
            name = el.get("tags", {}).get("name", "")
            if not name:
                continue
            
            coords = build_polygon(el.get("members", []))
            if coords:
                features.append({
                    "type": "Feature",
                    "properties": {"name": name},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": coords
                    }
                })

        print(f"ポリゴン数: {len(features)}")
        os.makedirs("data", exist_ok=True)
        with open("data/edogawa.geojson", "w", encoding="utf-8") as f:
            json.dump({"type": "FeatureCollection", "features": features}, f, ensure_ascii=False)
        print("✅ 保存完了")

    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        os.makedirs("data", exist_ok=True)
        with open("data/edogawa.geojson", "w") as f:
            json.dump({"type": "FeatureCollection", "features": []}, f)

if __name__ == "__main__":
    fetch()
