import { defineConfig } from '../../../controle-financeiro-frontend/node_modules/@playwright/test';
import original from '../../../controle-financeiro-frontend/src/screens/private/onboarding/e2e/playwright.config';
export default defineConfig({ ...original, testDir: '.', testMatch: 'integration.spec.ts' });
