import {defineConfig} from '@playwright/test';
import base from './playwright.rf15-residual.config';
export default defineConfig({...base, testMatch:['**/rf15-review-residual.integrated.spec.ts'], grepInvert:undefined});
