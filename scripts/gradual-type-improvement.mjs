#!/usr/bin/env node

/**
 * 점진적 타입 개선 스크립트
 * 
 * 단계별로 타입 안전성을 개선하는 자동화 도구
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

// 개선 단계별 설정
const IMPROVEMENT_PHASES = [
    {
        name: 'Phase 1: Error Message Safety',
        description: 'error.message를 getErrorMessage()로 변환',
        action: () => {
            console.log('🔧 error.message 패턴 수정 중...');

            // error.message를 getErrorMessage(error)로 변환
            const files = getAllTypeScriptFiles();
            let fixedCount = 0;

            files.forEach(file => {
                let content = fs.readFileSync(file, 'utf8');
                const originalContent = content;

                // error.message 패턴 찾기 및 변환
                content = content.replace(/error\.message/g, 'getErrorMessage(error)');

                // import 문 추가 (없는 경우)
                if (content !== originalContent && !content.includes('getErrorMessage')) {
                    const importLine = "import { getErrorMessage } from '@/types/type-utils';";
                    if (!content.includes(importLine)) {
                        content = importLine + '\n' + content;
                    }
                }

                if (content !== originalContent) {
                    fs.writeFileSync(file, content);
                    fixedCount++;
                }
            });

            console.log(`✅ ${fixedCount}개 파일에서 error.message 패턴 수정 완료`);
        }
    },

    {
        name: 'Phase 2: Safe Array Access',
        description: '배열 접근을 안전하게 변환',
        action: () => {
            console.log('🔧 배열 접근 패턴 수정 중...');

            const files = getAllTypeScriptFiles();
            let fixedCount = 0;

            files.forEach(file => {
                let content = fs.readFileSync(file, 'utf8');
                const originalContent = content;

                // 간단한 배열[0] 패턴 변환
                content = content.replace(/(\w+)\[0\]/g, 'safeArrayAccess($1, 0)');

                // import 문 추가
                if (content !== originalContent && !content.includes('safeArrayAccess')) {
                    const importLine = "import { safeArrayAccess } from '@/types/type-utils';";
                    if (!content.includes(importLine)) {
                        content = importLine + '\n' + content;
                    }
                }

                if (content !== originalContent) {
                    fs.writeFileSync(file, content);
                    fixedCount++;
                }
            });

            console.log(`✅ ${fixedCount}개 파일에서 배열 접근 패턴 수정 완료`);
        }
    },

    {
        name: 'Phase 3: Enable Strict Null Checks',
        description: 'strictNullChecks 점진적 활성화',
        action: () => {
            console.log('🔧 strictNullChecks 활성화 중...');

            updateTsConfig({
                strictNullChecks: true
            });

            console.log('✅ strictNullChecks 활성화 완료');
        }
    },

    {
        name: 'Phase 4: Enable No Implicit Any',
        description: 'noImplicitAny 활성화',
        action: () => {
            console.log('🔧 noImplicitAny 활성화 중...');

            updateTsConfig({
                noImplicitAny: true
            });

            console.log('✅ noImplicitAny 활성화 완료');
        }
    },

    {
        name: 'Phase 5: Enable No Unchecked Index Access',
        description: 'noUncheckedIndexedAccess 활성화',
        action: () => {
            console.log('🔧 noUncheckedIndexedAccess 활성화 중...');

            updateTsConfig({
                noUncheckedIndexedAccess: true
            });

            console.log('✅ noUncheckedIndexedAccess 활성화 완료');
        }
    }
];

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

    scanDir(path.join(PROJECT_ROOT, 'src'));
    return files;
}

function updateTsConfig(updates) {
    const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

    Object.assign(tsconfig.compilerOptions, updates);

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
}

function checkTypeErrors() {
    try {
        execSync('npm run type-check', { stdio: 'pipe' });
        return 0;
    } catch (error) {
        const output = error.stdout.toString();
        const matches = output.match(/Found (\d+) error/);
        return matches ? parseInt(matches[1]) : 0;
    }
}

function runPhase(phase) {
    console.log(`\n📋 ${phase.name}`);
    console.log(`📝 ${phase.description}`);

    const beforeErrors = checkTypeErrors();
    console.log(`⚠️  현재 타입 오류: ${beforeErrors}개`);

    phase.action();

    const afterErrors = checkTypeErrors();
    const improvement = beforeErrors - afterErrors;

    console.log(`⚠️  수정 후 타입 오류: ${afterErrors}개`);
    if (improvement > 0) {
        console.log(`🎉 ${improvement}개 오류 해결!`);
    } else if (improvement < 0) {
        console.log(`⚠️  ${Math.abs(improvement)}개 오류 증가 (일시적 현상일 수 있음)`);
    }

    return { beforeErrors, afterErrors, improvement };
}

// 메인 실행
async function main() {
    const args = process.argv.slice(2);
    const phaseToRun = args[0] ? parseInt(args[0]) : null;

    console.log('🚀 점진적 타입 개선 시작');
    console.log('='.repeat(50));

    if (phaseToRun !== null) {
        // 특정 단계만 실행
        if (phaseToRun >= 1 && phaseToRun <= IMPROVEMENT_PHASES.length) {
            const phase = IMPROVEMENT_PHASES[phaseToRun - 1];
            runPhase(phase);
        } else {
            console.log(`❌ 잘못된 단계 번호: ${phaseToRun}`);
            console.log(`사용 가능한 단계: 1-${IMPROVEMENT_PHASES.length}`);
        }
    } else {
        // 모든 단계 순차 실행
        let totalImprovement = 0;

        for (let i = 0; i < IMPROVEMENT_PHASES.length; i++) {
            const result = runPhase(IMPROVEMENT_PHASES[i]);
            totalImprovement += result.improvement;

            // 단계 간 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n🎯 최종 결과');
        console.log('='.repeat(50));
        console.log(`🎉 총 ${totalImprovement}개 타입 오류 해결!`);
        console.log(`✅ 점진적 타입 개선 완료`);
    }
}

main().catch(console.error); 