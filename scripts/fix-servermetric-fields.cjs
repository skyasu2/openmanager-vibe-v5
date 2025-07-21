#!/usr/bin/env node

/**
 * 🔧 ServerMetric 필드 이름 수정
 *
 * response_time -> responseTime
 * active_connections -> activeConnections
 */

const fs = require('fs');
const path = require('path');

const fixes = [
  // RedisMetricsManager.ts
  {
    file: 'src/services/redis/RedisMetricsManager.ts',
    fix: content => {
      content = content.replace(
        /m\.active_connections/g,
        'm.activeConnections'
      );
      content = content.replace(/m\.response_time/g, 'm.responseTime');
      return content;
    },
  },

  // SupabaseTimeSeriesManager.ts
  {
    file: 'src/services/supabase/SupabaseTimeSeriesManager.ts',
    fix: content => {
      content = content.replace(
        /metric\.active_connections/g,
        'metric.activeConnections'
      );
      content = content.replace(
        /metric\.response_time/g,
        'metric.responseTime'
      );

      // generateMockTimeSeries 함수에서도 수정
      content = content.replace(/response_time:/g, 'responseTime:');
      content = content.replace(/active_connections:/g, 'activeConnections:');

      return content;
    },
  },
];

console.log('🔧 ServerMetric 필드 이름 수정 시작...\n');

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
