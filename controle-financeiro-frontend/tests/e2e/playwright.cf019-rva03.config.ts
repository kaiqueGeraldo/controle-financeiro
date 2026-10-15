import {defineConfig} from '@playwright/test';
import base from './playwright.milestone-review.config';
export default defineConfig({...base,
 testMatch:['**/cf019-rva03.integrated.spec.ts'],
 outputDir:process.env.CF_REVIEW_EVIDENCE+'/artifacts',
 use:{...base.use,trace:'off',video:'off'},
});
