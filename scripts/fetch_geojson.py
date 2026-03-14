import requests, json, os

# 国土数値情報 行政区域データ API（江戸川区コード: 13123）
URL = "https://opendata.jp/api/2/rest/dataset?q=13123&fq=dataset_type:1"

# Overpass API で江戸川区の丁目ポリゴンを取得
OVERPASS = "https://overpass-api.de/api/interpreter"

query = """
[out:json][timeout:60];
relation["admin_level"="9"]["name"~"江戸川区"]
  (35.61,139.82,35.76,139.92);
out geom;
"""

def fetch():
    try:
        r = requests.post(OVERPASS, data={"data": query}, timeout=60)
        data = r.json()
        elements = data.get("elements", [])
        
        features = []
        for el in elements:
            if el.get("type") != "relation":
                continue
            name = el.get("tags", {}).get("name", "")
            if not name:
                continue
            
            # メンバーからポリゴンを構築
            coords = []
            for member in el.get("members", []):
                if member.get("role") == "outer" and "geometry" in member:
                    ring = [[p["lon"], p["lat"]] for p in member["geometry"]]
                    if ring and ring[0] != ring[-1]:
                        ring.append(ring[0])
                    coords.append(ring)
            
            if coords:
                features.append({
                    "type": "Feature",
                    "properties": {"name": name},
                    "geometry": {
                        "type": "Polygon" if len(coords) == 1 else "MultiPolygon",
                        "coordinates": coords if len(coords) == 1 else [coords]
                    }
                })
        
        geojson = {"type": "FeatureCollection", "features": features}
        
        os.makedirs("data", exist_ok=True)
        with open("data/edogawa.geojson", "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False)
        
        print(f"✅ {len(features)}丁目のポリゴンを取得しました")
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        # フォールバック：空のGeoJSONを作成
        os.makedirs("data", exist_ok=True)
        with open("data/edogawa.geojson", "w") as f:
            json.dump({"type": "FeatureCollection", "features": []}, f)

if __name__ == "__main__":
    fetch()
