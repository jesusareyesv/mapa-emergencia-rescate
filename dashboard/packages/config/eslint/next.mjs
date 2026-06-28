/**
 * Next.js ESLint flat config for apps that use Next.js.
 *
 * Composes @eslint/js recommended + eslint-config-next (which bundles
 * typescript-eslint, react, react-hooks, jsx-a11y, @next/eslint-plugin-next)
 * plus the shared boundary rules and vitest test block.
 *
 * Does NOT spread the full base config to avoid plugin re-registration conflicts:
 * eslint-config-next re-registers jsx-a11y and typescript-eslint internally, so
 * including base wholesale would cause "Cannot redefine plugin" errors.
 *
 * Resolution requires `next` to be installed in the consumer app.
 */

import js from "@eslint/js";
import nextConfig from "eslint-config-next";
import vitest from "eslint-plugin-vitest";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  // 1. @eslint/js recommended baseline
  js.configs.recommended,

  // 2. Next.js flat config (bundles typescript-eslint, react, react-hooks,
  //    jsx-a11y, and @next/eslint-plugin-next)
  ...nextConfig,

  // 3. Import-boundary rules (GC10 — DDD layer enforcement).
  //    Identical to base.mjs — scoped by `files` glob.

  // 3a. domain + application layers: must not import from infrastructure or ui.
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

  // 3b. ui layer: must not import from contexts (keep components domain-agnostic).
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

  // 4. Vitest plugin rules + globals, scoped to test/spec files only.
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
