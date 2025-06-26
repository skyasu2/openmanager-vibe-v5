#!/usr/bin/env node

/**
 * 🎯 TypeScript 근본원인 해결 스크립트
 * 
 * 191개 오류의 근본원인별 체계적 해결:
 * 1. 배열 타입 추론 문제 (40%)
 * 2. null/undefined 안전성 (25%) 
 * 3. React RefObject 불일치 (15%)
 * 4. Promise 배열 타입 (10%)
 * 5. 기타 타입 호환성 (10%)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🎯 TypeScript 근본원인 해결 시작...\n');

// 1️⃣ 배열 타입 추론 문제 해결 (40% 오류)
function fixArrayTypeInference() {
    console.log('1️⃣ 배열 타입 추론 문제 해결 중...');

    const arrayPatterns = [
        // recommendations 배열
        {
            search: /const recommendations = \[\];/g,
            replace: 'const recommendations: string[] = [];',
            description: 'recommendations 배열 타입 명시'
        },
        // healthChecks 배열
        {
            search: /const healthChecks = \[\];/g,
            replace: 'const healthChecks: Array<{name: string; status: string; responseTime: number; details: string; optional: boolean}> = [];',
            description: 'healthChecks 배열 타입 명시'
        },
        // initPromises 배열
        {
            search: /const initPromises = \[\];/g,
            replace: 'const initPromises: Promise<void>[] = [];',
            description: 'initPromises 배열 타입 명시'
        },
        // enginePromises 배열
        {
            search: /const enginePromises = \[\];/g,
            replace: 'const enginePromises: Promise<any>[] = [];',
            description: 'enginePromises 배열 타입 명시'
        },
        // incidents 배열
        {
            search: /const incidents = \[\];/g,
            replace: 'const incidents: Array<{id: string; type: string; severity: string; message: string; timestamp: Date; resolved: boolean}> = [];',
            description: 'incidents 배열 타입 명시'
        },
        // alerts 배열
        {
            search: /const alerts = \[\];/g,
            replace: 'const alerts: string[] = [];',
            description: 'alerts 배열 타입 명시'
        },
        // batches 배열
        {
            search: /const batches = \[\];/g,
            replace: 'const batches: any[][] = [];',
            description: 'batches 배열 타입 명시'
        },
        // servers 배열
        {
            search: /const servers = \[\];/g,
            replace: 'const servers: any[] = [];',
            description: 'servers 배열 타입 명시'
        },
        // results 배열
        {
            search: /const results = \[\];/g,
            replace: 'const results: any[] = [];',
            description: 'results 배열 타입 명시'
        },
        // missing/invalid 배열
        {
            search: /const missing = \[\];/g,
            replace: 'const missing: string[] = [];',
            description: 'missing 배열 타입 명시'
        },
        {
            search: /const invalid = \[\];/g,
            replace: 'const invalid: string[] = [];',
            description: 'invalid 배열 타입 명시'
        },
        {
            search: /const restored = \[\];/g,
            replace: 'const restored: string[] = [];',
            description: 'restored 배열 타입 명시'
        }
    ];

    const files = getAllTypeScriptFiles();
    let fixedCount = 0;

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        arrayPatterns.forEach(pattern => {
            if (pattern.search.test(content)) {
                content = content.replace(pattern.search, pattern.replace);
                modified = true;
                console.log(`  ✅ ${pattern.description}: ${path.relative(projectRoot, file)}`);
            }
        });

        if (modified) {
            fs.writeFileSync(file, content);
            fixedCount++;
        }
    });

    console.log(`✅ ${fixedCount}개 파일에서 배열 타입 추론 문제 해결 완료\n`);
}

// 2️⃣ null/undefined 안전성 문제 해결 (25% 오류)
function fixNullUndefinedSafety() {
    console.log('2️⃣ null/undefined 안전성 문제 해결 중...');

    const nullSafetyPatterns = [
        // error.timestamp 패턴
        {
            search: /error\.timestamp\s*>\s*(\w+)/g,
            replace: 'error.timestamp && error.timestamp > $1',
            description: 'error.timestamp null 체크 추가'
        },
        // weights.property 패턴
        {
            search: /weights\.(\w+)\s*\|\|\s*0/g,
            replace: 'weights.$1 ?? 0',
            description: 'weights 속성 nullish coalescing 적용'
        },
        // object?.property 패턴 강화
        {
            search: /(\w+)\.(\w+)\s*>\s*(\w+)/g,
            replace: '$1?.$2 && $1.$2 > $3',
            description: '객체 속성 접근 안전성 강화'
        }
    ];

    const files = getAllTypeScriptFiles();
    let fixedCount = 0;

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        nullSafetyPatterns.forEach(pattern => {
            const originalContent = content;
            content = content.replace(pattern.search, pattern.replace);
            if (content !== originalContent) {
                modified = true;
                console.log(`  ✅ ${pattern.description}: ${path.relative(projectRoot, file)}`);
            }
        });

        if (modified) {
            fs.writeFileSync(file, content);
            fixedCount++;
        }
    });

    console.log(`✅ ${fixedCount}개 파일에서 null/undefined 안전성 문제 해결 완료\n`);
}

// 3️⃣ React RefObject 타입 불일치 해결 (15% 오류)
function fixReactRefObjectTypes() {
    console.log('3️⃣ React RefObject 타입 불일치 해결 중...');

    const refPatterns = [
        // RefObject<HTMLElement | null> → RefObject<HTMLElement>
        {
            search: /(\w+Ref)\s*=\s*\{modalRef\}/g,
            replace: '$1={$1 as React.RefObject<HTMLDivElement>}',
            description: 'modalRef 타입 캐스팅'
        },
        {
            search: /(\w+Ref)\s*=\s*\{buttonRef\}/g,
            replace: '$1={$1 as React.RefObject<HTMLButtonElement>}',
            description: 'buttonRef 타입 캐스팅'
        },
        // useRef 초기화 패턴
        {
            search: /useRef<HTML(\w+)Element>\(null\)/g,
            replace: 'useRef<HTML$1Element | null>(null)',
            description: 'useRef nullable 타입 선언'
        }
    ];

    const files = getAllTypeScriptFiles();
    let fixedCount = 0;

    files.forEach(file => {
        if (!file.includes('.tsx')) return; // React 파일만 처리

        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        refPatterns.forEach(pattern => {
            if (pattern.search.test(content)) {
                content = content.replace(pattern.search, pattern.replace);
                modified = true;
                console.log(`  ✅ ${pattern.description}: ${path.relative(projectRoot, file)}`);
            }
        });

        if (modified) {
            fs.writeFileSync(file, content);
            fixedCount++;
        }
    });

    console.log(`✅ ${fixedCount}개 파일에서 React RefObject 타입 불일치 해결 완료\n`);
}

// 4️⃣ 타입 호환성 문제 해결 (10% 오류)
function fixTypeCompatibility() {
    console.log('4️⃣ 타입 호환성 문제 해결 중...');

    const compatibilityPatterns = [
        // undefined → null 변환
        {
            search: /:\s*RealMCPClient\s*\|\s*undefined/g,
            replace: ': RealMCPClient | null',
            description: 'undefined를 null로 통일'
        },
        // unknown[] → ReactNode 변환
        {
            search: /Object\.entries\([^)]+\)\.map\(/g,
            replace: '(Object.entries($&) as [string, boolean][]).map(',
            description: 'Object.entries 타입 캐스팅'
        },
        // any → 구체적 타입
        {
            search: /:\s*any\[\]/g,
            replace: ': unknown[]',
            description: 'any[] → unknown[] 변환'
        }
    ];

    const files = getAllTypeScriptFiles();
    let fixedCount = 0;

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        compatibilityPatterns.forEach(pattern => {
            if (pattern.search.test(content)) {
                content = content.replace(pattern.search, pattern.replace);
                modified = true;
                console.log(`  ✅ ${pattern.description}: ${path.relative(projectRoot, file)}`);
            }
        });

        if (modified) {
            fs.writeFileSync(file, content);
            fixedCount++;
        }
    });

    console.log(`✅ ${fixedCount}개 파일에서 타입 호환성 문제 해결 완료\n`);
}

// 5️⃣ 필수 import 추가
function addRequiredImports() {
    console.log('5️⃣ 필수 import 추가 중...');

    const importPatterns = [
        {
            usage: /getErrorMessage\(/g,
            importLine: "import { getErrorMessage } from '@/types/type-utils';",
            checkExisting: /import.*getErrorMessage.*from/
        },
        {
            usage: /safeArrayAccess\(/g,
            importLine: "import { safeArrayAccess } from '@/types/type-utils';",
            checkExisting: /import.*safeArrayAccess.*from/
        },
        {
            usage: /React\.RefObject/g,
            importLine: "import React from 'react';",
            checkExisting: /import.*React.*from ['"]react['"]/
        }
    ];

    const files = getAllTypeScriptFiles();
    let fixedCount = 0;

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        importPatterns.forEach(pattern => {
            if (pattern.usage.test(content) && !pattern.checkExisting.test(content)) {
                // 첫 번째 줄에 import 추가
                content = pattern.importLine + '\n' + content;
                modified = true;
                console.log(`  ✅ Import 추가: ${path.relative(projectRoot, file)}`);
            }
        });

        if (modified) {
            fs.writeFileSync(file, content);
            fixedCount++;
        }
    });

    console.log(`✅ ${fixedCount}개 파일에서 필수 import 추가 완료\n`);
}

// 유틸리티 함수
function getAllTypeScriptFiles() {
    const files = [];

    function scanDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                scanDir(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
                files.push(fullPath);
            }
        }
    }

    scanDir(path.join(projectRoot, 'src'));
    scanDir(path.join(projectRoot, 'tests'));
    return files;
}

// 메인 실행
async function main() {
    console.log('🚀 TypeScript 근본원인 해결 시작');
    console.log('='.repeat(60));

    try {
        // 1단계: 배열 타입 추론 문제 해결 (최대 효과)
        fixArrayTypeInference();

        // 2단계: null/undefined 안전성 문제 해결
        fixNullUndefinedSafety();

        // 3단계: React RefObject 타입 불일치 해결
        fixReactRefObjectTypes();

        // 4단계: 타입 호환성 문제 해결
        fixTypeCompatibility();

        // 5단계: 필수 import 추가
        addRequiredImports();

        console.log('🎯 최종 결과');
        console.log('='.repeat(60));
        console.log('✅ 근본원인별 TypeScript 문제 해결 완료!');
        console.log('📊 타입 체크를 실행하여 개선 결과를 확인하세요:');
        console.log('   npm run type-check');

    } catch (error) {
        console.error('❌ 오류 발생:', error);
        process.exit(1);
    }
}

main().catch(console.error); 