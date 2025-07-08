#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * 타입 오류 자동 수정 스크립트
 * 
 * 가장 빈번한 패턴들을 자동으로 수정합니다:
 * 1. error.message → getErrorMessage(error)
 * 2. array[index] → safeArrayAccess(array, index)
 * 3. useEffect 반환값 문제
 */

// 수정 패턴 정의
const fixPatterns = [
    // error.message 패턴
    {
        name: 'error.message',
        pattern: /error\.message/g,
        replacement: 'getErrorMessage(error)',
        needsImport: 'getErrorMessage',
        importFrom: '@/types/type-utils'
    },

    // 배열 접근 패턴 (간단한 경우만)
    {
        name: 'array[0]',
        pattern: /(\w+)\[0\]/g,
        replacement: 'safeArrayAccess($1, 0)',
        needsImport: 'safeArrayAccess',
        importFrom: '@/types/type-utils'
    },

    // useEffect 반환값 문제
    {
        name: 'useEffect cleanup',
        pattern: /useEffect\(\(\) => \{([^}]+)\}, \[([^\]]*)\]\);/g,
        replacement: 'useEffect(() => {\n$1\n    return () => {};\n  }, [$2]);',
        needsImport: null
    }
];

// 파일 처리 함수
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        const neededImports = new Set();

        // 각 패턴 적용
        fixPatterns.forEach(pattern => {
            const originalContent = content;
            content = content.replace(pattern.pattern, pattern.replacement);

            if (content !== originalContent) {
                modified = true;
                if (pattern.needsImport) {
                    neededImports.add({
                        name: pattern.needsImport,
                        from: pattern.importFrom
                    });
                }
                console.log(`✅ ${pattern.name} 패턴 수정: ${filePath}`);
            }
        });

        // 필요한 import 추가
        if (neededImports.size > 0) {
            neededImports.forEach(imp => {
                const importStatement = `import { ${imp.name} } from '${imp.from}';`;
                if (!content.includes(importStatement)) {
                    // 기존 import 문 뒤에 추가
                    const importRegex = /^import.*from.*['"];$/gm;
                    const imports = content.match(importRegex);
                    if (imports && imports.length > 0) {
                        const lastImport = imports[imports.length - 1];
                        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
                        content = content.slice(0, lastImportIndex) + '\n' + importStatement + content.slice(lastImportIndex);
                    } else {
                        // import가 없으면 파일 맨 위에 추가
                        content = importStatement + '\n\n' + content;
                    }
                    console.log(`📦 Import 추가: ${imp.name} from ${imp.from}`);
                }
            });
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }

        return false;
    } catch (error) {
        console.error(`❌ 파일 처리 오류 ${filePath}:`, error.message);
        return false;
    }
}

// 디렉토리 재귀 처리
function processDirectory(dirPath, extensions = ['.ts', '.tsx']) {
    let processedCount = 0;
    let modifiedCount = 0;

    function walkDir(currentPath) {
        const items = fs.readdirSync(currentPath);

        items.forEach(item => {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // node_modules, .git 등 제외
                if (!item.startsWith('.') && item !== 'node_modules') {
                    walkDir(itemPath);
                }
            } else if (stats.isFile()) {
                const ext = path.extname(item);
                if (extensions.includes(ext)) {
                    processedCount++;
                    if (processFile(itemPath)) {
                        modifiedCount++;
                    }
                }
            }
        });
    }

    walkDir(dirPath);
    return { processedCount, modifiedCount };
}

// 메인 실행
async function main() {
    console.log('🔧 타입 오류 자동 수정 시작...\n');

    const srcPath = path.join(projectRoot, 'src');
    const { processedCount, modifiedCount } = processDirectory(srcPath);

    console.log(`\n📊 수정 완료:`);
    console.log(`- 처리된 파일: ${processedCount}개`);
    console.log(`- 수정된 파일: ${modifiedCount}개`);

    if (modifiedCount > 0) {
        console.log('\n🧪 타입 체크 실행 중...');
        const { execSync } = await import('child_process');
        try {
            execSync('npm run type-check', { stdio: 'inherit', cwd: projectRoot });
        } catch (error) {
            console.log('타입 체크에서 여전히 오류가 있습니다. 추가 수정이 필요합니다.');
        }
    }
}

main().catch(console.error); 