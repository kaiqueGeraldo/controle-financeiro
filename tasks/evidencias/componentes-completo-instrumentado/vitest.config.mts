import { defineConfig } from "vitest/config";
import base from "/work/s/controle-financeiro-frontend/tests/component/vitest.config.mts";
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    setupFiles: ["/work/obs/setup.mjs", ...base.test.setupFiles, "/work/obs/cleanup-setup.mjs"]
  }
});
