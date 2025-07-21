#!/usr/bin/env node

/**
 * OpenManager Vibe v5 - 자동 버전 관리 시스템
 *
 * 주요 기능:
 * - 버전 정보 동기화 (package.json, description, CHANGELOG.md)
 * - Git 태그 자동 생성 및 푸시
 * - 버전 히스토리 추적
 * - 릴리스 노트 자동 생성
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VersionManager {
  constructor() {
    this.packagePath = path.join(__dirname, '..', 'package.json');
    this.changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    this.package = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
  }

  /**
   * 현재 버전 정보 출력
   */
  showCurrentVersion() {
    console.log(`📦 현재 버전: ${this.package.version}`);
    console.log(`📝 설명: ${this.package.description.substring(0, 100)}...`);

    try {
      const latestTag = execSync('git describe --tags --abbrev=0', {
        encoding: 'utf8',
      }).trim();
      console.log(`🏷️ 최신 태그: ${latestTag}`);
    } catch {
      console.log(`🏷️ 최신 태그: (없음)`);
    }
  }

  /**
   * 버전 범프 (patch, minor, major)
   */
  bumpVersion(type = 'patch') {
    const validTypes = ['patch', 'minor', 'major', 'prerelease'];
    if (!validTypes.includes(type)) {
      throw new Error(
        `유효하지 않은 버전 타입: ${type}. 사용 가능: ${validTypes.join(', ')}`
      );
    }

    console.log(`🚀 ${type} 버전 업데이트 시작...`);

    // 1. npm version으로 버전 업데이트
    const oldVersion = this.package.version;
    execSync(`npm version ${type} --no-git-tag-version`, { stdio: 'inherit' });

    // 2. 업데이트된 package.json 다시 로드
    this.package = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    const newVersion = this.package.version;

    console.log(`📈 버전 업데이트: ${oldVersion} → ${newVersion}`);

    // 3. description의 버전 정보 업데이트
    this.updateDescription(newVersion);

    // 4. CHANGELOG.md 업데이트
    this.updateChangelog(newVersion);

    // 5. Git 커밋 및 태그
    this.createGitTag(newVersion);

    console.log(`✅ 버전 ${newVersion} 릴리스 완료!`);
    return newVersion;
  }

  /**
   * package.json description의 버전 정보 업데이트
   */
  updateDescription(version) {
    const oldDescription = this.package.description;
    const newDescription = oldDescription.replace(
      /v\d+\.\d+\.\d+/,
      `v${version}`
    );

    if (oldDescription !== newDescription) {
      this.package.description = newDescription;
      fs.writeFileSync(
        this.packagePath,
        JSON.stringify(this.package, null, 2) + '\n'
      );
      console.log(`📝 Description 버전 업데이트: v${version}`);
    }
  }

  /**
   * CHANGELOG.md 업데이트 (한국시간 기준)
   */
  updateChangelog(version) {
    // 한국시간(KST) 기준 날짜 생성
    const kstDate = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Seoul',
    });
    const kstTime = new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
    });

    const changelogEntry = `
## [${version}] - ${kstDate} (KST)

### 🎉 새로운 기능
- 버전 ${version} 릴리스 (${kstTime} KST)

### 🛠️ 개선사항
- 자동 버전 관리 시스템 도입
- Git 태그 자동 생성
- 한국시간 기준 타임스탬프 적용

### 🐛 버그 수정
- 버전 정보 동기화 개선

---
`;

    try {
      let changelogContent = fs.readFileSync(this.changelogPath, 'utf8');

      // 첫 번째 ## 앞에 새 항목 삽입
      const firstHeaderIndex = changelogContent.indexOf('\n## ');
      if (firstHeaderIndex !== -1) {
        changelogContent =
          changelogContent.slice(0, firstHeaderIndex) +
          changelogEntry +
          changelogContent.slice(firstHeaderIndex);
      } else {
        changelogContent = changelogEntry + changelogContent;
      }

      fs.writeFileSync(this.changelogPath, changelogContent);
      console.log(`📋 CHANGELOG.md 업데이트 완료`);
    } catch (error) {
      console.log(`⚠️ CHANGELOG.md 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * Git 태그 생성 및 푸시 (한국시간 기준)
   */
  createGitTag(version) {
    try {
      // 한국시간 타임스탬프 생성
      const kstTimestamp =
        new Date()
          .toLocaleString('sv-SE', {
            timeZone: 'Asia/Seoul',
          })
          .substring(0, 16) + ' KST';

      // 1. 변경사항 커밋
      execSync('git add -A', { stdio: 'inherit' });
      execSync(
        `git commit -m "chore: 버전 ${version} 릴리스 (${kstTimestamp})

📦 변경사항:
- package.json 버전 업데이트: v${version}
- description 버전 정보 동기화
- CHANGELOG.md 자동 업데이트 (한국시간 기준)
- 자동 버전 관리 시스템 적용"`,
        { stdio: 'inherit' }
      );

      // 2. Git 태그 생성
      execSync(
        `git tag -a v${version} -m "Release v${version} (${kstTimestamp})"`,
        { stdio: 'inherit' }
      );

      // 3. 원격 저장소에 푸시
      execSync('git push', { stdio: 'inherit' });
      execSync(`git push origin v${version}`, { stdio: 'inherit' });

      console.log(`🏷️ Git 태그 v${version} 생성 및 푸시 완료`);
    } catch (error) {
      console.error(`❌ Git 태그 생성 실패: ${error.message}`);
    }
  }

  /**
   * 태그 목록 조회
   */
  listTags() {
    try {
      const tags = execSync('git tag --sort=-version:refname', {
        encoding: 'utf8',
      })
        .trim()
        .split('\n')
        .filter(tag => tag)
        .slice(0, 10);

      console.log(`🏷️ 최근 태그 목록 (최대 10개):`);
      tags.forEach((tag, index) => {
        console.log(`  ${index + 1}. ${tag}`);
      });
    } catch {
      console.log(`🏷️ 태그가 없습니다.`);
    }
  }

  /**
   * 릴리스 노트 생성
   */
  generateReleaseNotes(version) {
    const notes = `# 🚀 OpenManager Vibe v${version} 릴리스 노트

## 📊 버전 정보
- **버전**: ${version}
- **릴리스 날짜**: ${new Date().toISOString().split('T')[0]}
- **Git 태그**: v${version}

## 🎯 주요 변경사항
- 자동 버전 관리 시스템 도입
- Git 태그 자동 생성 및 동기화
- 버전 정보 일관성 개선

## 📦 설치 및 업그레이드
\`\`\`bash
# 최신 버전 확인
git fetch --tags
git checkout v${version}

# 의존성 설치
npm ci

# 빌드 및 실행
npm run build
npm start
\`\`\`

## 📝 변경 로그
자세한 변경사항은 [CHANGELOG.md](./CHANGELOG.md)를 참조하세요.
`;

    const notesPath = path.join(
      __dirname,
      '..',
      `RELEASE-NOTES-v${version}.md`
    );
    fs.writeFileSync(notesPath, notes);
    console.log(`📄 릴리스 노트 생성: ${notesPath}`);
  }
}

// CLI 인터페이스
function main() {
  const versionManager = new VersionManager();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔧 OpenManager Vibe v5 - 버전 관리 도구

사용법:
  node version-manager.mjs current          # 현재 버전 정보 출력
  node version-manager.mjs patch           # 패치 버전 업데이트 (x.x.X)
  node version-manager.mjs minor           # 마이너 버전 업데이트 (x.X.x)
  node version-manager.mjs major           # 메이저 버전 업데이트 (X.x.x)
  node version-manager.mjs prerelease      # 프리릴리스 버전 업데이트
  node version-manager.mjs tags            # 태그 목록 조회
  node version-manager.mjs notes [version] # 릴리스 노트 생성

예시:
  npm run version:patch                   # 패치 버전 자동 업데이트
  npm run release:minor                   # 검증 + 마이너 버전 릴리스
`);
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'current':
        versionManager.showCurrentVersion();
        break;
      case 'patch':
      case 'minor':
      case 'major':
      case 'prerelease':
        versionManager.bumpVersion(command);
        break;
      case 'tags':
        versionManager.listTags();
        break;
      case 'notes':
        const version = args[1] || versionManager.package.version;
        versionManager.generateReleaseNotes(version);
        break;
      default:
        console.error(`❌ 알 수 없는 명령어: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    process.exit(1);
  }
}

// ES6 모듈에서 직접 실행 감지
if (
  import.meta.url.startsWith('file:') &&
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1])
) {
  main();
}

// 간단한 fallback - 이 파일이 직접 실행되면 main() 호출
if (process.argv[1] && process.argv[1].includes('version-manager.mjs')) {
  main();
}

export default VersionManager;
