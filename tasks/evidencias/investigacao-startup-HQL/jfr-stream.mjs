/** Read one top-level JFR event at a time; retain only the current object. */
export async function* eventsFromChunks(chunks) {
  let header='',started=false,ended=false,depth=0,inString=false,escaped=false,pieces=[],separator=false;
  for await (const source of chunks) {
    let chunk=source;
    if(!started){
      header+=chunk;
      const match=/"events"\s*:\s*\[/.exec(header);
      if(!match){if(header.length>65536)throw Error('Missing JFR events header');continue;}
      chunk=header.slice(match.index+match[0].length);header='';started=true;
    }
    let from=depth?0:-1;
    for(let i=0;i<chunk.length;i++){
      const c=chunk[i];
      if(ended){if(!/[\s}]/.test(c))throw Error('Unexpected JFR suffix');continue;}
      if(depth===0){
        if(/\s/.test(c))continue;
        if(c===']'){ended=true;continue;}
        if(c===','&&separator){separator=false;continue;}
        if(c!=='{'||separator)throw Error('Unexpected event separator');
        depth=1;from=i;inString=false;escaped=false;continue;
      }
      if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;}
      else if(c==='"')inString=true;
      else if(c==='{')depth++;
      else if(c==='}'){
        depth--;
        if(depth===0){pieces.push(chunk.slice(from,i+1));yield JSON.parse(pieces.join(''));pieces=[];from=-1;separator=true;}
      }
    }
    if(depth)pieces.push(chunk.slice(from));
  }
  if(!started||!ended||depth||inString)throw Error('Truncated JFR events');
}
