import type {Locator,Page} from '@playwright/test';
import type {TextPaintSample} from './text-geometry';
import type {textGeometry} from './text-geometry';
type Observation=Awaited<ReturnType<typeof textGeometry>>;

/** Projects the existing observation; the extra DOM sample runs after the assertion, never in polling. */
export async function textGeometryDiagnostic(target:Locator,width:number,last:Observation|null,error:unknown,observationAt:string|null){
 const sample=await target.evaluate(element=>{
  const box=(r:DOMRect)=>({x:r.x,y:r.y,width:r.width,height:r.height});
  const style=getComputedStyle(element),clipping=[],ancestors=[];
  for(let p:Element|null=element;p;p=p.parentElement){const s=getComputedStyle(p);ancestors.push({tag:p.tagName,font:s.font,fontFamily:s.fontFamily,fontVariationSettings:s.fontVariationSettings,fontFeatureSettings:s.fontFeatureSettings,fontOpticalSizing:s.fontOpticalSizing,fontStretch:s.fontStretch,fontSynthesis:s.fontSynthesis,textRendering:s.textRendering,smoothing:s.getPropertyValue('-webkit-font-smoothing'),filter:s.filter,transform:s.transform,zoom:s.zoom});}
  for(let p:Element|null=element;p;p=p.parentElement){
   const s=getComputedStyle(p);
   if(/hidden|clip|auto|scroll/.test(s.overflowX+' '+s.overflowY))clipping.push({bounds:box(p.getBoundingClientRect()),clientWidth:p.clientWidth,clientHeight:p.clientHeight,clientLeft:p.clientLeft,clientTop:p.clientTop,overflowX:s.overflowX,overflowY:s.overflowY});
  }
  return {targetConfirmed:element.textContent?.trim()==='Custo ou avaliação indisponível',viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
   font:{status:document.fonts.status,family:style.fontFamily,size:style.fontSize,weight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing},
   clipping,ancestors,bounds:box(element.getBoundingClientRect())};
 },undefined,{timeout:1000}).catch(()=>null);
 const rects=last?.rects??[];
 const clip=rects.length?{x:Math.floor(Math.min(...rects.map(r=>r.x))),y:Math.floor(Math.min(...rects.map(r=>r.y))),
  right:Math.ceil(Math.max(...rects.map(r=>r.x+r.width))),bottom:Math.ceil(Math.max(...rects.map(r=>r.y+r.height)))}:null;
 return {version:1,targetKey:'SAN-E2-visual/unavailable-valuation',width,observationAt,sampleAt:new Date().toISOString(),
  targetConfirmed:sample?.targetConfirmed??null,outcome:error?'observer-error':last?.ok?'accepted':last?.failures.some(f=>f.startsWith('unsupported')||f.startsWith('reference:'))?'unsupported':!last?'unobserved':('status'in last&&last.status==='inconclusive')||last.failures.some(f=>['fonts-loading','unstable-animation','disconnected'].includes(f))?'inconclusive':'target-rejected',
  failures:last?.failures??[],viewport:last?.viewport??sample?.viewport??null,rects,clip,font:sample?.font??null,clipping:sample?.clipping??[],ancestors:sample?.ancestors??[],
  paint:last&&'paint'in last?last.paint:null,reference:last&&'reference'in last?last.reference:null,
  lastError:error instanceof Error?{name:error.name,message:error.message}:error?{name:'Error',message:String(error)}:null};
}

/** Decode the already captured A/B/C images once, after polling; retain only bounded numeric pixels. */
export async function textPaintRaster(page:Page,sample:TextPaintSample|null){
 if(!sample)return null;
 if(sample.clip.width*sample.clip.height>8192)return {omitted:'region exceeds diagnostic pixel bound'};
 return page.evaluate(async({images,reference,clip,glyphs})=>{
  const raster=[];
  for(const bytes of images){
   const bitmap=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}));
   try{if(bitmap.width!==clip.width||bitmap.height!==clip.height)return {unavailable:'raster dimensions diverge'};
    const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);
    const pixels=ctx.getImageData(0,0,bitmap.width,bitmap.height).data,rows=[];
    for(let y=0;y<bitmap.height;y++)rows.push(Array.from({length:bitmap.width},(_,x)=>Array.from(pixels.slice((y*bitmap.width+x)*4,(y*bitmap.width+x+1)*4))));
    raster.push(rows);
   }finally{bitmap.close();}
  }
  return {clip,glyphs,reference:{color:reference.color,alpha:Array.from({length:reference.height},(_,y)=>reference.alpha.slice(y*reference.width,(y+1)*reference.width))},images:raster};
 },{...sample,images:sample.images.map(b=>Array.from(b))}).catch(error=>({unavailable:error instanceof Error?error.message:String(error)}));
}
