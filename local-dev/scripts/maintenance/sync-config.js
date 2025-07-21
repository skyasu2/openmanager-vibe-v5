#!/usr/bin/env node
/**
 * 설정 파일 동기화 스크립트
 * 프로젝트 루트의 설정 파일들을 development/config와 infra/config로 동기화
 */

const fs = require('fs');
const path = require('path');

// 프로젝트 루트 경로 (스크립트가 development/scripts/maintenance에 있으므로)
const ROOT_DIR = path.resolve(__dirname, '../../..');

// 설정 파일 매핑
const CONFIG_MAPPINGS = {
  development: {
    source: ROOT_DIR,
    target: path.join(ROOT_DIR, 'development/config'),
    files: [
      'eslint.config.mjs',
      'postcss.config.mjs',
      'tailwind.config.ts',
      'vitest.config.ts',
      'components.json',
      'tsconfig.json',
      'playwright.config.ts',
    ],
  },
  infra: {
    source: ROOT_DIR,
    target: path.join(ROOT_DIR, 'infra/config'),
    files: [
      'vercel.json',
      'vercel.simple.json',
      'vercel.env.template',
      'vercel-complete-env-setup.txt',
      'vercel-additional-env.txt',
      'vercel-env-vars.txt',
      'gcp.yaml',
      'gcp-mcp-config.json',
    ],
  },
  mcp: {
    source: ROOT_DIR,
    target: path.join(ROOT_DIR, 'development/mcp'),
    files: ['cursor.mcp.json', 'mcp-gcp-ai.json'],
  },
};

/**
 * 파일 복사 함수
 */
function copyFile(source, target) {
  try {
    // 디렉토리 생성
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 파일 복사
    fs.copyFileSync(source, target);
    console.log(
      `✅ 복사됨: ${path.basename(source)} → ${path.relative(ROOT_DIR, target)}`
    );
    return true;
  } catch (error) {
    console.error(
      `❌ 복사 실패: ${path.basename(source)} → ${path.relative(ROOT_DIR, target)}: ${error.message}`
    );
    return false;
  }
}

/**
 * 글로브 패턴 매칭
 */
function matchFiles(pattern, sourceDir) {
  if (!pattern.includes('*')) {
    return [pattern];
  }

  const files = fs.readdirSync(sourceDir);
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  return files.filter(file => regex.test(file));
}

/**
 * 설정 파일 동기화
 */
function syncConfigs() {
  console.log('🔄 설정 파일 동기화 시작...\n');
  console.log(`📁 프로젝트 루트: ${ROOT_DIR}\n`);

  let totalCopied = 0;
  let totalFailed = 0;

  Object.entries(CONFIG_MAPPINGS).forEach(([category, config]) => {
    console.log(`📁 ${category.toUpperCase()} 설정 파일 처리 중...`);

    config.files.forEach(filePattern => {
      const matchedFiles = matchFiles(filePattern, config.source);

      matchedFiles.forEach(fileName => {
        const sourcePath = path.join(config.source, fileName);
        const targetPath = path.join(config.target, fileName);

        if (fs.existsSync(sourcePath)) {
          if (copyFile(sourcePath, targetPath)) {
            totalCopied++;
          } else {
            totalFailed++;
          }
        } else {
          console.log(`⚠️  파일 없음: ${fileName} (${sourcePath})`);
        }
      });
    });

    console.log('');
  });

  console.log('📊 동기화 완료 통계:');
  console.log(`✅ 성공: ${totalCopied}개`);
  console.log(`❌ 실패: ${totalFailed}개`);

  if (totalFailed === 0) {
    console.log('\n🎉 모든 설정 파일이 성공적으로 동기화되었습니다!');
  } else {
    console.log('\n⚠️  일부 파일 동기화에 실패했습니다. 로그를 확인해주세요.');
    process.exit(1);
  }
}

/**
 * 차이점 검사
 */
function checkDifferences() {
  console.log('🔍 설정 파일 차이점 검사...\n');
  console.log(`📁 프로젝트 루트: ${ROOT_DIR}\n`);

  Object.entries(CONFIG_MAPPINGS).forEach(([category, config]) => {
    console.log(`📁 ${category.toUpperCase()} 차이점 검사:`);

    config.files.forEach(filePattern => {
      const matchedFiles = matchFiles(filePattern, config.source);

      matchedFiles.forEach(fileName => {
        const sourcePath = path.join(config.source, fileName);
        const targetPath = path.join(config.target, fileName);

        if (fs.existsSync(sourcePath) && fs.existsSync(targetPath)) {
          const sourceContent = fs.readFileSync(sourcePath, 'utf8');
          const targetContent = fs.readFileSync(targetPath, 'utf8');

          if (sourceContent !== targetContent) {
            console.log(`🔄 차이 발견: ${fileName}`);
          } else {
            console.log(`✅ 동일: ${fileName}`);
          }
        } else if (fs.existsSync(sourcePath)) {
          console.log(`➕ 새 파일: ${fileName}`);
        } else if (fs.existsSync(targetPath)) {
          console.log(`➖ 삭제된 파일: ${fileName}`);
        } else {
          console.log(`⚠️  파일 없음: ${fileName}`);
        }
      });
    });

    console.log('');
  });
}

/**
 * 메인 실행 함수
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
설정 파일 동기화 스크립트

사용법:
  node sync-config.js [옵션]

옵션:
  --check, -c     차이점만 검사 (동기화하지 않음)
  --help, -h      도움말 표시

예시:
  node sync-config.js          # 설정 파일 동기화
  node sync-config.js --check  # 차이점 검사만

프로젝트 루트: ${ROOT_DIR}
`);
    return;
  }

  if (args.includes('--check') || args.includes('-c')) {
    checkDifferences();
  } else {
    syncConfigs();
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { syncConfigs, checkDifferences };
