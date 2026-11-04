"""Independent read-only reconciliation; output contains metadata and identities only."""
import collections, datetime, hashlib, io, json, pathlib, re, subprocess, sys, xml.etree.ElementTree as ET
W=pathlib.Path(__file__).resolve().parents[3]
O=pathlib.Path(sys.argv[1]); O.mkdir(parents=True,exist_ok=True)
R=pathlib.Path('C:/cf-exp/1104d'); E=W/'tasks/evidencias/saneamento-caminhos-expanded'
read=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def sha(p):
    p=pathlib.Path(p).resolve()
    with open(chr(92)*2+'?'+chr(92)+str(p),'rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()
def save(name,x):
    (O/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def git(*args): return subprocess.check_output(['git',*args],cwd=W)
issues=[]
def check(ok,label):
    if not ok: issues.append(label)
source=read(R/'s/.ci-source.json'); result=read(R/'all/result.json'); package=read(R/'all/package-manifest.json')
# Independent Git object comparison handles only the documented CRLF checkout conversion.
entries={}
for entry in git('ls-tree','-r','-z',source['commit']).split(b'\0'):
    if entry:
        meta,p=entry.split(b'\t',1); entries[p.decode('utf-8')]=meta.split()[2]
objects=[]; missing=[]
for row in source['files']:
    check(sha(R/'s'/row['path'])==row['sha256'],'candidate byte drift '+row['path'])
    if row['path'] not in entries:missing.append(row['path'])
    else:objects.append((row,entries[row['path']]))
batch=subprocess.run(['git','cat-file','--batch'],input=b''.join(h+b'\n' for _,h in objects),stdout=subprocess.PIPE,check=True,cwd=W).stdout
stream=io.BytesIO(batch); same=converted=0; mismatches=[]
for row,h in objects:
    header=stream.readline().split(); data=stream.read(int(header[2])); stream.read(1)
    actual=(R/'s'/row['path']).read_bytes()
    if actual==data:same+=1
    elif actual.replace(b'\r\n',b'\n')==data.replace(b'\r\n',b'\n'):converted+=1
    else:mismatches.append(row['path'])
check(not missing and not mismatches,'Git candidate inputs differ')
selection=read(R/'all/backend-selection.json')
def junit(directory):
    records=[]; ids=[]; counts=collections.Counter(); retries=[]
    for f in sorted(directory.glob('TEST-*.xml')):
        s=ET.parse(f).getroot(); tests=s.findall('testcase'); c={k:int(s.get(k)) for k in ('tests','failures','errors','skipped')}
        actual={'tests':len(tests),**{k:sum(t.find(tag) is not None for t in tests) for k,tag in [('failures','failure'),('errors','error'),('skipped','skipped')]}}
        check(c==actual,'XML header/body differs '+f.name);counts.update(actual)
        for t in tests:
            ids.append((t.get('classname'),t.get('name')))
            if any('rerun' in e.tag.lower() or 'flaky' in e.tag.lower() for e in t.iter()):retries.append(f.name)
        records.append({'file':f.name,'sha256':sha(f),'class':s.get('name'),'counts':actual,'identities':[[t.get('classname'),t.get('name')] for t in tests]})
    return {'classes':len(records),'counts':dict(counts),'uniqueIdentities':len(set(ids)),'duplicateIdentities':[list(k) for k,n in collections.Counter(ids).items() if n>1],'retryElements':retries,'records':records}
backend=junit(R/'all/surefire'); e2ej=junit(R/'all/e2e-surefire')
check(sorted(x['class'] for x in backend['records'])==selection['selected'],'backend selection/report mismatch')
check(backend['counts']=={'tests':928,'failures':0,'errors':0,'skipped':0},'backend counts')
check(backend['classes']==116 and backend['uniqueIdentities']==928,'backend identity count')
rows=[]
for row in read(E/'MATRIZ-15.json')['rows']:
    old=ET.parse(row['raw'][0]['file']).getroot()
    log=pathlib.Path(row['raw'][1]['file']).read_text(encoding='utf8',errors='replace')
    key='ENOENT' if row['primaryKind'].startswith('Chromium') else 'exceeds max length'
    check(key in log,'old relevant error missing '+row['class'])
    current=next(x for x in backend['records'] if x['class']==row['class'])
    check([row['class'],row['test']] in current['identities'],'original method absent '+row['class'])
    rows.append({'class':row['class'],'method':row['test'],'primary':key,'oldFailures':int(old.get('failures')),'originalRawVerified':all(sha(p['file'])==p['sha256'] for p in row['raw']),'current':current['counts'],'oldSha256':sha(row['raw'][0]['file']),'newSha256':current['sha256']})
# Fixed evidence references, never recursive runtime enumeration.
refs={}; bad=[]
def visit(x):
    if isinstance(x,list):
        for v in x:visit(v)
    elif isinstance(x,dict):
        f=x.get('file',x.get('path')); h=x.get('sha256')
        if isinstance(f,str) and isinstance(h,str) and re.fullmatch('[0-9a-fA-F]{64}',h):
            p=pathlib.Path(f)
            if not p.is_absolute():p=W/p
            refs[(str(p),h)]=True
        for v in x.values():visit(v)
for name in ['PROVENIENCIA','COLETA','RESULTADOS','VALIDACAO-15','MATRIZ-15','DESTINOS','ENCODING','REUSO-COMPLEMENTAR']:
    visit(read(E/(name+'.json')))
for p,h in refs:
    try:
        if sha(p)!=h:bad.append({'file':p,'reason':'hash differs'})
    except OSError as e:bad.append({'file':p,'reason':type(e).__name__})
# Reconcile old reference manifest and exact authorized deltas.
preserved=read(E/'PRESERVACAO.json'); protected=read(preserved['protected']['file'])
deltas={str(pathlib.Path(x['file'])):x for x in preserved['referenceDeltas']}; unchanged=archived=0; preservation_bad=[]
for row in protected['refs']:
    p=str(pathlib.Path(row['file']))
    if sha(p)==row['sha256']:unchanged+=1;continue
    d=deltas.get(p)
    if d and d['before']==row['sha256'] and sha(d['original'])==row['sha256'] and sha(p)==d['after']:archived+=1
    else:preservation_bad.append(p)
old=read(preserved['oldArtifacts']['manifest']); oldrows=old.get('added',old.get('extra',[])); oldbase=pathlib.Path(preserved['oldArtifacts']['manifest']).parent/'c'
oldbad=[r['path'] for r in oldrows if sha(oldbase/r['path'])!=r['sha256']]
check(len(protected['refs'])==2340 and unchanged==2321 and archived==19 and not preservation_bad,'preservation refs')
check(len(oldrows)==24 and not oldbad,'old artifacts')
check(sha(W/'README.md')==preserved['readmes']['worktree'],'worktree README')
main=W.parent.parent/'controle-financeiro'; check(sha(main/'README.md')=='6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca','main README')
# Independent platform-neutral multiset reconciliation for Linux and Windows.
prior=pathlib.Path(preserved['protected']['file']).parent
components={}
for platform,reportf,auditf in [('linux',prior/'linux-02/components.json',prior/'linux-02/component-audit.json'),('windows',prior/'windows-expanded/components.json',prior/'windows-expanded/component-audit.json')]:
    report,audit=read(reportf),read(auditf);expected=collections.Counter((m['file'],n) for m in audit['collected'] for n in m['cases'])
    actual=collections.Counter();states=collections.Counter()
    for module in report['testResults']:
        name=module['name'].replace('\\','/').split('/controle-financeiro-frontend/',1)[1]
        for t in module['assertionResults']:actual[(name,t['fullName'])]+=1;states[t['status']]+=1
    check(expected==actual and sum(actual.values())==626 and len(report['testResults'])==71 and states=={'passed':626},platform+' components coverage')
    components[platform]={'occurrences':sum(actual.values()),'distinctFileFullName':len(actual),'files':len(report['testResults']),'states':dict(states),'titleCollisions':[{'file':k[0],'title':k[1],'count':n} for k,n in actual.items() if n>1],'reportSha256':sha(reportf),'auditSha256':sha(auditf),'context':audit['context']}
check(package['commit']==source['commit'] and package['sourceDigest']==source['digest'],'package source')
check(sha(R/'all'/package['file'])==package['sha256']=='564f87cd83f2b7ddd793b0cded03ac64080647b5522355dc88b27ce218497be9','jar hash')
check(package['gates']['backend']['jarSha256']==package['sha256'],'backend marker jar')
check(not bad,'direct proof references')
summary={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'examinedHead':'9334264d4d96e8b64a2de16090ef4c5a77496441','candidate':source['commit'],'candidateDigest':source['digest'],'candidateFiles':len(source['files']),'gitComparison':{'byteEqual':same,'crlfOnly':converted,'missing':missing,'mismatches':mismatches},'backend':{k:v for k,v in backend.items() if k!='records'},'e2eJava':{k:v for k,v in e2ej.items() if k!='records'},'original15':rows,'references':{'verified':len(refs)-len(bad),'mismatches':bad},'preservation':{'references':len(protected['refs']),'unchangedInPlace':unchanged,'authorizedArchived':archived,'unexpected':preservation_bad,'oldArtifacts':len(oldrows),'oldArtifactDrift':oldbad,'readmesPreserved':True},'components':components,'package':{'commit':package['commit'],'sha256':package['sha256'],'bytes':(R/'all'/package['file']).stat().st_size},'issues':issues}
save('reconciliacao.json',summary);save('java-identidades.json',{'backend':backend,'e2e':e2ej})
print(json.dumps({k:summary[k] for k in ['gitComparison','backend','references','preservation','components','issues']},ensure_ascii=False))
if issues:sys.exit(1)
