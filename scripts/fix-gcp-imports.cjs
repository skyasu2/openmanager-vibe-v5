#!/usr/bin/env node

/**
 * 🔧 GCPRealDataService 및 BaselineStorageService 참조 제거
 *
 * 삭제된 서비스에 대한 import 문을 제거하고
 * FixedDataSystem으로 대체합니다.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 수정할 파일 목록
const filesToFix = [
  'src/app/api/ai-agent/orchestrator/route.ts',
  'src/app/api/ai/auto-report/route.ts',
  'src/app/api/ai/prediction/route.ts',
  'src/app/api/ai/unified-query/route.ts',
  'src/app/api/servers-optimized/route.ts',
  'src/app/api/servers/all/route.ts',
  'src/app/api/servers/next/route.ts',
  'src/app/api/servers/realtime/route.ts',
  'src/app/api/servers/route.ts',
  'src/app/api/system/initialize/route.ts',
  'src/core/ai/engines/MCPEngine.ts',
  'src/services/ai/EnhancedDataAnalyzer.ts',
  'src/services/ai/TaskOrchestrator.ts',
  'src/services/background/ServerDataScheduler.ts',
  'src/services/cache/ServerDataCache.ts',
  'src/services/data-collection/UnifiedDataBroker.ts',
  'src/services/metrics/EnrichedMetricsGenerator.ts',
  'src/services/vm/BaselineContinuityManager.ts',
  'src/services/vm/VMPersistentDataManager.ts',
  'src/services/websocket/WebSocketManager.ts',
  'src/utils/server-metrics-adapter.ts',
];

// BaselineStorageService 관련 추가
const baselineFiles = [
  'src/services/metrics/EnrichedMetricsGenerator.ts',
  'src/services/vm/BaselineContinuityManager.ts',
  'src/services/vm/VMPersistentDataManager.ts',
];

console.log('🔧 GCP 관련 import 수정 시작...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  파일 없음: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // GCPRealDataService import 제거
  if (content.includes("from '@/services/gcp/GCPRealDataService'")) {
    content = content.replace(
      /import\s+\{[^}]*\}\s+from\s+'@\/services\/gcp\/GCPRealDataService';\s*\n?/g,
      '// GCPRealDataService removed - using FixedDataSystem instead\n'
    );
    modified = true;
  }

  // BaselineStorageService import 제거
  if (
    content.includes("from '../gcp/BaselineStorageService'") ||
    content.includes("from '@/services/gcp/BaselineStorageService'")
  ) {
    content = content.replace(
      /import\s+\{[^}]*\}\s+from\s+'[^']*BaselineStorageService';\s*\n?/g,
      '// BaselineStorageService removed - using FixedDataSystem instead\n'
    );
    modified = true;
  }

  // GCPRealDataService 사용 코드 주석 처리
  if (content.includes('GCPRealDataService.getInstance()')) {
    content = content.replace(
      /const\s+\w+\s*=\s*GCPRealDataService\.getInstance\(\);/g,
      '// const gcpService = GCPRealDataService.getInstance(); // Removed'
    );
    modified = true;
  }

  // BaselineStorageService 사용 코드 주석 처리
  if (content.includes('BaselineStorageService.getInstance()')) {
    content = content.replace(
      /const\s+\w+\s*=\s*BaselineStorageService\.getInstance\(\);/g,
      '// const baselineService = BaselineStorageService.getInstance(); // Removed'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 수정됨: ${filePath}`);
  }
});

// 추가 수정 필요 파일들
console.log('\n📋 추가 수정 필요:');
console.log(
  '1. src/app/api/system/sync-data/route.ts - supabaseStart, validationStart 변수'
);
console.log(
  '2. src/components/unified-profile/UnifiedProfileButton.tsx - toggleAI 메서드'
);
console.log('3. src/services/ai/GCPAIDataAdapter.ts - 응답 타입');
console.log('4. ServerMetric 타입 관련 파일들');

console.log('\n✅ Import 수정 완료!');
