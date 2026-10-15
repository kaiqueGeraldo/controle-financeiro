import {defineConfig} from '@playwright/test';
import base from './playwright.cf014-history.config';
export default defineConfig({...base,
  testMatch:['**/cf014-history-diagnostic.integrated.spec.ts','**/cf014-history-review.integrated.spec.ts'],
  grep:/contraprova causal|harness civil|revisão independente/,
});
