// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

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

const eslintConfig = [// 🎯 전역 무시 설정 (기존 .eslintignore 대체)
{
  ignores: [
    // 빌드 및 배포 관련
    "dist/**",
    "build/**",
    ".next/**",
    "out/**",
    "storybook-static/**",
    "coverage/**",
    "test-results/**",

    // 의존성 및 설정
    "node_modules/**",
    "*.config.*",
    "*.d.ts",

    // 개발 도구 및 스크립트
    "scripts/**/*",
    "development/**/*",
    "infra/**/*",
    "config/**/*",
    "mcp-server/**/*",

    // 정적 파일
    "public/**/*",

    // 테스트 파일
    "tests/**/*",
    "e2e/**/*",
    "**/*.test.*",
    "**/*.spec.*",
    "**/__tests__/**",

    // 문서 및 백업
    "docs/**/*",
    "archive/**/*",
    "commit/**/*",
    "logs/**/*",

    // 스토리북
    ".storybook/**",
    "**/*.stories.*",

    // 임시 파일
    "*.tmp",
    "*.temp",
    ".env*",
    "*.log",
  ],
}, // 🔧 기본 설정 확장
...compat.extends("next/core-web-vitals", "next/typescript"), // 📋 플러그인 및 규칙 설정
{
  plugins: {
    "@typescript-eslint": typescriptPlugin,
    "@next/next": nextPlugin,
  },
  rules: {
    // 🚫 개발 편의성을 위한 규칙 완화
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-const": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/ban-ts-comment": "off", // @ts-ignore 사용 허용
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
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
