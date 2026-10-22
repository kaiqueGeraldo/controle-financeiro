import { defineConfig } from '../../../controle-financeiro-frontend/node_modules/vitest/dist/config.js';
import { fileURLToPath } from 'node:url';
export default defineConfig({ resolve: { alias: { '@': fileURLToPath(new URL('../../../controle-financeiro-frontend/src/', import.meta.url)) } }, test: { environment: 'jsdom', include: ['../tasks/evidencias/revalidacao-CF-031-identidade/consumers.test.tsx'], setupFiles: ['./tests/component/setup.ts'], reporters: ['verbose'], restoreMocks: true, unstubGlobals: true } });
