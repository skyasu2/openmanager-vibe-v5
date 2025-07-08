#!/usr/bin/env node
/**
 * 🏥 OpenManager Vibe v5 코드베이스 건강도 점검 스크립트
 * 생성일: 2025-07-02
 * 버전: v1.0
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 OpenManager Vibe v5 코드베이스 건강도 점검 시작...\n');

// 1. 파일 크기 분석 (1000줄 이상 파일 경고)
function checkLargeFiles() {
    console.log('📏 대용량 파일 분석...');

    const largeFiles = [];
    const srcFiles = getAllFiles('src', ['.ts', '.tsx', '.js', '.jsx']);

    srcFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n').length;

            if (lines > 1000) {
                largeFiles.push({
                    file: path.relative('.', file),
                    lines,
                    size: (fs.statSync(file).size / 1024).toFixed(1) + 'KB'
                });
            }
        } catch (error) {
            // 파일 읽기 오류 무시
        }
    });

    if (largeFiles.length > 0) {
        console.log('⚠️ 1000줄 이상 파일 발견:');
        largeFiles.sort((a, b) => b.lines - a.lines);
        largeFiles.forEach(file => {
            console.log(`   ${file.file} (${file.lines}줄, ${file.size})`);
        });
        console.log(`   권장: ${largeFiles.length}개 파일 분리 검토 필요\n`);
    } else {
        console.log('✅ 모든 파일이 적절한 크기입니다.\n');
    }

    return largeFiles;
}

// 2. 중복 코드 패턴 분석
function checkDuplicatePatterns() {
    console.log('🔍 중복 코드 패턴 분석...');

    const patterns = new Map();
    const srcFiles = getAllFiles('src', ['.ts', '.tsx']);

    srcFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');

            // 함수 선언 패턴 추출
            const functionMatches = content.match(/(?:function|const)\s+\w+/g) || [];
            functionMatches.forEach(match => {
                const normalized = match.replace(/\s+/g, ' ').trim();
                if (!patterns.has(normalized)) {
                    patterns.set(normalized, []);
                }
                patterns.get(normalized).push(file);
            });

        } catch (error) {
            // 파일 읽기 오류 무시
        }
    });

    const duplicates = Array.from(patterns.entries())
        .filter(([pattern, files]) => files.length > 3)
        .sort((a, b) => b[1].length - a[1].length);

    if (duplicates.length > 0) {
        console.log('⚠️ 중복 가능성 높은 패턴:');
        duplicates.slice(0, 5).forEach(([pattern, files]) => {
            console.log(`   "${pattern}" - ${files.length}개 파일에서 발견`);
        });
        console.log(`   총 ${duplicates.length}개 중복 패턴 발견\n`);
    } else {
        console.log('✅ 중복 패턴이 발견되지 않았습니다.\n');
    }

    return duplicates;
}

// 3. 미사용 import 분석
function checkUnusedImports() {
    console.log('📦 미사용 import 분석...');

    let unusedCount = 0;
    const srcFiles = getAllFiles('src', ['.ts', '.tsx']);

    srcFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const imports = content.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || [];

            imports.forEach(importLine => {
                // 단순한 미사용 import 체크 (실제 사용 여부는 복잡한 분석 필요)
                const importedItems = importLine.match(/import\s+\{([^}]+)\}/);
                if (importedItems) {
                    const items = importedItems[1].split(',').map(item => item.trim());
                    items.forEach(item => {
                        const cleanItem = item.replace(/\s+as\s+\w+/, '').trim();
                        if (!content.includes(cleanItem) || content.indexOf(cleanItem) === content.indexOf(importLine)) {
                            unusedCount++;
                        }
                    });
                }
            });

        } catch (error) {
            // 파일 읽기 오류 무시
        }
    });

    if (unusedCount > 20) {
        console.log(`⚠️ 미사용 import 추정: ${unusedCount}개`);
        console.log('   권장: ESLint 규칙으로 자동 정리 필요\n');
    } else {
        console.log('✅ import 상태가 양호합니다.\n');
    }

    return unusedCount;
}

// 4. API 라우트 건강도 체크
function checkAPIHealth() {
    console.log('🛣️ API 라우트 건강도 분석...');

    const apiFiles = getAllFiles('src/app/api', ['.ts']);
    let healthyAPIs = 0;
    let emptyAPIs = 0;
    let largeAPIs = 0;

    apiFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const size = fs.statSync(file).size;

            if (size < 500) {
                emptyAPIs++;
            } else if (size > 15000) {
                largeAPIs++;
            } else {
                healthyAPIs++;
            }

        } catch (error) {
            // 파일 읽기 오류 무시
        }
    });

    console.log(`📊 API 현황:`);
    console.log(`   ✅ 건강한 API: ${healthyAPIs}개`);
    console.log(`   ⚠️ 미구현 API: ${emptyAPIs}개`);
    console.log(`   🔍 대용량 API: ${largeAPIs}개`);

    const healthRatio = (healthyAPIs / apiFiles.length * 100).toFixed(1);
    console.log(`   📈 건강도: ${healthRatio}%\n`);

    return { healthy: healthyAPIs, empty: emptyAPIs, large: largeAPIs, ratio: healthRatio };
}

// 5. 테스트 커버리지 추정
function checkTestCoverage() {
    console.log('🧪 테스트 커버리지 추정...');

    const srcFiles = getAllFiles('src', ['.ts', '.tsx']);
    const testFiles = getAllFiles('tests', ['.test.ts', '.test.tsx']);

    const coverageRatio = (testFiles.length / srcFiles.length * 100).toFixed(1);

    if (coverageRatio < 30) {
        console.log(`⚠️ 테스트 커버리지 낮음: ${coverageRatio}%`);
        console.log('   권장: 핵심 기능 테스트 추가 필요\n');
    } else {
        console.log(`✅ 테스트 커버리지: ${coverageRatio}%\n`);
    }

    return coverageRatio;
}

// 6. 전체 건강도 점수 계산
function calculateHealthScore(metrics) {
    let score = 100;

    // 대용량 파일 패널티
    score -= metrics.largeFiles.length * 5;

    // 중복 패턴 패널티
    score -= Math.min(metrics.duplicates.length * 2, 20);

    // 미사용 import 패널티
    score -= Math.min(metrics.unusedImports / 10, 15);

    // API 건강도 보너스/패널티
    score += (metrics.apiHealth.ratio - 50) / 5;

    // 테스트 커버리지 보너스/패널티
    score += (metrics.testCoverage - 50) / 5;

    return Math.max(0, Math.min(100, score));
}

// 유틸리티 함수
function getAllFiles(dir, extensions) {
    let files = [];

    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files = files.concat(getAllFiles(fullPath, extensions));
        } else if (extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
        }
    });

    return files;
}

// 메인 실행
try {
    const metrics = {
        largeFiles: checkLargeFiles(),
        duplicates: checkDuplicatePatterns(),
        unusedImports: checkUnusedImports(),
        apiHealth: checkAPIHealth(),
        testCoverage: checkTestCoverage()
    };

    const healthScore = calculateHealthScore(metrics);

    console.log('🏥 전체 건강도 평가:');
    console.log(`📊 종합 점수: ${healthScore.toFixed(1)}/100`);

    if (healthScore >= 90) {
        console.log('🎉 코드베이스 상태: 매우 우수');
    } else if (healthScore >= 80) {
        console.log('✅ 코드베이스 상태: 우수');
    } else if (healthScore >= 70) {
        console.log('⚠️ 코드베이스 상태: 보통 (개선 권장)');
    } else {
        console.log('🚨 코드베이스 상태: 주의 (즉시 개선 필요)');
    }

    console.log('\n📋 권장 개선사항:');
    if (metrics.largeFiles.length > 0) {
        console.log('- 대용량 파일 분리 검토');
    }
    if (metrics.duplicates.length > 5) {
        console.log('- 중복 코드 리팩토링');
    }
    if (metrics.unusedImports > 50) {
        console.log('- 미사용 import 정리');
    }
    if (metrics.apiHealth.ratio < 70) {
        console.log('- API 구현 완성도 향상');
    }
    if (metrics.testCoverage < 50) {
        console.log('- 테스트 커버리지 향상');
    }

} catch (error) {
    console.error('❌ 건강도 점검 중 오류:', error.message);
    process.exit(1);
} 