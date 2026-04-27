import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('C:/inumap-repo2/scripts/fetch_geojson.py', encoding='utf-8') as f:
    src = f.read()

# ===== 1. calc_walk_score を3関数に分割 =====
old_func = (
    'def calc_walk_score(nearby_parks, base, base_is_override=False, walk_max=None):\n'
    '    # 公園スコア（種別11・12緑地・緑道を除く）\n'
    '    large_wide    = [p for p in nearby_parks if _classify_park(p) == \'large_wide\']\n'
    '    large_general = [p for p in nearby_parks if _classify_park(p) == \'large_general\']\n'
    '    medium        = [p for p in nearby_parks if _classify_park(p) == \'medium\']\n'
    '    small         = [p for p in nearby_parks if _classify_park(p) == \'small\']\n'
    '    park_score = (\n'
    '        min(len(large_wide)    * 60, 60) +   # 大型広域：60pt・1つで上限\n'
    '        min(len(large_general) * 50, 50) +   # 大型総合（都営特例含む）：50pt・1つで上限\n'
    '        min(len(medium)        * 20, 40) +   # 中型地区：2つまで上限40pt\n'
    '        min(len(small)         *  8, 16)     # 小型近隣：2つまで上限16pt\n'
    '    )\n'
    '    # 緑地・緑道スコア（種別11・12のみ、別軸）\n'
    '    greenways  = [p for p in nearby_parks if p.get(\'type\') == \'greenway\']\n'
    '    large_gw   = [p for p in greenways if p[\'area\'] >= 100000]\n'
    '    medium_gw  = [p for p in greenways if 10000 <= p[\'area\'] < 100000]\n'
    '    greenway_score = (\n'
    '        min(len(large_gw)  * 15, 15) +   # 大型緑地：1つで上限\n'
    '        min(len(medium_gw) *  8, 16)     # 中型緑地：2つまで\n'
    '    )\n'
    '    # ドッグランボーナス（公園規模別・緑地除く）\n'
    '    dogrun_parks = [p for p in nearby_parks if p[\'dogrun\'] and p.get(\'type\') != \'greenway\']\n'
    '    if dogrun_parks:\n'
    '        max_dogrun = max(dogrun_parks, key=lambda p: p[\'area\'])\n'
    '        max_dogrun_class = _classify_park(max_dogrun)\n'
    '        if max_dogrun[\'area\'] >= 500000 or max_dogrun_class == \'large_wide\':\n'
    '            dogrun_bonus = 20   # 大型広域DR\n'
    '        elif max_dogrun_class == \'large_general\':\n'
    '            dogrun_bonus = 18   # 大型総合DR\n'
    '        elif max_dogrun_class == \'medium\':\n'
    '            dogrun_bonus = 22   # 中型DR\n'
    '        else:\n'
    '            dogrun_bonus = 0\n'
    '    else:\n'
    '        dogrun_bonus = 0\n'
    '    osm_score = min(park_score + greenway_score + dogrun_bonus, 90)\n'
    '    if osm_score == 0:\n'
    '        walk = base\n'
    '    elif osm_score < base * 0.5:\n'
    '        walk = round(osm_score * 0.4 + base * 0.6)\n'
    '    else:\n'
    '        walk = round(osm_score * 0.7 + base * 0.3)\n'
    '    if base_is_override:\n'
    '        walk = max(walk, base)\n'
    '    if walk_max is not None:\n'
    '        walk = min(walk, walk_max)\n'
    '    MIN_WALK = 35\n'
    '    walk = max(walk, MIN_WALK)\n'
    '    if walk_max is not None:\n'
    '        walk = min(walk, walk_max)\n'
    '    return walk'
)

new_func = (
    'MIN_WALK = 35\n'
    '\n'
    'def calc_osm_score(nearby_parks):\n'
    '    """公園・緑地・ドッグランからosm_score（blend前）を計算"""\n'
    '    large_wide    = [p for p in nearby_parks if _classify_park(p) == \'large_wide\']\n'
    '    large_general = [p for p in nearby_parks if _classify_park(p) == \'large_general\']\n'
    '    medium        = [p for p in nearby_parks if _classify_park(p) == \'medium\']\n'
    '    small         = [p for p in nearby_parks if _classify_park(p) == \'small\']\n'
    '    park_score = (\n'
    '        min(len(large_wide)    * 60, 60) +   # 大型広域：60pt・1つで上限\n'
    '        min(len(large_general) * 50, 50) +   # 大型総合（都営特例含む）：50pt・1つで上限\n'
    '        min(len(medium)        * 20, 40) +   # 中型地区：2つまで上限40pt\n'
    '        min(len(small)         *  8, 16)     # 小型近隣：2つまで上限16pt\n'
    '    )\n'
    '    greenways  = [p for p in nearby_parks if p.get(\'type\') == \'greenway\']\n'
    '    large_gw   = [p for p in greenways if p[\'area\'] >= 100000]\n'
    '    medium_gw  = [p for p in greenways if 10000 <= p[\'area\'] < 100000]\n'
    '    greenway_score = (\n'
    '        min(len(large_gw)  * 15, 15) +   # 大型緑地：1つで上限\n'
    '        min(len(medium_gw) *  8, 16)     # 中型緑地：2つまで\n'
    '    )\n'
    '    dogrun_parks = [p for p in nearby_parks if p[\'dogrun\'] and p.get(\'type\') != \'greenway\']\n'
    '    if dogrun_parks:\n'
    '        max_dogrun = max(dogrun_parks, key=lambda p: p[\'area\'])\n'
    '        max_dogrun_class = _classify_park(max_dogrun)\n'
    '        if max_dogrun[\'area\'] >= 500000 or max_dogrun_class == \'large_wide\':\n'
    '            dogrun_bonus = 20   # 大型広域DR\n'
    '        elif max_dogrun_class == \'large_general\':\n'
    '            dogrun_bonus = 18   # 大型総合DR\n'
    '        elif max_dogrun_class == \'medium\':\n'
    '            dogrun_bonus = 22   # 中型DR\n'
    '        else:\n'
    '            dogrun_bonus = 0\n'
    '    else:\n'
    '        dogrun_bonus = 0\n'
    '    return min(park_score + greenway_score + dogrun_bonus, 90)\n'
    '\n'
    '\n'
    'def get_walk_base(st, osm_cache, stations, ward_default):\n'
    '    """2km圏内の居住駅のosm_score平均をbaseとする。該当なければ区デフォルト"""\n'
    '    nearby_osms = []\n'
    '    for other in stations:\n'
    '        if other[\'id\'] == st[\'id\']:\n'
    '            continue\n'
    '        if other[\'name\'] in NON_RESIDENTIAL_STATIONS:\n'
    '            continue\n'
    '        dist = haversine(st[\'lat\'], st[\'lng\'], other[\'lat\'], other[\'lng\'])\n'
    '        if dist <= 2000:\n'
    '            other_osm = osm_cache.get(other[\'id\'], 0)\n'
    '            if other_osm > 0:\n'
    '                nearby_osms.append(other_osm)\n'
    '    if nearby_osms:\n'
    '        return round(sum(nearby_osms) / len(nearby_osms))\n'
    '    return ward_default.get(st.get(\'ku\', \'\'), 40)\n'
    '\n'
    '\n'
    'def apply_walk_score(osm, base, base_is_override=False, walk_max=None):\n'
    '    """osm_scoreとbaseからwalkスコアを確定"""\n'
    '    if osm == 0:\n'
    '        walk = base\n'
    '    elif osm < base * 0.5:\n'
    '        walk = round(osm * 0.4 + base * 0.6)\n'
    '    else:\n'
    '        walk = osm   # 公園データ十分 → osm直接使用\n'
    '    if base_is_override:\n'
    '        walk = max(walk, base)\n'
    '    if walk_max is not None:\n'
    '        walk = min(walk, walk_max)\n'
    '    walk = max(walk, MIN_WALK)\n'
    '    if walk_max is not None:\n'
    '        walk = min(walk, walk_max)\n'
    '    return walk'
)

if old_func in src:
    src = src.replace(old_func, new_func, 1)
    print('Step1 OK: 3関数に分割完了')
else:
    print('ERROR: old_func not found')
    # デバッグ: 最初の100文字比較
    idx = src.find('def calc_walk_score')
    if idx >= 0:
        print(f'Found at {idx}, first 200 chars:')
        print(repr(src[idx:idx+200]))
    sys.exit(1)

# ===== 2. メイン処理を2パス設計に置換 =====
old_main_marker = (
    'results = []\n'
    'for st in stations:\n'
    '    print(f\'>> {st["ku"]} {st["name"]}\')\n'
    '    fac = get_fac(st[\'lat\'], st[\'lng\'])\n'
    '    # 洪水リスク: タイルから取得、失敗時はmaster.xlsxの値を使う\n'
    '    fl_val = get_flood_level(st[\'lat\'], st[\'lng\'])\n'
    '    if fl_val is None:\n'
    '        fl_val = st[\'fl\']  # フォールバック\n'
    '    time.sleep(1.5)\n'
    '\n'
    '    sid = st[\'id\']\n'
    '    ku  = st[\'ku\']\n'
    '    ov  = STATION_OVERRIDE.get(sid, {})\n'
    '\n'
    '    # walk: STATION_OVERRIDEのwalk_baseを優先、なければWALK_WARD_DEFAULT（区別デフォルト）を使用\n'
    '    nearby_parks = get_nearby_parks(st[\'lat\'], st[\'lng\'])\n'
    '    walk_base = ov.get(\'walk_base\', WALK_WARD_DEFAULT.get(ku, 40))\n'
    '    walk_is_override = \'walk_base\' in ov\n'
    '    walk_max = ov.get(\'walk_max\', None)\n'
    '    walk  = calc_walk_score(nearby_parks, walk_base, base_is_override=walk_is_override, walk_max=walk_max)'
)

new_main_marker = (
    '# パス1: 全駅のosm_scoreをキャッシュ（APIなし・公園データのみ）\n'
    'print(\'=== パス1: osm_scoreキャッシュ計算中 ===\')\n'
    'osm_cache = {}\n'
    'for st in stations:\n'
    '    nearby = get_nearby_parks(st[\'lat\'], st[\'lng\'])\n'
    '    osm_cache[st[\'id\']] = calc_osm_score(nearby)\n'
    'print(f\'osm_cacheキャッシュ完了: {len(osm_cache)}件\')\n'
    '\n'
    '# パス2: メイン処理（API呼び出し・walkスコア確定）\n'
    'results = []\n'
    'for st in stations:\n'
    '    print(f\'>> {st["ku"]} {st["name"]}\')\n'
    '    fac = get_fac(st[\'lat\'], st[\'lng\'])\n'
    '    # 洪水リスク: タイルから取得、失敗時はmaster.xlsxの値を使う\n'
    '    fl_val = get_flood_level(st[\'lat\'], st[\'lng\'])\n'
    '    if fl_val is None:\n'
    '        fl_val = st[\'fl\']  # フォールバック\n'
    '    time.sleep(1.5)\n'
    '\n'
    '    sid = st[\'id\']\n'
    '    ku  = st[\'ku\']\n'
    '    ov  = STATION_OVERRIDE.get(sid, {})\n'
    '\n'
    '    # walk: 2パス設計（周辺駅osm平均をbase、osm充足時はosm直接使用）\n'
    '    nearby_parks = get_nearby_parks(st[\'lat\'], st[\'lng\'])\n'
    '    osm      = osm_cache.get(sid, 0)\n'
    '    walk_max = ov.get(\'walk_max\', None)\n'
    '    if \'walk_base\' in ov:\n'
    '        walk_base        = ov[\'walk_base\']\n'
    '        walk_is_override = True\n'
    '    else:\n'
    '        walk_base        = get_walk_base(st, osm_cache, stations, WALK_WARD_DEFAULT)\n'
    '        walk_is_override = False\n'
    '    walk  = apply_walk_score(osm, walk_base, base_is_override=walk_is_override, walk_max=walk_max)'
)

if old_main_marker in src:
    src = src.replace(old_main_marker, new_main_marker, 1)
    print('Step2 OK: メイン処理2パス化完了')
else:
    print('ERROR: old_main_marker not found')
    idx = src.find('results = []\nfor st in stations:')
    print(f'results=[] at idx={idx}')
    if idx >= 0:
        print(repr(src[idx:idx+400]))
    sys.exit(1)

with open('C:/inumap-repo2/scripts/fetch_geojson.py', 'w', encoding='utf-8') as f:
    f.write(src)
print('ファイル書き込み完了')
