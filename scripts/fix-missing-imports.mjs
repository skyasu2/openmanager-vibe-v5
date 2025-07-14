#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * 누락된 import 문을 자동으로 추가하는 스크립트
 */

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
    return files;
}

function fixMissingImports() {
    const files = getAllTypeScriptFiles();
    let fixedCount = 0;

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
            usage: /safeObjectAccess\(/g,
            importLine: "import { safeObjectAccess } from '@/types/type-utils';",
            checkExisting: /import.*safeObjectAccess.*from/
        }
    ];

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        importPatterns.forEach(pattern => {
            // 함수 사용이 있는지 확인
            if (pattern.usage.test(content)) {
                // 이미 import가 있는지 확인
                if (!pattern.checkExisting.test(content)) {
                    // import 문 추가
                    const lines = content.split('\n');
                    let insertIndex = -1;

                    // 마지막 import 문 다음에 추가
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].startsWith('import ')) {
                            insertIndex = i + 1;
                        } else if (lines[i].trim() === '' && insertIndex > -1) {
                            break;
                        }
                    }

                    if (insertIndex > -1) {
                        lines.splice(insertIndex, 0, pattern.importLine);
                        content = lines.join('\n');
                        modified = true;
                    }
                }
            }
        });

        if (modified) {
            fs.writeFileSync(file, content);
            fixedCount++;
        }
    });

    console.log(`✅ ${fixedCount}개 파일에서 누락된 import 문 추가 완료`);
}

console.log('🔧 누락된 import 문 수정 시작...');
fixMissingImports();
console.log('✅ import 문 수정 완료!'); 