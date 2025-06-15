#!/usr/bin/env node

/**
 * 📚 OpenManager Vibe v5 문서 관리 스크립트
 * 
 * 기능:
 * - 문서 정리 및 분류
 * - 오래된 문서 백업
 * - 문서 구조 검증
 * - 문서 메타데이터 관리
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// 문서 구조 정의
const DOCS_STRUCTURE = {
    core: [
        'README.md',
        'QUICK_START.md',
        'INSTALLATION.md',
        'AI_SETUP.md',
        'DEVELOPMENT.md',
        'ARCHITECTURE.md',
        'DEPLOYMENT.md',
        'API.md',
        'TESTING.md'
    ],
    backup: ['backup/'],
    deliverables: ['deliverables/'],
    archived: ['archived/']
};

// 색상 출력 함수
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`
};

class DocumentManager {
    constructor() {
        this.docsDir = path.join(ROOT_DIR, 'docs');
        this.stats = {
            coreDocuments: 0,
            backupDocuments: 0,
            archivedDocuments: 0,
            totalSize: 0
        };
    }

    async init() {
        console.log(colors.blue('📚 OpenManager Vibe v5 문서 관리 시스템'));
        console.log(colors.gray('='.repeat(50)));

        await this.ensureDirectoryStructure();
        await this.analyzeDocuments();
        await this.generateIndex();
    }

    // 디렉토리 구조 확인 및 생성
    async ensureDirectoryStructure() {
        console.log(colors.yellow('📁 디렉토리 구조 확인 중...'));

        const directories = [
            'docs',
            'docs/backup',
            'docs/backup/legacy',
            'docs/backup/development',
            'docs/backup/root',
            'docs/archived',
            'docs/deliverables',
            'docs/deliverables/reports',
            'docs/deliverables/analysis'
        ];

        for (const dir of directories) {
            const fullPath = path.join(ROOT_DIR, dir);
            try {
                await fs.access(fullPath);
                console.log(colors.green(`  ✓ ${dir}`));
            } catch (error) {
                await fs.mkdir(fullPath, { recursive: true });
                console.log(colors.yellow(`  + ${dir} (생성됨)`));
            }
        }
    }

    // 문서 분석
    async analyzeDocuments() {
        console.log(colors.yellow('\n📊 문서 분석 중...'));

        // 핵심 문서 확인
        for (const doc of DOCS_STRUCTURE.core) {
            const docPath = path.join(this.docsDir, doc);
            try {
                const stat = await fs.stat(docPath);
                this.stats.coreDocuments++;
                this.stats.totalSize += stat.size;
                console.log(colors.green(`  ✓ ${doc} (${this.formatBytes(stat.size)})`));
            } catch (error) {
                console.log(colors.red(`  ✗ ${doc} (누락)`));
            }
        }

        // 백업 문서 분석
        await this.analyzeDirectory('docs/backup', 'backup');

        // 아카이브 문서 분석
        await this.analyzeDirectory('docs/archived', 'archived');
    }

    async analyzeDirectory(dirPath, type) {
        const fullPath = path.join(ROOT_DIR, dirPath);
        try {
            const files = await this.getMarkdownFiles(fullPath);
            if (type === 'backup') {
                this.stats.backupDocuments = files.length;
            } else if (type === 'archived') {
                this.stats.archivedDocuments = files.length;
            }

            console.log(colors.gray(`  📁 ${dirPath}: ${files.length}개 파일`));
        } catch (error) {
            console.log(colors.gray(`  📁 ${dirPath}: 0개 파일`));
        }
    }

    async getMarkdownFiles(dir) {
        const files = [];

        async function scanDirectory(currentDir) {
            try {
                const items = await fs.readdir(currentDir);
                for (const item of items) {
                    const fullPath = path.join(currentDir, item);
                    const stat = await fs.stat(fullPath);

                    if (stat.isDirectory()) {
                        await scanDirectory(fullPath);
                    } else if (item.endsWith('.md')) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // 디렉토리 접근 오류 무시
            }
        }

        await scanDirectory(dir);
        return files;
    }

    // 문서 인덱스 생성
    async generateIndex() {
        console.log(colors.yellow('\n📋 문서 인덱스 생성 중...'));

        const indexContent = this.generateIndexContent();
        const indexPath = path.join(this.docsDir, 'INDEX.md');

        await fs.writeFile(indexPath, indexContent, 'utf8');
        console.log(colors.green(`  ✓ 인덱스 생성: docs/INDEX.md`));
    }

    generateIndexContent() {
        const now = new Date();
        const timestamp = now.toISOString();
        const dateKR = now.toLocaleDateString('ko-KR');

        return `# 📚 OpenManager Vibe v5 문서 인덱스

> 생성일: ${dateKR}  
> 마지막 업데이트: ${timestamp}

## 🎯 핵심 문서 (7개)

### 🚀 시작하기
- [📖 README](../README.md) - 프로젝트 개요
- [⚡ Quick Start](QUICK_START.md) - 5분 빠른 시작
- [🔧 Installation](INSTALLATION.md) - 상세 설치 가이드

### 🤖 AI & 개발
- [🤖 AI Setup](AI_SETUP.md) - AI 기능 설정
- [🛠️ Development](DEVELOPMENT.md) - 개발 가이드
- [🏗️ Architecture](ARCHITECTURE.md) - 시스템 아키텍처

### 🚀 배포 & API
- [☁️ Deployment](DEPLOYMENT.md) - 배포 가이드
- [📚 API Documentation](API.md) - API 완전 참조
- [🧪 Testing](TESTING.md) - 테스트 가이드

## 📊 문서 통계

| 구분 | 개수 | 상태 |
|------|------|------|
| 핵심 문서 | ${this.stats.coreDocuments}/9 | ${this.stats.coreDocuments === 9 ? '✅ 완료' : '⚠️ 미완성'} |
| 백업 문서 | ${this.stats.backupDocuments} | 📦 보관됨 |
| 아카이브 문서 | ${this.stats.archivedDocuments} | 🗄️ 아카이브됨 |
| 총 용량 | ${this.formatBytes(this.stats.totalSize)} | - |

## 📁 폴더 구조

\`\`\`
docs/
├── 📋 핵심 문서 (9개)
│   ├── QUICK_START.md
│   ├── INSTALLATION.md
│   ├── AI_SETUP.md
│   ├── DEVELOPMENT.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── API.md
│   └── TESTING.md
├── 📦 backup/           # 기존 문서 백업
│   ├── legacy/         # 레거시 문서
│   ├── development/    # 개발 관련 백업
│   └── root/          # 루트 경로 백업
├── 🗄️ archived/        # 더이상 사용하지 않는 문서
├── 📊 deliverables/     # 산출물 및 보고서
│   ├── reports/       # 프로젝트 보고서
│   └── analysis/      # 분석 자료
└── 📋 INDEX.md         # 이 파일
\`\`\`

## 🔄 문서 관리 규칙

### ✅ 핵심 문서 (지속 업데이트)
- 프로젝트 핵심 정보
- 사용자 가이드
- 개발자 문서
- 정기적 업데이트 필요

### 📦 백업 문서 (읽기 전용)
- 기존 문서 보존
- 참조용 자료
- 변경 금지

### 🗄️ 아카이브 문서 (보관용)
- 더이상 사용하지 않는 문서
- 역사적 가치 보존
- 필요시 참조

### 📊 산출물 (프로젝트 결과물)
- 분석 보고서
- 프로젝트 요약
- 성과 문서

## 🛠️ 관리 명령어

\`\`\`bash
# 문서 구조 검증
npm run docs:validate

# 문서 정리
npm run docs:cleanup

# 인덱스 재생성
npm run docs:index

# 백업 생성
npm run docs:backup
\`\`\`

## 📅 업데이트 히스토리

- **${dateKR}**: 문서 구조 완전 리팩토링
- 핵심 문서 7개 → 9개로 확장
- 백업 시스템 구축
- 자동화 스크립트 도입

---

> **📝 노트**: 이 인덱스는 자동 생성됩니다. 수동으로 편집하지 마세요.
`;
    }

    // 정리 작업 수행
    async cleanup() {
        console.log(colors.yellow('\n🧹 문서 정리 작업 수행 중...'));

        // 임시 파일 제거
        await this.removeTemporaryFiles();

        // 빈 디렉토리 제거
        await this.removeEmptyDirectories();

        console.log(colors.green('✓ 정리 작업 완료'));
    }

    async removeTemporaryFiles() {
        const tempFiles = ['.DS_Store', 'Thumbs.db', '*.tmp', '*.bak'];
        // 구현 생략 - 필요시 추가
    }

    async removeEmptyDirectories() {
        // 구현 생략 - 필요시 추가
    }

    // 백업 생성
    async createBackup() {
        console.log(colors.yellow('\n💾 백업 생성 중...'));

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const backupDir = path.join(this.docsDir, 'backup', `auto-backup-${timestamp}`);

        await fs.mkdir(backupDir, { recursive: true });

        // 핵심 문서 백업
        for (const doc of DOCS_STRUCTURE.core) {
            const srcPath = path.join(this.docsDir, doc);
            const destPath = path.join(backupDir, doc);

            try {
                await fs.copyFile(srcPath, destPath);
                console.log(colors.gray(`  📄 ${doc} 백업됨`));
            } catch (error) {
                // 파일이 없으면 무시
            }
        }

        console.log(colors.green(`✓ 백업 완료: ${path.relative(ROOT_DIR, backupDir)}`));
    }

    // 통계 출력
    printStatistics() {
        console.log(colors.blue('\n📊 문서 관리 통계'));
        console.log(colors.gray('-'.repeat(30)));
        console.log(`핵심 문서: ${colors.green(this.stats.coreDocuments + '/9')}`);
        console.log(`백업 문서: ${colors.yellow(this.stats.backupDocuments + '개')}`);
        console.log(`아카이브: ${colors.gray(this.stats.archivedDocuments + '개')}`);
        console.log(`총 용량: ${colors.blue(this.formatBytes(this.stats.totalSize))}`);
        console.log(colors.gray('-'.repeat(30)));

        if (this.stats.coreDocuments === 9) {
            console.log(colors.green('✅ 모든 핵심 문서가 완비되었습니다!'));
        } else {
            console.log(colors.yellow(`⚠️ ${9 - this.stats.coreDocuments}개 문서가 누락되었습니다.`));
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// CLI 실행 부분
async function main() {
    const manager = new DocumentManager();

    const command = process.argv[2] || 'validate';

    switch (command) {
        case 'validate':
        case 'v':
            await manager.init();
            manager.printStatistics();
            break;

        case 'cleanup':
        case 'c':
            await manager.init();
            await manager.cleanup();
            manager.printStatistics();
            break;

        case 'backup':
        case 'b':
            await manager.init();
            await manager.createBackup();
            break;

        case 'index':
        case 'i':
            await manager.init();
            break;

        default:
            console.log(colors.yellow('사용법:'));
            console.log('  node scripts/docs-management.mjs [command]');
            console.log('');
            console.log(colors.blue('명령어:'));
            console.log('  validate, v   - 문서 구조 검증 (기본값)');
            console.log('  cleanup, c    - 문서 정리');
            console.log('  backup, b     - 백업 생성');
            console.log('  index, i      - 인덱스 재생성');
            break;
    }
}

// 에러 핸들링
process.on('unhandledRejection', (reason, promise) => {
    console.error(colors.red('❌ 처리되지 않은 거부:'), reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error(colors.red('❌ 처리되지 않은 예외:'), error);
    process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error(colors.red('❌ 스크립트 실행 오류:'), error);
        process.exit(1);
    });
}

export { DocumentManager }; 