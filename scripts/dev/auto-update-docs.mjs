#!/usr/bin/env node

// @ts-check
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * OpenManager Vibe v5.44.2 문서 자동화 시스템
 * 커밋 시 문서를 자동으로 최신화하는 스크립트
 */
class DocumentationAutoUpdater {
  constructor() {
    this.packageJson = this.loadPackageJson();
    this.currentVersion = this.packageJson.version;
    this.currentDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.changedFiles = this.getChangedFiles();

    console.log(`🚀 문서 자동화 시스템 v${this.currentVersion}`);
    console.log(`📅 현재 날짜: ${this.currentDate}`);
  }

  loadPackageJson() {
    try {
      return JSON.parse(fs.readFileSync('package.json', 'utf8'));
    } catch (error) {
      console.error('❌ package.json 로드 실패:', error.message);
      return { version: '5.44.2' };
    }
  }

  getChangedFiles() {
    try {
      const changedFiles = process.argv[2];
      if (changedFiles && changedFiles !== 'undefined') {
        return changedFiles.split('\n').filter(file => file.trim());
      }

      // Git staged files 확인
      const output = execSync('git diff --cached --name-only', {
        encoding: 'utf8',
      });
      return output.split('\n').filter(file => file.trim());
    } catch (error) {
      console.warn('⚠️ 변경 파일 목록 가져오기 실패:', error.message);
      return [];
    }
  }

  async updateAllDocuments() {
    console.log(`\n🔄 문서 업데이트 시작...`);

    const documents = [
      'docs/ai-system-architecture.md',
      'docs/deployment-guide.md',
      'docs/development-guide.md',
      'docs/development-progress-2025-07.md',
      'docs/development-tools.md',
      'docs/encryption-system-guide.md',
      'docs/environment-setup-guide.md',
      'docs/gcp-data-generator-architecture.md',
      'docs/operations-deployment.md',
      'docs/redis-swr-optimization-guide.md',
      'docs/server-management-guide.md',
      'docs/system-architecture.md',
      'docs/development/testing/README.md',
    ];

    let updatedCount = 0;

    for (const docPath of documents) {
      if (await this.updateDocument(docPath)) {
        updatedCount++;
      }
    }

    console.log(
      `\n✅ 문서 업데이트 완료! (${updatedCount}/${documents.length}개 문서 업데이트됨)`
    );

    if (updatedCount > 0) {
      console.log('📝 업데이트된 문서가 자동으로 스테이징에 추가됩니다.');
    }
  }

  async updateDocument(docPath) {
    if (!fs.existsSync(docPath)) {
      console.warn(`⚠️ 문서 없음: ${docPath}`);
      return false;
    }

    const originalContent = fs.readFileSync(docPath, 'utf8');
    let content = originalContent;
    let hasChanges = false;

    // 1. 버전 정보 업데이트
    const versionUpdated = this.updateVersionInfo(content);
    if (versionUpdated !== content) {
      content = versionUpdated;
      hasChanges = true;
    }

    // 2. 날짜 정보 업데이트
    const dateUpdated = this.updateDateInfo(content);
    if (dateUpdated !== content) {
      content = dateUpdated;
      hasChanges = true;
    }

    // 3. 코드 변경사항 반영 (기본적인 패턴만)
    const codeUpdated = this.updateBasicCodeReferences(content);
    if (codeUpdated !== content) {
      content = codeUpdated;
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(docPath, content, 'utf8');
      console.log(`📝 업데이트: ${path.basename(docPath)}`);
      return true;
    } else {
      console.log(`📄 변경없음: ${path.basename(docPath)}`);
      return false;
    }
  }

  updateVersionInfo(content) {
    // 버전 패턴 찾기 및 교체
    const versionPatterns = [
      {
        pattern: /OpenManager Vibe v\d+\.\d+\.\d+/g,
        replacement: `OpenManager Vibe v${this.currentVersion}`,
      },
      {
        pattern: /\*\*버전\*\*: v\d+\.\d+\.\d+/g,
        replacement: `**버전**: v${this.currentVersion}`,
      },
      {
        pattern: /버전\*\*: v\d+\.\d+\.\d+/g,
        replacement: `버전**: v${this.currentVersion}`,
      },
    ];

    let updatedContent = content;
    versionPatterns.forEach(({ pattern, replacement }) => {
      updatedContent = updatedContent.replace(pattern, replacement);
    });

    return updatedContent;
  }

  updateDateInfo(content) {
    // 날짜 패턴 찾기 및 교체
    const datePatterns = [
      {
        pattern: /\*\*업데이트\*\*: \d{4}년 \d{1,2}월 \d{1,2}일/g,
        replacement: `**업데이트**: ${this.currentDate}`,
      },
      {
        pattern: /업데이트\*\*: \d{4}년 \d{1,2}월 \d{1,2}일/g,
        replacement: `업데이트**: ${this.currentDate}`,
      },
    ];

    let updatedContent = content;
    datePatterns.forEach(({ pattern, replacement }) => {
      updatedContent = updatedContent.replace(pattern, replacement);
    });

    return updatedContent;
  }

  updateBasicCodeReferences(content) {
    // 기본적인 코드 참조 업데이트
    let updatedContent = content;

    // package.json 의존성 변경 감지
    if (this.changedFiles.includes('package.json')) {
      // 의존성 정보가 포함된 섹션 업데이트 (기본적인 패턴만)
      updatedContent = updatedContent.replace(
        /Node\.js \d+\+/g,
        `Node.js ${this.getNodeVersion()}+`
      );
    }

    // API 엔드포인트 변경 감지
    const apiChanges = this.changedFiles.filter(file =>
      file.includes('src/app/api')
    );
    if (apiChanges.length > 0) {
      // API 개수 업데이트 등 기본적인 정보만
      const apiCount = this.countApiEndpoints();
      updatedContent = updatedContent.replace(
        /\d+개 API 엔드포인트/g,
        `${apiCount}개 API 엔드포인트`
      );
    }

    return updatedContent;
  }

  getNodeVersion() {
    try {
      const engines = this.packageJson.engines;
      if (engines && engines.node) {
        return engines.node.replace(/[^\d]/g, '').substring(0, 2);
      }
      return '18';
    } catch {
      return '18';
    }
  }

  countApiEndpoints() {
    try {
      const apiDir = 'src/app/api';
      if (!fs.existsSync(apiDir)) return 94;

      // route.ts 파일 개수 세기
      const output = execSync(`find ${apiDir} -name "route.ts" | wc -l`, {
        encoding: 'utf8',
      });
      return parseInt(output.trim()) || 94;
    } catch {
      return 94; // 기본값
    }
  }

  // 문서 유효성 검사
  validateDocuments() {
    console.log('\n🔍 문서 유효성 검사...');

    const documents = [
      'docs/ai-system-architecture.md',
      'docs/deployment-guide.md',
      'docs/development-guide.md',
      'docs/development-progress-2025-07.md',
      'docs/development-tools.md',
      'docs/encryption-system-guide.md',
      'docs/environment-setup-guide.md',
      'docs/gcp-data-generator-architecture.md',
      'docs/operations-deployment.md',
      'docs/redis-swr-optimization-guide.md',
      'docs/server-management-guide.md',
      'docs/system-architecture.md',
      'docs/development/testing/README.md',
    ];

    let totalIssues = 0;

    documents.forEach(docPath => {
      if (fs.existsSync(docPath)) {
        const content = fs.readFileSync(docPath, 'utf8');
        const issues = this.checkDocumentIssues(content);

        if (issues.length > 0) {
          console.log(`⚠️ ${path.basename(docPath)}: ${issues.join(', ')}`);
          totalIssues += issues.length;
        } else {
          console.log(`✅ ${path.basename(docPath)}: 문제없음`);
        }
      }
    });

    if (totalIssues === 0) {
      console.log('🎉 모든 문서가 유효합니다!');
    } else {
      console.log(`⚠️ 총 ${totalIssues}개 문제 발견`);
    }

    return totalIssues === 0;
  }

  checkDocumentIssues(content) {
    const issues = [];

    // 버전 정보 일관성 확인
    const versionMatches = content.match(/v\d+\.\d+\.\d+/g);
    if (versionMatches) {
      const uniqueVersions = [...new Set(versionMatches)];
      if (uniqueVersions.length > 1) {
        issues.push('버전 불일치');
      }
    }

    // 날짜 정보 확인
    const datePattern = /\d{4}년 \d{1,2}월 \d{1,2}일/;
    if (!datePattern.test(content)) {
      issues.push('날짜 정보 없음');
    }

    // 기본 구조 확인
    if (!content.includes('##')) {
      issues.push('섹션 구조 없음');
    }

    return issues;
  }
}

// CLI 인터페이스
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const updater = new DocumentationAutoUpdater();

  switch (command) {
    case '--validate':
    case '-v':
      updater.validateDocuments();
      break;

    case '--help':
    case '-h':
      console.log(`
📝 OpenManager Vibe 문서 자동화 도구

사용법:
  node scripts/auto-update-docs.js [옵션] [변경된파일들]
  
옵션:
  --validate, -v    문서 유효성 검사만 실행
  --help, -h        도움말 표시
  
예시:
  node scripts/auto-update-docs.js
  node scripts/auto-update-docs.js --validate
  node scripts/auto-update-docs.js "src/core/ai/UnifiedAIEngine.ts"
      `);
      break;

    default:
      await updater.updateAllDocuments();
      if (command !== '--no-validate') {
        updater.validateDocuments();
      }
      break;
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
main().catch(error => {
  console.error('❌ 문서 자동화 실패:', error.message);
  process.exit(1);
});

export default DocumentationAutoUpdater;
