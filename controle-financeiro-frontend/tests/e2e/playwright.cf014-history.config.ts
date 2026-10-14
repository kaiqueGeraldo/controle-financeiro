import {defineConfig} from '@playwright/test';
import base from './playwright.rf15-residual.config';
import path from 'node:path';
export default defineConfig({...base,
  testMatch:['**/cf014-history-diagnostic.integrated.spec.ts'], grepInvert:undefined,
  outputDir:path.join(process.env.CF_REVIEW_EVIDENCE!, 'artifacts'),
  use:{...base.use,trace:'off',video:'off'},
});
