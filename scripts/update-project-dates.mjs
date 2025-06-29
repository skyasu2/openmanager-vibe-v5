#!/usr/bin/env node

/**
 * 🕒 OpenManager Vibe v5 - 프로젝트 날짜 일괄 업데이트 스크립트
 * 
 * 📅 현재 시간: 2025년 6월 29일 (KST)
 * 📅 프로젝트 시작: 2025년 5월 25일 (35일 진행)
 * 
 * ✅ 모든 2025년 1월 날짜 → 2025년 6월로 변경
 * ✅ 모든 주석, 문서, 코드의 시간 표기 업데이트
 * ✅ 한국시간(KST) 기준 통일
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 📊 통계 수집
let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

// 🔄 날짜 변환 규칙
const dateReplacements = [
    // 2025년 1월 → 6월 변환
    { from: /2025-06-28/g, to: '2025-06-28' },
    { from: /2025-06-27/g, to: '2025-06-27' },
    { from: /2025-06-26/g, to: '2025-06-26' },
    { from: /2025-06-25/g, to: '2025-06-25' },
    { from: /2025-06-24/g, to: '2025-06-24' },
    { from: /2025-06-23/g, to: '2025-06-23' },
    { from: /2025-06-22/g, to: '2025-06-22' },
    { from: /2025-06-21/g, to: '2025-06-21' },
    { from: /2025-06-20/g, to: '2025-06-20' },
    { from: /2025-06-10/g, to: '2025-06-10' },
    { from: /2025-06-06/g, to: '2025-06-06' },
    { from: /2025-06-03/g, to: '2025-06-03' },
    { from: /2025-06-01/g, to: '2025-06-01' },

    // 테스트 데이터 타임스탬프
    { from: /2025-06-01T00:00:00Z/g, to: '2025-06-01T00:00:00Z' },
    { from: /2025-06-01T00:01:00Z/g, to: '2025-06-01T00:01:00Z' },
    { from: /2025-06-01T00:02:00Z/g, to: '2025-06-01T00:02:00Z' },
    { from: /2025-06-01T00:03:00Z/g, to: '2025-06-01T00:03:00Z' },

    // 잘못된 미래 날짜 수정 (2026 → 2025)
    { from: /2025-05-/g, to: '2025-05-' },
    { from: /2025-06-/g, to: '2025-06-' },

    // 프로젝트 설명 텍스트
    { from: /2025년 5월 말 (25일)/g, to: '2025년 5월 말 (25일)' },
    { from: /2025년 6월 29일/g, to: '2025년 6월 29일' },

    // 한국어 날짜 표현
    { from: /2025년 06월/g, to: '2025년 06월' },
    { from: /2025\.01\./g, to: '2025.06.' },
];

// 🔍 처리할 파일 확장자
const targetExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.mjs',
    '.md', '.json', '.yaml', '.yml',
    '.txt', '.env'
];

// 🚫 제외할 디렉토리
const excludedDirs = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.vercel',
    'coverage'
];

/**
 * 📁 디렉토리 재귀 탐색
 */
async function walkDirectory(dir) {
    const files = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!excludedDirs.includes(entry.name)) {
                    const subFiles = await walkDirectory(fullPath);
                    files.push(...subFiles);
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name);
                if (targetExtensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    } catch (error) {
        console.warn(`⚠️  디렉토리 접근 실패: ${dir}`, error.message);
    }

    return files;
}

/**
 * 📝 파일 내용 업데이트
 */
async function updateFile(filePath) {
    try {
        totalFiles++;
        const content = await fs.readFile(filePath, 'utf8');
        let modifiedContent = content;
        let fileReplacements = 0;

        // 모든 날짜 변환 규칙 적용
        for (const rule of dateReplacements) {
            const matches = modifiedContent.match(rule.from);
            if (matches) {
                modifiedContent = modifiedContent.replace(rule.from, rule.to);
                fileReplacements += matches.length;
                totalReplacements += matches.length;
            }
        }

        // 파일이 수정되었으면 저장
        if (fileReplacements > 0) {
            await fs.writeFile(filePath, modifiedContent, 'utf8');
            modifiedFiles++;

            const relativePath = path.relative(projectRoot, filePath);
            console.log(`✅ ${relativePath} (${fileReplacements}개 수정)`);
        }

    } catch (error) {
        const relativePath = path.relative(projectRoot, filePath);
        console.error(`❌ ${relativePath}:`, error.message);
    }
}

/**
 * 🚀 메인 실행 함수
 */
async function main() {
    console.log('🕒 OpenManager Vibe v5 - 프로젝트 날짜 업데이트 시작');
    console.log('📅 현재: 2025년 6월 29일 (KST)');
    console.log('📅 프로젝트 시작: 2025년 5월 25일 (35일 진행)');
    console.log('');

    const startTime = Date.now();

    try {
        // 모든 파일 찾기
        console.log('🔍 파일 검색 중...');
        const files = await walkDirectory(projectRoot);
        console.log(`📁 총 ${files.length}개 파일 발견`);
        console.log('');

        // 파일별 처리
        console.log('🔄 파일 업데이트 중...');
        for (const file of files) {
            await updateFile(file);
        }

        // 결과 출력
        const duration = Date.now() - startTime;
        console.log('');
        console.log('📊 처리 완료 결과:');
        console.log(`✅ 검사한 파일: ${totalFiles}개`);
        console.log(`✏️  수정한 파일: ${modifiedFiles}개`);
        console.log(`🔄 총 변경사항: ${totalReplacements}개`);
        console.log(`⏱️  처리 시간: ${duration}ms`);
        console.log('');
        console.log('🎉 모든 날짜가 2025년 6월 기준으로 업데이트되었습니다!');

    } catch (error) {
        console.error('❌ 처리 중 오류 발생:', error);
        process.exit(1);
    }
}

// 스크립트 실행
main().catch(console.error); 
