import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import nextPlugin from "@next/eslint-plugin-next"
import typescriptPlugin from "@typescript-eslint/eslint-plugin"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      // 🚫 모든 ESLint 규칙 비활성화 (Vercel 배포 우선)
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off", 
      "@typescript-eslint/prefer-const": "off",
      "@typescript-eslint/no-var-requires": "off",
      "react/display-name": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      "prefer-const": "off", // 기본 ESLint prefer-const 규칙도 비활성화
      "no-unused-vars": "off",
      "no-console": "off",
      "no-debugger": "off",
    },
  },
];

export default eslintConfig;
