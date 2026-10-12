import {expect, test} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {registerSyntheticUser, syntheticUser} from './support/synthetic-auth';

test('Residual RF15-02: ativação no meio da transição, dados novos privados e liberação', async ({page}) => {
  const dir = process.env.CF_REVIEW_EVIDENCE!;
  await page.clock.setFixedTime(new Date('2027-01-15T12:00:00Z'));
  await registerSyntheticUser(page,syntheticUser('A',process.env.CF_E2E_NAMESPACE+'-privacy-cycle'));
  const create = async (name: string, initialBalance: number) => {
    const r = await page.request.post('/api/accounts',{data:{name,type:'CHECKING',initialBalance,color:'#10b981'}});
    expect(r.ok(),await r.text()).toBe(true);
  };
  await create('Conta ciclo privado',1234.56);
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/contas');
  await expect(page.getByText('Conta ciclo privado',{exact:true})).toBeVisible();
  const samples: unknown[] = [];
  await page.exposeFunction('privateCycleSample',(sample: unknown) => samples.push(sample));
  await page.evaluate(() => {
    const inspect = () => {
      for (const el of document.querySelectorAll('main [aria-hidden="true"]')) {
        if (!/1\.234,56|1\.734,56|500,00/.test(el.textContent ?? '')) continue;
        const style = getComputedStyle(el), box = el.getBoundingClientRect();
        const alpha = style.color === 'transparent' ? 0 : style.color.startsWith('rgba(') ? Number(style.color.split(',').at(-1)!.replace(')','')) : style.color.includes('/') ? Number(style.color.split('/').at(-1)!.replace(')','')) : 1;
        void (window as unknown as {privateCycleSample:(sample: unknown) => Promise<void>}).privateCycleSample({
          text:el.textContent,visibility:style.visibility,alpha,width:box.width,height:box.height,
          exposed:style.visibility === 'visible' && alpha > 0 && box.width > 0 && box.height > 0,
        });
      }
    };
    new MutationObserver(inspect).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-hidden','class','style']});
    let frames = 0;
    const frame = () => {inspect(); if (++frames < 600) requestAnimationFrame(frame);};
    requestAnimationFrame(frame);
    // Complemento controlado: congelar uma transição ancestral no ponto intermediário.
    // A animação Framer original permanece coberta pelo probe independente intacto.
    const transition = document.querySelector('main')!.animate([{opacity:0.3},{opacity:1}],{duration:300,fill:'both'});
    transition.pause(); transition.currentTime = 150;
  });
  await page.getByRole('button',{name:'Privacidade',exact:true}).click();
  await expect(page.locator('main [aria-hidden="true"]').filter({hasText:'1.234,56'}).first()).toBeAttached();
  expect(await page.locator('main').first().ariaSnapshot()).not.toMatch(/1\.234,56/);
  await page.screenshot({path:path.join(dir,'privacy-mid-transition.png')});
  await create('Conta nova privada',500);
  await page.evaluate(() => window.dispatchEvent(new Event('refreshFinance')));
  await expect(page.getByText('Conta nova privada',{exact:true})).toBeVisible();
  await expect(page.locator('main [aria-hidden="true"]').filter({hasText:'1.734,56'}).first()).toBeAttached();
  expect(await page.locator('main').first().ariaSnapshot()).not.toMatch(/1\.234,56|1\.734,56|500,00/);
  await page.screenshot({path:path.join(dir,'privacy-data-change.png')});
  await page.reload();
  await expect(page.getByText('Conta nova privada',{exact:true})).toBeVisible();
  expect(await page.locator('main').first().ariaSnapshot()).not.toMatch(/1\.234,56|1\.734,56|500,00/);
  await page.getByRole('button',{name:'Privacidade',exact:true}).click();
  await expect(page.locator('main [aria-hidden="true"]').filter({hasText:'1.734,56'})).toHaveCount(0);
  await expect(page.getByText(/1\.734,56/).first()).toBeVisible();
  expect(await page.locator('main').first().ariaSnapshot()).toMatch(/1\.734,56/);
  await page.screenshot({path:path.join(dir,'privacy-released.png')});
  await writeFile(path.join(dir,'privacy-cycle.json'),JSON.stringify(samples,null,2));
  expect(samples.length).toBeGreaterThan(0);
  expect(samples.filter(sample => (sample as {exposed:boolean}).exposed)).toEqual([]);
});
