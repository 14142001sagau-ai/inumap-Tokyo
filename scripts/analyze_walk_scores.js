#!/usr/bin/env node
'use strict';

const fs = require('fs');

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, p = Math.PI / 180;
  const a = Math.sin((lat2-lat1)*p/2)**2 +
    Math.cos(lat1*p)*Math.cos(lat2*p)*Math.sin((lng2-lng1)*p/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function minParkDist(sLat, sLng, park) {
  if (park.entrances && park.entrances.length) {
    return Math.min(...park.entrances.map(([la,lo]) => haversine(sLat, sLng, la, lo)));
  }
  return haversine(sLat, sLng, park.lat, park.lng);
}

function parkBonus(area) {
  if (area >= 100000) return 30;
  if (area >= 30000)  return 20;
  if (area >= 10000)  return 10;
  return 0;
}

const LARGE_PARKS = [
  {name:'駒沢オリンピック公園',lat:35.6242,lng:139.6602,area:413573},
  {name:'林試の森公園',lat:35.6252,lng:139.7015,area:120763},
  {name:'大島小松川公園',lat:35.6921,lng:139.8501,area:249283},
  {name:'明治公園',lat:35.6760,lng:139.7130,area:57309},
  {name:'日比谷公園',lat:35.6738,lng:139.7560,area:161637},
  {name:'浜離宮恩賜庭園',lat:35.6627,lng:139.7632,area:250216},
  {name:'芝公園',lat:35.6551,lng:139.7478,area:136023},
  {name:'旧芝離宮恩賜庭園',lat:35.6549,lng:139.7594,area:43175},
  {name:'台場公園',lat:35.6336,lng:139.7720,area:29963},
  {name:'青山公園',lat:35.6637,lng:139.7247,area:38465},
  {name:'戸山公園',lat:35.7043,lng:139.7135,area:186807},
  {name:'小石川後楽園',lat:35.7055,lng:139.7496,area:70847},
  {name:'六義園',lat:35.7323,lng:139.7463,area:87809},
  {name:'上野恩賜公園',lat:35.7138,lng:139.7742,area:538507},
  {name:'旧岩崎邸庭園',lat:35.7095,lng:139.7674,area:18235},
  {name:'横網町公園',lat:35.6994,lng:139.7964,area:19580},
  {name:'向島百花園',lat:35.7231,lng:139.8155,area:10886},
  {name:'東白鬚公園',lat:35.7331,lng:139.8145,area:103128},
  {name:'猿江恩賜公園',lat:35.6907,lng:139.8191,area:145088},
  {name:'清澄庭園',lat:35.6801,lng:139.7965,area:81091},
  {name:'夢の島公園',lat:35.6497,lng:139.8233,area:433212},
  {name:'木場公園',lat:35.6773,lng:139.8086,area:241603},
  {name:'潮風公園',lat:35.6239,lng:139.7688,area:154940},
  {name:'蘆花恒春園',lat:35.6616,lng:139.6124,area:80304},
  {name:'亀戸中央公園',lat:35.7010,lng:139.8362,area:103027},
  {name:'砧公園',lat:35.6291,lng:139.6216,area:391777},
  {name:'祖師谷公園',lat:35.6540,lng:139.5989,area:88694},
  {name:'光が丘公園',lat:35.7631,lng:139.6284,area:607824},
  {name:'浮間公園',lat:35.7944,lng:139.6926,area:117330},
  {name:'城北中央公園',lat:35.7568,lng:139.6728,area:260338},
  {name:'代々木公園',lat:35.6719,lng:139.6918,area:540529,
   entrances:[[35.6715,139.6993],[35.6804,139.6970]]},
  {name:'明治神宮',lat:35.6763,lng:139.6993,area:720000,
   entrances:[[35.6763,139.6993],[35.6830,139.6986]]},
  {name:'新宿御苑',lat:35.6850,lng:139.7101,area:580000,
   entrances:[[35.6863,139.7101],[35.6837,139.7156]]},
  {name:'善福寺公園',lat:35.7149,lng:139.5905,area:78622},
  {name:'善福寺川緑地',lat:35.6951,lng:139.6327,area:184083},
  {name:'和田堀公園',lat:35.6843,lng:139.6414,area:227510},
  {name:'旧古河庭園',lat:35.7425,lng:139.7463,area:30781},
  {name:'尾久の原公園',lat:35.7515,lng:139.7757,area:61841},
  {name:'汐入公園',lat:35.7366,lng:139.8096,area:129034},
  {name:'赤塚公園',lat:35.7847,lng:139.6566,area:254185},
  {name:'石神井公園',lat:35.7389,lng:139.5977,area:201375},
  {name:'大泉中央公園',lat:35.7748,lng:139.5976,area:103000},
  {name:'東綾瀬公園',lat:35.7703,lng:139.8321,area:158970},
  {name:'舎人公園',lat:35.7970,lng:139.7683,area:612717},
  {name:'中川公園',lat:35.7758,lng:139.8455,area:120699},
  {name:'水元公園',lat:35.7851,lng:139.8695,area:878996},
  {name:'篠崎公園',lat:35.7157,lng:139.8992,area:299371},
  {name:'葛西臨海公園',lat:35.6425,lng:139.8599,area:805861},
  {name:'宇喜田公園',lat:35.6743,lng:139.8606,area:58227},
  {name:'清水谷公園',lat:35.6815,lng:139.7359,area:10701},
  {name:'千鳥ヶ淵公園',lat:35.6843,lng:139.7446,area:15845},
  {name:'外濠公園',lat:35.6944,lng:139.7394,area:38794},
  {name:'築地公園',lat:35.6680,lng:139.7749,area:14039},
  {name:'新月島公園',lat:35.6594,lng:139.7872,area:18949},
  {name:'あかつき公園',lat:35.6663,lng:139.7765,area:12174},
  {name:'石川島公園',lat:35.6712,lng:139.7859,area:32433},
  {name:'隅田川公園',lat:35.6883,lng:139.7890,area:46899},
  {name:'佃・新川公園',lat:35.6758,lng:139.7861,area:27314},
  {name:'豊海運動公園',lat:35.6533,lng:139.7719,area:19549},
  {name:'有栖川宮記念公園',lat:35.6523,lng:139.7258,area:67131},
  {name:'檜町公園',lat:35.6669,lng:139.7313,area:16370},
  {name:'港南緑水公園',lat:35.6282,lng:139.7514,area:19859},
  {name:'お台場レインボー公園',lat:35.6329,lng:139.7781,area:11000},
  {name:'西戸山公園',lat:35.7076,lng:139.7010,area:22430},
  {name:'西落合公園',lat:35.7196,lng:139.6773,area:11560},
  {name:'新宿中央公園',lat:35.6888,lng:139.6893,area:88066},
  {name:'おとめ山公園',lat:35.7177,lng:139.7017,area:15054},
  {name:'甘泉園公園',lat:35.7114,lng:139.7159,area:14235},
  {name:'落合中央公園',lat:35.7128,lng:139.6932,area:21073},
  {name:'大塚公園',lat:35.7239,lng:139.7318,area:15377},
  {name:'江戸川公園',lat:35.7105,lng:139.7270,area:13204},
  {name:'新江戸川公園',lat:35.7129,lng:139.7228,area:18547},
  {name:'六義公園',lat:35.7331,lng:139.7465,area:12188},
  {name:'教育の森公園',lat:35.7199,lng:139.7363,area:21171},
  {name:'目白台運動公園',lat:35.7153,lng:139.7218,area:30381},
  {name:'隅田公園',lat:35.7159,lng:139.8036,area:106615},
  {name:'旧安田庭園',lat:35.6982,lng:139.7937,area:14242},
  {name:'錦糸公園',lat:35.6990,lng:139.8164,area:56124},
  {name:'銅像堀公園',lat:35.7213,lng:139.8100,area:12702},
  {name:'隅田川緑道',lat:35.7040,lng:139.7960,area:23182},
  {name:'堤通公園',lat:35.7239,lng:139.8108,area:13586},
  {name:'荒川四ツ木橋緑地',lat:35.7340,lng:139.8244,area:107001},
  {name:'大横川親水公園',lat:35.7083,lng:139.8074,area:63344},
  {name:'竪川親水公園',lat:35.6933,lng:139.8159,area:12300},
  {name:'東墨田公園',lat:35.7194,lng:139.8351,area:12528},
  {name:'深川',lat:35.6729,lng:139.7973,area:16740},
  {name:'古石場川親水',lat:35.6676,lng:139.7993,area:16362},
  {name:'越中島',lat:35.6707,lng:139.7889,area:16346},
  {name:'豊洲',lat:35.6535,lng:139.7925,area:24303},
  {name:'豊洲三丁目',lat:35.6584,lng:139.7961,area:10000},
  {name:'豊洲六丁目',lat:35.6464,lng:139.7911,area:16190},
  {name:'東雲水辺',lat:35.6469,lng:139.8054,area:16881},
  {name:'潮見運動',lat:35.6559,lng:139.8099,area:40081},
  {name:'横十間川親水',lat:35.6771,lng:139.8204,area:50583},
  {name:'木場親水',lat:35.6747,lng:139.8060,area:18912},
  {name:'豊住',lat:35.6745,lng:139.8113,area:19338},
  {name:'竪川河川敷',lat:35.6935,lng:139.8263,area:52834},
  {name:'仙台堀川',lat:35.6853,lng:139.8391,area:103850},
  {name:'城東',lat:35.6783,lng:139.8382,area:10054},
  {name:'荒川・砂町水辺',lat:35.6810,lng:139.8447,area:82635},
  {name:'南砂緑道',lat:35.6731,lng:139.8211,area:12691},
  {name:'南砂三丁目',lat:35.6684,lng:139.8325,area:38646},
  {name:'若洲',lat:35.6189,lng:139.8339,area:89683},
  {name:'戸越公園',lat:35.6102,lng:139.7214,area:18255},
  {name:'大井水神公園',lat:35.5926,lng:139.7309,area:12856},
  {name:'天王洲公園',lat:35.6202,lng:139.7501,area:30042},
  {name:'鮫洲運動公園',lat:35.6058,lng:139.7445,area:14191},
  {name:'西大井広場公園',lat:35.6020,lng:139.7232,area:13457},
  {name:'しながわ区民公園',lat:35.5896,lng:139.7383,area:127419},
  {name:'八潮公園',lat:35.6007,lng:139.7526,area:24918},
  {name:'しおじ公園',lat:35.5965,lng:139.7493,area:10233},
  {name:'東品川海上公園',lat:35.6175,lng:139.7497,area:19477},
  {name:'しながわ中央公園',lat:35.6096,lng:139.7280,area:21083},
  {name:'駒場野公園',lat:35.6581,lng:139.6802,area:39025},
  {name:'駒場公園',lat:35.6616,lng:139.6803,area:40396},
];

const stations = JSON.parse(fs.readFileSync('C:/inumap-repo2/data/stations.json','utf8'));
const scored = stations.filter(s => s.walk !== null && s.walk !== undefined);
console.log(`Total: ${stations.length} stations, scored: ${scored.length}\n`);

// ── 作業1 ──────────────────────────────────────────────────────────────────
console.log('='.repeat(72));
console.log('【作業1】近接駅ペア（800m以内・walkスコア差15以上）');
console.log('='.repeat(72));

const pairs = [];
for (let i = 0; i < scored.length; i++) {
  for (let j = i+1; j < scored.length; j++) {
    const a = scored[i], b = scored[j];
    const d = haversine(a.lat, a.lng, b.lat, b.lng);
    if (d > 800) continue;
    const diff = Math.abs(a.walk - b.walk);
    if (diff >= 15) pairs.push({diff, dist: Math.round(d), a, b});
  }
}
pairs.sort((x,y) => y.diff - x.diff);
console.log(`検出数: ${pairs.length}件\n`);
console.log('差  距離   高スコア駅              walk  低スコア駅              walk');
console.log('-'.repeat(72));
for (const {diff, dist, a, b} of pairs) {
  const [hi, lo] = a.walk > b.walk ? [a, b] : [b, a];
  console.log(`${String(diff).padStart(2)}  ${String(dist).padStart(4)}m  ${hi.name.padEnd(22)}${String(hi.walk).padStart(4)}  ${lo.name.padEnd(22)}${String(lo.walk).padStart(4)}`);
}

// ── 作業2 ──────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(72));
console.log('【作業2】LARGE_PARKS逆転チェック（公園に近いのにスコアが低い）');
console.log('='.repeat(72));

const INVERSION_THRESHOLD = 15;
const bonusParks = LARGE_PARKS.filter(p => parkBonus(p.area) > 0);
const seenInv = new Map();

for (const park of bonusParks) {
  const nearby = [];
  for (const s of scored) {
    const d = minParkDist(s.lat, s.lng, park);
    if (d <= 2000) nearby.push({d, s});
  }
  if (nearby.length < 2) continue;
  nearby.sort((a,b) => a.d - b.d);

  for (let i = 0; i < nearby.length; i++) {
    const {d: di, s: si} = nearby[i];
    for (let j = i+1; j < nearby.length; j++) {
      const {d: dj, s: sj} = nearby[j];
      const walkDiff = sj.walk - si.walk;
      if (walkDiff < INVERSION_THRESHOLD) continue;
      const key = [si.id, sj.id].sort().join('|');
      const cur = seenInv.get(key);
      if (!cur || walkDiff > cur.walkDiff) {
        seenInv.set(key, {
          park: park.name, parkBonus: parkBonus(park.area),
          nearName: si.name, nearId: si.id, nearDist: Math.round(di), nearWalk: si.walk,
          farName: sj.name,  farId: sj.id,  farDist:  Math.round(dj), farWalk:  sj.walk,
          walkDiff,
        });
      }
    }
  }
}

const inversions = [...seenInv.values()].sort((a,b) => b.walkDiff - a.walkDiff);
console.log(`検出数: ${inversions.length}件\n`);
console.log('公園               距近駅                dist  walk  距遠駅                dist  walk  差');
console.log('-'.repeat(90));
for (const inv of inversions.slice(0, 50)) {
  console.log(
    `${inv.park.padEnd(18)} ${inv.nearName.padEnd(20)}${String(inv.nearDist).padStart(5)}m ${String(inv.nearWalk).padStart(4)}  ` +
    `${inv.farName.padEnd(20)}${String(inv.farDist).padStart(5)}m ${String(inv.farWalk).padStart(4)}  +${inv.walkDiff}`
  );
}

// ── 作業3 ──────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(72));
console.log('【作業3】STATION_OVERRIDE修正候補');
console.log('='.repeat(72));

const candidates = new Map();
function addCandidate(id, name, currentWalk, suggestedWalk, reason) {
  if (!candidates.has(id)) {
    candidates.set(id, {name, currentWalk, suggested: currentWalk, reasons: []});
  }
  const c = candidates.get(id);
  c.suggested = Math.max(c.suggested, suggestedWalk);
  c.reasons.push(reason);
}

for (const {diff, dist, a, b} of pairs) {
  const [hi, lo] = a.walk > b.walk ? [a, b] : [b, a];
  // Suggest lower-bound = hi.walk - 5 (5pt margin allowed)
  addCandidate(lo.id, lo.name, lo.walk, hi.walk - 5,
    `近接ペア: ${hi.name}(walk=${hi.walk}, ${dist}m先)`);
}

for (const inv of inversions.slice(0, 50)) {
  addCandidate(inv.nearId, inv.nearName, inv.nearWalk, inv.farWalk - 5,
    `公園逆転: ${inv.park}／${inv.farName}(walk=${inv.farWalk}, dist=${inv.farDist}m)より${inv.walkDiff}pt低い`);
}

const overrides = [...candidates.entries()]
  .map(([id, v]) => ({id, ...v}))
  .filter(v => v.suggested > v.currentWalk)
  .sort((a,b) => (b.suggested - b.currentWalk) - (a.suggested - a.currentWalk));

console.log(`\n修正候補: ${overrides.length}駅\n`);
console.log('駅名                  ID                             現在  推奨  理由');
console.log('-'.repeat(90));
for (const v of overrides) {
  console.log(`${v.name.padEnd(20)}  ${v.id.padEnd(30)} ${String(v.currentWalk).padStart(4)} → ${String(v.suggested).padStart(4)}  ${v.reasons[0]}`);
}

console.log('\n# fetch_geojson.py STATION_OVERRIDE 追加コード候補:');
console.log();
for (const v of overrides) {
  console.log(`    '${v.id}': {'walk_base':${v.suggested}},  # ${v.name} (${v.currentWalk}→${v.suggested})`);
}
