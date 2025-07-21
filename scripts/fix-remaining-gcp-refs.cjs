#!/usr/bin/env node

/**
 * 🔧 남은 GCP 참조 수정
 *
 * gcpService 변수 참조를 주석 처리합니다.
 */

const fs = require('fs');
const path = require('path');

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
];

console.log('🔧 남은 GCP 참조 수정 시작...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  파일 없음: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // gcpService 변수 참조 주석 처리
  if (content.includes('gcpService')) {
    // gcpService. 로 시작하는 메서드 호출 주석 처리
    content = content.replace(
      /(\s*)([^\/\n]*gcpService\.[^\n;]*;?)/g,
      '$1// $2 // GCP service removed'
    );

    // generator 변수 참조도 주석 처리
    content = content.replace(
      /(\s*)([^\/\n]*generator\.[^\n;]*;?)/g,
      '$1// $2 // GCP generator removed'
    );

    modified = true;
  }

  // 콜백 함수 타입 추가
  content = content.replace(
    /\.then\(response => \{/g,
    '.then((response: any) => {'
  );

  content = content.replace(/\.filter\(s => /g, '.filter((s: any) => ');

  if (modified || content.includes('.then((response: any)')) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 수정됨: ${filePath}`);
  }
});

console.log('\n✅ GCP 참조 수정 완료!');
