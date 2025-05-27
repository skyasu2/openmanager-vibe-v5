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
      "@typescript-eslint/no-unused-vars": "off", // 개발 중에는 off로 설정
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
      "react-hooks/exhaustive-deps": "warn", // 경고로만 표시
      "@next/next/no-img-element": "warn", // 이미지 최적화 권장사항
    },
  },
];

export default eslintConfig;
