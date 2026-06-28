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
// Resolution happens at the consumer app level (an app that has `next` installed);
// this package cannot be linted in isolation without `next` present as a peer.
import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  // 1. @eslint/js recommended baseline
  js.configs.recommended,

  // 2. Next.js flat config (includes TS-ESLint, React, react-hooks, jsx-a11y,
  //    @next/eslint-plugin-next). Spread because it is an array.
  ...nextConfig,

  // 3. Import-boundary rules (GC5 / GC10 — DDD layer enforcement).
  //    Split into separate flat-config objects scoped by `files` glob so that
  //    restrictions apply only to the relevant layer and non-layer files are unaffected.

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
];

export default config;
