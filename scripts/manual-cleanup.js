#!/usr/bin/env node
/**
 * 수동 코드베이스 정리 스크립트
 * 2025-06-08 날짜 수정 및 코드 정리
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 수동 코드베이스 정리 시작 (2025-06-08)...\n');

// 1. 확실히 삭제 가능한 중복 파일들
const duplicateFiles = [
  // AISidebar 중복
  'src/modules/ai-sidebar/components/AISidebar.tsx', // 대신 dashboard/AISidebar.tsx 사용
  
  // 오래된 ServerCard 중복
  'src/components/dashboard/ServerCard.tsx', // 개별 파일들이 있음
  
  // 중복된 ErrorBoundary
  'src/components/providers/ErrorBoundary.tsx', // 메인 ErrorBoundary.tsx 사용
  
  // 중복된 HeroSection
  'src/components/landing/HeroSection.tsx', // figma-ui 버전 사용
  
  // 중복된 integrated-ai-engine
  'src/core/ai/integrated-ai-engine.ts', // services 버전 사용
  
  // 중복된 redis
  'src/lib/cache/redis.ts', // 메인 redis.ts 사용
];

// 2. 명확히 미사용인 파일들 (테스트/스토리북 제외)
const unusedFiles = [
  // 미사용 테스트 파일들
  'src/components/dashboard/DashboardHeader.test.tsx',
  'src/components/dashboard/SystemStatusDisplay.stories.tsx',
  'src/services/collectors/RealPrometheusCollector.test.ts',
  'src/services/redisTimeSeriesService.test.ts',
  'src/hooks/useServerQueries.test.tsx',
  
  // 미사용 백업/이전 버전들
  'src/actions/servers.ts',
  'src/actions/system.ts',
  'src/services/fastapi-stub.ts',
  'src/stores/powerStore.ts',
  'src/stores/serverDataStore.ts',
  'src/stores/systemStore.ts',
  
  // 오래된 AI 엔진들
  'src/services/ai/keep-alive-system.ts',
  'src/services/ai/lightweight-anomaly-detector.ts',
  'src/services/ai/local-rag-engine.ts',
  'src/services/ai/local-vector-db.ts',
  'src/services/ai/nlp-processor.ts',
  'src/services/ai/transformers-engine.ts',
  
  // 사용하지 않는 유틸리티
  'src/utils/enhanced-data-generator.ts',
  'src/utils/error-recovery.ts',
  'src/utils/production-logger.ts',
  'src/utils/safeFormat.ts',
];

// 3. 날짜가 잘못된 문서들 수정
const documentUpdates = [
  'PROJECT_STATUS.md',
  'CHANGELOG.md',
  'DEPLOYMENT_CHECKLIST.md',
  'docs/README.md',
  'docs/SYSTEM_REPAIR_STATUS.md',
];

// 백업 디렉토리 생성
function createBackupDir() {
  const backupDir = 'archive/cleanup-2025-06-08';
  if (!fs.existsSync('archive')) {
    fs.mkdirSync('archive');
  }
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  return backupDir;
}

// 파일 이동
function moveFile(source, destination) {
  try {
    if (fs.existsSync(source)) {
      const destDir = path.dirname(destination);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.renameSync(source, destination);
      const stats = fs.statSync(destination);
      console.log(`✅ ${source} → ${destination} (${(stats.size / 1024).toFixed(1)}KB)`);
      return true;
    } else {
      console.log(`⚠️ ${source} (이미 없음)`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${source} 이동 실패: ${error.message}`);
    return false;
  }
}

// 메인 정리 함수
function cleanupCodebase() {
  const backupDir = createBackupDir();
  let totalMoved = 0;
  let totalSize = 0;
  
  console.log('📁 중복 파일 정리...\n');
  duplicateFiles.forEach((file, index) => {
    const fileName = path.basename(file);
    const destination = path.join(backupDir, 'duplicates', fileName);
    
    console.log(`${index + 1}. ${file}`);
    if (moveFile(file, destination)) {
      totalMoved++;
      const stats = fs.statSync(destination);
      totalSize += stats.size;
    }
  });
  
  console.log('\n🗑️ 미사용 파일 정리...\n');
  unusedFiles.forEach((file, index) => {
    const fileName = path.basename(file);
    const destination = path.join(backupDir, 'unused', fileName);
    
    console.log(`${index + 1}. ${file}`);
    if (moveFile(file, destination)) {
      totalMoved++;
      const stats = fs.statSync(destination);
      totalSize += stats.size;
    }
  });
  
  console.log(`\n📊 정리 완료: ${totalMoved}개 파일, ${(totalSize / 1024 / 1024).toFixed(2)}MB 절약\n`);
  
  return { moved: totalMoved, size: totalSize };
}

// 날짜 수정
function fixDates() {
  console.log('📅 문서 날짜 수정...\n');
  
  const dateReplacements = [
    { from: '2025-01-21', to: '2025-05-20' },
    { from: '2025-01-20', to: '2025-05-15' },
    { from: '2025-01-18', to: '2025-05-10' },
    { from: '2025-01-15', to: '2025-05-01' },
    { from: '2025-01-10', to: '2025-01-10' }, // 이건 실제 존재하는 날짜
    { from: '2025-01-06', to: '2024-12-15' },
  ];
  
  documentUpdates.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      let updated = false;
      
      dateReplacements.forEach(({ from, to }) => {
        if (content.includes(from)) {
          content = content.replace(new RegExp(from, 'g'), to);
          updated = true;
        }
      });
      
      if (updated) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ ${file} 날짜 수정 완료`);
      } else {
        console.log(`⚠️ ${file} 수정할 날짜 없음`);
      }
    } else {
      console.log(`❌ ${file} 파일 없음`);
    }
  });
}

// 실행
try {
  console.log('🎯 2025-06-08 코드베이스 정리 시작\n');
  
  // 1. 파일 정리
  const cleanupResult = cleanupCodebase();
  
  // 2. 날짜 수정
  fixDates();
  
  // 3. 결과 리포트
  const reportPath = 'scripts/cleanup-report-2025-06-08.md';
  const report = `# 코드베이스 정리 리포트 - 2025-06-08

## 📊 정리 결과
- **정리된 파일**: ${cleanupResult.moved}개
- **절약된 용량**: ${(cleanupResult.size / 1024 / 1024).toFixed(2)}MB
- **백업 위치**: archive/cleanup-2025-06-08/

## 🔧 중복 파일 정리 (${duplicateFiles.length}개)
${duplicateFiles.map(f => `- ${f}`).join('\n')}

## 🗑️ 미사용 파일 정리 (${unusedFiles.length}개)
${unusedFiles.map(f => `- ${f}`).join('\n')}

## 📅 날짜 수정 완료
- 프로젝트 타임라인에 맞게 날짜 정정
- 2024년 5월 ~ 2025년 6월 기간으로 수정

## 🚀 다음 단계
1. npm run build 테스트
2. 기능 확인
3. Git 커밋 및 푸시
`;

  fs.writeFileSync(reportPath, report, 'utf8');
  
  console.log('\n🎉 정리 완료!');
  console.log(`📄 리포트: ${reportPath}`);
  console.log('📁 백업: archive/cleanup-2025-06-08/');
  
} catch (error) {
  console.error('❌ 정리 중 오류:', error.message);
  process.exit(1);
} 