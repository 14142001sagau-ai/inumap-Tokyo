import requests, json, os, time, openpyxl

OVERPASS = 'https://overpass-api.de/api/interpreter'
EXCEL = 'data/master.xlsx'
RADIUS = 1300

# HOUSING = 治安40% + 商業施設50% + ペット可10%
# 商業スコアは犬連れ視点で調整（繁華街系は減点）
HOUSING   = {'nishikasai':72,'kasai':70,'kasairinkai':46,'funabori':70,'ichinoe':68,'mizue':63,'shinozaki':64,'koiwa':58,'shinkoiwa':62,'hirai':65,'edogawa':57,'keiseikoiwa':70}

# SAFETY = 凶悪犯x3 + 粗暴犯x2 + 侵入窃盗x1 + 軽犯罪x0.5（R6実データ）
SAFETY    = {'nishikasai':59,'kasai':64,'kasairinkai':74,'funabori':70,'ichinoe':80,'mizue':70,'shinozaki':77,'koiwa':55,'shinkoiwa':64,'hirai':67,'edogawa':75,'keiseikoiwa':73}
COMMUNITY = {'nishikasai':71,'kasai':69,'kasairinkai':65,'funabori':67,'ichinoe':69,'mizue':70,'shinozaki':79,'koiwa':70,'shinkoiwa':68,'hirai':72,'edogawa':68,'keiseikoiwa':67}
WALK      = {'nishikasai':80,'kasai':80,'kasairinkai':80,'funabori':80,'ichinoe':40,'mizue':80,'shinozaki':80,'koiwa':40,'shinkoiwa':80,'hirai':80,'edogawa':40,'keiseikoiwa':80}
MEDICAL   = {'nishikasai':78,'kasai':90,'kasairinkai':30,'funabori':78,'ichinoe':30,'mizue':66,'shinozaki':66,'koiwa':30,'shinkoiwa':81,'hirai':69,'edogawa':30,'keiseikoiwa':95}
MOBILITY  = {'nishikasai':50,'kasai':60,'kasairinkai':50,'funabori':50,'ichinoe':50,'mizue':50,'shinozaki':50,'koiwa':50,'shinkoiwa':50,'hirai':50,'edogawa':50,'keiseikoiwa':50}
NAME_TO_ID = {'西葛西':'nishikasai','葛西':'kasai','葛西臨海公園':'kasairinkai','船堀':'funabori','一之江':'ichinoe','瑞江':'mizue','篠崎':'shinozaki','小岩':'koiwa','新小岩':'shinkoiwa','平井':'hirai','江戸川':'edogawa','京成小岩':'keiseikoiwa'}
def load_stations():
 wb = openpyxl.load_workbook(EXCEL)
 results = []
 for ws in wb.worksheets:
  for row in ws.iter_rows(min_row=2, values_only=True):
   if not row[0]: continue
   ku,name,line,lat,lng,fl = row[0],row[1],row[2],row[3],row[4],row[5]
   sid = NAME_TO_ID.get(name, name)
   results.append({'id':sid,'name':name,'line':line,'lat':lat,'lng':lng,'fl':fl,'ku':ku})
 return results
def get_fac(lat,lng):
 a=str(RADIUS); c=str(lat)+','+str(lng)
 q='[out:json][timeout:45];(node[leisure=park](around:'+a+','+c+');way[leisure=park](around:'+a+','+c+');node[shop=supermarket](around:'+a+','+c+');node[amenity=veterinary](around:'+a+','+c+');node[leisure=dog_park](around:'+a+','+c+');node[shop=pet](around:'+a+','+c+');node[amenity=car_sharing](around:'+a+','+c+'););out center;'
 try:
  r=requests.post(OVERPASS,data={'data':q},timeout=45)
  els=r.json().get('elements',[])
  parks,vets,dogruns,pets,carshares=[],[],[],[],[]
  for el in els:
   tags=el.get('tags',{}); n=tags.get('name','')
   if not n: continue
   if tags.get('leisure')=='park': parks.append(n)
   elif tags.get('leisure')=='dog_park': dogruns.append(n)
   elif tags.get('amenity')=='veterinary': vets.append(n)
   elif tags.get('shop')=='pet': pets.append(n)
   elif tags.get('amenity')=='car_sharing': carshares.append(n)
  return {'parks':parks[:5],'vets':vets[:5],'dogruns':dogruns[:3],'pets':pets[:3],'carshares':carshares[:3]}
 except: return {'parks':[],'vets':[],'dogruns':[],'pets':[],'carshares':[]}
stations=load_stations()
print('読み込み完了: '+str(len(stations))+'駅')
results=[]
for st in stations:
 print('📍 '+st['name'])
 fac=get_fac(st['lat'],st['lng'])
 time.sleep(1.5)
 sid=st['id']
 results.append({'id':sid,'name':st['name'],'line':st['line'],'lat':st['lat'],'lng':st['lng'],'walk':WALK.get(sid,40),'housing':HOUSING.get(sid,65),'medical':MEDICAL.get(sid,50),'mobility':MOBILITY.get(sid,50),'community':COMMUNITY.get(sid,68),'safety':SAFETY.get(sid,70),'fl':st['fl'],'parks':fac['parks'],'vets':fac['vets'],'dogruns':fac['dogruns'],'carshares':fac['carshares']})
os.makedirs('data',exist_ok=True)
with open('data/stations.json','w',encoding='utf-8') as f: json.dump(results,f,ensure_ascii=False,indent=2)
print('✅ '+str(len(results))+'駅保存完了')
