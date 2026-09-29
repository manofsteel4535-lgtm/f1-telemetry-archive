"""Reproducible archive import. Python 3 + pandas + lxml. Network required."""
import json,re,math,unicodedata,urllib.request,urllib.parse,concurrent.futures,pathlib,subprocess
from lxml import html
import pandas as pd
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE='https://en.wikipedia.org/wiki/List_of_Formula_One_circuits'
def fetch(url):
    url=urllib.parse.quote(url,safe=":/?=&%#")
    req=urllib.request.Request(url,headers={'User-Agent':'F1TelemetryArchive/1.0 (educational circuit archive)'})
    return urllib.request.urlopen(req,timeout=22).read()
def slug(s):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
raw=pathlib.Path('/tmp/f1-circuit-list.html').read_bytes() if pathlib.Path('/tmp/f1-circuit-list.html').exists() else fetch(SOURCE)
table=html.fromstring(raw).xpath('//table[contains(@class,"wikitable")]')[1]
df=pd.read_html(raw.decode())[2]
geo=json.load(open('/tmp/circuits.geojson')) if pathlib.Path('/tmp/circuits.geojson').exists() else json.loads(fetch('https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson'))
features=geo['features']
aliases={'algarve':'portimao','enzo':'imola','jose':'interlagos','las-vegas':'las-vegas','lusail':'losail','madring':'madrid'}
def find_geo(name):
    special={'algarve':22,'enzo':20,'jose':18,'las-vegas':35,'lusail':32,'madring':33,'monza':12,'istanbul':25}
    for key,i in special.items():
        if key in slug(name):return features[i]
    sn=slug(name)
    for f in features:
        fn=slug(f['properties']['Name'])
        if sn==fn or sn in fn or fn in sn:return f
    return None
def path_for(f):
    coords=f['geometry']['coordinates'];lat=sum(p[1] for p in coords)/len(coords)
    pts=[(p[0]*math.cos(math.radians(lat)),-p[1]) for p in coords]
    xmin=min(p[0] for p in pts);ymin=min(p[1] for p in pts);w=max(p[0] for p in pts)-xmin;h=max(p[1] for p in pts)-ymin;s=min(620/w,360/h)
    return 'M'+' L'.join(f'{(x-xmin)*s+(720-w*s)/2:.1f},{(y-ymin)*s+(460-h*s)/2:.1f}' for x,y in pts)+' Z'
rows=[]
for (_,r),tr in zip(df.iterrows(),table.xpath('./tbody/tr | ./tr')[1:]):
    cells=tr.xpath('./td'); name=re.sub(r'\s*[*†]\s*','',r['Circuit']).strip();years=[int(y) for y in re.findall(r'\b(?:19|20)\d{2}\b',str(r['Season(s)']))]
    if not cells:continue
    url=cells[0].xpath('.//a/@href')[0];f=find_geo(name)
    imgs=cells[1].xpath('.//img/@src');img=imgs[0] if imgs else ''
    if img.startswith('//'):img='https:'+img
    original=re.sub(r'/thumb/','/',img).split('?')[0].replace('thumb.wikimedia.org','upload.wikimedia.org')
    if '/thumb/' in img:original=original.rsplit('/',1)[0]
    pages=cells[1].xpath('.//a/@href')
    c={'id':slug(name),'name':name,'country':r['Country'].replace('West Germany','Germany'),'location':r['Location'],'type':r['Type'],'direction':r['Direction'],'length':float(re.search(r'[\d.]+',r['Last length used'])[0]),'turns':int(re.search(r'\d+',str(r['Turns']))[0]),'seasons':re.sub(r'\[.*?\]','',r['Season(s)']),'first':min(years),'last':max(years),'source':url,'mapSource':pages[0] if pages else None,'mapUrl':original,'path':path_for(f) if f else None,'mapScope':'Dataset configuration; see source' if f else 'Last F1 configuration per source','records':[]}
    # Recent classification deliberately does not imply a confirmed calendar slot.
    c['status']='recent' if c['last']>=2025 else 'historic'
    rows.append(c)
(ROOT/'public/maps').mkdir(exist_ok=True)
def enrich(c):
    try:
        page=html.fromstring(fetch(c['source']));records=[];config='Configuration as published in source';layouts=[]
        for tr in page.xpath('//table[contains(@class,"infobox")]//tr'):
            th=' '.join(tr.xpath('./th//text()')).strip();td=' '.join(tr.xpath('./td//text()')).strip();td=re.sub(r'\s+',' ',td)
            if th and not td and len(th)>8 and re.search(r'19\d{2}|20\d{2}',th):
                config=th;layouts.append(th)
            if 'lap record' in th.lower() and td:records.append({'label':th,'text':td,'configuration':config,'source':c['source']})
        c['layouts']=layouts
        c['records']=records
        paras=page.xpath('//p[not(ancestor::table)]')
        c['context']=' '.join(' '.join(p.itertext()).strip() for p in paras if len(' '.join(p.itertext()).strip())>120)[:800]
    except Exception as e:c['importNote']='Circuit profile could not be retrieved.'
    if not c['path'] and c['mapUrl']:
        try:
            blob=subprocess.check_output(['curl','-fLs','--max-time','30',c['mapUrl']])
            if b'<svg' in blob[:2000]:ext='svg'
            elif blob.startswith(b'\x89PNG'):ext='png'
            else:raise ValueError('Map response is not SVG or PNG')
            name=c['id']+'.'+ext
            (ROOT/'public/maps'/name).write_bytes(blob);c['image']='/maps/'+name
        except Exception:pass
    return c
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    result=list(pool.map(enrich,rows))
(ROOT/'src/data/circuits.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({'circuits':len(result),'geometry':sum(bool(c['path']) for c in result),'images':sum(bool(c.get('image')) for c in result),'withRecords':sum(bool(c['records']) for c in result)}))
