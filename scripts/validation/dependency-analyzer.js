/**
 * 지능형 검증 파이프라인 - 의존성 분석기
 * @description 변경된 파일의 의존성 트리를 분석하여 영향 범위 계산
 * @created 2025-08-09
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 캐싱 시스템 (5분 TTL)
const dependencyCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5분

/**
 * TypeScript/JavaScript 파일의 import/require 추출
 */
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = new Set();
    
    // ES6 import 패턴
    const importRegex = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"](.*?)['"];?/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
    
    // CommonJS require 패턴
    const requireRegex = /require\s*\(\s*['"](.*?)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
    
    // Dynamic import 패턴
    const dynamicImportRegex = /import\s*\(\s*['"](.*?)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
    
    return Array.from(imports);
  } catch (error) {
    console.warn(`⚠️  의존성 추출 실패: ${filePath}`, error.message);
    return [];
  }
}

/**
 * 상대 경로를 절대 경로로 해석
 */
function resolveImportPath(importPath, currentFilePath) {
  // 외부 패키지는 그대로 반환
  if (!importPath.startsWith('.')) {
    return importPath;
  }
  
  const currentDir = path.dirname(currentFilePath);
  const resolvedPath = path.resolve(currentDir, importPath);
  
  // 파일 확장자 추가 시도
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
  
  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  // index 파일 확인
  for (const ext of extensions) {
    const indexPath = path.join(resolvedPath, 'index' + ext);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return resolvedPath;
}

/**
 * TypeScript 경로 매핑 해석 (@/ 등)
 */
function resolveTypeScriptPaths(importPath, projectRoot) {
  // @/ 경로 매핑 (src/)
  if (importPath.startsWith('@/')) {
    const srcPath = importPath.replace('@/', path.join(projectRoot, 'src/'));
    return path.resolve(srcPath);
  }
  
  // @components, @lib 등 추가 매핑
  const pathMappings = {
    '@components/': 'src/components/',
    '@lib/': 'src/lib/',
    '@utils/': 'src/utils/',
    '@types/': 'src/types/',
    '@hooks/': 'src/hooks/',
    '@services/': 'src/services/',
    '@styles/': 'src/styles/',
  };
  
  for (const [alias, realPath] of Object.entries(pathMappings)) {
    if (importPath.startsWith(alias)) {
      const resolvedPath = importPath.replace(alias, path.join(projectRoot, realPath));
      return path.resolve(resolvedPath);
    }
  }
  
  return importPath;
}

/**
 * 파일의 직접 의존성 분석
 */
function analyzeDirectDependencies(filePath, projectRoot) {
  const cacheKey = `deps_${filePath}`;
  const cached = dependencyCache.get(cacheKey);
  
  // 캐시 확인
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.dependencies;
  }
  
  const imports = extractImports(filePath);
  const dependencies = {
    internal: [], // 프로젝트 내부 파일
    external: [], // 외부 패키지
    unresolved: [] // 해석 불가
  };
  
  for (const importPath of imports) {
    try {
      // TypeScript 경로 매핑 해석
      const mappedPath = resolveTypeScriptPaths(importPath, projectRoot);
      
      // 상대 경로 해석
      const resolvedPath = resolveImportPath(mappedPath, filePath);
      
      // 분류
      if (importPath.startsWith('.') || importPath.startsWith('@/')) {
        // 내부 의존성
        dependencies.internal.push({
          importPath,
          resolvedPath,
          exists: fs.existsSync(resolvedPath)
        });
      } else if (importPath.includes('/') && !importPath.startsWith('node:')) {
        // 외부 패키지
        dependencies.external.push(importPath);
      } else {
        // 해석 불가
        dependencies.unresolved.push(importPath);
      }
    } catch (error) {
      dependencies.unresolved.push(importPath);
    }
  }
  
  // 캐시 저장
  dependencyCache.set(cacheKey, {
    dependencies,
    timestamp: Date.now()
  });
  
  return dependencies;
}

/**
 * 의존성 트리 재귀 분석 (순환 의존성 방지)
 */
function analyzeDependencyTree(filePath, projectRoot, visited = new Set(), depth = 0) {
  // 최대 깊이 제한 (성능)
  if (depth > 10) return { dependencies: [], circularRef: false };
  
  // 순환 의존성 검사
  if (visited.has(filePath)) {
    return { dependencies: [], circularRef: true };
  }
  
  visited.add(filePath);
  
  const directDeps = analyzeDirectDependencies(filePath, projectRoot);
  const allDependencies = new Set([filePath]);
  let hasCircularRef = false;
  
  // 내부 의존성만 재귀 분석
  for (const dep of directDeps.internal) {
    if (dep.exists) {
      const subTree = analyzeDependencyTree(dep.resolvedPath, projectRoot, new Set(visited), depth + 1);
      
      subTree.dependencies.forEach(d => allDependencies.add(d));
      
      if (subTree.circularRef) {
        hasCircularRef = true;
      }
    }
  }
  
  visited.delete(filePath);
  
  return {
    dependencies: Array.from(allDependencies),
    circularRef: hasCircularRef,
    directDependencies: directDeps
  };
}

/**
 * 변경 영향 범위 계산
 */
function calculateImpactScope(changedFiles, projectRoot) {
  const impactAnalysis = {
    totalFiles: 0,
    affectedFiles: new Set(),
    externalPackages: new Set(),
    circularDependencies: [],
    recommendations: []
  };
  
  for (const filePath of changedFiles) {
    try {
      const analysis = analyzeDependencyTree(filePath, projectRoot);
      
      // 영향받는 파일 수집
      analysis.dependencies.forEach(dep => impactAnalysis.affectedFiles.add(dep));
      
      // 외부 패키지 수집
      if (analysis.directDependencies) {
        analysis.directDependencies.external.forEach(pkg => 
          impactAnalysis.externalPackages.add(pkg)
        );
      }
      
      // 순환 의존성 기록
      if (analysis.circularRef) {
        impactAnalysis.circularDependencies.push(filePath);
      }
      
    } catch (error) {
      console.warn(`⚠️  의존성 분석 실패: ${filePath}`, error.message);
    }
  }
  
  impactAnalysis.totalFiles = impactAnalysis.affectedFiles.size;
  
  // 검증 추천사항 생성
  impactAnalysis.recommendations = generateValidationRecommendations(impactAnalysis);
  
  return impactAnalysis;
}

/**
 * 의존성 기반 검증 추천사항 생성
 */
function generateValidationRecommendations(impactAnalysis) {
  const recommendations = [];
  const { totalFiles, circularDependencies, externalPackages } = impactAnalysis;
  
  // 대규모 영향 감지
  if (totalFiles > 50) {
    recommendations.push({
      type: 'LARGE_IMPACT',
      severity: 'HIGH',
      message: `${totalFiles}개 파일 영향 - 전체 테스트 실행 권장`,
      action: 'run-full-tests'
    });
  } else if (totalFiles > 20) {
    recommendations.push({
      type: 'MEDIUM_IMPACT',
      severity: 'MEDIUM', 
      message: `${totalFiles}개 파일 영향 - 관련 테스트 실행`,
      action: 'run-related-tests'
    });
  }
  
  // 순환 의존성 경고
  if (circularDependencies.length > 0) {
    recommendations.push({
      type: 'CIRCULAR_DEPENDENCY',
      severity: 'HIGH',
      message: `순환 의존성 감지: ${circularDependencies.length}개 파일`,
      action: 'check-circular-deps',
      files: circularDependencies
    });
  }
  
  // 외부 패키지 변경 감지
  if (externalPackages.size > 10) {
    recommendations.push({
      type: 'MANY_EXTERNALS',
      severity: 'MEDIUM',
      message: `${externalPackages.size}개 외부 패키지 의존성 - 타입 체크 강화`,
      action: 'enhanced-type-check'
    });
  }
  
  return recommendations;
}

/**
 * 캐시 관리
 */
function clearCache() {
  dependencyCache.clear();
}

function getCacheStats() {
  return {
    size: dependencyCache.size,
    entries: Array.from(dependencyCache.keys())
  };
}

/**
 * 테스트할 파일 결정 (의존성 기반)
 */
function determineTestFiles(changedFiles, projectRoot) {
  const testFiles = new Set();
  
  for (const filePath of changedFiles) {
    // 직접적인 테스트 파일
    const testPatterns = [
      filePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
      filePath.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
      filePath.replace('/src/', '/tests/').replace(/\.(ts|tsx|js|jsx)$/, '.test.$1')
    ];
    
    for (const testPattern of testPatterns) {
      if (fs.existsSync(testPattern)) {
        testFiles.add(testPattern);
      }
    }
  }
  
  return Array.from(testFiles);
}

module.exports = {
  analyzeDependencyTree,
  analyzeDirectDependencies,
  calculateImpactScope,
  determineTestFiles,
  generateValidationRecommendations,
  clearCache,
  getCacheStats,
  extractImports,
  resolveTypeScriptPaths
};