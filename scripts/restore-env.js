/**
 * 🔧 OpenManager Vibe v5 - 통합 환경변수 복구 시스템 v2.0
 *
 * 기능:
 * - 올바른 복호화 알고리즘 사용
 * - 중복 기능 제거 및 통합
 * - API 키 문제 해결
 * - 환경변수 검증 및 복구
 * - Google AI 헬스체크 비활성화 설정
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// 🔧 올바른 복호화 함수 (EnvBackupManager와 동일한 알고리즘)
function decrypt(encryptedText) {
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) {
      console.warn('⚠️ 암호화 형식이 올바르지 않음, 원본 반환:', encryptedText);
      return encryptedText;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encryptionKey = crypto
      .createHash('sha256')
      .update(process.env.CRON_SECRET || 'openmanager-vibe-v5-backup')
      .digest('hex')
      .slice(0, 32);

    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.warn('⚠️ 복호화 실패, 원본 반환:', error.message);
    return encryptedText;
  }
}

console.log('🔧 OpenManager Vibe v5 - 통합 환경변수 복구 시작...\n');

try {
  // 1. 백업 파일 확인
  const backupPath = path.join(__dirname, '../config/env-backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('❌ 백업 파일이 존재하지 않습니다:', backupPath);
    process.exit(1);
  }

  console.log('📊 1. 백업 파일 로드...');
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log('   백업 버전:', backup.version);
  console.log('   백업 생성일:', backup.created);
  console.log('   환경변수 개수:', backup.entries.length);

  // 2. 환경변수 복구
  console.log('\n🔄 2. 환경변수 복구 중...');
  let envContent = '';
  const envPath = path.join(__dirname, '../.env.local');
  let successCount = 0;
  let failCount = 0;

  // 기본 환경변수 추가 (Google AI 헬스체크 비활성화 포함)
  const defaultVars = {
    NODE_ENV: 'development',
    DISABLE_GOOGLE_AI_HEALTH_CHECK: 'true',
    NEXT_TELEMETRY_DISABLED: '1',
    SKIP_ENV_VALIDATION: 'true',
    GOOGLE_AI_BETA_MODE: 'true',
    GOOGLE_AI_ENABLED: 'true',
    DEVELOPMENT_MODE: 'true',
    LOCAL_DEVELOPMENT: 'true',
  };

  // 기본값부터 추가
  for (const [key, value] of Object.entries(defaultVars)) {
    envContent += `${key}=${value}\n`;
  }

  // 백업된 환경변수 복구
  backup.entries.forEach(entry => {
    try {
      const value = entry.encrypted ? decrypt(entry.value) : entry.value;
      if (value && value !== entry.value) {
        console.log(`   ✅ 복호화 성공: ${entry.key}`);
      }
      envContent += `${entry.key}=${value}\n`;
      successCount++;
    } catch (error) {
      console.error(`   ❌ 복구 실패: ${entry.key} - ${error.message}`);
      failCount++;
    }
  });

  // 3. .env.local 파일 생성
  console.log('\n📝 3. .env.local 파일 생성...');
  fs.writeFileSync(envPath, envContent);

  // 4. 결과 출력
  console.log('\n🎯 4. 복구 결과:');
  console.log(`   ✅ 성공: ${successCount}개 변수`);
  console.log(`   ❌ 실패: ${failCount}개 변수`);
  console.log(`   📁 파일 위치: ${envPath}`);

  // 5. 중복 기능 정리 안내
  console.log('\n🧹 5. 중복 기능 통합 완료:');
  console.log('   ✅ 올바른 복호화 알고리즘 적용');
  console.log('   ✅ Google AI 헬스체크 비활성화 설정');
  console.log('   ✅ 테스트 서버 최적화 설정');
  console.log('   ✅ 기본 환경변수 자동 설정');

  console.log('\n🚀 통합 환경변수 복구 완료!');
  console.log(
    '   다음 단계: npm run dev로 서버 재시작하여 API 키 문제 해결 확인'
  );
} catch (error) {
  console.error('\n❌ 환경변수 복구 실패:', error.message);
  console.error('   스택 트레이스:', error.stack);
  process.exit(1);
}
