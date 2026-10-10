// Verificador de DTO DOCUMENTAL. Não é biblioteca de produto.
import assert from 'node:assert/strict';
export const MONEY_MAX = 99999999999999n;
export function decimal(token, {scale=2, signed=false, individual=false}={}) {
  assert.equal(typeof token,'string','DECIMAL_TYPE');
  assert(new RegExp(`^${signed?'-?':''}(0|[1-9][0-9]*)\\.[0-9]{${scale}}$`).test(token),'DECIMAL_FORMAT');
  const n=BigInt(token.replace('.',''));
  assert(!(n===0n&&token.startsWith('-')),'NEGATIVE_ZERO');
  const max=10n**BigInt(12+scale)-1n;
  if(individual) assert(n<=max&&n>=-max,'INDIVIDUAL_RANGE');
  return n;
}
export function validateAmount(row,{scale=2,signed=false,na=false,capacity=false}={}) {
  assert(row&&typeof row==='object'&&!Array.isArray(row),'AMOUNT_OBJECT');
  assert.deepEqual(Object.keys(row).sort(),['state','value','knownSubtotal','outsideIndividualRange','missingPaths'].sort(),'AMOUNT_FIELDS');
  assert(Array.isArray(row.missingPaths)&&row.missingPaths.every(x=>typeof x==='string'&&x.startsWith('/')),'MISSING_PATHS');
  assert.equal(new Set(row.missingPaths).size,row.missingPaths.length,'DUPLICATE_PATH');
  if(row.state==='KNOWN'||row.state==='PARTIAL') {
    const n=decimal(row.knownSubtotal,{scale,signed});
    assert.equal(row.outsideIndividualRange,(n<0n?-n:n)>10n**BigInt(12+scale)-1n,'RANGE_INDICATOR');
    if(row.state==='KNOWN'){
      assert.equal(row.value,row.knownSubtotal,'KNOWN_VALUE');
      assert.equal(row.missingPaths.length,0,'KNOWN_MISSING');
      if(capacity)assert(n<=MONEY_MAX,'CAPACITY_RANGE');
    } else {
      assert.equal(row.value,null,'PARTIAL_VALUE');
      assert(row.missingPaths.length>0,'PARTIAL_MISSING');
      assert(!capacity,'CAPACITY_NOT_PARTIAL');
    }
  } else {
    assert(row.state==='UNKNOWN'||(na&&row.state==='NOT_APPLICABLE'),'AMOUNT_STATE');
    assert.equal(row.value,null,'UNKNOWN_VALUE');assert.equal(row.knownSubtotal,null,'UNKNOWN_SUBTOTAL');
    assert.equal(row.outsideIndividualRange,null,'UNKNOWN_RANGE');
    assert(row.state==='UNKNOWN'?row.missingPaths.length>0:row.missingPaths.length===0,'UNKNOWN_MISSING');
  }
}
// Expected financeiro vem das fixtures literais; este cálculo confronta suas parcelas.
export function reconcileParts(row,parts,options={}) {
  validateAmount(row,options);
  const known=parts.filter(x=>x!==null),missing=parts.length-known.length;
  const sum=known.reduce((n,s)=>n+decimal(s,options),0n);
  const state=missing?(known.length?'PARTIAL':'UNKNOWN'):'KNOWN';
  assert.equal(row.state,state,'COMPLETENESS');
  if(known.length||!missing)assert.equal(decimal(row.knownSubtotal,options),sum,'SUM_MISMATCH');
}
