/**
 * Shared Vitest config preset for the monorepo.
 *
 * Consumer packages merge this in their vitest.config.ts:
 *   import { defineConfig, mergeConfig } from "vitest/config";
 *   import base from "@repo/config/vitest";
 *   export default mergeConfig(base, defineConfig({ ... }));
 */

import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(__dirname, "./setup.ts")],
  },
});
