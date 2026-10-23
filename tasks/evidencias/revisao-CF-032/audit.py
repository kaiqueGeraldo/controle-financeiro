"""Read-only independent evidence audit: stdlib, Decimal, OOXML; no product oracle."""
import json, sys, hashlib, zipfile, xml.etree.ElementTree as ET
from pathlib import Path
from decimal import Decimal as D, ROUND_HALF_UP

run=Path(sys.argv[1]); dest=Path(sys.argv[2])
def read(name): return json.loads((run/name).read_text(encoding='utf-8-sig'))
def money(value): return D(str(value))
checks=[]
for prefix in ['B','C']:
    expected=[('cash',D('1300')+D('250.10')-D('40.20')-D('2'),D('350'),D('501'),D('350')),
              ('purchase',D('1507.90'),D('350')+D('120'),D('501'),D('350')),
              ('payment',D('1507.90')-D('200'),D('470')-D('200'),D('501'),D('350')),
              ('final',D('1307.90')-D('21'),D('270'),D('500')+(D('1')/3*5).quantize(D('.01'),rounding=ROUND_HALF_UP),D('450'))]
    for name,accounts,debt,invest,reserve in expected:
        data=read(f'{prefix}-{name}-sql.json')
        observedAccounts=sum(money(a['balance']) for a in data['accounts'])
        observedDebt=sum(money(a['amount'])-money(a['paid_amount'])-money(a['refunded_amount']) for a in data['cardLines'])
        observedInvestment=sum(money(a['valuation_amount']) for a in data['investments'])
        observedReserve=sum(money(a['amount']) for a in data['allocations'] if a['account_id'])
        assert (observedAccounts,observedDebt,observedInvestment,observedReserve)==(accounts,debt,invest,reserve)
        checks.append(dict(checkpoint=f'{prefix}-{name}',accounts=str(accounts),debt=str(debt),investment=str(invest),reservedAccounts=str(reserve),netWorth=str(accounts+invest-debt),freeCash=str(accounts-reserve)))
    final=read(f'{prefix}-final-sql.json')
    stock=next(i for i in final['investments'] if i['position_mode']=='UNIT')
    assert money(stock['total_cost'])==D('.60')+2*D('10')+D('1')
    assert money(stock['quantity'])==5
    fixed=next(i for i in final['investments'] if i['position_mode']=='MONETARY')
    assert fixed['total_cost'] is None and fixed['quantity'] is None
assert read('B-final-sql.json')==read('B-new-session-sql.json')

ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
books=[]
for file in run.glob('*.xlsx'):
    with zipfile.ZipFile(file) as z:
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            strings=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        styles=ET.fromstring(z.read('xl/styles.xml'))
        xfs=styles.find('s:cellXfs',ns)
        sheets=[]
        for name in z.namelist():
            if not name.startswith('xl/worksheets/sheet') or not name.endswith('.xml'): continue
            cells=[]
            for c in ET.fromstring(z.read(name)).findall('.//s:c',ns):
                raw=c.findtext('s:v',None,ns); typ=c.get('t','n')
                val=strings[int(raw)] if typ=='s' else ''.join(c.find('s:is',ns).itertext()) if typ=='inlineStr' else raw
                cells.append(dict(cell=c.get('r'),type=typ,value=val,style=c.get('s','0'),numFmtId=xfs[int(c.get('s','0'))].get('numFmtId'),xml=ET.tostring(c,encoding='unicode')))
            sheets.append(dict(part=name,cells=cells))
        books.append(dict(file=file.name,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),sheets=sheets))
october=next(b for b in books if b['file']=='C-october.xlsx')
cells=october['sheets'][0]['cells']
description=next(c for c in cells if c['value']=='CF032 receita')
row=description['cell'][1:]
time=next(c for c in cells if c['cell']=='B'+row)
assert time['value']=='12:34' and time['type'] in ('s','inlineStr')
sqltime=next(t['time'] for t in read('C-final-sql.json')['transactions'] if t['description']=='CF032 receita')
assert sqltime=='12:34:56'
report={'income':str(D('250.10')),'consumption':str(D('40.20')+D('2')+D('120')),'result':str(D('250.10')-D('40.20')-D('2')-D('120')),'cash':str(D('250.10')-D('40.20')-D('2')-D('200')-D('21'))}
for value in [report['income'],report['consumption'],report['result']]:
    assert any(c['value']==value for c in cells)
result=dict(run=str(run),checkpoints=checks,report=report,time=dict(database=sqltime,cell=time,classification='B: text serialization truncates seconds; not hidden numeric formatting'),workbooks=books)
dest.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(checkpoints=len(checks),workbooks=len(books),time=time,report=report),ensure_ascii=False))
