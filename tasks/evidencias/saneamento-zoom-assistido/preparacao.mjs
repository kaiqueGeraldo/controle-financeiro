import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {chromium,expect} from '@playwright/test';

// Playwright global setup, after its existing /auth server readiness.
// Compiles routes in an isolated bootstrap context. It never replaces the
// original scenario's UI registration or changes its 15s application assertions.
export default async function prepareCompiledRoutes() {
  const directory=process.env.ZOOM_READINESS_DIR;
  assert.ok(directory,'Explicit private readiness output required');
  fs.mkdirSync(directory);
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({baseURL:process.env.CF_TEST_BASE_URL,locale:'pt-BR',timezoneId:'America/Sao_Paulo'});
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});
  const events=[],started=Date.now();
  let result='failed';
  try {
    const email='zoom-bootstrap-'+randomUUID()+'@example.invalid';
    const password='Synthetic-Bootstrap-2026!'; // Synthetic, disposable database only.
    const register=await context.request.post('/api/auth/register',{data:{nome:'Pessoa Sintética Bootstrap',email,senha:password},timeout:15_000});
    assert.equal(register.status(),200,'Bootstrap register failed');
    const login=await context.request.post('/api/auth/login',{data:{email,senha:password},timeout:15_000});
    assert.equal(login.status(),200,'Bootstrap login failed');
    const credentials=await login.json();
    assert.ok(credentials.token);
    await context.addCookies([{name:'token',value:credentials.token,url:process.env.CF_TEST_BASE_URL,httpOnly:true,sameSite:'Lax'}]);
    const user=await context.request.get('/api/auth/user',{timeout:15_000});
    assert.equal(user.status(),200);assert.equal((await user.json()).email,email);
    const page=await context.newPage();
    for(const route of ['/','/contas','/cartoes','/planejamento','/extrato']) {
      const at=Date.now();
      // Same 120s lifecycle/compile readiness bound as the existing Next webServer.
      // This is not the 15s application oracle or a successful scenario result.
      const response=await page.goto(route,{timeout:120_000});
      assert.equal(response.status(),200);
      await expect(page.getByRole('heading',{level:1})).toBeVisible({timeout:15_000});
      await expect(page.locator('.animate-spin')).toHaveCount(0,{timeout:15_000});
      events.push({route,status:response.status(),durationMs:Date.now()-at,title:await page.title()});
    }
    result='ready';
  } finally {
    fs.writeFileSync(path.join(directory,'compilation-readiness.json'),JSON.stringify({
      result,startedAt:started,elapsedMs:Date.now()-started,events,
      originalScenarioRegistrationReplaced:false,applicationTimeoutChanged:false,
      nativeZoomExecuted:false,fullScenarioApproved:false,
      context:'Separate bootstrap identity, only in the disposable PostgreSQL database'
    },null,2),{flag:'wx'});
    await context.tracing.stop({path:path.join(directory,'compilation-private.zip')});
    await context.close();await browser.close();
  }
}
