#!/usr/bin/env node
/**
 * AI 컨텍스트 파일 체크 스크립트
 * GitHub Copilot 및 AI 도구들이 프로젝트를 제대로 인식하는지 확인
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 AI 컨텍스트 시스템 체크 시작...\n');
console.log('🏗️ 개발 환경 구성:');
console.log('   🎯 메인: WSL + Claude Code');
console.log('   🔧 서브: gemini-cli (토큰관리), codex-cli (Plus요금제), qwen-cli (무료백업)');
console.log('   � 보조: VS Code + GitHub Copilot (이미지 처리, 캡쳐 작업)\n');

// 필수 AI 컨텍스트 파일들
const requiredFiles = [
    {
        path: '.vscode/ai-context.json',
        description: 'VS Code AI 기본 컨텍스트'
    },
    {
        path: '.vscode/settings.json',
        description: 'VS Code GitHub Copilot 설정'
    },
    {
        path: '.vscode/extensions.json',
        description: 'VS Code 추천 확장'
    },
    {
        path: '.github/copilot-instructions.md',
        description: 'GitHub Copilot 지침서'
    },
    {
        path: 'AI-CONTEXT.md',
        description: '메인 AI 컨텍스트 파일'
    },
    {
        path: 'docs/PROJECT-SUMMARY.md',
        description: '프로젝트 요약'
    },
    {
        path: 'docs/development/ai-workflow-guide.md',
        description: 'AI 개발 워크플로우 가이드'
    },
    {
        path: '.mcp.json',
        description: 'MCP 서버 설정'
    }
];

let allGood = true;

// 파일 존재 확인
console.log('📁 필수 AI 컨텍스트 파일 체크:');
requiredFiles.forEach(file => {
    const exists = fs.existsSync(file.path);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file.path} - ${file.description}`);

    if (!exists) {
        allGood = false;
    }
});

// GitHub Copilot 설정 세부 체크
console.log('\n🔧 GitHub Copilot 설정 상세 체크:');
try {
    const settingsPath = '.vscode/settings.json';
    if (fs.existsSync(settingsPath)) {
        const settingsContent = fs.readFileSync(settingsPath, 'utf8');

        // JSONC 주석 제거 (간단한 방법)
        const cleanedContent = settingsContent
            .replace(/\/\*[\s\S]*?\*\//g, '') // 블록 주석 제거
            .replace(/\/\/.*$/gm, '') // 라인 주석 제거
            .replace(/,\s*}/g, '}') // 마지막 콤마 제거
            .replace(/,\s*]/g, ']'); // 배열 마지막 콤마 제거

        const settings = JSON.parse(cleanedContent);

        // Copilot 활성화 확인
        const copilotEnabled = settings['github.copilot.enable'];
        if (copilotEnabled && copilotEnabled.typescript && copilotEnabled.typescriptreact) {
            console.log('   ✅ TypeScript Copilot 활성화됨');
        } else {
            console.log('   ⚠️  TypeScript Copilot 설정 확인 필요');
        }

        // 한국어 설정 확인
        const locale = settings['github.copilot.chat.localeOverride'];
        if (locale === 'ko') {
            console.log('   ✅ 한국어 로케일 설정됨');
        } else {
            console.log('   ⚠️  한국어 로케일 설정 권장');
        }

        // 자동완성 확인
        const autoComplete = settings['github.copilot.editor.enableAutoCompletions'];
        if (autoComplete) {
            console.log('   ✅ 자동완성 활성화됨');
        } else {
            console.log('   ⚠️  자동완성 비활성화됨');
        }

        // 고급 설정 확인
        const advanced = settings['github.copilot.advanced'];
        if (advanced && advanced.length) {
            console.log('   ✅ 고급 설정 적용됨 (길이: ' + advanced.length + ')');
        } else {
            console.log('   ⚠️  고급 설정 기본값 사용 중');
        }
    }
} catch (error) {
    console.log('   ⚠️  settings.json 읽기 실패:', error.message);
    console.log('   💡 VS Code에서 settings.json을 직접 확인해주세요.');
}

// 프로젝트 구조 체크
console.log('\n📊 프로젝트 구조 체크:');
const importantDirs = [
    'src/services/ai',
    'src/components',
    'src/types',
    'docs'
];

importantDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${dir}/`);

    if (!exists) {
        allGood = false;
    }
});

// TypeScript 파일 통계
console.log('\n📈 TypeScript 파일 통계:');
try {
    const countFiles = (dir, ext) => {
        if (!fs.existsSync(dir)) return 0;
        let count = 0;
        const files = fs.readdirSync(dir, { withFileTypes: true });

        files.forEach(file => {
            if (file.isDirectory() && !file.name.includes('node_modules') && !file.name.startsWith('.')) {
                count += countFiles(path.join(dir, file.name), ext);
            } else if (file.name.endsWith(ext)) {
                count++;
            }
        });

        return count;
    };

    const tsCount = countFiles('src', '.ts');
    const tsxCount = countFiles('src', '.tsx');

    console.log(`   📝 TypeScript 파일: ${tsCount}개`);
    console.log(`   ⚛️  React TSX 파일: ${tsxCount}개`);
    console.log(`   📦 총 파일: ${tsCount + tsxCount}개`);
} catch (error) {
    console.log('   ⚠️  파일 통계 수집 실패:', error.message);
}

// 최종 결과
console.log('\n' + '='.repeat(50));
if (allGood) {
    console.log('🎉 AI 컨텍스트 시스템이 올바르게 설정되었습니다!');
    console.log('🤖 멀티 AI 에이전트 환경이 준비되었습니다.');
    console.log('\n💡 사용법:');
    console.log('   🎯 메인 개발: WSL 터미널에서 Claude Code 실행');
    console.log('   � 토큰 관리: gemini-cli로 사용량 조절 및 대체');
    console.log('   💰 Plus 활용: codex-cli로 ChatGPT Plus 요금제 최대 활용');
    console.log('   💸 비용 절약: qwen-cli 무료 제공량으로 백업');
    console.log('   📷 이미지 작업: VS Code에서 캡쳐 → GitHub Copilot 분석');
} else {
    console.log('⚠️  일부 AI 컨텍스트 파일이 누락되었습니다.');
    console.log('🔧 다음 명령으로 설정을 완성하세요:');
    console.log('   npm run copilot:setup');
}
console.log('='.repeat(50));

process.exit(allGood ? 0 : 1);
