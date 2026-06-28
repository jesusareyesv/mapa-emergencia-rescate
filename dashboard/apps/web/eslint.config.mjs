import nextConfig from "@repo/config/eslint/next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...nextConfig,
  // In TypeScript files, the base no-unused-vars rule fires on named params
  // in type-level method signatures (a known limitation). Disable it here;
  // @typescript-eslint/no-unused-vars handles TS files correctly.
  {
    name: "repo/ts-no-unused-vars-override",
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-unused-vars": "off",
    },
  },
];

export default config;
