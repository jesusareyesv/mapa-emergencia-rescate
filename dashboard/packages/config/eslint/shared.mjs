/**
 * Shared ESLint flat config objects used by both base.mjs and next.mjs.
 *
 * Contains only configs that do NOT register jsx-a11y or typescript-eslint
 * plugins — those two must remain per-file to avoid "Cannot redefine plugin"
 * errors when eslint-config-next is in the same array.
 *
 * Exports:
 *  - boundaryConfigs — two no-restricted-imports objects (GC10 DDD layering)
 *  - vitestConfig    — eslint-plugin-vitest block scoped to test/spec files
 *  - sharedConfigs   — array of all three (spread into base/next config arrays)
 */

import vitest from "eslint-plugin-vitest";

// 4a / 3a. domain + application layers: must not import from infrastructure or ui.
export const domainApplicationBoundary = {
  name: "repo/boundaries/domain-application",
  files: ["**/domain/**", "**/application/**"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/infrastructure/**", "**/ui/**"],
            message:
              "domain/application must not depend on infrastructure or ui (DDD layering)",
          },
        ],
      },
    ],
  },
};

// 4b / 3b. ui layer: must not import from contexts (keep components domain-agnostic).
export const uiBoundary = {
  name: "repo/boundaries/ui",
  files: ["**/ui/**"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["**/contexts/**"],
            message: "ui must stay domain-agnostic (no imports from contexts)",
          },
        ],
      },
    ],
  },
};

// Vitest plugin rules + globals, scoped to test/spec files only.
// Merges vitest.configs.recommended (rules + plugin registration) and
// vitest.configs.env (languageOptions.globals for describe/it/expect/vi/…).
export const vitestConfig = {
  name: "repo/vitest",
  files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
  plugins: vitest.configs.recommended.plugins,
  rules: vitest.configs.recommended.rules,
  languageOptions: vitest.configs.env.languageOptions,
};

// Disable the core no-unused-vars rule for TS files so that
// @typescript-eslint/no-unused-vars (enabled via typescript-eslint/eslint-config-next)
// is the sole authority on unused variables in TypeScript.  Must be placed after
// js.configs.recommended so it overrides the core rule rather than the TS one.
export const tsNoUnusedVarsOverride = {
  name: "repo/ts-no-unused-vars-override",
  files: ["**/*.{ts,tsx}"],
  rules: {
    "no-unused-vars": "off",
  },
};

/** All shared configs as a flat array — spread into the consumer's config. */
const sharedConfigs = [
  domainApplicationBoundary,
  uiBoundary,
  vitestConfig,
  tsNoUnusedVarsOverride,
];

export default sharedConfigs;
