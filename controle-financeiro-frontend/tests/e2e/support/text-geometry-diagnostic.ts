import type {Locator} from '@playwright/test';
import type {textGeometry} from './text-geometry';
type Observation=Awaited<ReturnType<typeof textGeometry>>;

/** Projects the existing observation; the extra DOM sample runs after the assertion, never in polling. */
export async function textGeometryDiagnostic(target:Locator,width:number,last:Observation|null,error:unknown,observationAt:string|null){
 const sample=await target.evaluate(element=>{
  const box=(r:DOMRect)=>({x:r.x,y:r.y,width:r.width,height:r.height});
  const style=getComputedStyle(element),clipping=[];
  for(let p:Element|null=element;p;p=p.parentElement){
   const s=getComputedStyle(p);
   if(/hidden|clip|auto|scroll/.test(s.overflowX+' '+s.overflowY))clipping.push({bounds:box(p.getBoundingClientRect()),clientWidth:p.clientWidth,clientHeight:p.clientHeight,clientLeft:p.clientLeft,clientTop:p.clientTop,overflowX:s.overflowX,overflowY:s.overflowY});
  }
  return {targetConfirmed:element.textContent?.trim()==='Custo ou avaliação indisponível',viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
   font:{status:document.fonts.status,family:style.fontFamily,size:style.fontSize,weight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing},
   clipping,bounds:box(element.getBoundingClientRect())};
 },undefined,{timeout:1000}).catch(()=>null);
 const rects=last?.rects??[];
 const clip=rects.length?{x:Math.floor(Math.min(...rects.map(r=>r.x))),y:Math.floor(Math.min(...rects.map(r=>r.y))),
  right:Math.ceil(Math.max(...rects.map(r=>r.x+r.width))),bottom:Math.ceil(Math.max(...rects.map(r=>r.y+r.height)))}:null;
 return {version:1,targetKey:'SAN-E2-visual/unavailable-valuation',width,observationAt,sampleAt:new Date().toISOString(),
  targetConfirmed:sample?.targetConfirmed??null,outcome:error?'observer-error':last?.ok?'accepted':last?.failures.some(f=>f.startsWith('unsupported')||f.startsWith('reference:'))?'unsupported':!last?'unobserved':('status'in last&&last.status==='inconclusive')||last.failures.some(f=>['fonts-loading','unstable-animation','disconnected'].includes(f))?'inconclusive':'target-rejected',
  failures:last?.failures??[],viewport:last?.viewport??sample?.viewport??null,rects,clip,font:sample?.font??null,clipping:sample?.clipping??[],
  paint:last&&'paint'in last?last.paint:null,reference:last&&'reference'in last?last.reference:null,
  lastError:error instanceof Error?{name:error.name,message:error.message}:error?{name:'Error',message:String(error)}:null};
}
