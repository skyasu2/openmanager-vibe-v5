#!/usr/bin/env node

/**
 * 🔧 남은 TypeScript 오류 수정
 *
 * GCP 서비스 제거로 인한 나머지 오류들을 자동으로 수정
 */

const fs = require('fs');
const path = require('path');

// 수정할 파일들과 수정 내용
const fixes = [
  // servers-optimized/route.ts import 제거
  {
    file: 'src/app/api/servers-optimized/route.ts',
    fix: content => {
      return content.replace(
        /const { GCPRealDataService } = await import\('@\/services\/gcp\/GCPRealDataService'\);/g,
        '// GCPRealDataService import removed'
      );
    },
  },

  // unified-query/route.ts totalServers 수정
  {
    file: 'src/app/api/ai/unified-query/route.ts',
    fix: content => {
      return content.replace(
        'serverCount: serverData.totalServers,',
        'serverCount: serverData.data?.length || 0,'
      );
    },
  },

  // servers/all/route.ts gcpDataService 수정
  {
    file: 'src/app/api/servers/all/route.ts',
    fix: content => {
      return content
        .replace(
          /const gcpDataService = [^;]+;/g,
          '// const gcpDataService removed'
        )
        .replace(
          /const servers = await gcpDataService\.[^;]+;/g,
          'const servers: any[] = []; // gcpDataService removed'
        );
    },
  },

  // servers/realtime/route.ts GCPRealDataService 제거
  {
    file: 'src/app/api/servers/realtime/route.ts',
    fix: content => {
      return content
        .replace(
          /const gcpService = GCPRealDataService\.getInstance\(\);/g,
          '// const gcpService removed'
        )
        .replace(
          /const gcpService = await GCPRealDataService\.getInstance\(\);/g,
          '// const gcpService removed'
        )
        .replace(/\.map\(\(response\)/g, '.map((response: any)')
        .replace(
          /import { GCPRealDataService } from[^;]+;/g,
          '// GCPRealDataService import removed'
        );
    },
  },

  // system/sync-data/route.ts 변수 수정
  {
    file: 'src/app/api/system/sync-data/route.ts',
    fix: content => {
      return content
        .replace(
          /const supabaseTime = Date\.now\(\) - supabaseStart;/g,
          'const supabaseTime = 0; // supabaseStart removed'
        )
        .replace(
          /const validationTime = Date\.now\(\) - validationStart;/g,
          'const validationTime = 0; // validationStart removed'
        );
    },
  },

  // UnifiedProfileButton.tsx aiToggle 수정
  {
    file: 'src/components/unified-profile/UnifiedProfileButton.tsx',
    fix: content => {
      return content
        .replace(/setAiToggle\(/g, '// setAiToggle(')
        .replace(/className=\{`\$\{aiToggle/g, 'className={`${false');
    },
  },

  // MCPEngine.ts GCPRealDataService 제거
  {
    file: 'src/core/ai/engines/MCPEngine.ts',
    fix: content => {
      return content
        .replace(
          /const gcpService = GCPRealDataService\.getInstance\(\);/g,
          '// const gcpService removed'
        )
        .replace(
          /const serverData = await GCPRealDataService\.getInstance\(\)\.[^;]+;/g,
          'const serverData = { data: [] }; // GCPRealDataService removed'
        )
        .replace(
          /GCPRealDataService\.getInstance\(\)/g,
          '{ getRealServerMetrics: async () => ({ data: [] }) }'
        )
        .replace(
          /import { GCPRealDataService } from[^;]+;/g,
          '// GCPRealDataService import removed'
        );
    },
  },

  // EnhancedDataAnalyzer.ts 수정
  {
    file: 'src/services/ai/EnhancedDataAnalyzer.ts',
    fix: content => {
      return content
        .replace(
          /const gcpService = GCPRealDataService\.getInstance\(\);/g,
          '// const gcpService removed'
        )
        .replace(
          /const gcpDataService = GCPRealDataService\.getInstance\(\);/g,
          '// const gcpDataService removed'
        )
        .replace(
          /GCPRealDataService\.getInstance\(\)/g,
          '{ getRealServerMetrics: async () => ({ data: [] }) }'
        )
        .replace(/\.map\(\(response\)/g, '.map((response: any)')
        .replace(/\.filter\(\(r\)/g, '.filter((r: any)')
        .replace(
          /import { GCPRealDataService } from[^;]+;/g,
          '// GCPRealDataService import removed'
        );
    },
  },

  // TaskOrchestrator.ts 수정
  {
    file: 'src/services/ai/TaskOrchestrator.ts',
    fix: content => {
      return content
        .replace(
          /const gcpService = GCPRealDataService\.getInstance\(\);/g,
          '// const gcpService removed'
        )
        .replace(
          /import { GCPRealDataService } from[^;]+;/g,
          '// GCPRealDataService import removed'
        );
    },
  },

  // ServerDataScheduler.ts 수정
  {
    file: 'src/services/background/ServerDataScheduler.ts',
    fix: content => {
      return content
        .replace(
          /const gcpService = GCPRealDataService\.getInstance\(\);/g,
          '// const gcpService removed'
        )
        .replace(
          /import { GCPRealDataService } from[^;]+;/g,
          '// GCPRealDataService import removed'
        );
    },
  },

  // ServerDataCache.ts generator 수정
  {
    file: 'src/services/cache/ServerDataCache.ts',
    fix: content => {
      return content
        .replace(/const generator = [^;]+;/g, '// const generator removed')
        .replace(
          /const data = await generator\.[^;]+;/g,
          'const data = { data: [] }; // generator removed'
        )
        .replace(
          /const mockData = await generator\.generateMockData\(\)\.map\(\(response\)/g,
          'const mockData = [].map((response: any)'
        );
    },
  },

  // UnifiedDataBroker.ts 수정
  {
    file: 'src/services/data-collection/UnifiedDataBroker.ts',
    fix: content => {
      return content
        .replace(
          /const gcpDataService = [^;]+;/g,
          '// const gcpDataService removed'
        )
        .replace(
          /const response = await gcpDataService\.[^;]+;/g,
          'const response = { data: [] }; // gcpDataService removed'
        )
        .replace(
          /await generator\.generateMockData\(\)\.map\(\(response\)/g,
          '[].map((response: any)'
        )
        .replace(
          /generator\.generateMockData\(\)\.filter\(\(r\)/g,
          '[].filter((r: any)'
        )
        .replace(
          /generator\.generateMockData\(\)\.forEach\(\(r\)/g,
          '[].forEach((r: any)'
        )
        .replace(
          /generator\.generateMockData\(\)\.map\(\(r\)/g,
          '[].map((r: any)'
        );
    },
  },

  // EnrichedMetricsGenerator.ts BaselineStorageService 제거
  {
    file: 'src/services/metrics/EnrichedMetricsGenerator.ts',
    fix: content => {
      return content
        .replace(
          /const storageService = BaselineStorageService\.getInstance\(\);/g,
          '// const storageService removed'
        )
        .replace(
          /import { BaselineStorageService } from[^;]+;/g,
          '// BaselineStorageService import removed'
        );
    },
  },

  // BaselineContinuityManager.ts 수정
  {
    file: 'src/services/vm/BaselineContinuityManager.ts',
    fix: content => {
      return content
        .replace(
          /const storageService = BaselineStorageService\.getInstance\(\);/g,
          '// const storageService removed'
        )
        .replace(
          /import { BaselineStorageService } from[^;]+;/g,
          '// BaselineStorageService import removed'
        );
    },
  },

  // VMPersistentDataManager.ts 수정
  {
    file: 'src/services/vm/VMPersistentDataManager.ts',
    fix: content => {
      return content
        .replace(
          /const storageService = BaselineStorageService\.getInstance\(\);/g,
          '// const storageService removed'
        )
        .replace(
          /import { BaselineStorageService } from[^;]+;/g,
          '// BaselineStorageService import removed'
        );
    },
  },

  // WebSocketManager.ts 수정
  {
    file: 'src/services/websocket/WebSocketManager.ts',
    fix: content => {
      return content
        .replace(
          /const gcpService = GCPRealDataService\.getInstance\(\);/g,
          '// const gcpService removed'
        )
        .replace(/\.map\(\(response\)/g, '.map((response: any)')
        .replace(
          /import { GCPRealDataService } from[^;]+;/g,
          '// GCPRealDataService import removed'
        );
    },
  },

  // server-metrics-adapter.ts GCPServerMetrics 제거
  {
    file: 'src/utils/server-metrics-adapter.ts',
    fix: content => {
      return content
        .replace(/: GCPServerMetrics/g, ': any // GCPServerMetrics removed')
        .replace(/GCPServerMetrics\[\]/g, 'any[] // GCPServerMetrics removed')
        .replace(
          /import { GCPServerMetrics } from[^;]+;/g,
          '// GCPServerMetrics import removed'
        );
    },
  },
];

console.log('🔧 남은 TypeScript 오류 수정 시작...\n');

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
