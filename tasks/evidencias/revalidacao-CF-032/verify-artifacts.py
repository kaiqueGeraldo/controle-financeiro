"""Independent artifact consistency checks; no application imports."""
from pathlib import Path
import json, hashlib, xml.etree.ElementTree as ET

root=Path(__file__).resolve().parent
repo=root.parents[2]
audit=json.loads((root/'audit.json').read_text(encoding='utf-8'))
books={b['file']:b for b in audit['workbooks']}
def values(name):
    return [c['value'] for s in books[name]['sheets'] for c in s['cells'] if c['value'] is not None]
assert 'RECEITA EXCLUSIVA A' in values('H-A.xlsx')
assert 'DESPESA EXCLUSIVA B' not in values('H-A.xlsx')
assert 'RECEITA EXCLUSIVA A' not in values('H-B.xlsx')
assert 'DESPESA EXCLUSIVA B' in values('H-B.xlsx')
assert any('PARTIAL' in v for v in values('H-A.xlsx'))
assert any('Indisponível' in v for v in values('C-october.xlsx'))
assert all(x['netWorth']=='1518.57' and x['freeCash']=='836.90' for x in audit['checkpoints'] if x['checkpoint'].endswith('final'))
proofs=json.loads((root/'proof-hashes.json').read_text(encoding='utf-8-sig'))
assert len(proofs)==8 and all(p['equal'] for p in proofs)
mutants=json.loads((repo/'tasks/evidencias/saneamento-CF-032/counterproofs/results.json').read_text(encoding='utf-8-sig'))
verified=[]
for mutant in mutants:
    for target in mutant['files']:
        rel=target['file'].replace('backend/','controle-financeiro-backend/',1) if target['file'].startswith('backend/') else target['file'].replace('frontend/','controle-financeiro-frontend/',1)
        digest=hashlib.sha256((repo/rel).read_bytes()).hexdigest().upper()
        assert digest==target['beforeHash']==target['restoredHash'] and digest!=target['mutantHash']
        verified.append(rel)
reports=[]
for folder in ['backend','certification']:
    for file in (root/folder/'reports').glob('TEST-*.xml'):
        suite=ET.parse(file).getroot()
        reports.append(dict(run=folder,name=suite.get('name'),tests=int(suite.get('tests')),failures=int(suite.get('failures')),errors=int(suite.get('errors'))))
control=[s for s in reports if s['run']=='backend' and not s['name'].endswith('CertificationProbeTest')]
assert sum(s['tests'] for s in control)==95 and all(s['errors']==s['failures']==0 for s in control)
assert sum(s['tests'] for s in reports if s['run']=='certification')==5
assert all(s['errors']==s['failures']==0 for s in reports if s['run']=='certification')
result=dict(workbooks=len(books),isolatedExports=True,partialCoveragePreserved=True,originalProofs=8,verifiedHistoricalMutantTargets=verified,backendReports=reports)
(root/'artifact-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(dict(workbooks=len(books),historicalMutations=len(mutants),backendControls=95,newProbes=5)))
