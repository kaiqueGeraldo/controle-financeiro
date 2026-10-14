import {defineConfig} from '@playwright/test';
import base from './playwright.rvr24-visual.config';
export default defineConfig({...base,testMatch:['**/rvr24-review-interaction.integrated.spec.ts']});
