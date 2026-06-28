/**
 * Base ESLint flat config for all packages in the monorepo.
 *
 * Includes:
 *  1. @eslint/js recommended
 *  2. typescript-eslint recommended (flat config array)
 *  3. eslint-plugin-jsx-a11y recommended (flat config)
 *  4. Import-boundary rules (GC10): domain/application must not reach into
 *     infrastructure or ui layers; ui must not reach into context modules.
 *  5. eslint-plugin-vitest recommended + env globals, scoped to test/spec files.
 *
 * Does NOT include eslint-config-next. Use @repo/config/eslint/next for Next.js apps.
 */

import js from "@eslint/js";
import jsdocA11y from "eslint-plugin-jsx-a11y";
import vitest from "eslint-plugin-vitest";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  // 1. @eslint/js recommended baseline
  js.configs.recommended,

  // 2. typescript-eslint recommended (array — spread)
  ...tseslint.configs.recommended,

  // 3. jsx-a11y recommended (flat config object)
  jsdocA11y.flatConfigs.recommended,

  // 4. Import-boundary rules (GC10 — DDD layer enforcement).
  //    Scoped by `files` glob so restrictions apply only to the relevant layer.

  // 4a. domain + application layers: must not import from infrastructure or ui.
  {
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
  },

  // 4b. ui layer: must not import from contexts (keep components domain-agnostic).
  {
    name: "repo/boundaries/ui",
    files: ["**/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/contexts/**"],
              message:
                "ui must stay domain-agnostic (no imports from contexts)",
            },
          ],
        },
      ],
    },
  },

  // 5. Vitest plugin rules + globals, scoped to test/spec files only.
  //    Merges vitest.configs.recommended (rules + plugin registration) and
  //    vitest.configs.env (languageOptions.globals for describe/it/expect/vi/…).
  {
    name: "repo/vitest",
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    plugins: vitest.configs.recommended.plugins,
    rules: vitest.configs.recommended.rules,
    languageOptions: vitest.configs.env.languageOptions,
  },
];

export default config;
