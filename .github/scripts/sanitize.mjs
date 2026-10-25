// Bounded format protection, not discovery of arbitrary secrets. Transform whole
// publication files; never stream untrusted child output to the CI console.
const sensitive=/^(?:password|passwd|secret|authorization|proxy-authorization|cookie|set-cookie|api[_-]?key|access[_-]?token|refresh[_-]?token)$/i;
const redacted='[REDACTED]';
function textRules(text){
  text=text.replace(/("(?:\\.|[^"\\])*")\s*:\s*("(?:\\.|[^"\\])*"|[^\s,}\]"]+)/g,(match,key,value)=>{
    if(!sensitive.test(JSON.parse(key)))return match;
    if(!/^(?:"(?:\\.|[^"\\])*"|null|true|false|-?\d+(?:\.\d+)?)$/.test(value))throw new Error('Unsafe malformed sensitive JSON field');
    return key+': '+JSON.stringify(redacted);
  });
  for(const match of text.matchAll(/("(?:\\.|[^"\\])*")\s*:\s*(")/g)){
    if(sensitive.test(JSON.parse(match[1]))&&!/^"(?:\\.|[^"\\])*"/.test(text.slice(match.index+match[0].length-1)))throw new Error('Unsafe unterminated sensitive JSON string');
  }
  return text
    .replace(/\b(?:proxy-authorization|authorization|set-cookie|cookie)\s*[:=][^\r\n]*(?:\r?\n[\t ]+[^\r\n]*)*/gi,match=>match.slice(0,match.search(/[:=]/)+1)+' '+redacted)
    .replace(/\b(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=]\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;]+)/gi,'$1='+redacted)
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED_JWT]')
    .replace(/Cf003-[AB]-Senha-2026/g,'[SYNTHETIC_PASSWORD]');
}
function visit(value){
  if(Array.isArray(value))return value.map(visit);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,sensitive.test(key)?redacted:visit(item)]));
  return typeof value==='string'?textRules(value):value;
}
export function sanitizeJson(text){return JSON.stringify(visit(JSON.parse(text)),null,2)+'\n';}
export function sanitizeText(text){
  if(/^\s*[\[{]/.test(text)){try{JSON.parse(text);return sanitizeJson(text);}catch(error){if(!(error instanceof SyntaxError))throw error;}}
  return textRules(text);
}
export function sanitizeFile(text,file){return file.endsWith('.json')?sanitizeJson(text):sanitizeText(text);}
