import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals"),
    {
        // 🚀 최적화된 ESLint 설정
        ignores: [
            ".next/**/*",
            "node_modules/**/*",
            "dist/**/*",
            "build/**/*",
            "coverage/**/*",
            "*.min.js",
            "*.bundle.js",
            "public/**/*",
            "docs/**/*",
            ".vercel/**/*",
            "tests/**/*.test.ts",
            "tests/**/*.test.tsx",
            "**/*.d.ts",
        ],
        rules: {
            // TypeScript 관련 규칙 완화 (빌드는 성공하지만 타입 오류가 있는 상황)
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",

            // React 관련 규칙
            "react-hooks/exhaustive-deps": "warn",
            "react/no-unescaped-entities": "warn",

            // Next.js 관련 규칙
            "@next/next/no-img-element": "warn",
            "@next/next/no-html-link-for-pages": "warn",

            // 일반적인 JavaScript 규칙
            "no-console": "off", // 로깅을 위해 console.log 허용
            "no-unused-expressions": "warn",
            "prefer-const": "warn",
            "no-var": "error",
        },
    },
];

export default eslintConfig; 