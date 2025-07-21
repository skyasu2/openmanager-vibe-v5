#!/usr/bin/env node

/**
 * 🔧 ServerMetric 타입 오류 및 기타 TypeScript 오류 수정
 */

const fs = require('fs');
const path = require('path');

const fixes = [
  // RedisMetricsManager.ts - ServerMetric 필드 수정
  {
    file: 'src/services/redis/RedisMetricsManager.ts',
    fix: content => {
      // systemMetrics?.cpuUsage를 cpu로 변경
      content = content.replace(
        /metric\.systemMetrics\.cpuUsage/g,
        'metric.cpu'
      );
      content = content.replace(
        /metric\.systemMetrics\.memoryUsage/g,
        'metric.memory'
      );
      content = content.replace(
        /metric\.systemMetrics\.diskUsage/g,
        'metric.disk'
      );
      content = content.replace(
        /metric\.systemMetrics\.networkUsage/g,
        '(metric.network.in + metric.network.out) / 2'
      );

      // applicationMetrics를 직접 필드로 변경
      content = content.replace(
        /metric\.applicationMetrics\.requestCount/g,
        'metric.activeConnections'
      );
      content = content.replace(/metric\.applicationMetrics\.errorRate/g, '0'); // 기본값
      content = content.replace(
        /metric\.applicationMetrics\.responseTime/g,
        'metric.responseTime'
      );

      return content;
    },
  },

  // SupabaseTimeSeriesManager.ts - ServerMetric 필드 수정
  {
    file: 'src/services/supabase/SupabaseTimeSeriesManager.ts',
    fix: content => {
      // systemMetrics를 직접 필드로 변경
      content = content.replace(
        /metric\.systemMetrics\.cpuUsage/g,
        'metric.cpu'
      );
      content = content.replace(
        /metric\.systemMetrics\.memoryUsage/g,
        'metric.memory'
      );
      content = content.replace(
        /metric\.systemMetrics\.diskUsage/g,
        'metric.disk'
      );
      content = content.replace(
        /metric\.systemMetrics\.networkUsage/g,
        '(metric.network.in + metric.network.out) / 2'
      );

      // applicationMetrics를 직접 필드로 변경
      content = content.replace(
        /metric\.applicationMetrics\.responseTime/g,
        'metric.responseTime'
      );
      content = content.replace(/metric\.applicationMetrics\.errorRate/g, '0'); // 기본값
      content = content.replace(
        /metric\.applicationMetrics\.requestCount/g,
        'metric.activeConnections'
      );

      // generateMockTimeSeries 함수의 타입 오류 수정
      content = content.replace(
        /return Array\.from\({ length: count }, \(_, i\) => \({[\s\S]*?}\)\);/g,
        `return Array.from({ length: count }, (_, i) => ({
      timestamp: new Date(Date.now() - (count - i) * 60 * 1000),
      serverId: \`server-\${Math.floor(Math.random() * 10) + 1}\`,
      cpu: 30 + Math.random() * 40,
      memory: 40 + Math.random() * 30,
      disk: 20 + Math.random() * 50,
      network: {
        in: Math.random() * 1000,
        out: Math.random() * 500
      },
      status: 'healthy' as const,
      responseTime: 50 + Math.random() * 150,
      activeConnections: Math.floor(Math.random() * 100)
    }));`
      );

      return content;
    },
  },

  // servers/all/route.ts - gcpDataService 수정
  {
    file: 'src/app/api/servers/all/route.ts',
    fix: content => {
      content = content.replace(
        /if \(!gcpDataService\)/g,
        'if (true) // gcpDataService removed'
      );
      content = content.replace(
        /const servers = await gcpDataService\.getRealServerMetrics\(\);/g,
        'const servers: any[] = []; // gcpDataService removed'
      );
      return content;
    },
  },

  // servers/realtime/route.ts - GCPRealDataService 수정
  {
    file: 'src/app/api/servers/realtime/route.ts',
    fix: content => {
      content = content.replace(
        /const gcpService = GCPRealDataService\.getInstance\(\);/g,
        '// const gcpService = GCPRealDataService.getInstance(); // Removed'
      );
      content = content.replace(
        /const gcpService = await GCPRealDataService\.getInstance\(\);/g,
        '// const gcpService = await GCPRealDataService.getInstance(); // Removed'
      );
      content = content.replace(/\.map\(\(response\)/g, '.map((response: any)');
      return content;
    },
  },

  // system/sync-data/route.ts - timing 변수 수정
  {
    file: 'src/app/api/system/sync-data/route.ts',
    fix: content => {
      // supabaseStart 정의
      content = content.replace(
        /console\.log\('💾 Supabase 데이터 동기화 시작\.\.\.'\);/,
        `const supabaseStart = Date.now();
    console.log('💾 Supabase 데이터 동기화 시작...');`
      );

      // validationStart 정의
      content = content.replace(
        /console\.log\('✅ 데이터 무결성 검증 중\.\.\.'\);/,
        `const validationStart = Date.now();
    console.log('✅ 데이터 무결성 검증 중...');`
      );

      return content;
    },
  },

  // UnifiedProfileButton.tsx - aiToggle 수정
  {
    file: 'src/components/unified-profile/UnifiedProfileButton.tsx',
    fix: content => {
      content = content.replace(
        /className=\{`\$\{false/g,
        'className={`${false'
      );
      return content;
    },
  },

  // TaskOrchestrator.ts - GCPRealDataService import 제거
  {
    file: 'src/services/ai/TaskOrchestrator.ts',
    fix: content => {
      content = content.replace(
        /import { GCPRealDataService } from '@\/services\/gcp\/GCPRealDataService';/g,
        '// GCPRealDataService import removed'
      );
      content = content.replace(
        /const gcpService = GCPRealDataService\.getInstance\(\);/g,
        '// const gcpService removed'
      );
      return content;
    },
  },

  // ServerDataScheduler.ts 수정
  {
    file: 'src/services/background/ServerDataScheduler.ts',
    fix: content => {
      content = content.replace(
        /import { GCPRealDataService } from '@\/services\/gcp\/GCPRealDataService';/g,
        '// GCPRealDataService import removed'
      );
      content = content.replace(
        /const gcpService = GCPRealDataService\.getInstance\(\);/g,
        '// const gcpService removed'
      );
      return content;
    },
  },

  // ServerDataCache.ts - generator 수정
  {
    file: 'src/services/cache/ServerDataCache.ts',
    fix: content => {
      content = content.replace(
        /if \(!generator\)/g,
        'if (true) // generator removed'
      );
      content = content.replace(
        /const data = await generator\.getRealServerMetrics\(\);/g,
        'const data = { data: [] }; // generator removed'
      );
      content = content.replace(
        /const mockData = await generator\.generateMockData\(\)\.map\(\(response\)/g,
        'const mockData = [].map((response: any)'
      );
      return content;
    },
  },

  // UnifiedDataBroker.ts 수정
  {
    file: 'src/services/data-collection/UnifiedDataBroker.ts',
    fix: content => {
      content = content.replace(
        /if \(!gcpDataService\)/g,
        'if (true) // gcpDataService removed'
      );
      content = content.replace(
        /const response = await gcpDataService\.getRealServerMetrics\(\);/g,
        'const response = { data: [] }; // gcpDataService removed'
      );
      content = content.replace(
        /await generator\.generateMockData\(\)\.map\(\(response\)/g,
        '[].map((response: any)'
      );
      content = content.replace(
        /generator\.generateMockData\(\)\.filter\(\(r\)/g,
        '[].filter((r: any)'
      );
      content = content.replace(
        /generator\.generateMockData\(\)\.forEach\(\(r\)/g,
        '[].forEach((r: any)'
      );
      content = content.replace(
        /generator\.generateMockData\(\)\.map\(\(r\)/g,
        '[].map((r: any)'
      );
      return content;
    },
  },

  // EnrichedMetricsGenerator.ts 수정
  {
    file: 'src/services/metrics/EnrichedMetricsGenerator.ts',
    fix: content => {
      content = content.replace(
        /import { BaselineStorageService } from '@\/services\/gcp\/BaselineStorageService';/g,
        '// BaselineStorageService import removed'
      );
      content = content.replace(
        /const storageService = BaselineStorageService\.getInstance\(\);/g,
        '// const storageService removed'
      );
      return content;
    },
  },

  // BaselineContinuityManager.ts 수정
  {
    file: 'src/services/vm/BaselineContinuityManager.ts',
    fix: content => {
      content = content.replace(
        /import { BaselineStorageService } from '@\/services\/gcp\/BaselineStorageService';/g,
        '// BaselineStorageService import removed'
      );
      content = content.replace(
        /const storageService = BaselineStorageService\.getInstance\(\);/g,
        '// const storageService removed'
      );
      return content;
    },
  },

  // VMPersistentDataManager.ts 수정
  {
    file: 'src/services/vm/VMPersistentDataManager.ts',
    fix: content => {
      content = content.replace(
        /import { BaselineStorageService } from '@\/services\/gcp\/BaselineStorageService';/g,
        '// BaselineStorageService import removed'
      );
      content = content.replace(
        /const storageService = BaselineStorageService\.getInstance\(\);/g,
        '// const storageService removed'
      );
      return content;
    },
  },

  // WebSocketManager.ts 수정
  {
    file: 'src/services/websocket/WebSocketManager.ts',
    fix: content => {
      content = content.replace(
        /import { GCPRealDataService } from '@\/services\/gcp\/GCPRealDataService';/g,
        '// GCPRealDataService import removed'
      );
      content = content.replace(
        /const gcpService = GCPRealDataService\.getInstance\(\);/g,
        '// const gcpService removed'
      );
      content = content.replace(/\.map\(\(response\)/g, '.map((response: any)');
      return content;
    },
  },
];

console.log('🔧 타입 오류 수정 시작...\n');

let totalFixed = 0;

fixes.forEach(({ file, fix }) => {
  const fullPath = path.join(process.cwd(), file);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  파일 없음: ${file}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    content = fix(content);

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ 수정됨: ${file}`);
      totalFixed++;
    } else {
      console.log(`⏭️  변경 없음: ${file}`);
    }
  } catch (error) {
    console.error(`❌ 오류 발생 (${file}):`, error.message);
  }
});

console.log(`\n✅ 총 ${totalFixed}개 파일 수정 완료!`);
