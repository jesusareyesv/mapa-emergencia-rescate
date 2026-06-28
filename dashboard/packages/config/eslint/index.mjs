/**
 * Shared ESLint flat config preset for the monorepo.
 *
 * Composition:
 *  1. @eslint/js recommended
 *  2. typescript-eslint recommended (via eslint-config-next which bundles it)
 *  3. eslint-config-next (Next 16 flat config array — includes react, react-hooks,
 *     jsx-a11y, @next/eslint-plugin-next, typescript-eslint)
 *  4. Import-boundary rules (GC5/GC10): domain/application must not reach into
 *     infrastructure or ui layers; ui must not reach into context modules.
 *
 * Note: eslint-config-next already bundles jsx-a11y and typescript-eslint, so
 * we do not duplicate those configs here to avoid rule conflicts.
 * eslint-plugin-jsx-a11y is listed as a devDependency for hoisting purposes.
 *
 * Consumer apps extend this array in their own eslint.config.mjs:
 *   import base from "@repo/config/eslint";
 *   export default [...base, { files: [...], rules: {...} }];
 */

import js from "@eslint/js";
// eslint-config-next exports a flat config array when next@16 is present.
// It is resolved at consumer app level (next must be installed alongside).
import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  // 1. @eslint/js recommended baseline
  js.configs.recommended,

  // 2. Next.js flat config (includes TS-ESLint, React, react-hooks, jsx-a11y,
  //    @next/eslint-plugin-next). Spread because it is an array.
  ...nextConfig,

  // 3. Import-boundary rules (GC5 / GC10 — DDD layer enforcement).
  //    These use no-restricted-imports to prevent layer inversion.
  {
    name: "repo/boundaries",
    rules: {
      // domain layer: must not depend on infrastructure or ui
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Prevent domain code from importing infrastructure concerns
              group: [
                "*/infrastructure/*",
                "../infrastructure/*",
                "../../infrastructure/*",
              ],
              message:
                "Domain/Application layer must not import from infrastructure. Use dependency inversion (ports/interfaces).",
            },
            {
              // Prevent domain code from importing UI concerns
              group: ["*/ui/*", "../ui/*", "../../ui/*", "*/components/*"],
              message:
                "Domain/Application layer must not import from ui. Keep business logic UI-agnostic.",
            },
            {
              // Prevent ui components from importing React context providers directly
              group: ["*/contexts/*", "../contexts/*", "../../contexts/*"],
              message:
                "UI components must not import from contexts directly. Receive context values via props or hooks.",
            },
          ],
        },
      ],
    },
  },
];

export default config;
