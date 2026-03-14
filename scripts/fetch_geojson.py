import requests, json, os

def fetch():
    # 国土数値情報 行政区域データ API
    # 江戸川区コード: 13123
    url = "https://geoshape.ex.nii.ac.jp/city/geojson/20230101/13/13123_g.geojson"
    
    try:
        print("国土数値情報から取得中...")
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        data = r.json()
        features = data.get("features", [])
        print(f"取得件数: {len(features)}")
        
        os.makedirs("data", exist_ok=True)
        with open("data/edogawa.geojson", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        print("✅ 保存完了")
        
        # 丁目名と座標の確認
        for f in features[:5]:
            props = f.get("properties", {})
            print(f"  - {props}")
            
    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        
        # フォールバック
        os.makedirs("data", exist_ok=True)
        with open("data/edogawa.geojson", "w") as f:
            json.dump({"type": "FeatureCollection", "features": []}, f)

if __name__ == "__main__":
    fetch()
