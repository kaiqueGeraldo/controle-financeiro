import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'.',testMatch:'text-geometry.observer.spec.ts',timeout:15_000,
 workers:1,retries:0,use:{browserName:'chromium',viewport:{width:360,height:900}},
});
