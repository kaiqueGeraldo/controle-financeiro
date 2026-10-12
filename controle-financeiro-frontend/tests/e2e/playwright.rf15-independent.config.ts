import {defineConfig} from '@playwright/test';
import base from './playwright.frontend-closure.config';
export default defineConfig({...base,testMatch:['**/rf15-independent.integrated.spec.ts'],outputDir:'../artifacts/rf15-independent'});
