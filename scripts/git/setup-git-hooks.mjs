#!/usr/bin/env node

/**
 * 🔧 Git 훅 설정 스크립트
 *
 * 커밋 시 자동으로 문서를 갱신하는 Git 훅을 설정합니다.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * 🔧 Git 훅 설정
 */
function setupGitHooks() {
  console.log('🔧 Git 훅 설정 시작...\n');

  try {
    // .git/hooks 디렉토리 확인
    const gitHooksDir = path.join(projectRoot, '.git/hooks');
    const customHooksDir = path.join(projectRoot, '.githooks');

    if (!fs.existsSync(gitHooksDir)) {
      console.error(
        '❌ .git 디렉토리를 찾을 수 없습니다. Git 저장소인지 확인하세요.'
      );
      process.exit(1);
    }

    if (!fs.existsSync(customHooksDir)) {
      console.error('❌ .githooks 디렉토리를 찾을 수 없습니다.');
      process.exit(1);
    }

    // pre-commit 훅 복사
    const sourceHook = path.join(customHooksDir, 'pre-commit');
    const targetHook = path.join(gitHooksDir, 'pre-commit');

    if (fs.existsSync(sourceHook)) {
      fs.copyFileSync(sourceHook, targetHook);

      // 실행 권한 부여 (Unix/Linux/macOS)
      if (process.platform !== 'win32') {
        try {
          execSync(`chmod +x "${targetHook}"`);
          console.log('✅ pre-commit 훅 실행 권한 설정 완료');
        } catch (error) {
          console.warn(
            '⚠️ 실행 권한 설정 실패 (Windows에서는 정상):',
            error.message
          );
        }
      }

      console.log('✅ pre-commit 훅 설정 완료');
      console.log(`   소스: ${sourceHook}`);
      console.log(`   대상: ${targetHook}`);
    } else {
      console.error('❌ .githooks/pre-commit 파일을 찾을 수 없습니다.');
      process.exit(1);
    }

    // 테스트 실행
    console.log('\n🧪 문서 갱신 스크립트 테스트...');
    execSync('node scripts/update-docs.mjs', {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    console.log('\n✅ Git 훅 설정 완료!');
    console.log('📝 이제 커밋할 때마다 자동으로 문서가 갱신됩니다.');
    console.log('\n🎯 설정된 훅:');
    console.log('  - pre-commit: 문서 자동 갱신');
    console.log('\n📚 자동 갱신 대상:');
    console.log('  - docs/ARCHITECTURE.md');
    console.log('  - docs/API.md');
    console.log('  - docs/environment/vercel.env.template');
  } catch (error) {
    console.error('❌ Git 훅 설정 실패:', error.message);
    process.exit(1);
  }
}

/**
 * 🚀 메인 실행
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  setupGitHooks();
}

export { setupGitHooks };
