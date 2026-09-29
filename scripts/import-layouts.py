"""Join Jules Roy's CC BY 4.0 layout archive to the venue registry.
Usage: python scripts/import-layouts.py /path/to/f1-circuits-svg-main
Download: https://github.com/julesr0y/f1-circuits-svg (retain its LICENSE).
"""
import json,pathlib,sys,unicodedata,re,shutil
ROOT=pathlib.Path(__file__).resolve().parents[1];REPO=pathlib.Path(sys.argv[1]);data=json.loads((ROOT/'src/data/circuits.json').read_text());layouts=json.loads((REPO/'circuits.json').read_text())
def norm(s):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
explicit={'ti-circuit-aida':'aida','scandinavian-raceway':'anderstorp','autodromo-oscar-y-juan-galvez':'buenos-aires','circuit-de-charade':'clermont-ferrand','prince-george-circuit':'east-london','circuito-permanente-del-jarama':'jarama','albert-park-circuit':'melbourne','mosport-park':'mosport','circuito-da-boavista':'porto','algarve-international-circuit':'portimao','red-bull-ring':'spielberg','korea-international-circuit':'yeongam','autodromo-nazionale-di-monza':'monza'}
for c in data:
 target=next((g for g in layouts if g['id']==explicit.get(c['id'])),None)
 if not target:target=next((g for g in layouts if norm(c['name'])==norm(g['name'])),None)
 if not target:target=next((g for g in layouts if norm(g['id']) in norm(c['id'])),None)
 if not target:raise ValueError('No map match: '+c['id'])
 c['layoutVersions']=[]
 for l in target['layouts']:
  filename=l['layoutId']+'.svg';src=REPO/'circuits/minimal/black'/filename
  if not src.exists():raise ValueError('Missing '+filename)
  shutil.copyfile(src,ROOT/'public/maps'/filename)
  c['layoutVersions'].append({'id':l['layoutId'],'era':l['seasons'],'image':'/maps/'+filename})
 if not c['path']:
  latest=max(c['layoutVersions'],key=lambda l:max(map(int,re.findall(r'\d{4}',l['era']))))
  c['image']=latest['image'];c['mapSource']='https://github.com/julesr0y/f1-circuits-svg';c['mapScope']='Schematic last-used F1 layout, Jules Roy (CC BY 4.0)'
 c['layoutSource']='https://github.com/julesr0y/f1-circuits-svg'
(ROOT/'src/data/circuits.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
valid={pathlib.Path(l['image']).name for c in data for l in c['layoutVersions']}
for f in (ROOT/'public/maps').iterdir():
 if f.name not in valid:f.unlink()
shutil.copyfile(REPO/'LICENSE',ROOT/'licenses/Jules-Roy-CC-BY-4.0.txt')
print('Complete:',len(data),'venues;',sum(len(c['layoutVersions']) for c in data),'historical layout diagrams')
