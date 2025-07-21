#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 전체 코드베이스 사용하지 않는 파일 검색 시작...\n');

// 1. 모든 TypeScript 파일 수집
function getAllTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules') {
        files.push(...getAllTsFiles(fullPath));
      }
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

// 2. 파일 내용에서 import 구문 추출
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];

    // import 구문 정규식
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // dynamic import 추출
    const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  } catch (error) {
    return [];
  }
}

// 3. 상대 경로를 절대 경로로 변환
function resolveImportPath(importPath, fromFile) {
  if (importPath.startsWith('.')) {
    const dir = path.dirname(fromFile);
    const resolved = path.resolve(dir, importPath);

    // 확장자 추가 시도
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      if (fs.existsSync(resolved + ext)) {
        return resolved + ext;
      }
    }

    // index 파일 확인
    for (const ext of extensions) {
      const indexPath = path.join(resolved, 'index' + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    return resolved;
  }

  return null; // 외부 패키지
}

// 4. 메인 분석 함수
function analyzeCodebase() {
  const srcFiles = getAllTsFiles('src');
  const usedFiles = new Set();
  const importGraph = new Map();

  console.log(`📊 총 ${srcFiles.length}개 TypeScript 파일 발견\n`);

  // Entry points (항상 사용됨)
  const entryPoints = [
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/dashboard/layout.tsx',
  ];

  // import 관계 구축
  for (const file of srcFiles) {
    const imports = extractImports(file);
    importGraph.set(file, imports);

    // entry point에서 시작
    if (entryPoints.some(entry => file.includes(entry))) {
      usedFiles.add(file);
    }
  }

  // DFS로 사용되는 파일 추적
  function markAsUsed(filePath) {
    if (usedFiles.has(filePath)) return;

    usedFiles.add(filePath);
    const imports = importGraph.get(filePath) || [];

    for (const importPath of imports) {
      const resolvedPath = resolveImportPath(importPath, filePath);
      if (resolvedPath && srcFiles.includes(resolvedPath)) {
        markAsUsed(resolvedPath);
      }
    }
  }

  // Entry point부터 추적
  for (const entryPoint of entryPoints) {
    const fullPath = srcFiles.find(f => f.includes(entryPoint));
    if (fullPath) {
      markAsUsed(fullPath);
    }
  }

  // API 라우트는 모두 사용됨으로 간주
  for (const file of srcFiles) {
    if (file.includes('/api/') && file.endsWith('route.ts')) {
      markAsUsed(file);
    }
  }

  // 사용되지 않는 파일 찾기
  const unusedFiles = srcFiles.filter(file => !usedFiles.has(file));

  console.log('📈 분석 결과:');
  console.log(`✅ 사용되는 파일: ${usedFiles.size}개`);
  console.log(`❌ 사용되지 않는 파일: ${unusedFiles.length}개\n`);

  if (unusedFiles.length > 0) {
    console.log('🗑️ 사용되지 않는 파일 목록:');
    unusedFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    console.log();
  }

  // 중복 가능성 체크
  console.log('🔍 중복 가능성 체크...');
  const filesByName = {};
  for (const file of srcFiles) {
    const basename = path.basename(file);
    if (!filesByName[basename]) {
      filesByName[basename] = [];
    }
    filesByName[basename].push(file);
  }

  const duplicates = Object.entries(filesByName).filter(
    ([name, files]) => files.length > 1
  );
  if (duplicates.length > 0) {
    console.log('⚠️ 같은 이름을 가진 파일들 (중복 가능성):');
    duplicates.forEach(([name, files]) => {
      console.log(`📄 ${name}:`);
      files.forEach(file => console.log(`   - ${file}`));
    });
    console.log();
  }

  return {
    total: srcFiles.length,
    used: usedFiles.size,
    unused: unusedFiles,
    duplicates,
  };
}

// 실행
try {
  const result = analyzeCodebase();

  console.log('✅ 코드베이스 분석 완료!');
  console.log(`📊 총 파일: ${result.total}개`);
  console.log(`✅ 사용중: ${result.used}개`);
  console.log(`❌ 미사용: ${result.unused.length}개`);
  console.log(`⚠️ 중복 가능성: ${result.duplicates.length}개 그룹`);
} catch (error) {
  console.error('❌ 분석 중 오류:', error.message);
  process.exit(1);
}
