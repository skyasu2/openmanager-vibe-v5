/**
 * 🧹 사용하지 않는 기능 정리 스크립트 (VM 서버데이터 생성기 제거 후)
 *
 * VM 시스템 제거로 불필요해진 기능들과 코드를 정리합니다.
 * - 더 이상 참조되지 않는 파일들
 * - 사용되지 않는 import 구문들
 * - 미사용 API 엔드포인트들
 * - 데드 코드 감지 및 제거
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 🗑️ 완전히 제거된 VM 시스템 관련 키워드들
const REMOVED_KEYWORDS = [
    'RealServerDataGenerator',
    'VMPersistentDataManager',
    'EnrichedMetricsGenerator',
    'LongRunningScenarioEngine',
    'BaselineContinuityManager',
    'SimpleEnterpriseMetrics',
    'EnterpriseMetricsGenerator',
    'EnterpriseMetricsGeneratorV2',
];

// 🔍 분석 대상 디렉토리들
const SCAN_DIRECTORIES = [
    'src',
    'tests',
    'scripts',
];

// 📝 분석 결과 저장
const analysisResults = {
    deadImports: [],
    unusedFiles: [],
    deprecatedAPIs: [],
    emptyDirectories: [],
    unusedTypes: [],
    deadReferences: [],
};

/**
 * 🔍 메인 분석 함수
 */
async function analyzeUnusedFeatures() {
    console.log('🧹 사용하지 않는 기능 분석 시작...');

    // 1. 데드 import 구문 찾기
    await findDeadImports();

    // 2. 사용되지 않는 파일들 찾기
    await findUnusedFiles();

    // 3. 더 이상 사용되지 않는 API 찾기
    await findDeprecatedAPIs();

    // 4. 빈 디렉토리 찾기
    await findEmptyDirectories();

    // 5. 사용되지 않는 타입 정의 찾기
    await findUnusedTypes();

    // 6. 데드 참조 찾기
    await findDeadReferences();

    // 결과 리포트 생성
    generateCleanupReport();
}

/**
 * 🔍 데드 import 구문 찾기
 */
async function findDeadImports() {
    console.log('🔍 데드 import 구문 검색 중...');

    for (const dir of SCAN_DIRECTORIES) {
        const files = getAllTsFiles(dir);

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');

                // 제거된 키워드를 import하는 구문 찾기
                for (const keyword of REMOVED_KEYWORDS) {
                    const importRegex = new RegExp(`import.*${keyword}.*from`, 'g');
                    const matches = content.match(importRegex);

                    if (matches) {
                        analysisResults.deadImports.push({
                            file,
                            keyword,
                            lines: matches,
                        });
                    }
                }
            } catch (error) {
                console.warn(`파일 ${file} 읽기 실패:`, error.message);
            }
        }
    }

    console.log(`📋 데드 import: ${analysisResults.deadImports.length}개`);
}

/**
 * 🔍 사용되지 않는 파일들 찾기
 */
async function findUnusedFiles() {
    console.log('🔍 사용되지 않는 파일 검색 중...');

    // VM 관련 패턴들
    const vmPatterns = [
        /vm-.*\.ts$/,
        /.*vm.*\.ts$/,
        /server-data-generator.*\.ts$/,
        /real-server.*\.ts$/,
        /enterprise-metrics-generator.*\.ts$/,
    ];

    for (const dir of SCAN_DIRECTORIES) {
        const files = getAllTsFiles(dir);

        for (const file of files) {
            const fileName = path.basename(file);

            // VM 관련 패턴 매칭
            if (vmPatterns.some(pattern => pattern.test(fileName))) {
                // 실제로 다른 파일에서 참조되는지 확인
                const isReferenced = await isFileReferenced(file);

                if (!isReferenced) {
                    analysisResults.unusedFiles.push({
                        file,
                        reason: 'VM 시스템 관련 파일로 더 이상 참조되지 않음',
                    });
                }
            }
        }
    }

    console.log(`📋 미사용 파일: ${analysisResults.unusedFiles.length}개`);
}

/**
 * 🔍 더 이상 사용되지 않는 API 찾기
 */
async function findDeprecatedAPIs() {
    console.log('🔍 더 이상 사용되지 않는 API 검색 중...');

    const apiDir = 'src/app/api';

    if (fs.existsSync(apiDir)) {
        const apiPaths = getAllDirectories(apiDir);

        for (const apiPath of apiPaths) {
            const routeFile = path.join(apiPath, 'route.ts');

            if (fs.existsSync(routeFile)) {
                const content = fs.readFileSync(routeFile, 'utf8');

                // VM 시스템 관련 API인지 확인
                if (REMOVED_KEYWORDS.some(keyword => content.includes(keyword))) {
                    // 실제로 호출되는지 확인
                    const apiEndpoint = apiPath.replace(apiDir, '').replace(/\\/g, '/');
                    const isUsed = await isAPIEndpointUsed(apiEndpoint);

                    if (!isUsed) {
                        analysisResults.deprecatedAPIs.push({
                            endpoint: apiEndpoint,
                            file: routeFile,
                            reason: 'VM 시스템 관련 API로 더 이상 사용되지 않음',
                        });
                    }
                }
            }
        }
    }

    console.log(`📋 더 이상 사용되지 않는 API: ${analysisResults.deprecatedAPIs.length}개`);
}

/**
 * 🔍 빈 디렉토리 찾기
 */
async function findEmptyDirectories() {
    console.log('🔍 빈 디렉토리 검색 중...');

    for (const dir of SCAN_DIRECTORIES) {
        const emptyDirs = findEmptyDirsRecursive(dir);
        analysisResults.emptyDirectories.push(...emptyDirs);
    }

    console.log(`📋 빈 디렉토리: ${analysisResults.emptyDirectories.length}개`);
}

/**
 * 🔍 사용되지 않는 타입 정의 찾기
 */
async function findUnusedTypes() {
    console.log('🔍 사용되지 않는 타입 정의 검색 중...');

    const typeFiles = getAllTsFiles('src/types');

    for (const file of typeFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');

            // interface나 type 정의 찾기
            const typeRegex = /(interface|type)\s+(\w+)/g;
            let match;

            while ((match = typeRegex.exec(content)) !== null) {
                const typeName = match[2];

                // VM 관련 타입인지 확인
                if (REMOVED_KEYWORDS.some(keyword => typeName.includes(keyword.replace('Generator', '')))) {
                    const isUsed = await isTypeUsed(typeName);

                    if (!isUsed) {
                        analysisResults.unusedTypes.push({
                            file,
                            typeName,
                            reason: 'VM 시스템 관련 타입으로 더 이상 사용되지 않음',
                        });
                    }
                }
            }
        } catch (error) {
            console.warn(`타입 파일 ${file} 분석 실패:`, error.message);
        }
    }

    console.log(`📋 미사용 타입: ${analysisResults.unusedTypes.length}개`);
}

/**
 * 🔍 데드 참조 찾기 
 */
async function findDeadReferences() {
    console.log('🔍 데드 참조 검색 중...');

    for (const dir of SCAN_DIRECTORIES) {
        const files = getAllTsFiles(dir);

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');

                for (const keyword of REMOVED_KEYWORDS) {
                    if (content.includes(keyword)) {
                        // import 구문이 아닌 실제 사용 찾기
                        const lines = content.split('\n');
                        const referencingLines = lines
                            .map((line, index) => ({ line, number: index + 1 }))
                            .filter(({ line }) =>
                                line.includes(keyword) &&
                                !line.trim().startsWith('import') &&
                                !line.trim().startsWith('//')
                            );

                        if (referencingLines.length > 0) {
                            analysisResults.deadReferences.push({
                                file,
                                keyword,
                                references: referencingLines,
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn(`데드 참조 분석 실패 ${file}:`, error.message);
            }
        }
    }

    console.log(`📋 데드 참조: ${analysisResults.deadReferences.length}개`);
}

/**
 * 📊 정리 리포트 생성
 */
function generateCleanupReport() {
    const report = `
🧹 사용하지 않는 기능 정리 리포트
=================================

📊 분석 결과:
- 데드 import: ${analysisResults.deadImports.length}개
- 미사용 파일: ${analysisResults.unusedFiles.length}개
- 더 이상 사용되지 않는 API: ${analysisResults.deprecatedAPIs.length}개
- 빈 디렉토리: ${analysisResults.emptyDirectories.length}개
- 미사용 타입: ${analysisResults.unusedTypes.length}개
- 데드 참조: ${analysisResults.deadReferences.length}개

🗑️ 데드 import:
${analysisResults.deadImports.map(item => `  - ${item.file}: ${item.keyword}`).join('\n')}

📄 미사용 파일:
${analysisResults.unusedFiles.map(item => `  - ${item.file}: ${item.reason}`).join('\n')}

🌐 더 이상 사용되지 않는 API:
${analysisResults.deprecatedAPIs.map(item => `  - ${item.endpoint}: ${item.reason}`).join('\n')}

📁 빈 디렉토리:
${analysisResults.emptyDirectories.map(dir => `  - ${dir}`).join('\n')}

🏷️ 미사용 타입:
${analysisResults.unusedTypes.map(item => `  - ${item.file}: ${item.typeName}`).join('\n')}

🔗 데드 참조:
${analysisResults.deadReferences.map(item => `  - ${item.file}: ${item.keyword} (${item.references.length}개 참조)`).join('\n')}

🔧 권장 정리 작업:
1. 데드 import 구문 제거
2. 미사용 파일 삭제 (백업 후)
3. 더 이상 사용되지 않는 API 제거
4. 빈 디렉토리 삭제
5. 미사용 타입 정의 제거
6. 데드 참조 정리

⚠️ 주의: 실제 삭제 전에 반드시 백업을 만들고, 테스트를 실행하세요.
`;

    console.log(report);

    // 리포트 파일로 저장
    const reportPath = 'cleanup-analysis-report.md';
    fs.writeFileSync(reportPath, report);
    console.log(`📝 리포트가 ${reportPath}에 저장되었습니다.`);
}

// 🔧 유틸리티 함수들

function getAllTsFiles(dir) {
    const files = [];

    if (!fs.existsSync(dir)) return files;

    function scanDir(currentDir) {
        const entries = fs.readdirSync(currentDir);

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
                files.push(fullPath);
            }
        }
    }

    scanDir(dir);
    return files;
}

function getAllDirectories(dir) {
    const dirs = [];

    if (!fs.existsSync(dir)) return dirs;

    function scanDir(currentDir) {
        const entries = fs.readdirSync(currentDir);

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                dirs.push(fullPath);
                scanDir(fullPath);
            }
        }
    }

    scanDir(dir);
    return dirs;
}

function findEmptyDirsRecursive(dir) {
    const emptyDirs = [];

    if (!fs.existsSync(dir)) return emptyDirs;

    function scanDir(currentDir) {
        try {
            const entries = fs.readdirSync(currentDir);

            if (entries.length === 0) {
                emptyDirs.push(currentDir);
                return;
            }

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scanDir(fullPath);
                }
            }
        } catch (error) {
            // 권한 없는 디렉토리는 무시
        }
    }

    scanDir(dir);
    return emptyDirs;
}

async function isFileReferenced(filePath) {
    try {
        const fileName = path.basename(filePath, path.extname(filePath));
        const searchPattern = fileName.replace(/-/g, '\\-'); // escape hyphens for grep

        // grep으로 다른 파일에서 참조되는지 확인
        const result = execSync(`grep -r "${searchPattern}" src/ --include="*.ts" --include="*.tsx" | grep -v "${filePath}"`,
            { encoding: 'utf8', stdio: 'pipe' });

        return result.trim().length > 0;
    } catch {
        return false; // grep에서 아무것도 찾지 못하면 false
    }
}

async function isAPIEndpointUsed(endpoint) {
    try {
        const searchEndpoint = endpoint.replace(/\//g, '\\/'); // escape slashes for grep

        // API 호출하는 코드 찾기
        const result = execSync(`grep -r "${searchEndpoint}" src/ --include="*.ts" --include="*.tsx"`,
            { encoding: 'utf8', stdio: 'pipe' });

        return result.trim().length > 0;
    } catch {
        return false;
    }
}

async function isTypeUsed(typeName) {
    try {
        // 타입이 사용되는 곳 찾기 (interface/type 정의 제외)
        const result = execSync(`grep -r "${typeName}" src/ --include="*.ts" --include="*.tsx" | grep -v "^.*\\(interface\\|type\\)\\s\\+${typeName}"`,
            { encoding: 'utf8', stdio: 'pipe' });

        return result.trim().length > 0;
    } catch {
        return false;
    }
}

// 실행
if (require.main === module) {
    analyzeUnusedFeatures().catch(console.error);
}

module.exports = {
    analyzeUnusedFeatures,
    analysisResults,
}; 