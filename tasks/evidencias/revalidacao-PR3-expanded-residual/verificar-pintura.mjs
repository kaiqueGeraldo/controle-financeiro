import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const runtime=path.resolve(process.argv[2]),require=createRequire(import.meta.url),sharp=require(path.join(runtime,'s/f/node_modules/sharp')),folder=path.join(runtime,'restored-and-boundaries/browsers/RevalidationVisualProbe'),data=JSON.parse(fs.readFileSync(path.join(folder,'live-geometry.json'))),rows=[];
for(const observation of data.observations){
 const file=path.join(folder,'live-'+observation.kind+'.png'),{data:pixels,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true}),r=observation.observed.rects[0];
 let redPixels=0;for(let y=Math.floor(r.y);y<Math.ceil(r.y+r.height);y++)for(let x=Math.floor(r.x);x<Math.ceil(r.x+r.width);x++){const i=4*(y*info.width+x);if(pixels[i]>120&&pixels[i]>2*pixels[i+1]&&pixels[i]>1.2*pixels[i+2])redPixels++;}
 const normalized=path.join(runtime,'live-normalized-'+observation.kind+'.png');await sharp(pixels,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(normalized);
 const restored=await sharp(normalized).ensureAlpha().raw().toBuffer();assert.equal(createHash('sha256').update(restored).digest('hex'),createHash('sha256').update(pixels).digest('hex'));
 rows.push({kind:observation.kind,helperAccepted:observation.observed.ok,range:r,redTextPixels:redPixels,imageSha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex'),rgbaSha256:createHash('sha256').update(pixels).digest('hex'),normalizedPreview:normalized,sameDecodedPixels:true});
}
assert.ok(rows[0].redTextPixels>0);assert.equal(rows[1].redTextPixels,0);assert.equal(rows[2].redTextPixels,0);assert.equal(rows[3].redTextPixels,rows[0].redTextPixels);
fs.writeFileSync(path.join(runtime,'live-pixels.json'),JSON.stringify({purpose:'Read-only pixel verification; normalized PNG has identical decoded pixels, originals untouched',rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows.map(({kind,redTextPixels,helperAccepted})=>({kind,redTextPixels,helperAccepted}))));
