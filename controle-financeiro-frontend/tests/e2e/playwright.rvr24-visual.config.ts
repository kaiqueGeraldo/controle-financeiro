import {defineConfig} from '@playwright/test';
import base from './playwright.rf15-residual-independent.config';
export default defineConfig({...base, testMatch:['**/rvr24-visual.integrated.spec.ts','**/rf15-review-residual.integrated.spec.ts','**/rf15-matrix.integrated.spec.ts']});
