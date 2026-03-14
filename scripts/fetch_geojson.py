import requests, json, os

OVERPASS = "https://overpass-api.de/api/interpreter"

query = """
[out:json][timeout:90];
area["name"="江戸川区"]["admin_level"="7"]->.ward;
relation["admin_level"="9"](area.ward);
out geom;
"""

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
            coords = []
            for member in el.get("members", []):
                if member.get("role") == "outer" and "geometry" in member:
                    ring = [[p["lon"], p["lat"]] for p in member["geometry"]]
                    if len(ring) > 2:
                        if ring[0] != ring[-1]:
                            ring.append(ring[0])
                        coords.append(ring)
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
        os.makedirs("data", exist_ok=True)
        with open("data/edogawa.geojson", "w") as f:
            json.dump({"type": "FeatureCollection", "features": []}, f)

if __name__ == "__main__":
    fetch()
