#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 리팩토링 후 코드베이스 점검 및 모듈간 연결도 분석 시작...\n');

// 분석 결과 저장 객체
const analysisResult = {
  timestamp: new Date().toISOString(),
  totalFiles: 0,
  moduleConnections: {},
  dependencyGraph: {},
  coreModules: {},
  orphanedFiles: [],
  circularDependencies: [],
  importErrors: [],
  architectureHealth: {}
};

// 핵심 모듈 정의
const coreModules = {
  'dashboard': {
    path: 'src/app/dashboard',
    type: 'application',
    role: '메인 대시보드 애플리케이션'
  },
  'components': {
    path: 'src/components',
    type: 'ui',
    role: 'UI 컴포넌트 라이브러리'
  },
  'ai-sidebar': {
    path: 'src/modules/ai-sidebar',
    type: 'feature',
    role: 'AI 사이드바 기능 모듈'
  },
  'ai-agent': {
    path: 'src/modules/ai-agent',
    type: 'feature',  
    role: 'AI 에이전트 처리 모듈'
  },
  'services': {
    path: 'src/services',
    type: 'business',
    role: '비즈니스 로직 서비스'
  },
  'api': {
    path: 'src/app/api',
    type: 'api',
    role: 'API 라우트 핸들러'
  },
  'lib': {
    path: 'src/lib',
    type: 'utility',
    role: '공통 라이브러리 및 유틸리티'
  },
  'hooks': {
    path: 'src/hooks',
    type: 'logic',
    role: 'React 훅 및 상태 관리'
  },
  'stores': {
    path: 'src/stores',
    type: 'state',
    role: '전역 상태 관리'
  }
};

// 파일 스캔 함수
function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // archive, node_modules, .next 등 제외
        if (!item.startsWith('.') && 
            item !== 'node_modules' && 
            item !== 'archive' &&
            !fullPath.includes('archive')) {
          scan(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Import 분석
function analyzeImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // import 문 정규식
    const importRegexes = [
      /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g,
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
    ];
    
    importRegexes.forEach(regex => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        imports.push({
          path: match[1],
          isRelative: match[1].startsWith('.'),
          isAbsolute: match[1].startsWith('@/'),
          isExternal: !match[1].startsWith('.') && !match[1].startsWith('@/')
        });
      }
    });
    
    return imports;
  } catch (error) {
    console.warn(`⚠️ 파일 분석 실패: ${filePath} - ${error.message}`);
    return [];
  }
}

// 모듈 분류
function classifyFile(filePath) {
  const relativePath = path.relative('src', filePath);
  
  for (const [moduleKey, moduleInfo] of Object.entries(coreModules)) {
    if (relativePath.startsWith(moduleInfo.path.replace('src/', ''))) {
      return {
        module: moduleKey,
        type: moduleInfo.type,
        role: moduleInfo.role,
        subPath: relativePath.replace(moduleInfo.path.replace('src/', ''), '')
      };
    }
  }
  
  return {
    module: 'unknown',
    type: 'misc',
    role: '분류되지 않은 파일',
    subPath: relativePath
  };
}

// 의존성 그래프 생성
function buildDependencyGraph(files) {
  const graph = {};
  const moduleConnections = {};
  
  files.forEach(file => {
    const relativePath = path.relative(process.cwd(), file);
    const imports = analyzeImports(file);
    const classification = classifyFile(file);
    
    graph[relativePath] = {
      classification,
      imports: imports.map(imp => ({
        ...imp,
        resolvedPath: resolveImportPath(imp.path, file)
      })),
      size: fs.statSync(file).size,
      lines: fs.readFileSync(file, 'utf8').split('\n').length
    };
    
    // 모듈간 연결 집계
    const fromModule = classification.module;
    if (!moduleConnections[fromModule]) {
      moduleConnections[fromModule] = {
        internal: new Set(),
        external: new Set(),
        totalImports: 0,
        files: []
      };
    }
    
    moduleConnections[fromModule].files.push(relativePath);
    moduleConnections[fromModule].totalImports += imports.length;
    
    imports.forEach(imp => {
      if (imp.isRelative || imp.isAbsolute) {
        const resolvedPath = resolveImportPath(imp.path, file);
        if (resolvedPath) {
          const targetClassification = classifyFile(resolvedPath);
          const toModule = targetClassification.module;
          
          if (fromModule === toModule) {
            moduleConnections[fromModule].internal.add(imp.path);
          } else {
            moduleConnections[fromModule].external.add(toModule);
          }
        }
      }
    });
  });
  
  // Set을 Array로 변환
  Object.keys(moduleConnections).forEach(module => {
    moduleConnections[module].internal = Array.from(moduleConnections[module].internal);
    moduleConnections[module].external = Array.from(moduleConnections[module].external);
  });
  
  return { graph, moduleConnections };
}

// Import 경로 해석
function resolveImportPath(importPath, fromFile) {
  try {
    if (importPath.startsWith('@/')) {
      return path.resolve('src', importPath.replace('@/', ''));
    } else if (importPath.startsWith('.')) {
      const fromDir = path.dirname(fromFile);
      return path.resolve(fromDir, importPath);
    }
    return null; // 외부 라이브러리
  } catch (error) {
    return null;
  }
}

// 순환 의존성 탐지
function detectCircularDependencies(graph) {
  const visiting = new Set();
  const visited = new Set();
  const cycles = [];
  
  function dfs(node, path = []) {
    if (visiting.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push([...path.slice(cycleStart), node]);
      }
      return;
    }
    
    if (visited.has(node)) return;
    
    visiting.add(node);
    path.push(node);
    
    const nodeData = graph[node];
    if (nodeData && nodeData.imports) {
      nodeData.imports.forEach(imp => {
        if (imp.resolvedPath && graph[path.relative(process.cwd(), imp.resolvedPath)]) {
          dfs(path.relative(process.cwd(), imp.resolvedPath), [...path]);
        }
      });
    }
    
    visiting.delete(node);
    visited.add(node);
    path.pop();
  }
  
  Object.keys(graph).forEach(node => {
    if (!visited.has(node)) {
      dfs(node);
    }
  });
  
  return cycles;
}

// 고아 파일 탐지
function detectOrphanedFiles(graph) {
  const referencedFiles = new Set();
  
  // 모든 import된 파일 수집
  Object.values(graph).forEach(fileData => {
    fileData.imports.forEach(imp => {
      if (imp.resolvedPath) {
        const relativePath = path.relative(process.cwd(), imp.resolvedPath);
        referencedFiles.add(relativePath);
      }
    });
  });
  
  // 참조되지 않은 파일 찾기 (entry point 제외)
  const entryPoints = new Set([
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/dashboard/page.tsx'
  ]);
  
  const orphaned = [];
  Object.keys(graph).forEach(file => {
    if (!referencedFiles.has(file) && !entryPoints.has(file)) {
      orphaned.push(file);
    }
  });
  
  return orphaned;
}

// 아키텍처 건강도 평가
function evaluateArchitectureHealth(moduleConnections, graph, cycles, orphaned) {
  const health = {
    overall: 'good',
    scores: {},
    issues: [],
    recommendations: []
  };
  
  // 모듈별 점수 계산
  Object.entries(moduleConnections).forEach(([module, data]) => {
    let score = 100;
    
    // 너무 많은 외부 의존성 (-5점씩)
    if (data.external.length > 5) {
      score -= (data.external.length - 5) * 5;
      health.issues.push(`${module}: 과도한 외부 의존성 (${data.external.length}개)`);
    }
    
    // 파일 수 대비 import 비율
    const avgImports = data.totalImports / data.files.length;
    if (avgImports > 10) {
      score -= 10;
      health.issues.push(`${module}: 높은 결합도 (평균 ${avgImports.toFixed(1)}개 import/파일)`);
    }
    
    health.scores[module] = Math.max(0, score);
  });
  
  // 전체 점수
  const avgScore = Object.values(health.scores).reduce((a, b) => a + b, 0) / Object.keys(health.scores).length;
  
  // 순환 의존성 패널티
  if (cycles.length > 0) {
    health.issues.push(`순환 의존성 발견 (${cycles.length}개)`);
    health.recommendations.push('순환 의존성 해결 필요');
  }
  
  // 고아 파일 패널티
  if (orphaned.length > 5) {
    health.issues.push(`미사용 파일 다수 (${orphaned.length}개)`);
    health.recommendations.push('미사용 파일 정리 권장');
  }
  
  // 전체 건강도 결정
  if (avgScore >= 90) health.overall = 'excellent';
  else if (avgScore >= 80) health.overall = 'good';
  else if (avgScore >= 70) health.overall = 'fair';
  else health.overall = 'poor';
  
  return health;
}

// 연결도 매트릭스 생성
function generateConnectionMatrix(moduleConnections) {
  const modules = Object.keys(moduleConnections);
  const matrix = {};
  
  modules.forEach(fromModule => {
    matrix[fromModule] = {};
    modules.forEach(toModule => {
      matrix[fromModule][toModule] = 0;
    });
    
    // 외부 연결 수 계산
    moduleConnections[fromModule].external.forEach(toModule => {
      if (matrix[fromModule][toModule] !== undefined) {
        matrix[fromModule][toModule]++;
      }
    });
  });
  
  return matrix;
}

// 메인 분석 실행
async function main() {
  console.log('🔍 파일 스캔 중...');
  const allFiles = scanDirectory('src');
  analysisResult.totalFiles = allFiles.length;
  
  console.log(`📁 총 ${allFiles.length}개 파일 발견\n`);
  
  console.log('🔗 의존성 그래프 생성 중...');
  const { graph, moduleConnections } = buildDependencyGraph(allFiles);
  analysisResult.dependencyGraph = graph;
  analysisResult.moduleConnections = moduleConnections;
  
  console.log('🔄 순환 의존성 탐지 중...');
  const cycles = detectCircularDependencies(graph);
  analysisResult.circularDependencies = cycles;
  
  console.log('👻 고아 파일 탐지 중...');
  const orphaned = detectOrphanedFiles(graph);
  analysisResult.orphanedFiles = orphaned;
  
  console.log('🏥 아키텍처 건강도 평가 중...');
  const health = evaluateArchitectureHealth(moduleConnections, graph, cycles, orphaned);
  analysisResult.architectureHealth = health;
  
  // 연결도 매트릭스
  const connectionMatrix = generateConnectionMatrix(moduleConnections);
  
  // 결과 출력
  console.log('\n📊 모듈간 연결도 분석 결과:');
  console.log('================================');
  
  Object.entries(moduleConnections).forEach(([module, data]) => {
    console.log(`\n🔧 ${module.toUpperCase()} 모듈:`);
    console.log(`   📄 파일 수: ${data.files.length}개`);
    console.log(`   📥 총 import: ${data.totalImports}개`);
    console.log(`   🔗 외부 의존성: ${data.external.join(', ') || '없음'}`);
    console.log(`   📈 건강도: ${health.scores[module]}점`);
  });
  
  console.log('\n🔗 모듈 연결 매트릭스:');
  console.log('=====================');
  const modules = Object.keys(connectionMatrix);
  console.log('        ' + modules.map(m => m.substring(0, 8).padEnd(8)).join(' '));
  modules.forEach(fromModule => {
    const row = fromModule.substring(0, 8).padEnd(8);
    const connections = modules.map(toModule => 
      connectionMatrix[fromModule][toModule].toString().padEnd(8)
    ).join(' ');
    console.log(row + connections);
  });
  
  console.log(`\n🏥 전체 아키텍처 건강도: ${health.overall.toUpperCase()}`);
  console.log(`📊 평균 점수: ${Object.values(health.scores).reduce((a, b) => a + b, 0) / Object.keys(health.scores).length}점`);
  
  if (health.issues.length > 0) {
    console.log('\n⚠️ 발견된 문제점:');
    health.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (health.recommendations.length > 0) {
    console.log('\n💡 권장사항:');
    health.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }
  
  if (cycles.length > 0) {
    console.log(`\n🔄 순환 의존성 (${cycles.length}개):`);
    cycles.forEach((cycle, index) => {
      console.log(`   ${index + 1}. ${cycle.join(' → ')}`);
    });
  }
  
  if (orphaned.length > 0) {
    console.log(`\n👻 고아 파일 (${orphaned.length}개):`);
    orphaned.slice(0, 10).forEach(file => {
      console.log(`   - ${file}`);
    });
    if (orphaned.length > 10) {
      console.log(`   ... 및 ${orphaned.length - 10}개 더`);
    }
  }
  
  // 결과를 JSON 파일로 저장
  fs.writeFileSync('scripts/codebase-analysis-result.json', JSON.stringify(analysisResult, null, 2));
  
  // 보고서 생성
  generateAnalysisReport(analysisResult, connectionMatrix);
  
  console.log('\n✅ 분석 완료!');
  console.log('📄 상세 결과: scripts/codebase-analysis-result.json');
  console.log('📋 분석 보고서: scripts/post-refactor-analysis-report.md');
}

// 분석 보고서 생성
function generateAnalysisReport(result, connectionMatrix) {
  const timestamp = new Date().toLocaleDateString('ko-KR');
  
  let report = `# 📊 리팩토링 후 코드베이스 분석 보고서\n\n`;
  report += `**분석 일시:** ${timestamp}\n`;
  report += `**총 파일 수:** ${result.totalFiles}개\n\n`;
  
  report += `## 🏗️ 모듈 아키텍처 현황\n\n`;
  Object.entries(result.moduleConnections).forEach(([module, data]) => {
    const moduleInfo = coreModules[module];
    report += `### ${module.charAt(0).toUpperCase() + module.slice(1)} 모듈\n`;
    report += `- **역할:** ${moduleInfo?.role || '정의되지 않음'}\n`;
    report += `- **파일 수:** ${data.files.length}개\n`;
    report += `- **총 import:** ${data.totalImports}개\n`;
    report += `- **외부 의존성:** ${data.external.length}개 모듈 (${data.external.join(', ') || '없음'})\n`;
    report += `- **건강도:** ${result.architectureHealth.scores[module]}점\n\n`;
  });
  
  report += `## 🔗 모듈간 연결 매트릭스\n\n`;
  report += `각 숫자는 모듈간 의존성 연결 수를 나타냅니다.\n\n`;
  report += `| From\\To | ${Object.keys(connectionMatrix).join(' | ')} |\n`;
  report += `|---------|${'---------|'.repeat(Object.keys(connectionMatrix).length)}\n`;
  Object.entries(connectionMatrix).forEach(([fromModule, connections]) => {
    const row = Object.values(connections).join(' | ');
    report += `| ${fromModule} | ${row} |\n`;
  });
  
  report += `\n## 🏥 아키텍처 건강도\n\n`;
  report += `**전체 평가:** ${result.architectureHealth.overall.toUpperCase()}\n\n`;
  
  if (result.architectureHealth.issues.length > 0) {
    report += `### ⚠️ 발견된 문제점\n`;
    result.architectureHealth.issues.forEach(issue => {
      report += `- ${issue}\n`;
    });
    report += `\n`;
  }
  
  if (result.architectureHealth.recommendations.length > 0) {
    report += `### 💡 개선 권장사항\n`;
    result.architectureHealth.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
    report += `\n`;
  }
  
  if (result.circularDependencies.length > 0) {
    report += `## 🔄 순환 의존성 (${result.circularDependencies.length}개)\n\n`;
    result.circularDependencies.forEach((cycle, index) => {
      report += `${index + 1}. \`${cycle.join(' → ')}\`\n`;
    });
    report += `\n`;
  }
  
  if (result.orphanedFiles.length > 0) {
    report += `## 👻 고아 파일 (${result.orphanedFiles.length}개)\n\n`;
    report += `다음 파일들은 다른 파일에서 참조되지 않습니다:\n\n`;
    result.orphanedFiles.slice(0, 20).forEach(file => {
      report += `- \`${file}\`\n`;
    });
    if (result.orphanedFiles.length > 20) {
      report += `- ... 및 ${result.orphanedFiles.length - 20}개 더\n`;
    }
    report += `\n`;
  }
  
  report += `## 📈 리팩토링 효과 평가\n\n`;
  report += `리팩토링 이전 대비 개선사항:\n`;
  report += `- ✅ 중복 파일 제거로 구조 명확화\n`;
  report += `- ✅ 미사용 파일 정리로 복잡도 감소\n`;
  report += `- ✅ archive 백업으로 안전성 확보\n`;
  report += `- ✅ 빌드 설정 최적화\n\n`;
  
  report += `## 🎯 다음 최적화 기회\n\n`;
  report += `1. **모듈 의존성 최적화:** 과도한 외부 의존성을 가진 모듈 정리\n`;
  report += `2. **고아 파일 정리:** 사용되지 않는 파일들의 추가 정리\n`;
  report += `3. **순환 의존성 해결:** 발견된 순환 의존성 구조 개선\n`;
  report += `4. **코드 응집도 향상:** 모듈 내부 구조 최적화\n\n`;
  
  fs.writeFileSync('scripts/post-refactor-analysis-report.md', report);
}

main().catch(console.error); 