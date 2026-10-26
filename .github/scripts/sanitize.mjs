// Complete files only. This is a bounded format sanitizer, not secret discovery.
export const sanitizationLimits=Object.freeze({bytes:16*1024*1024,stringLayers:2,structureDepth:64});
const sensitive=/^(?:password|passwd|secret|authorization|proxy-authorization|cookie|set-cookie|api[_-]?key|access[_-]?token|refresh[_-]?token)$/i;
const header=/^(?:proxy-authorization|authorization|set-cookie|cookie)$/i;
const field=/(proxy-authorization|authorization|set-cookie|cookie|password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=][^\S\r\n]*/iy;
const redacted='[REDACTED]';
function checked(text){
  if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>sanitizationLimits.bytes)throw new Error('Unsafe evidence size');
  return text;
}
const whitespace=c=>c!==undefined&&/\s/.test(c);
function skipSpace(text,start){while(whitespace(text[start]))start++;return start;}
function lineEnd(text,start){while(start<text.length&&text[start]!=='\r'&&text[start]!=='\n')start++;return start;}
// Delimiter scan only; JSON.parse remains the JSON decoder. No backtracking.
function quoteEnd(text,start){
  const quote=text[start];
  for(let i=start+1;i<text.length;i++){
    if(text[i]==='\r'||text[i]==='\n')break;
    if(text[i]==='\\'){i++;continue;}
    if(text[i]===quote)return i+1;
  }
  throw new Error('Unsafe unterminated quoted value');
}
function parseJson(text){try{return JSON.parse(text);}catch{throw new SyntaxError('Unsafe malformed JSON evidence');}}
function visit(value,encoding,depth){
  if(depth>sanitizationLimits.structureDepth)throw new Error('Unsafe JSON structure depth');
  if(Array.isArray(value))return value.map(item=>visit(item,encoding,depth+1));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,sensitive.test(key)?redacted:visit(item,encoding,depth+1)]));
  return typeof value==='string'?textRules(value,encoding+1):value;
}
function textRules(text,encoding=0){
  // Plain terminal strings need no further decoding. Additional structured or
  // quoted content beyond the supported layers is rejected, never returned raw.
  if(encoding>sanitizationLimits.stringLayers&&/["\[{]/.test(text))throw new Error('Unsafe JSON string encoding depth');
  if(/^\s*[\[{]/.test(text)){
    let value;try{value=JSON.parse(text);}catch(error){if(!(error instanceof SyntaxError))throw error;}
    if(value!==undefined)return JSON.stringify(visit(value,encoding,0),null,2)+'\n';
  }
  const pieces=[];let copied=0,i=0,jsonValueStart=-1;
  function replace(start,end,value){pieces.push(text.slice(copied,start),value);copied=end;i=end;}
  while(i<text.length){
    if(text[i]==='\\'&&text[i+1]==='"')throw new Error('Unsafe escaped quote outside a JSON string');
    if(text[i]==='"'){
      let end;
      try{end=quoteEnd(text,i);}catch(error){if(i===jsonValueStart)throw error;i++;continue;}
      const raw=text.slice(i,end),decoded=parseJson(raw),colon=skipSpace(text,end);
      if(text[colon]===':'){
        if(sensitive.test(decoded)){
          const start=skipSpace(text,colon+1);let finish;
          if(text[start]==='"')finish=quoteEnd(text,start);
          else{
            finish=start;while(finish<text.length&&!whitespace(text[finish])&&!',}]'.includes(text[finish]))finish++;
            const scalar=text.slice(start,finish);
            if(!/^(?:null|true|false|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/.test(scalar))throw new Error('Unsafe malformed sensitive JSON field');
          }
          replace(i,finish,text.slice(i,start)+JSON.stringify(redacted));continue;
        }
        // Keys keep their exact spelling/escaping. Values are visited separately.
        jsonValueStart=skipSpace(text,colon+1);i=end;continue;
      }
      const safe=textRules(decoded,encoding+1);
      if(safe!==decoded){replace(i,end,JSON.stringify(safe));continue;}
      i=end;continue;
    }
    // One bounded identifier pattern outside JSON tokens. A quoted assignment
    // never falls through to an unquoted alternative if its delimiter is absent.
    if(i===0||!/[A-Za-z0-9_]/.test(text[i-1])){
      field.lastIndex=i;const match=field.exec(text);
      if(match){
        const start=field.lastIndex;let end=start;
        if(text[start]==='\r'||text[start]==='\n')throw new Error('Unsafe incomplete field value');
        if(header.test(match[1])){
          end=lineEnd(text,start);
          while(end<text.length){
            let next=end;if(text[next]==='\r')next++;if(text[next]==='\n')next++;
            if(text[next]!==' '&&text[next]!=='\t')break;end=lineEnd(text,next);
          }
        }else if(text[start]==='"'||text[start]==="'")end=quoteEnd(text,start);
        else while(end<text.length&&!whitespace(text[end])&&text[end]!==','&&text[end]!==';')end++;
        replace(i,end,text.slice(i,start)+redacted);continue;
      }
    }
    i++;
  }
  pieces.push(text.slice(copied));
  return pieces.join('').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED_JWT]').replace(/Cf003-[AB]-Senha-2026/g,'[SYNTHETIC_PASSWORD]');
}
export function sanitizeJson(text){return checked(JSON.stringify(visit(parseJson(checked(text)),0,0),null,2)+'\n');}
export function sanitizeText(text){return checked(textRules(checked(text)));}
export function sanitizeFile(text,file){return file.endsWith('.json')?sanitizeJson(text):sanitizeText(text);}
