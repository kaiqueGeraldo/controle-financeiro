import { artifactDirectory } from "./support/artifacts.cjs";
import { defineConfig } from '@playwright/test';
import base from './playwright.frontend-closure.config';
export default defineConfig({ ...base,
  testMatch: process.env.RF15_RVA_ONLY === '1' ? ['**/rf15-rva.integrated.spec.ts'] : ['**/frontend-closure*.integrated.spec.ts', '**/rf15-accessibility.integrated.spec.ts', '**/rf15-surfaces.integrated.spec.ts', '**/rf15-matrix.integrated.spec.ts', '**/rf15-timezones.integrated.spec.ts', '**/cf015.native-zoom.integrated.spec.ts', '**/rf15-native-chrome.integrated.spec.ts'],
  metadata: {...base.metadata, ...(process.env.CF_ZOOM_EXCEPTION ? {zoomException: {decision: process.env.CF_ZOOM_EXCEPTION, candidate: process.env.CF_ZOOM_CANDIDATE, digest: process.env.CF_ZOOM_DIGEST, runId: process.env.CF_ZOOM_RUN, decisionSha: process.env.CF_ZOOM_DECISION_SHA}} : {})},
  outputDir: artifactDirectory("rf15", "../artifacts/rf15"),
});
