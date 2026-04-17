// New blended formula impact calculator
// Simulates the new calc_walk_score formula against current stations.json walk scores

const fs = require('fs');
const stations = JSON.parse(fs.readFileSync('C:/inumap-repo2/data/stations.json','utf8'));

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// Minimal LARGE_PARKS (only parks with entrances that were updated, plus key ones)
// For accurate simulation we need all LARGE_PARKS but this is for key stations only
const LARGE_PARKS = [
  {name:'和田堀公園', lat:35.6843, lng:139.6414, area:227510,
   entrances:[[35.6850,139.6361],[35.6803,139.6399]]},
  {name:'砧公園', lat:35.6291, lng:139.6216, area:391777,
   entrances:[[35.6370,139.6210],[35.6220,139.6230],[35.6383,139.6073],[35.6200,139.6107]]},
  {name:'城北中央公園', lat:35.7568, lng:139.6728, area:260338,
   entrances:[[35.7506,139.6699],[35.7531,139.6791]]},
  {name:'荒川戸田橋緑地', lat:35.7988, lng:139.6617, area:596881,
   entrances:[[35.7979,139.6576],[35.7985,139.6503]]},
  {name:'代々木公園', lat:35.6719, lng:139.6918, area:540529,
   entrances:[[35.6715,139.6993],[35.6804,139.6970],[35.6733,139.6943],[35.6719,139.7055]]},
  {name:'明治神宮', lat:35.6763, lng:139.6993, area:720000,
   entrances:[[35.6763,139.6993],[35.6830,139.6986],[35.6755,139.6940]]},
  {name:'石神井公園', lat:35.7389, lng:139.5977, area:201375,
   entrances:[[35.7430,139.6030],[35.7390,139.6140],[35.7320,139.5990],[35.7388,139.5912]]},
  {name:'光が丘公園', lat:35.7631, lng:139.6284, area:607824,
   entrances:[[35.7590,139.6285],[35.7690,139.6270],[35.7633,139.6390],[35.7635,139.6185]]},
  {name:'赤塚公園', lat:35.7847, lng:139.6566, area:254185,
   entrances:[[35.7760,139.6490],[35.7699,139.6293]]},
  {name:'平和の森公園(中野)', lat:35.7169, lng:139.6619, area:54659,
   entrances:[[35.7208,139.6618],[35.7185,139.6558]]},
  {name:'駒沢オリンピック公園', lat:35.6242, lng:139.6602, area:413573,
   entrances:[[35.6299,139.6601],[35.6241,139.6696]]},
  {name:'水元公園', lat:35.7851, lng:139.8695, area:878996,
   entrances:[[35.7720,139.8690],[35.7738,139.8568]]},
  {name:'舎人公園', lat:35.7970, lng:139.7683, area:612717,
   entrances:[[35.7810,139.7682],[35.8060,139.7680],[35.7940,139.7791],[35.7940,139.7575]]},
  {name:'善福寺公園', lat:35.7149, lng:139.5905, area:78622,
   entrances:[[35.7095,139.5935],[35.7190,139.5965]]},
  {name:'浮間公園', lat:35.7944, lng:139.6926, area:117330,
   entrances:[[35.7910,139.6915]]},
  {name:'葛西臨海公園', lat:35.6425, lng:139.8599, area:805861,
   entrances:[[35.6418,139.8597],[35.6490,139.8598],[35.6450,139.8533],[35.6340,139.8621]]},
  {name:'井の頭公園', lat:35.6975, lng:139.5771, area:367000,
   entrances:[[35.7008,139.5786],[35.6966,139.5738]]},
  {name:'小金井公園', lat:35.7208, lng:139.5021, area:788000,
   entrances:[[35.7048,139.5043],[35.7360,139.4993]]},
];

function minParkDist(stLat, stLng, p) {
  if (p.entrances && p.entrances.length > 0) {
    return Math.min(...p.entrances.map(([la,lo]) => haversine(stLat, stLng, la, lo)));
  }
  return haversine(stLat, stLng, p.lat, p.lng);
}

// New blended formula
function newBlended(osmScore, base) {
  if (osmScore === 0) return base;
  if (osmScore < base * 0.5) return Math.round(osmScore * 0.4 + base * 0.6);
  return Math.round(osmScore * 0.7 + base * 0.3);
}

// Old blended formula
function oldBlended(osmScore, base) {
  return Math.round(osmScore * 0.7 + base * 0.3);
}

// Target stations
const targets = [
  '西永福','永福町','祖師ヶ谷大蔵','喜多見',
  '上板橋','氷川台','新高島平','西高島平',
  '地下鉄成増','成増','沼袋','野方',
  '代々木','参宮橋','明治神宮前','駒沢大学',
  '石神井公園','大泉学園','光が丘',
  '吉祥寺','武蔵小金井','花小金井', // 井の頭・小金井公園
];

console.log('駅名 | 現walk | 最近接公園 | 距離m | LARGE_PARKSボーナス | 新式影響');
console.log('--------------------------------------------------------------------');

for (const st of stations) {
  if (!targets.includes(st.name)) continue;

  const nearLarge = LARGE_PARKS.filter(p => minParkDist(st.lat, st.lng, p) <= 1600);
  let maxArea = 0;
  let nearestParkName = '-';
  let nearestDist = 99999;

  for (const p of LARGE_PARKS) {
    const d = minParkDist(st.lat, st.lng, p);
    if (d < nearestDist) {
      nearestDist = d;
      nearestParkName = p.name;
    }
  }

  let bonus = 0;
  if (nearLarge.length > 0) {
    maxArea = Math.max(...nearLarge.map(p => p.area));
    if (maxArea >= 100000) bonus = 30;
    else if (maxArea >= 30000) bonus = 20;
    else if (maxArea >= 10000) bonus = 10;
  }

  // Estimate base walk from WALK_STATION (approximate using current walk + back-calculation)
  // For stations that haven't been overridden, walk ≈ blended
  // We'll show what new formula would give for various osm_score assumptions
  const currentWalk = st.walk;
  const distM = Math.round(nearestDist);
  const inRange = nearestDist <= 1600 ? '✓' : '×';

  console.log(`${st.name}: walk=${currentWalk}, 最近接=${nearestParkName}(${distM}m)${inRange}, bonus=${bonus}`);
}

// Specific calculation: for stations where osm_score=bonus (OSM returns 0 parks)
console.log('\n--- OSM=0の場合の新旧比較 (osm_score=bonus, WALK_STATIONベース推定) ---');
const WALK_STATION_SAMPLE = {
  '西永福': 62, '永福町': 62, '祖師ヶ谷大蔵': 62, '喜多見': 62,
  '上板橋': 60, '氷川台': 60, '新高島平': 67, '西高島平': 60,
  '地下鉄成増': 62, '沼袋': 58, '野方': 55,
  '代々木': 62, '参宮橋': 58, '明治神宮前': 58, '駒沢大学': 72,
  '大泉学園': 48, '吉祥寺': 65, '武蔵小金井': 55, '花小金井': 48,
};

for (const st of stations) {
  if (!targets.includes(st.name)) continue;
  const base = WALK_STATION_SAMPLE[st.name];
  if (!base) continue;

  const nearLarge = LARGE_PARKS.filter(p => minParkDist(st.lat, st.lng, p) <= 1600);
  let bonus = 0;
  if (nearLarge.length > 0) {
    const maxArea = Math.max(...nearLarge.map(p => p.area));
    if (maxArea >= 100000) bonus = 30;
    else if (maxArea >= 30000) bonus = 20;
    else if (maxArea >= 10000) bonus = 10;
  }

  const osmScore = bonus; // OSM=0の場合
  const oldW = nearLarge.length > 0 ? oldBlended(osmScore, base) : base;
  const newW = nearLarge.length > 0 ? newBlended(osmScore, base) : base;
  const diff = newW - oldW;
  const marker = diff > 0 ? `↑+${diff}` : diff < 0 ? `↓${diff}` : '=';

  console.log(`${st.name}: base=${base}, bonus=${osmScore}, 旧=${oldW} → 新=${newW} ${marker}`);
}
