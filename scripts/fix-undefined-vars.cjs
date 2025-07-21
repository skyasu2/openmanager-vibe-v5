#!/usr/bin/env node

/**
 * 🔧 정의되지 않은 변수 수정
 *
 * response, servers, gcpResponse 등 정의되지 않은 변수들을 수정
 */

const fs = require('fs');
const path = require('path');

// 수정할 파일 목록
const fixes = [
  {
    file: 'src/app/api/ai/unified-query/route.ts',
    fix: content => {
      return content.replace(
        /\/\/ const serverData = await gcpService\.getRealServerMetrics\(\); \/\/ GCP service removed\s*\n\s*\/\/ 간단한 AI 응답 생성/,
        `// const serverData = await gcpService.getRealServerMetrics(); // GCP service removed
      const serverData = { data: [] }; // 임시 빈 데이터

      // 간단한 AI 응답 생성`
      );
    },
  },
  {
    file: 'src/app/api/servers-optimized/route.ts',
    fixes: [
      {
        find: /if \(gcpResponse\.success && !gcpResponse\.isErrorState\) \{/g,
        replace:
          '// if (gcpResponse.success && !gcpResponse.isErrorState) { // GCP response removed',
      },
      {
        find: /data: gcpResponse\.data,/g,
        replace: 'data: [], // gcpResponse.data removed',
      },
      {
        find: /data: response\.data,/g,
        replace: 'data: [], // response.data removed',
      },
    ],
  },
  {
    file: 'src/app/api/servers/route.ts',
    fixes: [
      {
        find: /if \(gcpResponse\.success && !gcpResponse\.isErrorState\) \{/g,
        replace:
          '// if (gcpResponse.success && !gcpResponse.isErrorState) { // GCP response removed',
      },
      {
        find: /data: gcpResponse\.data,/g,
        replace: 'data: [], // gcpResponse.data removed',
      },
      {
        find: /const servers = response\.data;/g,
        replace: 'const servers: any[] = []; // response.data removed',
      },
    ],
  },
];

console.log('🔧 정의되지 않은 변수 수정 시작...\n');

fixes.forEach(({ file, fix, fixes: multipleFixes }) => {
  const fullPath = path.join(process.cwd(), file);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  파일 없음: ${file}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  if (fix) {
    const newContent = fix(content);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  if (multipleFixes) {
    multipleFixes.forEach(({ find, replace }) => {
      if (content.match(find)) {
        content = content.replace(find, replace);
        modified = true;
      }
    });
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 수정됨: ${file}`);
  }
});

console.log('\n✅ 변수 수정 완료!');
