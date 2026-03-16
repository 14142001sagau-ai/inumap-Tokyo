import requests, json, os, time, openpyxl
OVERPASS = 'https://overpass-api.de/api/interpreter'
EXCEL = 'data/master.xlsx'
RADIUS = 2000
HOUSING   = {'nishikasai':62,'kasai':63,'kasairinkai':50,'funabori':66,'ichinoe':68,'mizue':72,'shinozaki':76,'koiwa':70,'shinkoiwa':68,'hirai':70,'edogawa':68,'keiseikoiwa':67}
SAFETY    = {'nishikasai':78,'kasai':74,'kasairinkai':82,'funabori':72,'ichinoe':74,'mizue':76,'shinozaki':82,'koiwa':55,'shinkoiwa':54,'hirai':70,'edogawa':70,'keiseikoiwa':68}
COMMUNITY = {'nishikasai':71,'kasai':69,'kasairinkai':65,'funabori':67,'ichinoe':69,'mizue':70,'shinozaki':79,'koiwa':70,'shinkoiwa':68,'hirai':72,'edogawa':68,'keiseikoiwa':67}
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
 walk=min(100,40+len(fac['parks'])*8+len(fac['dogruns'])*15)
 medical=min(100,30+len(fac['vets'])*12+len(fac['pets'])*5)
 mobility=min(100,50+len(fac['carshares'])*10)
 results.append({'id':st['id'],'name':st['name'],'line':st['line'],'lat':st['lat'],'lng':st['lng'],'walk':walk,'housing':HOUSING.get(st['id'],65),'medical':medical,'mobility':mobility,'community':COMMUNITY.get(st['id'],68),'safety':SAFETY.get(st['id'],70),'fl':st['fl'],'parks':fac['parks'],'vets':fac['vets'],'dogruns':fac['dogruns'],'carshares':fac['carshares']})
os.makedirs('data',exist_ok=True)
with open('data/stations.json','w',encoding='utf-8') as f: json.dump(results,f,ensure_ascii=False,indent=2)
print('✅ '+str(len(results))+'駅保存完了')
