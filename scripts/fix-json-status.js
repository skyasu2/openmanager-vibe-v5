const fs = require('fs');
const path = require('path');

/**
 * 24시간 JSON 파일의 "healthy" 상태를 "online"으로 일괄 변경
 * TypeScript 타입과의 일관성 확보
 */

const metricsDir = path.join(
  process.cwd(),
  'public',
  'server-scenarios',
  'hourly-metrics'
);
const hourFiles = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, '0')}.json`
);

let totalChanges = 0;
let filesProcessed = 0;

console.log('🔄 JSON 파일 타입 일관성 작업 시작...\n');

hourFiles.forEach((filename) => {
  const filePath = path.join(metricsDir, filename);

  try {
    // 파일 읽기
    const content = fs.readFileSync(filePath, 'utf8');

    // 변경 전 "healthy" 개수 확인
    const healthyCount = (content.match(/"status":\s*"healthy"/g) || []).length;

    if (healthyCount === 0) {
      console.log(`⏭️  ${filename}: 변경 필요 없음`);
      filesProcessed++;
      return;
    }

    // "healthy" -> "online" 변경
    const updatedContent = content.replace(
      /"status":\s*"healthy"/g,
      '"status": "online"'
    );

    // 파일 쓰기
    fs.writeFileSync(filePath, updatedContent, 'utf8');

    totalChanges += healthyCount;
    filesProcessed++;

    console.log(`✅ ${filename}: ${healthyCount}개 변경 완료`);
  } catch (error) {
    console.error(`❌ ${filename}: 오류 발생 -`, error.message);
  }
});

console.log('\n📊 작업 완료 요약:');
console.log(`   - 처리된 파일: ${filesProcessed}/24`);
console.log(`   - 총 변경 수: ${totalChanges}개`);
console.log('   - 타입 일관성: healthy → online\n');
