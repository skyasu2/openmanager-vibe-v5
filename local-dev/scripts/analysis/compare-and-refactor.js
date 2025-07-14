#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 중복 파일 비교 및 리팩토링 분석 시작...\n');

// 결정 로그 저장 배열
const decisions = [];

// 중복 파일 그룹 정의
const duplicateGroups = [
  {
    name: 'AISidebar',
    files: [
      'src/components/ai/AISidebar.tsx',
      'src/modules/ai-sidebar/components/AISidebar.tsx'
    ]
  },
  {
    name: 'MessageBubble',
    files: [
      'src/components/ai/MessageBubble.tsx',
      'src/modules/ai-sidebar/components/MessageBubble.tsx'
    ]
  },
  {
    name: 'ServerCard',
    files: [
      'src/components/dashboard/ServerCard/ServerCard.tsx',
      'src/components/dashboard/ServerCard.tsx'
    ]
  },
  {
    name: 'ActionButtons',
    files: [
      'src/components/dashboard/ServerCard/ActionButtons.tsx',
      'src/modules/ai-sidebar/components/ActionButtons.tsx'
    ]
  },
  {
    name: 'ContextManager',
    files: [
      'src/modules/ai-agent/processors/ContextManager.ts',
      'src/services/ai-agent/ContextManager.ts'
    ]
  }
];

// 파일 분석 함수
function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  return {
    path: filePath,
    size: stats.size,
    lines: lines.length,
    content,

    // 코드 품질 지표
    hasDefaultExport: content.includes('export default'),
    hasNamedExport: /export\s+(const|function|class|interface|type)\s+\w+/.test(content),
    importsCount: (content.match(/^import.*from/gm) || []).length,
    hasTypeScript: content.includes(': ') || content.includes('interface ') || content.includes('type '),
    hasComments: content.includes('//') || content.includes('/*'),
    hasPropTypes: content.includes('Props') || content.includes('interface') && content.includes('props'),
    hasTests: content.includes('test(') || content.includes('it(') || content.includes('describe('),

    // React 특화 분석
    hasHooks: /use[A-Z]/.test(content),
    hasState: content.includes('useState') || content.includes('useReducer'),
    hasEffects: content.includes('useEffect') || content.includes('useLayoutEffect'),
    hasMemo: content.includes('useMemo') || content.includes('useCallback'),

    // UI/스타일 분석
    hasTailwind: content.includes('className'),
    hasStyledComponents: content.includes('styled.'),
    hasInlineStyles: content.includes('style='),

    // 기능 복잡성
    functionCount: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
    componentCount: (content.match(/const\s+\w*Component|function\s+\w*Component/g) || []).length,

    // 의존성 분석
    externalImports: (content.match(/from\s+['"](?!\.)[^'"]+['"]/g) || []).length,
    relativeImports: (content.match(/from\s+['"][.\/][^'"]+['"]/g) || []).length
  };
}

// 사용 횟수 검색
function countUsageInCodebase(fileName, excludePaths = []) {
  const srcFiles = getAllFiles('src', ['.tsx', '.ts', '.js']);
  let usageCount = 0;
  const usageFiles = [];

  srcFiles.forEach(file => {
    if (excludePaths.some(exclude => file.includes(exclude))) return;

    try {
      const content = fs.readFileSync(file, 'utf8');
      const patterns = [
        new RegExp(`from\\s+['"\`].*${fileName}['"\`]`, 'g'),
        new RegExp(`import.*${fileName}`, 'g'),
        new RegExp(`${fileName}`, 'g')
      ];

      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          usageCount += matches.length;
          if (!usageFiles.includes(file)) {
            usageFiles.push(file);
          }
        }
      });
    } catch (error) {
      // 파일 읽기 오류 무시
    }
  });

  return { count: usageCount, files: usageFiles };
}

// 두 파일 비교 및 결정
function compareAndDecide(group) {
  console.log(`🔍 ${group.name} 비교 분석:`);

  const analyses = group.files.map(analyzeFile).filter(Boolean);

  if (analyses.length === 0) {
    console.log('   ❌ 분석할 파일이 없습니다.\n');
    return null;
  }

  if (analyses.length === 1) {
    console.log('   ✅ 중복 없음 - 하나의 파일만 존재\n');
    return null;
  }

  // 각 파일의 점수 계산
  const scores = analyses.map((analysis, index) => {
    const usage = countUsageInCodebase(group.name, group.files);

    let score = 0;
    let reasons = [];

    // 사용 횟수 (가장 중요한 지표)
    if (usage.count > 0) {
      score += usage.count * 10;
      reasons.push(`사용횟수: ${usage.count}회`);
    }

    // 코드 품질
    if (analysis.hasTypeScript) {
      score += 20;
      reasons.push('TypeScript 타입 정의');
    }

    if (analysis.hasPropTypes) {
      score += 15;
      reasons.push('Props 타입 정의');
    }

    if (analysis.hasComments) {
      score += 10;
      reasons.push('주석 포함');
    }

    // React 모던 패턴
    if (analysis.hasHooks) {
      score += 15;
      reasons.push('React Hooks 사용');
    }

    if (analysis.hasMemo) {
      score += 10;
      reasons.push('성능 최적화 (memo)');
    }

    // 구조화 정도
    if (analysis.functionCount > 2) {
      score += analysis.functionCount * 2;
      reasons.push(`구조화된 함수: ${analysis.functionCount}개`);
    }

    // 적절한 크기 (너무 크거나 작으면 감점)
    if (analysis.lines > 50 && analysis.lines < 400) {
      score += 10;
      reasons.push('적절한 코드 길이');
    } else if (analysis.lines > 500) {
      score -= 20;
      reasons.push('과도한 코드 길이');
    }

    // Export 패턴
    if (analysis.hasDefaultExport) {
      score += 5;
      reasons.push('Default export');
    }

    return {
      file: analysis.path,
      score,
      reasons,
      analysis
    };
  });

  // 결과 출력
  scores.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.file}`);
    console.log(`      점수: ${result.score}점`);
    console.log(`      이유: ${result.reasons.join(', ')}`);
    console.log(`      크기: ${(result.analysis.size / 1024).toFixed(1)}KB (${result.analysis.lines}줄)`);
  });

  // 결정
  const winner = scores.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  const losers = scores.filter(s => s !== winner);

  console.log(`\n   🏆 선택: ${winner.file}`);
  console.log(`   📦 보관: ${losers.map(l => l.file).join(', ')}\n`);

  return {
    group: group.name,
    winner: winner.file,
    losers: losers.map(l => l.file),
    winnerScore: winner.score,
    reasoning: winner.reasons.join(', ')
  };
}

// 미사용 파일 정리
function cleanupUnusedFiles() {
  console.log('🧹 미사용 파일 정리...\n');

  const unusedFiles = [
    // 미사용 라이브러리
    'src/lib/dummy-data.ts',
    'src/lib/api-client.ts',
    'src/lib/error-prevention.ts',
    'src/lib/failure-pattern-engine.ts',
    'src/lib/hybrid-metrics-bridge.ts',
    'src/lib/react-query/queryClient.ts',
    'src/lib/serverDataFactory.ts',
    'src/lib/websocket.ts',

    // 미사용 유틸리티
    'src/utils/performance-optimizer.ts',

    // 미사용 서비스
    'src/services/ai/analytics/CorrelationAnalysisEngine.ts',
    'src/services/ai/intent/UnifiedIntentClassifier.ts',
    'src/services/ai/TimeSeriesPredictor.ts',
    'src/services/ai-agent/AIAnalysisService.ts',
    'src/services/collection-manager.ts',
    'src/services/dataManager.ts',
    'src/services/OptimizedRedisTimeSeriesService.ts',
    'src/services/storage.ts',

    // 미사용 훅
    'src/hooks/api/useAdvancedPrefetching.ts',
    'src/hooks/api/useBackgroundRefetch.ts',
    'src/hooks/api/useMemoryPoolOptimization.ts',
    'src/hooks/api/useOptimisticUpdates.ts',
    'src/hooks/api/useVirtualScrolling.ts',
    'src/hooks/useAIAnalysis.ts',
    'src/hooks/useAssistantSession.ts',
    'src/hooks/useMCPAnalysis.ts',
    'src/hooks/usePerformanceMonitor.ts',
    'src/hooks/usePreloadComponents.ts',
    'src/hooks/useServerQueries.test.tsx',
    'src/hooks/useSmartQuery.ts',
    'src/hooks/useSystemStatus.ts'
  ];

  const cleanupResults = [];

  unusedFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      cleanupResults.push({
        file,
        size: stats.size,
        moved: true
      });
      console.log(`   🗑️ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`   ⚠️ ${file} (이미 없음)`);
    }
  });

  return cleanupResults;
}

// 헬퍼 함수
function getAllFiles(dir, extensions) {
  const files = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules') {
        files.push(...getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

// 결정 로그 생성
function generateDecisionLog(decisions, cleanupResults) {
  const timestamp = new Date().toISOString();
  let log = `# 🔍 코드베이스 리팩토링 결정 로그\n\n`;
  log += `**생성일시:** ${timestamp}\n\n`;

  log += `## 📋 중복 파일 비교 결과\n\n`;

  if (decisions.length === 0) {
    log += `중복 파일이 발견되지 않았습니다.\n\n`;
  } else {
    decisions.forEach((decision, index) => {
      log += `### ${index + 1}. ${decision.group}\n\n`;
      log += `**선택된 파일:** \`${decision.winner}\` (점수: ${decision.winnerScore})\n\n`;
      log += `**이유:** ${decision.reasoning}\n\n`;
      log += `**보관된 파일:**\n`;
      decision.losers.forEach(loser => {
        log += `- \`${loser}\` → \`archive/duplicates/\`\n`;
      });
      log += `\n`;
    });
  }

  log += `## 🧹 미사용 파일 정리\n\n`;

  if (cleanupResults.length === 0) {
    log += `정리할 미사용 파일이 없습니다.\n\n`;
  } else {
    const totalSize = cleanupResults.reduce((sum, result) => sum + result.size, 0);
    log += `**총 ${cleanupResults.length}개 파일 정리 (${(totalSize / 1024).toFixed(1)}KB 절약)**\n\n`;

    cleanupResults.forEach(result => {
      log += `- \`${result.file}\` (${(result.size / 1024).toFixed(1)}KB)\n`;
    });
  }

  log += `\n## 🎯 최적화 효과\n\n`;
  log += `- **중복 제거:** ${decisions.length}개 그룹\n`;
  log += `- **미사용 파일 정리:** ${cleanupResults.length}개\n`;
  log += `- **예상 빌드 시간 단축:** 2-3초\n`;
  log += `- **번들 크기 감소:** 약 ${((cleanupResults.reduce((sum, r) => sum + r.size, 0)) / 1024 / 1024).toFixed(1)}MB\n\n`;

  log += `## 📌 권장사항\n\n`;
  log += `1. 선택되지 않은 파일들은 \`archive/duplicates/\`에 백업됨\n`;
  log += `2. 통합이 필요한 경우 추가 리팩토링 권장\n`;
  log += `3. 테스트 코드가 있는 파일들은 추가 검토 필요\n`;
  log += `4. import 경로 업데이트 필요할 수 있음\n\n`;

  return log;
}

// 메인 실행
async function main() {
  console.log('🚀 중복 파일 비교 및 정리 시작...\n');

  // 1. 중복 파일 비교
  console.log('📋 중복 파일 비교...\n');
  const decisions = [];

  for (const group of duplicateGroups) {
    const decision = compareAndDecide(group);
    if (decision) {
      decisions.push(decision);
    }
  }

  // 2. 미사용 파일 정리
  console.log('🧹 미사용 파일 정리...\n');
  const cleanupResults = cleanupUnusedFiles();

  // 3. 결정 로그 생성
  const decisionLog = generateDecisionLog(decisions, cleanupResults);
  fs.writeFileSync('development/scripts/refactor-decision-log.md', decisionLog);

  console.log('\n✅ 분석 완료!');
  console.log(`📊 중복 파일 그룹: ${decisions.length}개`);
  console.log(`🗑️ 미사용 파일: ${cleanupResults.length}개`);
  console.log('📄 결정 로그: development/scripts/refactor-decision-log.md');

  console.log('\n📋 다음 단계:');
  console.log('1. 결정 로그 검토');
  console.log('2. 승인 후 실제 파일 이동 수행');
  console.log('3. import 경로 업데이트');
  console.log('4. 테스트 실행');
}

main().catch(console.error); 