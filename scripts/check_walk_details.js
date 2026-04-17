// Detailed walk score analysis for specific stations
const fs = require('fs');
const stations = JSON.parse(fs.readFileSync('C:/inumap-repo2/data/stations.json','utf8'));

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.asin(Math.sqrt(a));
}

// Full LARGE_PARKS (key parks only for this analysis, centroid-based unless entrances added)
const LARGE_PARKS = [
  // 確認1エリア
  {name:'代々木公園', lat:35.6719, lng:139.6918, area:540529,
   entrances:[[35.6715,139.6993],[35.6804,139.6970],[35.6733,139.6943],[35.6719,139.7055]]},
  {name:'明治神宮', lat:35.6763, lng:139.6993, area:720000,
   entrances:[[35.6763,139.6993],[35.6830,139.6986],[35.6755,139.6940]]},
  {name:'新宿御苑', lat:35.6850, lng:139.7101, area:580000,
   entrances:[[35.6863,139.7101],[35.6837,139.7156]]},
  {name:'明治公園', lat:35.6760, lng:139.7130, area:57309},
  // 確認2エリア
  {name:'上野恩賜公園', lat:35.7138, lng:139.7742, area:538507},
  {name:'旧岩崎邸庭園', lat:35.7095, lng:139.7674, area:18235},
  {name:'六義園', lat:35.7323, lng:139.7463, area:87809},
  // 確認3エリア
  {name:'木場公園', lat:35.6773, lng:139.8086, area:241603},
  {name:'清澄庭園', lat:35.6801, lng:139.7965, area:81091},
  {name:'猿江恩賜公園', lat:35.6907, lng:139.8191, area:145088},
  {name:'荒川千住新橋緑地', lat:35.7603, lng:139.8050, area:122673},
  {name:'荒川四ツ木橋緑地', lat:35.7340, lng:139.8244, area:107001},
  {name:'荒川江北橋緑地', lat:35.7559, lng:139.7731, area:145826},
  {name:'曳舟川親水公園', lat:35.7613, lng:139.8457, area:31892},
  {name:'東立石緑地公園', lat:35.7321, lng:139.8533, area:29441},
  // 日暮里向け
  {name:'上野恩賜公園', lat:35.7138, lng:139.7742, area:538507},
];

function minParkDist(stLat, stLng, p) {
  if (p.entrances && p.entrances.length > 0)
    return Math.min(...p.entrances.map(([la,lo]) => haversine(stLat, stLng, la, lo)));
  return haversine(stLat, stLng, p.lat, p.lng);
}

function newBlended(osm, base) {
  if (osm === 0) return base;
  if (osm < base * 0.5) return Math.round(osm*0.4 + base*0.6);
  return Math.round(osm*0.7 + base*0.3);
}

// WALK_STATION actual values
const WALK_STATION = {
  '明治神宮前':58, '代々木':57, '原宿':48,
  '上野':60, '京成上野':57, '根津':62, '上野御徒町':62, '御徒町':60,
  '上野広小路':62, '湯島':62, '本郷三丁目':64, '鶯谷':58, '入谷':58,
  '日暮里':44, '東大前':65, '新御徒町':41,
  '北千住':70, '青砥':64, '木場':68, '清澄白河':68,
};

const targets1 = ['明治神宮前','代々木','原宿'];
const targets2 = ['上野','京成上野','根津','上野御徒町','御徒町','上野広小路','湯島','本郷三丁目','鶯谷','入谷','日暮里','東大前','新御徒町'];
const targets3 = ['北千住','青砥','木場','清澄白河'];

function analyze(st, targetName) {
  const base = WALK_STATION[st.name] || 60;
  const parks = st.parks || [];
  const dogruns = st.dogruns || [];

  // Replicate calc_walk_score logic
  const parkScore = Math.min(parks.length * 10, 50);
  let dogrunScore = dogruns.length > 0 ? 40 : 0;
  // bonus from BIG_PARK_KEYWORDS in parks list
  const bigParkKeywords = ['代々木公園','明治神宮','新宿御苑','浜離宮','芝公園','上野公園','石神井公園','赤塚公園','光が丘公園','舎人公園','砧公園','駒沢公園','多摩川','荒川','隅田公園','木場公園'];
  let bonus = Math.min(parks.filter(p => bigParkKeywords.some(k => p.includes(k))).length * 15, 30);

  const nearLarge = LARGE_PARKS.filter(p => minParkDist(st.lat, st.lng, p) <= 1600);
  if (nearLarge.length > 0) {
    const maxArea = Math.max(...nearLarge.map(p => p.area));
    if (maxArea >= 100000) bonus = Math.max(bonus, 30);
    else if (maxArea >= 30000) bonus = Math.max(bonus, 20);
    else if (maxArea >= 10000) bonus = Math.max(bonus, 10);
    if (!dogruns.length) {
      if (nearLarge.some(p => p.name.includes('ドッグ'))) dogrunScore = 40;
    }
  }

  const osmScore = Math.min(parkScore + dogrunScore + bonus, 90);
  const noOsmData = parks.length === 0 && dogruns.length === 0 && nearLarge.length === 0;

  let calcWalk;
  if (noOsmData) {
    calcWalk = base;
  } else {
    calcWalk = newBlended(osmScore, base);
  }

  // Show near parks sorted by distance
  const nearInfo = LARGE_PARKS
    .map(p => ({name:p.name, dist:Math.round(minParkDist(st.lat, st.lng, p))}))
    .filter(p => p.dist <= 2000)
    .sort((a,b) => a.dist-b.dist)
    .slice(0,3)
    .map(p => `${p.name}(${p.dist}m)`)
    .join(', ');

  console.log(`\n【${st.name}】 lat=${st.lat}, lng=${st.lng}`);
  console.log(`  現walk=${st.walk}, base(推定)=${base}`);
  console.log(`  OSMパーク=${parks.length}件, OSMドッグラン=${dogruns.length}件`);
  console.log(`  park_score=${parkScore}, dogrun_score=${dogrunScore}, bonus=${bonus}`);
  console.log(`  osm_score=${osmScore}, no_osm_data=${noOsmData}`);
  console.log(`  新式calc_walk=${calcWalk}`);
  console.log(`  近接LARGE_PARKS: ${nearInfo || 'なし(2km以内)'}`);
}

console.log('=== 確認1: 明治神宮前・代々木・原宿 ===');
for (const st of stations) {
  if (targets1.includes(st.name)) analyze(st);
}

console.log('\n=== 確認2: 上野エリア ===');
for (const st of stations) {
  if (targets2.includes(st.name)) analyze(st);
}

console.log('\n=== 確認3: 北千住・青砥・木場・清澄白河 ===');
for (const st of stations) {
  if (targets3.includes(st.name)) analyze(st);
}

// 確認4: 上野恩賜公園・木場公園登録状況
console.log('\n=== 確認4: 上野恩賜公園・木場公園の登録確認 ===');
console.log('上野恩賜公園: LARGE_PARKSに登録あり, centroid=(35.7138,139.7742), area=538507㎡, entrances=未設定');
console.log('木場公園: LARGE_PARKSに登録あり, centroid=(35.6773,139.8086), area=241603㎡, entrances=未設定');

// Calculate distances to key stations
const ueno = {lat:35.7138, lng:139.7742};
const kiba = {lat:35.6773, lng:139.8086};
const uenoCandidateStations = ['鶯谷','根津','湯島','日暮里','東大前'];
const kibaCandidateStations = ['木場','清澄白河'];

console.log('\n上野恩賜公園 centroidからの距離:');
for (const st of stations) {
  if (uenoCandidateStations.includes(st.name)) {
    const d = Math.round(haversine(ueno.lat, ueno.lng, st.lat, st.lng));
    console.log(`  ${st.name}: ${d}m ${d<=1600?'✓圏内':'× 圏外'}`);
  }
}

// 鶯谷側入口候補から日暮里
const uguisuEntrance = [35.7220, 139.7780]; // 公園北東角付近
const nippori = stations.find(s=>s.name==='日暮里');
if (nippori) {
  const d = Math.round(haversine(uguisuEntrance[0], uguisuEntrance[1], nippori.lat, nippori.lng));
  console.log(`\n  仮入口(35.7220,139.7780)から日暮里: ${d}m ${d<=1600?'→圏内になる！':'→まだ圏外'}`);
}

console.log('\n木場公園 centroidからの距離:');
for (const st of stations) {
  if (kibaCandidateStations.includes(st.name)) {
    const d = Math.round(haversine(kiba.lat, kiba.lng, st.lat, st.lng));
    console.log(`  ${st.name}: ${d}m ${d<=1600?'✓圏内':'× 圏外'}`);
  }
}
