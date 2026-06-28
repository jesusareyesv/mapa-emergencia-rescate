import base from "@repo/config/eslint";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...base,
  // Allow Vitest globals (describe, it, expect, etc.) in test files.
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
  },
];

export default config;
