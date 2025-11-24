#!/usr/bin/env node
/**
 * Phase 4: Update imports for enterprise/ folder reorganization
 *
 * 이동된 파일 (3개):
 * - enterprise-failures.ts → enterprise/enterprise-failures.ts
 * - enterprise-metrics.ts → enterprise/enterprise-metrics.ts
 * - enterprise-servers.ts → enterprise/enterprise-servers.ts
 *
 * 검색 경로:
 * - src/app/
 * - src/components/
 * - src/hooks/
 * - src/lib/
 * - src/services/
 * - src/utils/
 * - src/types/
 * - tests/
 * - __tests__/
 */

const fs = require('fs');
const path = require('path');

// Import mappings (order matters for partial matches)
const importMappings = [
  {
    from: '@/lib/enterprise-failures',
    to: '@/lib/enterprise/enterprise-failures',
  },
  {
    from: '@/lib/enterprise-metrics',
    to: '@/lib/enterprise/enterprise-metrics',
  },
  {
    from: '@/lib/enterprise-servers',
    to: '@/lib/enterprise/enterprise-servers',
  },
];

// Directories to scan
const searchDirs = [
  'src/app',
  'src/components',
  'src/hooks',
  'src/lib',
  'src/services',
  'src/utils',
  'src/types',
  'tests',
  '__tests__',
];

let totalFiles = 0;
let updatedFiles = 0;

function updateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Update imports for each mapping
  for (const { from, to } of importMappings) {
    // Match both single and double quotes
    const patterns = [
      new RegExp(`from ['\"]${from.replace(/\//g, '\\/')}['\"]`, 'g'),
      new RegExp(`import\\(['\"]${from.replace(/\//g, '\\/')}['\"]\\)`, 'g'),
    ];

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        const quote = content.match(pattern)?.[0]?.includes('"') ? '"' : "'";
        content = content.replace(
          new RegExp(`(['\"])${from.replace(/\//g, '\\/')}\\1`, 'g'),
          `${quote}${to}${quote}`
        );
        updated = true;
      }
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content);
    updatedFiles++;
  }
}

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and .git
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      // Process TypeScript and JavaScript files
      if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        totalFiles++;
        updateImportsInFile(fullPath);
      }
    }
  }
}

// Main execution
console.log('🔄 Phase 4: enterprise/ 폴더 import 경로 업데이트 시작...\n');

for (const dir of searchDirs) {
  scanDirectory(dir);
}

console.log(`\n📊 완료: ${updatedFiles}/${totalFiles} 파일 업데이트됨`);
console.log('\n✅ 다음 단계: npm run type-check && npm run test:super-fast');
