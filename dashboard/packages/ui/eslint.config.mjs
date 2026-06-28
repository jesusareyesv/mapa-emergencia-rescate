import base from "@repo/config/eslint";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...base,
  // packages/ui is not a Next.js app — disable the pages-dir rule that fires on non-app packages.
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  // Allow Vitest globals in test files.
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
