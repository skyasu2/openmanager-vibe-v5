#!/usr/bin/env node

/**
 * 🚀 CHANGELOG.md 자동 갱신 스크립트
 * 
 * 기능:
 * - 최근 커밋 분석하여 CHANGELOG 자동 생성
 * - 이모지 기반 커밋 타입 분류
 * - 날짜별 그룹화
 * - 버전 번호 자동 증가
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
  CHANGELOG_PATH: 'CHANGELOG.md',
  DAYS_TO_CHECK: 7, // 최근 7일간의 커밋 확인
  COMMIT_TYPES: {
    '✨': 'Added',
    '🚀': 'Added',
    '🐛': 'Fixed',
    '🛠️': 'Fixed',
    '🚨': 'Fixed',
    '♻️': 'Refactored',
    '⚡': 'Improved',
    '📚': 'Documentation',
    '🧪': 'Testing',
    '🔧': 'Changed',
    '⏪': 'Reverted',
    '🛡️': 'Security'
  }
};

class ChangelogUpdater {
  constructor() {
    this.changelog = '';
    this.lastVersion = '';
    this.newVersion = '';
  }

  // 현재 버전 가져오기
  getCurrentVersion() {
    try {
      const content = fs.readFileSync(CONFIG.CHANGELOG_PATH, 'utf8');
      const versionMatch = content.match(/## \[(\d+\.\d+\.\d+)\]/);
      if (versionMatch) {
        this.lastVersion = versionMatch[1];
        return versionMatch[1];
      }
    } catch (error) {
      console.log('⚠️  CHANGELOG.md를 읽을 수 없습니다. 새로 생성합니다.');
    }
    return '5.67.22'; // 기본 버전
  }

  // 버전 번호 증가
  incrementVersion(type = 'patch') {
    const [major, minor, patch] = this.lastVersion.split('.').map(Number);
    
    switch (type) {
      case 'major':
        this.newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        this.newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
      default:
        this.newVersion = `${major}.${minor}.${patch + 1}`;
    }
    
    return this.newVersion;
  }

  // 최근 커밋 가져오기
  getRecentCommits() {
    const since = new Date();
    since.setDate(since.getDate() - CONFIG.DAYS_TO_CHECK);
    const sinceStr = since.toISOString().split('T')[0];
    
    try {
      const commits = execSync(
        `git log --since="${sinceStr}" --pretty=format:"%h|%ad|%s" --date=short`,
        { encoding: 'utf8' }
      ).trim();
      
      if (!commits) {
        console.log('ℹ️  최근 커밋이 없습니다.');
        return [];
      }
      
      return commits.split('\n').map(line => {
        const [hash, date, message] = line.split('|');
        return { hash, date, message };
      });
    } catch (error) {
      console.error('❌ 커밋 정보를 가져올 수 없습니다:', error.message);
      return [];
    }
  }

  // 커밋 분류
  categorizeCommits(commits) {
    const categorized = {
      Added: [],
      Changed: [],
      Fixed: [],
      Improved: [],
      Refactored: [],
      Documentation: [],
      Testing: [],
      Security: [],
      Reverted: []
    };
    
    commits.forEach(commit => {
      // 이모지 추출
      const emojiMatch = commit.message.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
      const emoji = emojiMatch ? emojiMatch[1] : null;
      
      // 카테고리 결정
      let category = 'Changed';
      if (emoji && CONFIG.COMMIT_TYPES[emoji]) {
        category = CONFIG.COMMIT_TYPES[emoji];
      }
      
      // 메시지 정리
      const cleanMessage = commit.message
        .replace(/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u, '')
        .replace(/^(feat|fix|docs|style|refactor|test|chore|perf|build|ci|revert|hotfix):\s*/i, '')
        .trim();
      
      if (cleanMessage && !cleanMessage.includes('Merge branch') && !cleanMessage.includes('Merge pull request')) {
        categorized[category].push({
          ...commit,
          cleanMessage
        });
      }
    });
    
    // 빈 카테고리 제거
    Object.keys(categorized).forEach(key => {
      if (categorized[key].length === 0) {
        delete categorized[key];
      }
    });
    
    return categorized;
  }

  // CHANGELOG 엔트리 생성
  generateEntry(commits) {
    const today = new Date().toISOString().split('T')[0];
    const categorized = this.categorizeCommits(commits);
    
    if (Object.keys(categorized).length === 0) {
      console.log('ℹ️  업데이트할 변경사항이 없습니다.');
      return null;
    }
    
    // 주요 변경사항 요약
    const summary = this.generateSummary(categorized);
    
    let entry = `## [${this.newVersion}] - ${today}\n\n`;
    entry += `### ${summary}\n\n`;
    
    // 카테고리별 변경사항
    Object.entries(categorized).forEach(([category, items]) => {
      entry += `#### ${category}\n\n`;
      items.forEach(item => {
        entry += `- ${item.cleanMessage} (${item.hash})\n`;
      });
      entry += '\n';
    });
    
    return entry;
  }

  // 요약 생성
  generateSummary(categorized) {
    const totalChanges = Object.values(categorized).reduce((sum, arr) => sum + arr.length, 0);
    
    // 가장 많은 변경사항 카테고리 찾기
    let mainCategory = 'Changed';
    let maxCount = 0;
    Object.entries(categorized).forEach(([category, items]) => {
      if (items.length > maxCount) {
        maxCount = items.length;
        mainCategory = category;
      }
    });
    
    // 첫 번째 주요 변경사항 가져오기
    const firstChange = categorized[mainCategory]?.[0]?.cleanMessage || '다양한 개선사항';
    
    return `${firstChange.substring(0, 50)}${firstChange.length > 50 ? '...' : ''} (${totalChanges}개 변경)`;
  }

  // CHANGELOG 업데이트
  updateChangelog(entry) {
    try {
      let content = '';
      
      if (fs.existsSync(CONFIG.CHANGELOG_PATH)) {
        content = fs.readFileSync(CONFIG.CHANGELOG_PATH, 'utf8');
        
        // 헤더 부분과 기존 엔트리 분리
        const headerEnd = content.indexOf('## [');
        if (headerEnd !== -1) {
          const header = content.substring(0, headerEnd);
          const oldEntries = content.substring(headerEnd);
          content = header + entry + '\n' + oldEntries;
        } else {
          // 헤더만 있는 경우
          content = content + '\n' + entry;
        }
      } else {
        // 새 파일 생성
        content = `# Changelog

> 📌 **참고**: 이전 버전들의 상세한 변경 이력은 [CHANGELOG-LEGACY.md](./CHANGELOG-LEGACY.md)를 참조하세요.
>
> - Legacy 파일: v5.0.0 ~ v5.65.6 (2024-05 ~ 2025-01)
> - 현재 파일: v5.65.7 이후 (2025-01 ~)

${entry}`;
      }
      
      fs.writeFileSync(CONFIG.CHANGELOG_PATH, content);
      console.log(`✅ CHANGELOG.md 업데이트 완료 (v${this.newVersion})`);
      
      return true;
    } catch (error) {
      console.error('❌ CHANGELOG.md 업데이트 실패:', error.message);
      return false;
    }
  }

  // 실행
  run() {
    console.log('🚀 CHANGELOG 자동 갱신 시작...\n');
    
    // 1. 현재 버전 확인
    this.getCurrentVersion();
    console.log(`📌 현재 버전: v${this.lastVersion}`);
    
    // 2. 최근 커밋 가져오기
    const commits = this.getRecentCommits();
    if (commits.length === 0) {
      console.log('ℹ️  업데이트할 커밋이 없습니다.');
      return;
    }
    console.log(`📊 분석할 커밋: ${commits.length}개\n`);
    
    // 3. 버전 증가 (기능 추가가 있으면 minor, 아니면 patch)
    const hasFeatures = commits.some(c => 
      c.message.includes('✨') || 
      c.message.includes('🚀') || 
      c.message.toLowerCase().includes('feat')
    );
    this.incrementVersion(hasFeatures ? 'minor' : 'patch');
    console.log(`🆕 새 버전: v${this.newVersion}\n`);
    
    // 4. CHANGELOG 엔트리 생성
    const entry = this.generateEntry(commits);
    if (!entry) {
      return;
    }
    
    // 5. CHANGELOG 업데이트
    this.updateChangelog(entry);
    
    // 6. Git에 추가 제안
    console.log('\n💡 다음 명령어로 변경사항을 커밋하세요:');
    console.log('   git add CHANGELOG.md');
    console.log(`   git commit -m "📚 docs: CHANGELOG v${this.newVersion} 업데이트"`);
  }
}

// 실행
if (require.main === module) {
  const updater = new ChangelogUpdater();
  updater.run();
}

module.exports = ChangelogUpdater;