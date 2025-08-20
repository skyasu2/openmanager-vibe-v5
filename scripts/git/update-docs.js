#!/usr/bin/env node

/**
 * 📚 문서 자동 갱신 통합 스크립트
 * 
 * CHANGELOG.md와 README.md를 한 번에 업데이트합니다.
 * 
 * 사용법:
 *   node scripts/git/update-docs.js          # 두 문서 모두 업데이트
 *   node scripts/git/update-docs.js changelog # CHANGELOG만 업데이트
 *   node scripts/git/update-docs.js readme    # README만 업데이트
 *   node scripts/git/update-docs.js --commit  # 업데이트 후 자동 커밋
 */

const ChangelogUpdater = require('./update-changelog');
const ReadmeUpdater = require('./update-readme');
const { execSync } = require('child_process');

class DocsUpdater {
  constructor() {
    this.args = process.argv.slice(2);
    this.shouldCommit = this.args.includes('--commit');
    this.target = this.args.find(arg => !arg.startsWith('--')) || 'all';
  }

  // Git 상태 확인
  checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      if (status && !this.shouldCommit) {
        console.log('⚠️  작업 디렉토리에 변경사항이 있습니다.');
        console.log('   문서 업데이트 후 수동으로 커밋하거나 --commit 옵션을 사용하세요.\n');
      }
      return true;
    } catch (error) {
      console.error('❌ Git 상태 확인 실패:', error.message);
      return false;
    }
  }

  // 문서 자동 커밋
  commitDocs(files) {
    try {
      // 변경된 파일 확인
      const changes = execSync(`git diff --name-only ${files.join(' ')}`, { encoding: 'utf8' }).trim();
      
      if (!changes) {
        console.log('ℹ️  커밋할 변경사항이 없습니다.');
        return;
      }

      // 파일 추가
      execSync(`git add ${files.join(' ')}`);
      
      // 커밋 메시지 생성
      const date = new Date().toISOString().split('T')[0];
      const message = `📚 docs: 문서 자동 업데이트 (${date})

- CHANGELOG.md: 최근 커밋 반영
- README.md: 프로젝트 통계 및 버전 업데이트

🤖 Generated with update-docs.js`;

      // 커밋
      execSync(`git commit -m "${message}"`);
      console.log('✅ 자동 커밋 완료');
      
    } catch (error) {
      console.error('❌ 자동 커밋 실패:', error.message);
      console.log('💡 수동으로 커밋해주세요:');
      console.log(`   git add ${files.join(' ')}`);
      console.log('   git commit -m "📚 docs: 문서 업데이트"');
    }
  }

  // 실행
  async run() {
    console.log('═'.repeat(60));
    console.log('📚 프로젝트 문서 자동 갱신 시스템');
    console.log('═'.repeat(60));
    console.log('');

    // Git 상태 확인
    this.checkGitStatus();

    const updatedFiles = [];

    // CHANGELOG 업데이트
    if (this.target === 'all' || this.target === 'changelog') {
      console.log('📝 CHANGELOG.md 업데이트 중...');
      console.log('─'.repeat(60));
      const changelogUpdater = new ChangelogUpdater();
      changelogUpdater.run();
      updatedFiles.push('CHANGELOG.md');
      console.log('');
    }

    // README 업데이트
    if (this.target === 'all' || this.target === 'readme') {
      console.log('📖 README.md 업데이트 중...');
      console.log('─'.repeat(60));
      const readmeUpdater = new ReadmeUpdater();
      readmeUpdater.run();
      updatedFiles.push('README.md');
      console.log('');
    }

    // 자동 커밋 (옵션)
    if (this.shouldCommit && updatedFiles.length > 0) {
      console.log('📦 변경사항 커밋 중...');
      console.log('─'.repeat(60));
      this.commitDocs(updatedFiles);
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log('✨ 문서 갱신 완료!');
    console.log('═'.repeat(60));

    // 사용 팁
    if (!this.shouldCommit) {
      console.log('\n💡 팁: --commit 옵션을 추가하면 자동으로 커밋됩니다.');
      console.log('   예: npm run docs:update -- --commit');
    }
  }
}

// 실행
if (require.main === module) {
  const updater = new DocsUpdater();
  updater.run();
}