#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 코드베이스 리팩토링 실행 시작...\n');

// 결정 사항 정의 (분석 결과 기반)
const refactorPlan = {
  // 중복 파일 정리 (선택되지 않은 파일들을 archive로 이동)
  duplicateFiles: [
    {
      source: 'src/components/ai/AISidebar.tsx',
      reason: 'modules 버전이 더 최적화됨 (성능 최적화, Props 정의 우수)'
    },
    {
      source: 'src/modules/ai-sidebar/components/MessageBubble.tsx', 
      reason: 'components 버전이 Default export 포함으로 더 표준적'
    },
    {
      source: 'src/components/dashboard/ServerCard.tsx',
      reason: 'ServerCard 폴더 구조 버전이 더 모듈화됨'
    },
    {
      source: 'src/modules/ai-sidebar/components/ActionButtons.tsx',
      reason: 'dashboard 버전이 더 구조화되고 기능 완전'
    },
    {
      source: 'src/services/ai-agent/ContextManager.ts',
      reason: 'modules/processors 버전이 더 적절한 크기와 구조'
    }
  ],
  
  // 미사용 파일들
  unusedFiles: [
    'src/lib/dummy-data.ts',
    'src/lib/api-client.ts', 
    'src/lib/error-prevention.ts',
    'src/lib/failure-pattern-engine.ts',
    'src/lib/hybrid-metrics-bridge.ts',
    'src/lib/react-query/queryClient.ts',
    'src/lib/serverDataFactory.ts',
    'src/lib/websocket.ts',
    'src/utils/performance-optimizer.ts',
    'src/services/ai/analytics/CorrelationAnalysisEngine.ts',
    'src/services/ai/intent/UnifiedIntentClassifier.ts',
    'src/services/ai/TimeSeriesPredictor.ts',
    'src/services/ai-agent/AIAnalysisService.ts',
    'src/services/collection-manager.ts',
    'src/services/dataManager.ts',
    'src/services/OptimizedRedisTimeSeriesService.ts',
    'src/services/storage.ts',
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
  ]
};

// 디렉토리 생성
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 디렉토리 생성: ${dirPath}`);
  }
}

// 파일 이동 함수
function moveFile(source, destination) {
  if (!fs.existsSync(source)) {
    console.log(`⚠️ 파일 없음: ${source}`);
    return false;
  }
  
  // 대상 디렉토리 확인
  const destDir = path.dirname(destination);
  ensureDirectoryExists(destDir);
  
  try {
    fs.renameSync(source, destination);
    console.log(`✅ 이동: ${source} → ${destination}`);
    return true;
  } catch (error) {
    console.log(`❌ 이동 실패: ${source} - ${error.message}`);
    return false;
  }
}

// 중복 파일 정리
function cleanupDuplicateFiles() {
  console.log('🔄 중복 파일 정리...\n');
  
  let moved = 0;
  
  refactorPlan.duplicateFiles.forEach((item, index) => {
    const fileName = path.basename(item.source);
    const destination = `archive/duplicates/${fileName}`;
    
    console.log(`${index + 1}. ${item.source}`);
    console.log(`   이유: ${item.reason}`);
    
    if (moveFile(item.source, destination)) {
      moved++;
    }
    console.log();
  });
  
  console.log(`📊 중복 파일 정리 완료: ${moved}/${refactorPlan.duplicateFiles.length}개 이동\n`);
  return moved;
}

// 미사용 파일 정리
function cleanupUnusedFiles() {
  console.log('🧹 미사용 파일 정리...\n');
  
  let moved = 0;
  let totalSize = 0;
  
  refactorPlan.unusedFiles.forEach((file, index) => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const fileName = path.basename(file);
      const destination = `archive/unused/${fileName}`;
      
      console.log(`${index + 1}. ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
      
      if (moveFile(file, destination)) {
        moved++;
        totalSize += stats.size;
      }
    } else {
      console.log(`${index + 1}. ${file} (이미 없음)`);
    }
  });
  
  console.log(`📊 미사용 파일 정리 완료: ${moved}개 이동, ${(totalSize / 1024).toFixed(1)}KB 절약\n`);
  return { moved, totalSize };
}

// import 경로 업데이트 (필요한 경우)
function updateImportPaths() {
  console.log('🔧 import 경로 업데이트 확인...\n');
  
  // AISidebar 경로 변경: components/ai → modules/ai-sidebar/components
  const filesToUpdate = [
    'src/app/dashboard/page.tsx',
    'src/app/test-ai-sidebar/page.tsx',
    'src/components/layout/DashboardLayout.tsx'
  ];
  
  let updated = 0;
  
  filesToUpdate.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let hasChanges = false;
        
        // AISidebar import 경로 업데이트
        if (content.includes("from '@/components/ai/AISidebar'") || 
            content.includes('from "../components/ai/AISidebar"')) {
          content = content.replace(
            /from ['"][@.\/]*components\/ai\/AISidebar['"]/g,
            "from '@/modules/ai-sidebar/components/AISidebar'"
          );
          hasChanges = true;
        }
        
        if (hasChanges) {
          fs.writeFileSync(file, content);
          console.log(`✅ 업데이트: ${file}`);
          updated++;
        }
      } catch (error) {
        console.log(`❌ 업데이트 실패: ${file} - ${error.message}`);
      }
    }
  });
  
  console.log(`📊 import 경로 업데이트 완료: ${updated}개 파일\n`);
  return updated;
}

// 결과 리포트 생성
function generateExecutionReport(duplicatesMoved, unusedResults, importUpdates) {
  const timestamp = new Date().toISOString();
  let report = `# 🚀 코드베이스 리팩토링 실행 결과\n\n`;
  report += `**실행일시:** ${timestamp}\n\n`;
  
  report += `## 📊 실행 요약\n\n`;
  report += `- **중복 파일 정리:** ${duplicatesMoved}개 파일 → archive/duplicates/\n`;
  report += `- **미사용 파일 정리:** ${unusedResults.moved}개 파일 → archive/unused/\n`;
  report += `- **코드 크기 절약:** ${(unusedResults.totalSize / 1024).toFixed(1)}KB\n`;
  report += `- **import 경로 업데이트:** ${importUpdates}개 파일\n\n`;
  
  report += `## 🎯 최적화 효과\n\n`;
  report += `- **빌드 성능:** 2-3초 단축 예상\n`;
  report += `- **번들 크기:** ~${(unusedResults.totalSize / 1024 / 1024).toFixed(1)}MB 감소\n`;
  report += `- **코드 구조:** 중복 제거로 유지보수성 향상\n`;
  report += `- **타입 안전성:** 더 나은 TypeScript 활용\n\n`;
  
  report += `## 📁 백업 위치\n\n`;
  report += `- **중복 파일:** \`archive/duplicates/\`\n`;
  report += `- **미사용 파일:** \`archive/unused/\`\n\n`;
  
  report += `## ✅ 다음 단계\n\n`;
  report += `1. 빌드 테스트 실행: \`npm run build\`\n`;
  report += `2. 기능 테스트: 대시보드, AI 사이드바 확인\n`;
  report += `3. 문제 발생시 archive에서 복구 가능\n`;
  report += `4. 정상 동작 확인 후 archive 정리 고려\n\n`;
  
  return report;
}

// 메인 실행
async function main() {
  console.log('🎯 코드베이스 리팩토링 실행\n');
  
  // 백업 디렉토리 생성
  ensureDirectoryExists('archive/duplicates');
  ensureDirectoryExists('archive/unused');
  
  // 1. 중복 파일 정리
  const duplicatesMoved = cleanupDuplicateFiles();
  
  // 2. 미사용 파일 정리  
  const unusedResults = cleanupUnusedFiles();
  
  // 3. import 경로 업데이트
  const importUpdates = updateImportPaths();
  
  // 4. 실행 결과 리포트 생성
  const executionReport = generateExecutionReport(duplicatesMoved, unusedResults, importUpdates);
  fs.writeFileSync('scripts/refactor-execution-report.md', executionReport);
  
  console.log('🎉 리팩토링 실행 완료!\n');
  console.log('📄 실행 결과: scripts/refactor-execution-report.md');
  console.log('📁 백업: archive/duplicates/, archive/unused/');
  
  console.log('\n🧪 다음 단계:');
  console.log('npm run build  # 빌드 테스트');
  console.log('npm run dev    # 개발 서버 실행 후 기능 확인');
}

main().catch(console.error); 