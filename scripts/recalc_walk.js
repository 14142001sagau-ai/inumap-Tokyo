/**
 * boundary_points追加後のwalkスコア再計算
 * 作業5・6用 - Overpass API不使用、既存stations.jsonデータを使用
 */
const fs = require('fs');
const stations = JSON.parse(fs.readFileSync('data/stations.json', 'utf8'));

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const p = Math.PI / 180;
  const a = Math.sin((lat2-lat1)*p/2)**2 + Math.cos(lat1*p)*Math.cos(lat2*p)*Math.sin((lng2-lng1)*p/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ===== LARGE_PARKS（fetch_geojson.pyから最新版を反映）=====
const LARGE_PARKS = [
  {name:'駒沢オリンピック公園', lat:35.6242, lng:139.6602, area:413573, dogrun:true,
   boundary_points:[[35.6307,139.6602],[35.6178,139.6601],[35.6242,139.6701],[35.6242,139.6503]],
   entrances:[[35.6299,139.6601],[35.6241,139.6696]]},
  {name:'林試の森公園', lat:35.6252, lng:139.7015, area:120763},
  {name:'大島小松川公園', lat:35.6921, lng:139.8501, area:249283},
  {name:'明治公園', lat:35.6760, lng:139.7130, area:57309},
  {name:'日比谷公園', lat:35.6738, lng:139.7560, area:161637},
  {name:'浜離宮恩賜庭園', lat:35.6627, lng:139.7632, area:250216},
  {name:'芝公園', lat:35.6551, lng:139.7478, area:136023},
  {name:'旧芝離宮恩賜庭園', lat:35.6549, lng:139.7594, area:43175},
  {name:'台場公園', lat:35.6336, lng:139.7720, area:29963},
  {name:'青山公園', lat:35.6637, lng:139.7247, area:38465},
  {name:'戸山公園', lat:35.7043, lng:139.7135, area:186807},
  {name:'小石川後楽園', lat:35.7055, lng:139.7496, area:70847},
  {name:'六義園', lat:35.7323, lng:139.7463, area:87809},
  {name:'上野恩賜公園', lat:35.7138, lng:139.7742, area:538507,
   boundary_points:[[35.7233,139.7748],[35.7085,139.7738],[35.7150,139.7810],[35.7173,139.7690]],
   entrances:[[35.7220,139.7780],[35.7100,139.7700],[35.7230,139.7710]]},
  {name:'旧岩崎邸庭園', lat:35.7095, lng:139.7674, area:18235},
  {name:'横網町公園', lat:35.6994, lng:139.7964, area:19580},
  {name:'向島百花園', lat:35.7231, lng:139.8155, area:10886},
  {name:'東白鬚公園', lat:35.7331, lng:139.8145, area:103128},
  {name:'猿江恩賜公園', lat:35.6907, lng:139.8191, area:145088},
  {name:'清澄庭園', lat:35.6801, lng:139.7965, area:81091},
  {name:'夢の島公園', lat:35.6497, lng:139.8233, area:433212},
  {name:'木場公園', lat:35.6773, lng:139.8086, area:241603, dogrun:true,
   boundary_points:[[35.6840,139.8088],[35.6701,139.8088],[35.6770,139.8161],[35.6770,139.8015]],
   entrances:[[35.6730,139.8075],[35.6710,139.8090]]},
  {name:'潮風公園', lat:35.6239, lng:139.7688, area:154940},
  {name:'蘆花恒春園', lat:35.6616, lng:139.6124, area:80304, dogrun:true},
  {name:'亀戸中央公園', lat:35.7010, lng:139.8362, area:103027},
  {name:'砧公園', lat:35.6291, lng:139.6216, area:391777,
   boundary_points:[[35.6400,139.6145],[35.6178,139.6105],[35.6310,139.6310],[35.6310,139.6050]],
   entrances:[[35.6370,139.6210],[35.6220,139.6230],[35.6383,139.6073],[35.6200,139.6107]]},
  {name:'祖師谷公園', lat:35.6540, lng:139.5989, area:88694},
  {name:'光が丘公園', lat:35.7631, lng:139.6284, area:607824,
   boundary_points:[[35.7713,139.6273],[35.7551,139.6287],[35.7631,139.6403],[35.7631,139.6167]],
   entrances:[[35.7590,139.6285],[35.7690,139.6270],[35.7633,139.6390],[35.7635,139.6185]]},
  {name:'浮間公園', lat:35.7944, lng:139.6926, area:117330,
   entrances:[[35.7910,139.6915]]},
  {name:'城北中央公園', lat:35.7568, lng:139.6728, area:260338, dogrun:true,
   boundary_points:[[35.7636,139.6755],[35.7498,139.6693],[35.7552,139.6808],[35.7598,139.6648]],
   entrances:[[35.7506,139.6699],[35.7531,139.6791]]},
  {name:'代々木公園', lat:35.6719, lng:139.6918, area:540529, dogrun:true,
   boundary_points:[[35.6810,139.6986],[35.6661,139.6917],[35.6699,139.7056],[35.6780,139.6825]],
   entrances:[[35.6715,139.6993],[35.6804,139.6970],[35.6733,139.6943],[35.6719,139.7055]]},
  {name:'明治神宮', lat:35.6763, lng:139.6993, area:720000,
   boundary_points:[[35.6860,139.6994],[35.6692,139.7001],[35.6730,139.7065],[35.6805,139.6898]],
   entrances:[[35.6763,139.6993],[35.6830,139.6986],[35.6755,139.6940]]},
  {name:'新宿御苑', lat:35.6850, lng:139.7101, area:580000,
   boundary_points:[[35.6903,139.7112],[35.6793,139.7120],[35.6853,139.7196],[35.6856,139.7044]],
   entrances:[[35.6863,139.7101],[35.6837,139.7156]]},
  {name:'善福寺公園', lat:35.7149, lng:139.5905, area:78622,
   boundary_points:[[35.7198,139.5955],[35.7091,139.5900],[35.7150,139.5970],[35.7150,139.5840]],
   entrances:[[35.7095,139.5935],[35.7190,139.5965]]},
  {name:'善福寺川緑地', lat:35.6951, lng:139.6327, area:184083},
  {name:'和田堀公園', lat:35.6843, lng:139.6414, area:227510,
   boundary_points:[[35.6883,139.6385],[35.6799,139.6415],[35.6843,139.6462],[35.6843,139.6330]],
   entrances:[[35.6850,139.6361],[35.6803,139.6399]]},
  {name:'旧古河庭園', lat:35.7425, lng:139.7463, area:30781},
  {name:'尾久の原公園', lat:35.7515, lng:139.7757, area:61841},
  {name:'汐入公園', lat:35.7366, lng:139.8096, area:129034},
  {name:'赤塚公園', lat:35.7847, lng:139.6566, area:254185,
   boundary_points:[[35.7892,139.6425],[35.7691,139.6304],[35.7848,139.6618],[35.7848,139.6280]],
   entrances:[[35.7760,139.6490],[35.7699,139.6293]]},
  {name:'石神井公園', lat:35.7389, lng:139.5977, area:201375,
   boundary_points:[[35.7450,139.5990],[35.7310,139.5985],[35.7388,139.6155],[35.7388,139.5902]],
   entrances:[[35.7430,139.6030],[35.7390,139.6140],[35.7320,139.5990],[35.7388,139.5912]]},
  {name:'大泉中央公園', lat:35.7748, lng:139.5976, area:103000},
  {name:'東綾瀬公園', lat:35.7703, lng:139.8321, area:158970},
  {name:'舎人公園', lat:35.7970, lng:139.7683, area:612717, dogrun:true,
   boundary_points:[[35.8074,139.7683],[35.7800,139.7683],[35.7970,139.7800],[35.7970,139.7565]],
   entrances:[[35.7810,139.7682],[35.8060,139.7680],[35.7940,139.7791],[35.7940,139.7575]]},
  {name:'中川公園', lat:35.7758, lng:139.8455, area:120699},
  {name:'水元公園', lat:35.7851, lng:139.8695, area:878996, dogrun:true,
   boundary_points:[[35.7966,139.8697],[35.7723,139.8696],[35.7851,139.8832],[35.7849,139.8551]],
   entrances:[[35.7720,139.8690],[35.7738,139.8568]]},
  {name:'篠崎公園', lat:35.7157, lng:139.8992, area:299371, dogrun:true},
  {name:'葛西臨海公園', lat:35.6425, lng:139.8599, area:805861,
   entrances:[[35.6418,139.8597],[35.6490,139.8598],[35.6450,139.8533],[35.6340,139.8621]]},
  {name:'宇喜田公園', lat:35.6743, lng:139.8606, area:58227},
  {name:'清水谷公園', lat:35.6815, lng:139.7359, area:10701},
  {name:'千鳥ヶ淵公園', lat:35.6843, lng:139.7446, area:15845},
  {name:'外濠公園', lat:35.6944, lng:139.7394, area:38794},
  {name:'築地公園', lat:35.6680, lng:139.7749, area:14039},
  {name:'新月島公園', lat:35.6594, lng:139.7872, area:18949},
  {name:'あかつき公園', lat:35.6663, lng:139.7765, area:12174},
  {name:'石川島公園', lat:35.6712, lng:139.7859, area:32433},
  {name:'隅田川公園', lat:35.6883, lng:139.7890, area:46899},
  {name:'佃・新川公園', lat:35.6758, lng:139.7861, area:27314},
  {name:'豊海運動公園', lat:35.6533, lng:139.7719, area:19549},
  {name:'有栖川宮記念公園', lat:35.6523, lng:139.7258, area:67131},
  {name:'檜町公園', lat:35.6669, lng:139.7313, area:16370},
  {name:'港南緑水公園', lat:35.6282, lng:139.7514, area:19859},
  {name:'お台場レインボー公園', lat:35.6329, lng:139.7781, area:11000},
  {name:'西戸山公園', lat:35.7076, lng:139.7010, area:22430},
  {name:'西落合公園', lat:35.7196, lng:139.6773, area:11560},
  {name:'新宿中央公園', lat:35.6888, lng:139.6893, area:88066},
  {name:'おとめ山公園', lat:35.7177, lng:139.7017, area:15054},
  {name:'甘泉園公園', lat:35.7114, lng:139.7159, area:14235},
  {name:'落合中央公園', lat:35.7128, lng:139.6932, area:21073},
  {name:'大塚公園', lat:35.7239, lng:139.7318, area:15377},
  {name:'江戸川公園', lat:35.7105, lng:139.7270, area:13204},
  {name:'新江戸川公園', lat:35.7129, lng:139.7228, area:18547},
  {name:'六義公園', lat:35.7331, lng:139.7465, area:12188},
  {name:'教育の森公園', lat:35.7199, lng:139.7363, area:21171},
  {name:'目白台運動公園', lat:35.7153, lng:139.7218, area:30381},
  {name:'隅田公園', lat:35.7159, lng:139.8036, area:106615},
  {name:'旧安田庭園', lat:35.6982, lng:139.7937, area:14242},
  {name:'錦糸公園', lat:35.6990, lng:139.8164, area:56124},
  {name:'銅像堀公園', lat:35.7213, lng:139.8100, area:12702},
  {name:'隅田川緑道', lat:35.7040, lng:139.7960, area:23182},
  {name:'堤通公園', lat:35.7239, lng:139.8108, area:13586},
  {name:'荒川四ツ木橋緑地', lat:35.7340, lng:139.8244, area:107001},
  {name:'大横川親水公園', lat:35.7083, lng:139.8074, area:63344},
  {name:'竪川親水公園', lat:35.6933, lng:139.8159, area:12300},
  {name:'東墨田公園', lat:35.7194, lng:139.8351, area:12528},
  {name:'高島平緑地', lat:35.7874, lng:139.6656, area:82143},
  {name:'荒川戸田橋緑地', lat:35.7988, lng:139.6617, area:596881,
   boundary_points:[[35.8030,139.6620],[35.7945,139.6615],[35.7988,139.6755],[35.7988,139.6420]],
   entrances:[[35.7979,139.6576],[35.7985,139.6503]]},
  {name:'武蔵関公園', lat:35.7275, lng:139.5671, area:48967},
  {name:'飛鳥山公園', lat:35.7490, lng:139.7402, area:73272},
  {name:'新荒川大橋緑地', lat:35.7891, lng:139.7203, area:80925},
  {name:'中央公園', lat:35.7535, lng:139.7261, area:79243},
  {name:'赤羽自然観察公園', lat:35.7740, lng:139.7109, area:54020},
  {name:'小豆沢公園', lat:35.7789, lng:139.6977, area:70382},
  {name:'東板橋公園', lat:35.7547, lng:139.7127, area:25052},
  {name:'成増北第一公園', lat:35.7890, lng:139.6366, area:15288},
  {name:'高島平緑地', lat:35.7874, lng:139.6656, area:82143},
  {name:'平和の森公園', lat:35.7169, lng:139.6619, area:54659,
   boundary_points:[[35.7215,139.6618],[35.7130,139.6620],[35.7169,139.6665],[35.7169,139.6558]],
   entrances:[[35.7208,139.6618],[35.7185,139.6558]]},
  {name:'哲学堂公園', lat:35.7225, lng:139.6740, area:52494},
  {name:'江古田の森公園', lat:35.7307, lng:139.6663, area:58911},
  {name:'馬橋公園', lat:35.7097, lng:139.6440, area:19261},
  {name:'井草森公園', lat:35.7269, lng:139.6111, area:39504},
  {name:'北運動公園', lat:35.7743, lng:139.7285, area:23794},
  {name:'江北公園', lat:35.7774, lng:139.7489, area:87822},
  {name:'荒川千住新橋緑地', lat:35.7603, lng:139.8050, area:122673},
  {name:'荒川江北橋緑地', lat:35.7559, lng:139.7731, area:145826},
  {name:'柴又公園', lat:35.7574, lng:139.8799, area:51670},
  {name:'総合レクリエーション公園', lat:35.6507, lng:139.8731, area:228529},
  {name:'新左近川親水公園', lat:35.6539, lng:139.8605, area:109840},
  {name:'小岩緑地', lat:35.7304, lng:139.8953, area:420964},
  {name:'篠崎緑地', lat:35.7202, lng:139.8994, area:261582},
  {name:'多摩川緑地', lat:35.5411, lng:139.7013, area:351532},
  {name:'大蔵運動公園', lat:35.6297, lng:139.6125, area:112816},
  {name:'世田谷公園', lat:35.6442, lng:139.6805, area:78957},
  {name:'多摩川遊園', lat:35.5985, lng:139.6443, area:107876},
  {name:'等々力渓谷公園', lat:35.6046, lng:139.6462, area:30210},
  {name:'兵庫島公園', lat:35.6114, lng:139.6255, area:65730},
  {name:'多摩川二子橋公園', lat:35.6163, lng:139.6192, area:175908},
  {name:'羽根木公園', lat:35.6586, lng:139.6548, area:79651},
  {name:'駒場野公園', lat:35.6581, lng:139.6802, area:39025},
  {name:'碑文谷公園', lat:35.6259, lng:139.6823, area:43534},
  {name:'洗足池公園', lat:35.6028, lng:139.6895, area:76951},
  {name:'多摩川台公園', lat:35.5900, lng:139.6661, area:67154},
  {name:'萩中公園', lat:35.5501, lng:139.7379, area:64115},
  {name:'大森ふるさとの浜辺公園', lat:35.5736, lng:139.7420, area:128325},
  {name:'平和の森公園(大田)', lat:35.5787, lng:139.7407, area:104839},
  {name:'しながわ区民公園', lat:35.5896, lng:139.7383, area:127419},
  {name:'大島小松川公園', lat:35.6921, lng:139.8501, area:249283},
  {name:'井の頭公園', lat:35.6975, lng:139.5771, area:367000,
   boundary_points:[[35.7020,139.5768],[35.6931,139.5770],[35.6975,139.5840],[35.6975,139.5693]],
   entrances:[[35.7008,139.5786],[35.6966,139.5738]]},
  {name:'小金井公園', lat:35.7208, lng:139.5021, area:788000,
   entrances:[[35.7048,139.5043],[35.7360,139.4993]]},
];

// ===== WALK_STATION (主要駅のみ抜粋) =====
// 全駅はfetch_geojson.pyの値だが、ここでは既存stations.jsonのwalkを"旧スコア"として比較
// WALK_STATIONのbaseはstations.jsonには保存されていないため、オーバーライドなし駅はbase=60で近似

const STATION_OVERRIDE = {
  '代々木公園_5a2091':  {walk_base:85},
  '代々木八幡_80028d': {walk_base:82},
  '代々木_a00496':      {walk_base:70},
  '明治神宮前_f3ebe8':  {walk_base:70},
  '参宮橋_10a2cd':      {walk_base:65},
  '千駄ヶ谷_a63c5c':    {walk_base:60},
  '北千住_93f4e2':      {walk_base:54},
  '木場_a4a435':        {walk_base:56},
  '下赤塚_687399':  {walk_base:62},
  '地下鉄赤塚_cc2b86': {walk_base:62},
  '金町_f7f426':    {walk_base:62},
  '赤坂見附_6c6bf2': {walk_base:75},
  '光が丘_21fde0':      {walk_base:85},
  '石神井公園_d3b96b':   {walk_base:69},
  '渋谷_31a4ea':        {walk_base:62},
  '二子玉川_e3b826':    {walk_base:85},
  '足立小台_5064bc':    {walk_base:85},
  '谷在家_861183':      {walk_base:75},
  '見沼代親水公園_9f8565': {walk_base:62},
  '春日_3187bc':        {walk_base:67},
  '王子駅前_36ace5':    {walk_base:67},
  '飛鳥山_3b08c6':      {walk_base:67},
  '町屋_20cc14':        {walk_base:68},
  '秋葉原_4b226d':      {walk_base:57},
  '東日本橋_c35183':    {walk_base:63},
  '荒川二丁目_3f1ecf':  {walk_base:69},
  '新御茶ノ水_a485f1':  {walk_base:41},
  '京成上野_fabb1f':   {walk_base:75},
  '上野広小路_cfe21b': {walk_base:65},
  '上野御徒町_4bc376': {walk_base:65},
  '御徒町_1d1560':     {walk_base:65},
  '新御徒町_92e5e3':   {walk_base:60},
  '東大前_df831c':     {walk_base:50},
};

const BIG_PARK_KEYWORDS = [
  '篠崎公園','大島小松川','新左近川','小岩公園','親水公園','河川敷',
  '代々木公園','明治神宮','新宿御苑','浜離宮','芝公園','上野公園',
  '井の頭公園','石神井公園','赤塚公園','光が丘公園','舎人公園',
  '砧公園','駒沢公園','多摩川','荒川','隅田公園','木場公園',
];

function minParkDist(stLat, stLng, p) {
  const pts = [...(p.boundary_points || []), ...(p.entrances || []), [p.lat, p.lng]];
  return Math.min(...pts.map(([la,lo]) => haversine(stLat, stLng, la, lo)));
}

function calcWalkScore(fac, base, stLat, stLng, baseIsOverride) {
  const parkScore   = Math.min(fac.parks.length * 10, 50);
  let dogrunScore   = fac.dogruns.length > 0 ? 40 : 0;
  const bigParks    = fac.parks.filter(p => BIG_PARK_KEYWORDS.some(k => p.includes(k)));
  let bonus         = Math.min(bigParks.length * 15, 30);
  if (stLat && stLng) {
    const nearLarge = LARGE_PARKS.filter(p => minParkDist(stLat, stLng, p) <= 1600);
    if (nearLarge.length > 0) {
      const maxArea = Math.max(...nearLarge.map(p => p.area));
      if (maxArea >= 100000) bonus = Math.max(bonus, 30);
      else if (maxArea >= 30000) bonus = Math.max(bonus, 20);
      else if (maxArea >= 10000) bonus = Math.max(bonus, 10);
      if (fac.dogruns.length === 0) {
        const dogrunParks = nearLarge.filter(p => p.name.includes('ドッグ') || p.dogrun);
        if (dogrunParks.length > 0) dogrunScore = 40;
      }
    }
  }
  const osmScore = Math.min(parkScore + dogrunScore + bonus, 90);
  const noOsmData = fac.parks.length === 0 && fac.dogruns.length === 0 &&
    !(stLat && LARGE_PARKS.some(p => minParkDist(stLat, stLng, p) <= 1600));
  if (noOsmData) return base;
  let blended;
  if (osmScore === 0) blended = base;
  else if (osmScore < base * 0.5) blended = Math.round(osmScore * 0.4 + base * 0.6);
  else blended = Math.round(osmScore * 0.7 + base * 0.3);
  if (baseIsOverride) return Math.max(blended, base);
  return blended;
}

// ===== 旧min_park_dist（boundary_pointsなし）=====
function minParkDistOld(stLat, stLng, p) {
  const pts = [...(p.entrances || []), [p.lat, p.lng]];
  return Math.min(...pts.map(([la,lo]) => haversine(stLat, stLng, la, lo)));
}

function calcWalkScoreOld(fac, base, stLat, stLng, baseIsOverride) {
  const parkScore   = Math.min(fac.parks.length * 10, 50);
  let dogrunScore   = fac.dogruns.length > 0 ? 40 : 0;
  const bigParks    = fac.parks.filter(p => BIG_PARK_KEYWORDS.some(k => p.includes(k)));
  let bonus         = Math.min(bigParks.length * 15, 30);
  if (stLat && stLng) {
    const nearLarge = LARGE_PARKS.filter(p => minParkDistOld(stLat, stLng, p) <= 1600);
    if (nearLarge.length > 0) {
      const maxArea = Math.max(...nearLarge.map(p => p.area));
      if (maxArea >= 100000) bonus = Math.max(bonus, 30);
      else if (maxArea >= 30000) bonus = Math.max(bonus, 20);
      else if (maxArea >= 10000) bonus = Math.max(bonus, 10);
      if (fac.dogruns.length === 0) {
        // 旧ロジック：'ドッグ'がname内のみ
        const dogrunParks = nearLarge.filter(p => p.name.includes('ドッグ'));
        if (dogrunParks.length > 0) dogrunScore = 40;
      }
    }
  }
  const osmScore = Math.min(parkScore + dogrunScore + bonus, 90);
  const noOsmData = fac.parks.length === 0 && fac.dogruns.length === 0 &&
    !(stLat && LARGE_PARKS.some(p => minParkDistOld(stLat, stLng, p) <= 1600));
  if (noOsmData) return base;
  let blended;
  if (osmScore === 0) blended = base;
  else if (osmScore < base * 0.5) blended = Math.round(osmScore * 0.4 + base * 0.6);
  else blended = Math.round(osmScore * 0.7 + base * 0.3);
  if (baseIsOverride) return Math.max(blended, base);
  return blended;
}

// ===== メイン処理 =====
const TARGET_NAMES = new Set([
  '高島平','西高島平','新高島平','成増','地下鉄成増',
  '沼袋','野方','新井薬師前',
  '中目黒','恵比寿','神泉',
  '高輪ゲートウェイ','泉岳寺',
  '外苑前','青山一丁目','表参道',
  '国会議事堂前','飯田橋','神楽坂',
  '早稲田','雑司ヶ谷','護国寺',
]);

const changes = [];
const targetResults = {};
const overrideChanges = [];

// WALK_STATIONをfetch_geojson.pyから読み込む（重要：ここでは簡略化のため旧スコアを参照）
// 実際はstations.jsonの現在のwalkを"旧スコア"として使い、新計算を比較

for (const st of stations) {
  const {name, id: sid, lat, lng, walk: oldWalk} = st;
  if (oldWalk === null || oldWalk === undefined) continue;

  const fac = {
    parks:   st.parks || [],
    dogruns: st.dogruns || [],
    vets:    st.vets || [],
    vets_emergency: st.vets_emergency || [],
    dog_cafes: st.dog_cafes || [],
    groomings: st.groomings || [],
    carshares: st.carshares || [],
    car_rentals: st.car_rentals || [],
  };

  const ov = STATION_OVERRIDE[sid] || {};
  // walk_baseはstations.jsonには保存されていないため、
  // OVERRIDEがある駅はそのwalk_base、ない駅は現在のwalkをbaseとして使う
  // （正確にはWALK_STATIONが必要だが近似として）
  const walkBase = ov.walk_base !== undefined ? ov.walk_base : oldWalk;
  const baseIsOverride = ov.walk_base !== undefined;

  // 旧計算（boundary_pointsなし）
  const calcOld = calcWalkScoreOld(fac, walkBase, lat, lng, baseIsOverride);
  // 新計算（boundary_points有り）
  const calcNew = calcWalkScore(fac, walkBase, lat, lng, baseIsOverride);

  if (calcNew !== calcOld) {
    changes.push({name, sid, oldWalk, calcOld, calcNew});
  }

  if (TARGET_NAMES.has(name)) {
    targetResults[name] = {oldWalk, calcOld, calcNew};
  }

  // STATION_OVERRIDE見直し候補：OVERRIDEがある駅で自動計算値>=OVERRIDE値
  if (baseIsOverride) {
    const ovVal = ov.walk_base;
    const calcNoOv = calcWalkScore(fac, oldWalk, lat, lng, false);
    if (calcNoOv >= ovVal) {
      overrideChanges.push({name, sid, ovVal, calcNoOv});
    }
  }
}

console.log(`\n=== walkスコア変化駅数（今回の変更による計算差分）: ${changes.length} ===\n`);

console.log('=== 指定駅の変化前後 ===');
const targetOrder = [
  '高島平','西高島平','新高島平','成増','地下鉄成増',
  '沼袋','野方','新井薬師前',
  '中目黒','恵比寿','神泉',
  '高輪ゲートウェイ','泉岳寺',
  '外苑前','青山一丁目','表参道',
  '国会議事堂前','飯田橋','神楽坂',
  '早稲田','雑司ヶ谷','護国寺',
];
for (const t of targetOrder) {
  if (targetResults[t]) {
    const {oldWalk, calcOld, calcNew} = targetResults[t];
    const mark = calcNew !== calcOld ? '★変化' : '  同値';
    console.log(`${mark} ${t}: 現在=${oldWalk}, 旧計算=${calcOld}, 新計算=${calcNew}`);
  } else {
    console.log(`  NOT FOUND: ${t}`);
  }
}

console.log('\n=== 全変化駅一覧（今回boundary_points追加による変化）===');
for (const {name, sid, oldWalk, calcOld, calcNew} of changes.sort((a,b)=>a.name.localeCompare(b.name,'ja'))) {
  console.log(`  ${name}: 旧計算=${calcOld} → 新計算=${calcNew}  (現在=${oldWalk}, sid=${sid})`);
}

console.log('\n=== 作業5: STATION_OVERRIDE削除候補 ===');
console.log('（自動計算値 >= OVERRIDE値になった駅）');
if (overrideChanges.length === 0) {
  console.log('  なし');
} else {
  for (const {name, sid, ovVal, calcNoOv} of overrideChanges) {
    console.log(`  削除候補: ${name} (OVERRIDE=${ovVal}, 自動計算=${calcNoOv}, sid=${sid})`);
  }
}
