import {defineConfig} from '@playwright/test';
import base from './playwright.frontend-closure.config';
import path from 'node:path';

export default defineConfig({...base,
  testMatch: ['**/rf15-independent.integrated.spec.ts', '**/rf15-residual*.integrated.spec.ts', '**/rf15-matrix.integrated.spec.ts', '**/rf15-surfaces.integrated.spec.ts', '**/rf15-accessibility.integrated.spec.ts'],
  grepInvert: /PAID real|metas hoje|hábito formulário/,
  outputDir: path.join(process.env.CF_REVIEW_EVIDENCE!, 'artifacts'),
  use: {...base.use, reducedMotion: 'no-preference', trace: 'retain-on-failure'},
});
