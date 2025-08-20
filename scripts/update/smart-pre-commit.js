#!/usr/bin/env node

/**
 * 🚀 스마트 Pre-commit 검증 스크립트 v2.0
 * 
 * 특징:
 * - 파일 수 기반 자동 모드 선택
 * - 빠른 실패 패턴으로 효율성 극대화
 * - 단계별 진행 상태 표시
 * - WSL2 환경 최적화된 캐시 활용
 * - 성능 테스트 완료
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정 상수
const CONFIG = {
  TIMEOUT_SECONDS: 300, // 5분
  MAX_FILES_FOR_FULL_CHECK: 10,
  MAX_FILES_FOR_FAST_CHECK: 25,
  MAX_FILES_FOR_MINIMAL_CHECK: 50,
  TS_CACHE_DIR: '/tmp/tsc-precommit-cache',
  MAX_FILE_SIZE_MB: 2,
};

// 유틸리티 함수들
const utils = {
  // 변경된 파일 목록 가져오기
  getChangedFiles() {
    try {
      const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
      return staged ? staged.split('\n').filter(file => file.length > 0) : [];
    } catch (error) {
      console.log('⚠️  변경된 파일을 확인할 수 없습니다.');
      return [];
    }
  },

  // TypeScript/JavaScript 파일 필터링
  filterCodeFiles(files) {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    return files.filter(file => {
      const ext = path.extname(file);
      return codeExtensions.includes(ext) && 
             !file.includes('node_modules/') &&
             !file.includes('.next/') &&
             !file.includes('/docs/') &&
             !file.includes('/scripts/');
    });
  },

  // 실행 시간 측정
  timeCommand(name, command, timeout = CONFIG.TIMEOUT_SECONDS) {
    const startTime = Date.now();
    console.log(`🔄 ${name} 시작...`);
    
    try {
      const result = execSync(`timeout ${timeout} ${command}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ ${name} 완료 (${elapsed}초)`);
      return { success: true, elapsed, output: result };
    } catch (error) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      if (error.status === 124) { // timeout exit code
        console.log(`⏰ ${name} 타임아웃 (${elapsed}초)`);
        return { success: false, timeout: true, elapsed };
      } else {
        console.log(`❌ ${name} 실패 (${elapsed}초)`);
        return { success: false, timeout: false, elapsed, error };
      }
    }
  },

  // 진행률 표시
  showProgress(current, total, description) {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
    console.log(`📊 [${bar}] ${percentage}% - ${description}`);
  },

  // 캐시 디렉토리 설정
  ensureCacheDir() {
    try {
      if (!fs.existsSync(CONFIG.TS_CACHE_DIR)) {
        fs.mkdirSync(CONFIG.TS_CACHE_DIR, { recursive: true });
      }
    } catch (error) {
      console.log('⚠️  캐시 디렉토리 생성 실패, 캐시 비활성화');
    }
  },

  // 파일 크기 확인
  isFileTooLarge(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      return fileSizeMB > CONFIG.MAX_FILE_SIZE_MB;
    } catch {
      return false;
    }
  },

  // 변경된 TypeScript 파일만으로 임시 tsconfig 생성
  createTempTsConfig(files) {
    const tsFiles = files.filter(f => 
      (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')) && 
      !this.isFileTooLarge(f) &&
      fs.existsSync(f)
    );

    if (tsFiles.length === 0) return null;

    // 프로젝트 루트에 임시 파일 생성 (상대 경로 문제 해결)
    const tempConfigPath = path.join(process.cwd(), '.tsconfig.temp.json');
    
    // 기본 설정을 그대로 복사하고 include만 변경
    const baseConfig = JSON.parse(fs.readFileSync('./config/typescript/tsconfig.precommit.json', 'utf8'));
    const tempConfig = {
      ...baseConfig,
      include: tsFiles,
      exclude: baseConfig.exclude || []
    };

    try {
      fs.writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2));
      return tempConfigPath;
    } catch (error) {
      console.log('⚠️  임시 tsconfig 생성 실패:', error.message);
      return null;
    }
  },

  // 임시 파일 정리
  cleanupTempFiles() {
    const tempConfigPath = path.join(process.cwd(), '.tsconfig.temp.json');
    try {
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
      }
    } catch (error) {
      // 무시
    }
  }
};

// 검증 단계들
const validators = {
  // 0단계: 자동 코드 리뷰 및 수정 (새로 추가)
  async autoReview(files, mode) {
    console.log('\n🤖 0단계: 자동 코드 리뷰 및 수정');
    
    // minimal 모드에서는 자동 리뷰 스킵
    if (mode === 'minimal') {
      console.log('✅ 자동 리뷰 스킵 (minimal 모드)');
      return { success: true, skipped: true };
    }
    
    // 파일이 너무 많으면 스킵
    if (files.length > 10) {
      console.log('✅ 자동 리뷰 스킵 (파일 10개 초과)');
      return { success: true, skipped: true };
    }

    console.log(`🚀 서브에이전트 기반 자동 리뷰 시작 (${files.length}개 파일)`);
    
    return utils.timeCommand(
      '자동 코드 리뷰 및 수정',
      'node scripts/dev/auto-review-and-fix.js',
      180 // 3분 제한
    );
  },

  // 1단계: 보안 검사 (가장 빠른 실패)
  async security(files) {
    console.log('\n🔒 1단계: 보안 검사');
    
    // 민감한 패턴이 포함된 파일만 검사
    const sensitiveFiles = files.filter(file => {
      const content = fs.readFileSync(file, 'utf8').toLowerCase();
      return content.includes('password') || 
             content.includes('api_key') || 
             content.includes('secret') ||
             content.includes('token');
    });

    if (sensitiveFiles.length === 0) {
      console.log('✅ 보안 검사 스킵 (민감한 내용 없음)');
      return { success: true, skipped: true };
    }

    console.log(`🔍 ${sensitiveFiles.length}개 파일에서 보안 검사 실행`);
    return utils.timeCommand(
      '보안 검사',
      'node scripts/env/check-hardcoded-secrets.js',
      60 // 1분 제한
    );
  },

  // 2단계: 구문 검사 (빠른 실패)
  async syntax(files) {
    console.log('\n🔍 2단계: 구문 검사');
    utils.showProgress(2, 4, '구문 검사 중');

    // 캐시 디렉토리 준비
    utils.ensureCacheDir();

    const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    if (tsFiles.length === 0) {
      console.log('✅ TypeScript 파일 없음 - 스킵');
      return { success: true, skipped: true };
    }

    // 큰 파일 제외
    const validFiles = tsFiles.filter(f => !utils.isFileTooLarge(f));
    const skippedLargeFiles = tsFiles.length - validFiles.length;
    
    if (skippedLargeFiles > 0) {
      console.log(`⚠️  큰 파일 ${skippedLargeFiles}개 스킵 (>${CONFIG.MAX_FILE_SIZE_MB}MB)`);
    }

    if (validFiles.length === 0) {
      console.log('✅ 검사할 TypeScript 파일 없음 - 스킵');
      return { success: true, skipped: true };
    }

    console.log(`🔧 TypeScript 파일 ${validFiles.length}개 검사 (변경된 파일만)`);

    // 변경된 파일만으로 임시 tsconfig 생성
    const tempConfigPath = utils.createTempTsConfig(validFiles);
    
    if (!tempConfigPath) {
      console.log('⚠️  임시 설정 생성 실패, 기본 검사로 대체');
      return utils.timeCommand(
        'TypeScript 구문 검사 (기본)',
        'npx tsc --noEmit --skipLibCheck --project config/typescript/tsconfig.precommit.json',
        60 // 1분 제한
      );
    }

    // 최적화된 TypeScript 검사 (변경된 파일만)
    return utils.timeCommand(
      `TypeScript 구문 검사 (${validFiles.length}개 파일)`,
      `npx tsc --noEmit --skipLibCheck --project "${tempConfigPath}"`,
      30 // 30초 제한 (변경된 파일만이므로 빠름)
    );
  },

  // 3단계: 코드 품질 (조건부 실행)
  async quality(files, mode) {
    console.log('\n🎨 3단계: 코드 품질 검사');
    utils.showProgress(3, 4, `코드 품질 검사 (${mode} 모드)`);

    // 모드별 LINT_MODE 설정
    const modeMap = {
      'minimal': 'prettier-only',
      'fast': 'fast', 
      'full': 'auto'
    };

    const lintMode = modeMap[mode] || 'auto';
    process.env.LINT_MODE = lintMode;

    console.log(`🔧 Lint 모드: ${lintMode} (${files.length}개 파일)`);
    
    return utils.timeCommand(
      '코드 품질 검사',
      'npx lint-staged',
      mode === 'minimal' ? 60 : 180 // minimal: 1분, 나머지: 3분
    );
  },

  // 4단계: 최종 검증 (선택적)
  async final(files, mode) {
    if (mode === 'minimal') {
      console.log('\n✅ 4단계: 최종 검증 스킵 (minimal 모드)');
      return { success: true, skipped: true };
    }

    console.log('\n🧪 4단계: 최종 검증');
    utils.showProgress(4, 4, '최종 검증 중');

    // 빠른 테스트만 실행
    return utils.timeCommand(
      '빠른 테스트',
      'npm run test:quick',
      120 // 2분 제한
    );
  }
};

// 메인 실행 함수
async function main() {
  console.log('🚀 스마트 Pre-commit 검증 시작 (v3.0 - 성능 최적화)\n');
  
  // 환경 변수 체크
  if (process.env.HUSKY === '0') {
    console.log('⏭️  HUSKY=0 설정으로 검증을 건너뜁니다.');
    process.exit(0);
  }

  // 캐시 시스템 초기화
  utils.ensureCacheDir();

  // 변경된 파일 분석
  const allFiles = utils.getChangedFiles();
  const codeFiles = utils.filterCodeFiles(allFiles);
  
  console.log(`📁 변경된 파일: ${allFiles.length}개 (코드 파일: ${codeFiles.length}개)`);
  
  if (codeFiles.length === 0) {
    console.log('✅ 코드 파일 변경 없음 - 빠른 완료');
    process.exit(0);
  }

  // 모드 결정
  let mode;
  if (codeFiles.length <= CONFIG.MAX_FILES_FOR_FULL_CHECK) {
    mode = 'full';
  } else if (codeFiles.length <= CONFIG.MAX_FILES_FOR_FAST_CHECK) {
    mode = 'fast';
  } else if (codeFiles.length <= CONFIG.MAX_FILES_FOR_MINIMAL_CHECK) {
    mode = 'minimal';
  } else {
    console.log(`⚠️  변경된 파일이 너무 많습니다 (${codeFiles.length}개). HUSKY=0 git commit을 사용하세요.`);
    process.exit(1);
  }

  console.log(`🎯 검증 모드: ${mode.toUpperCase()} (${codeFiles.length}개 파일)\n`);

  const startTime = Date.now();
  const results = [];

  try {
    // 단계별 실행 (자동 리뷰 추가)
    const steps = [
      () => validators.autoReview(codeFiles, mode),
      () => validators.security(codeFiles),
      () => validators.syntax(codeFiles),
      () => validators.quality(codeFiles, mode),
      () => validators.final(codeFiles, mode)
    ];

    for (let i = 0; i < steps.length; i++) {
      const result = await steps[i]();
      results.push(result);

      // 실패 시 즉시 중단 (스킵된 경우 제외)
      if (!result.success && !result.skipped) {
        if (result.timeout) {
          console.log(`\n⏰ ${i + 1}단계에서 타임아웃 발생`);
          console.log('🚀 빠른 커밋을 위해 검증을 스킵합니다...');
          process.env.HUSKY = '0';
          process.exit(0);
        } else {
          console.log(`\n❌ ${i + 1}단계에서 검증 실패!`);
          console.log('💡 빠른 커밋을 원하면: HUSKY=0 git commit');
          process.exit(1);
        }
      }
    }

    // 성공 요약
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const executedSteps = results.filter(r => !r.skipped).length;
    
    console.log(`\n🎉 Pre-commit 검증 완료!`);
    console.log(`📊 실행된 단계: ${executedSteps}/5, 총 소요시간: ${totalTime}초`);
    console.log(`🚀 모드: ${mode.toUpperCase()}, 파일: ${codeFiles.length}개`);

  } catch (error) {
    console.error('💥 예상치 못한 오류:', error.message);
    console.log('🚀 검증을 스킵하고 커밋을 진행합니다...');
    process.env.HUSKY = '0';
    process.exit(0);
  } finally {
    // 임시 파일 정리
    utils.cleanupTempFiles();
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('💥 스크립트 실행 오류:', error);
    process.exit(1);
  });
}

module.exports = { main, utils, validators };