#!/usr/bin/env node

/**
 * ESLint 결과 파일 정리 스크립트
 * 
 * ESLint 결과에서 source 코드를 제거하여 파일 크기를 줄입니다.
 * 이는 대용량 프로젝트에서 ESLint 결과 파일이 너무 커지는 문제를 해결합니다.
 */

const fs = require('fs');
const path = require('path');

const ESLINT_RESULTS_FILE = 'eslint-results.json';

function cleanEslintResults() {
    try {
        if (!fs.existsSync(ESLINT_RESULTS_FILE)) {
            console.log('❌ eslint-results.json 파일을 찾을 수 없습니다.');
            return;
        }

        const content = fs.readFileSync(ESLINT_RESULTS_FILE, 'utf8');

        // npm warnings와 기타 텍스트를 제거하고 JSON 부분만 추출
        const jsonStart = content.indexOf('[{');
        if (jsonStart === -1) {
            console.log('❌ 유효한 JSON 배열을 찾을 수 없습니다.');
            return;
        }

        const jsonContent = content.substring(jsonStart);

        // 첫 번째 완전한 JSON 배열 찾기
        let bracketCount = 0;
        let endIndex = -1;

        for (let i = 0; i < jsonContent.length; i++) {
            if (jsonContent[i] === '[') bracketCount++;
            if (jsonContent[i] === ']') {
                bracketCount--;
                if (bracketCount === 0) {
                    endIndex = i + 1;
                    break;
                }
            }
        }

        if (endIndex <= 0) {
            console.log('❌ 완전한 JSON 배열을 찾을 수 없습니다.');
            return;
        }

        const validJson = jsonContent.substring(0, endIndex);
        const data = JSON.parse(validJson);

        // source 코드 제거하여 파일 크기 줄이기
        const cleanedData = data.map(result => ({
            filePath: result.filePath,
            messages: result.messages,
            suppressedMessages: result.suppressedMessages || [],
            errorCount: result.errorCount,
            fatalErrorCount: result.fatalErrorCount,
            warningCount: result.warningCount,
            fixableErrorCount: result.fixableErrorCount,
            fixableWarningCount: result.fixableWarningCount,
            usedDeprecatedRules: result.usedDeprecatedRules || []
            // source 필드 제거됨
        }));

        // 백업 생성
        const backupFile = `${ESLINT_RESULTS_FILE}.backup.${Date.now()}`;
        fs.copyFileSync(ESLINT_RESULTS_FILE, backupFile);

        // 정리된 결과 저장
        fs.writeFileSync(ESLINT_RESULTS_FILE, JSON.stringify(cleanedData, null, 2));

        const originalSize = fs.statSync(backupFile).size;
        const cleanedSize = fs.statSync(ESLINT_RESULTS_FILE).size;
        const reduction = ((originalSize - cleanedSize) / originalSize * 100).toFixed(1);

        console.log('✅ ESLint 결과 파일 정리 완료');
        console.log(`📊 원본 크기: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📊 정리된 크기: ${(cleanedSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📊 크기 감소: ${reduction}%`);
        console.log(`📁 파일 수: ${cleanedData.length}`);
        console.log(`💾 백업 파일: ${backupFile}`);

    } catch (error) {
        console.error('❌ ESLint 결과 파일 정리 실패:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    cleanEslintResults();
}

module.exports = { cleanEslintResults };