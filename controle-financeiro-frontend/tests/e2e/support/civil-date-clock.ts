import type {Page} from '@playwright/test';

/** Fix only civil date. Preserve performance/rAF/timers/WAAPI's document time origin. */
export async function setCivilDateOnly(page:Page,date:Date):Promise<void>{
  const fixedTime=date.getTime();
  if(!Number.isFinite(fixedTime))throw new Error('Invalid fixed civil date');
  await page.addInitScript((time:number)=>{
    const NativeDate=Date;
    const FixedDate=new Proxy(NativeDate,{
      apply(){return new NativeDate(time).toString();},
      construct(target,args,newTarget){return Reflect.construct(target,args.length?args:[time],newTarget);},
      get(target,key,receiver){return key==='now'?()=>time:Reflect.get(target,key,receiver);},
    });
    window.Date=FixedDate;
  },fixedTime);
}
