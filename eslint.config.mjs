// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
// // import storybook from "eslint-plugin-storybook";

import { FlatCompat } from "@eslint/eslintrc";
import nextPlugin from "@next/eslint-plugin-next";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript"), {
  ignores: [
    "scripts/**/*",
    "development/**/*",
    "public/**/*",
    "tests/**/*",
    "e2e/**/*",
    "infra/**/*",
    "docs/**/*",
    "config/**/*",
    "mcp-server/**/*",
    "*.config.*",
    "*.test.*",
    "*.spec.*"
  ],
  plugins: {
    "@typescript-eslint": typescriptPlugin,
    "@next/next": nextPlugin,
  },
  rules: {
    // 🚫 모든 ESLint 규칙 완전 비활성화
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-const": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-require-imports": "off",
    "react/display-name": "off",
    "react-hooks/exhaustive-deps": "off",
    "@next/next/no-img-element": "off",
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "import/no-anonymous-default-export": "off",
    "import/no-require": "off",
  },
}];

export default eslintConfig;
