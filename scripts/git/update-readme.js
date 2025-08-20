#!/usr/bin/env node

/**
 * 📚 README.md 자동 갱신 스크립트
 * 
 * 기능:
 * - 프로젝트 통계 자동 업데이트
 * - 최근 업데이트 일자 갱신
 * - 버전 정보 동기화
 * - 기술 스택 버전 업데이트
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ReadmeUpdater {
  constructor() {
    this.stats = {};
    this.version = '';
  }

  // 프로젝트 통계 수집
  collectStats() {
    try {
      // TypeScript 파일 수
      const tsFiles = execSync('find src -name "*.ts" -o -name "*.tsx" | wc -l', { encoding: 'utf8' }).trim();
      
      // 전체 코드 라인 수
      const totalLines = execSync('find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk "{print $1}"', { encoding: 'utf8' }).trim();
      
      // 테스트 파일 수
      const testFiles = execSync('find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | wc -l', { encoding: 'utf8' }).trim();
      
      // 커밋 수
      const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
      
      // 컨트리뷰터 수
      const contributors = execSync('git shortlog -sn | wc -l', { encoding: 'utf8' }).trim();
      
      // 브랜치 수
      const branches = execSync('git branch -r | wc -l', { encoding: 'utf8' }).trim();
      
      this.stats = {
        tsFiles: parseInt(tsFiles) || 0,
        totalLines: parseInt(totalLines) || 0,
        testFiles: parseInt(testFiles) || 0,
        commitCount: parseInt(commitCount) || 0,
        contributors: parseInt(contributors) || 0,
        branches: parseInt(branches) || 0
      };
      
      console.log('📊 프로젝트 통계:');
      console.log(`   - TypeScript 파일: ${this.stats.tsFiles}개`);
      console.log(`   - 코드 라인: ${this.stats.totalLines.toLocaleString()}줄`);
      console.log(`   - 테스트 파일: ${this.stats.testFiles}개`);
      console.log(`   - 커밋: ${this.stats.commitCount}개`);
      console.log(`   - 컨트리뷰터: ${this.stats.contributors}명`);
      console.log('');
      
    } catch (error) {
      console.error('⚠️  통계 수집 중 오류:', error.message);
    }
  }

  // 버전 정보 가져오기
  getVersion() {
    try {
      // package.json에서 버전 가져오기
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      this.version = packageJson.version || '5.68.0';
      
      // CHANGELOG.md에서 최신 버전 확인
      if (fs.existsSync('CHANGELOG.md')) {
        const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
        const versionMatch = changelog.match(/## \[(\d+\.\d+\.\d+)\]/);
        if (versionMatch) {
          this.version = versionMatch[1];
        }
      }
      
      console.log(`📌 현재 버전: v${this.version}`);
      
    } catch (error) {
      console.error('⚠️  버전 정보 가져오기 실패:', error.message);
      this.version = '5.68.0';
    }
  }

  // 기술 스택 버전 업데이트
  getTechVersions() {
    const versions = {};
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // 주요 의존성 버전
      versions.next = packageJson.dependencies?.next?.replace('^', '') || '15.1.7';
      versions.react = packageJson.dependencies?.react?.replace('^', '') || '19.0.0';
      versions.typescript = packageJson.devDependencies?.typescript?.replace('^', '') || '5.7.3';
      versions.tailwind = packageJson.devDependencies?.tailwindcss?.replace('^', '') || '3.4.17';
      
      // Node.js 버전
      try {
        versions.node = execSync('node --version', { encoding: 'utf8' }).trim().replace('v', '');
      } catch {
        versions.node = '22.18.0';
      }
      
    } catch (error) {
      console.error('⚠️  기술 스택 버전 가져오기 실패:', error.message);
    }
    
    return versions;
  }

  // README 섹션 업데이트
  updateSection(content, sectionName, newContent) {
    const startMarker = `<!-- ${sectionName}:START -->`;
    const endMarker = `<!-- ${sectionName}:END -->`;
    
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      return content.substring(0, startIndex + startMarker.length) +
             '\n' + newContent + '\n' +
             content.substring(endIndex);
    }
    
    return content;
  }

  // README 업데이트
  updateReadme() {
    try {
      if (!fs.existsSync('README.md')) {
        console.error('❌ README.md 파일이 없습니다.');
        return false;
      }
      
      let content = fs.readFileSync('README.md', 'utf8');
      
      // 1. 버전 배지 업데이트
      content = content.replace(
        /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[\d.]+/g,
        `![Version](https://img.shields.io/badge/version-${this.version}`
      );
      
      // 2. 최종 업데이트 날짜
      const today = new Date().toISOString().split('T')[0];
      content = content.replace(
        /최종 업데이트: \d{4}-\d{2}-\d{2}/g,
        `최종 업데이트: ${today}`
      );
      content = content.replace(
        /Last Updated: \d{4}-\d{2}-\d{2}/g,
        `Last Updated: ${today}`
      );
      
      // 3. 프로젝트 통계 업데이트 (마커가 있는 경우)
      if (content.includes('<!-- STATS:START -->')) {
        const statsContent = `
- 📝 TypeScript 파일: **${this.stats.tsFiles}개**
- 📏 전체 코드: **${this.stats.totalLines.toLocaleString()}줄**
- 🧪 테스트 파일: **${this.stats.testFiles}개**
- 📊 총 커밋: **${this.stats.commitCount}개**
- 👥 컨트리뷰터: **${this.stats.contributors}명**`;
        
        content = this.updateSection(content, 'STATS', statsContent);
      }
      
      // 4. 기술 스택 버전 업데이트
      const versions = this.getTechVersions();
      if (versions.next) {
        content = content.replace(/Next\.js \d+(\.\d+)?/g, `Next.js ${versions.next.split('.')[0]}`);
        content = content.replace(/React \d+(\.\d+)?/g, `React ${versions.react.split('.')[0]}`);
        content = content.replace(/TypeScript \d+\.\d+/g, `TypeScript ${versions.typescript.substring(0, 3)}`);
        content = content.replace(/Node\.js v\d+(\.\d+)?/g, `Node.js v${versions.node.split('.')[0]}`);
      }
      
      // 5. 프로젝트 상태 업데이트
      if (this.stats.tsFiles > 0) {
        content = content.replace(
          /코드베이스: \d+[,\d]*줄/g,
          `코드베이스: ${this.stats.totalLines.toLocaleString()}줄`
        );
        content = content.replace(
          /TypeScript 파일: \d+개/g,
          `TypeScript 파일: ${this.stats.tsFiles}개`
        );
      }
      
      // 6. Force redeploy 타임스탬프 업데이트 (있는 경우)
      const now = new Date().toString();
      content = content.replace(
        /# Force Vercel redeploy.*/g,
        `# Force Vercel redeploy - ${now}`
      );
      
      // 파일 저장
      fs.writeFileSync('README.md', content);
      console.log('✅ README.md 업데이트 완료');
      
      return true;
      
    } catch (error) {
      console.error('❌ README.md 업데이트 실패:', error.message);
      return false;
    }
  }

  // 실행
  run() {
    console.log('📚 README.md 자동 갱신 시작...\n');
    
    // 1. 버전 정보 가져오기
    this.getVersion();
    
    // 2. 프로젝트 통계 수집
    this.collectStats();
    
    // 3. README 업데이트
    if (this.updateReadme()) {
      console.log('\n💡 다음 명령어로 변경사항을 커밋하세요:');
      console.log('   git add README.md');
      console.log(`   git commit -m "📚 docs: README.md 업데이트 (v${this.version})"`);
    }
  }
}

// 실행
if (require.main === module) {
  const updater = new ReadmeUpdater();
  updater.run();
}

module.exports = ReadmeUpdater;