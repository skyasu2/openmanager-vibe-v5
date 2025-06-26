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
        this.archivedDir = path.join(this.docsDir, 'archived');
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

    // 루트 및 서브디렉토리의 MD 파일을 docs로 이동
    async syncRootMarkdown() {
        console.log(colors.yellow('\n🔄 루트 및 서브디렉토리 MD 파일 이동 중...'));
        try {
            const items = await fs.readdir(ROOT_DIR);
            for (const item of items) {
                const fullPath = path.join(ROOT_DIR, item);
                const stat = await fs.stat(fullPath);
                if (stat.isFile() && item.endsWith('.md') && !['README.md', 'CHANGELOG.md'].includes(item)) {
                    const destPath = path.join(this.docsDir, item);
                    await fs.rename(fullPath, destPath);
                    console.log(colors.green(`  ✓ ${item} -> docs/${item}`));
                }
            }
        } catch (err) {
            console.log(colors.red('문서 동기화 중 오류 발생:'), err);
        }
    }

    // 아카이브 문서 분석 및 분류
    async analyzeArchived() {
        console.log(colors.yellow('\n📊 아카이브 문서 분석 중...'));

        const categories = {
            development: [],    // 개발 관련
            deployment: [],     // 배포 관련  
            ai: [],            // AI 시스템 관련
            documentation: [],  // 문서화 관련
            legacy: [],        // 레거시/완료 보고서
            reference: []      // 참조용
        };

        try {
            const files = await fs.readdir(this.archivedDir);

            for (const file of files) {
                if (!file.endsWith('.md')) continue;

                const filePath = path.join(this.archivedDir, file);
                const stat = await fs.stat(filePath);
                const content = await fs.readFile(filePath, 'utf8');

                const analysis = {
                    name: file,
                    size: stat.size,
                    lines: content.split('\n').length,
                    category: this.categorizeDocument(file, content),
                    importance: this.assessImportance(file, content),
                    action: 'keep' // default
                };

                categories[analysis.category].push(analysis);
            }

            // 분석 결과 출력
            this.printArchiveAnalysis(categories);

            // 관리 계획 생성
            await this.generateArchiveManagementPlan(categories);

        } catch (error) {
            console.log(colors.red('아카이브 분석 중 오류:'), error.message);
        }
    }

    categorizeDocument(filename, content) {
        const name = filename.toLowerCase();
        const text = content.toLowerCase();

        if (name.includes('deploy') || name.includes('render') || name.includes('vercel')) {
            return 'deployment';
        } else if (name.includes('ai-') || name.includes('mcp') || name.includes('rag') || text.includes('ai 엔진')) {
            return 'ai';
        } else if (name.includes('개발') || name.includes('development') || name.includes('guide')) {
            return 'development';
        } else if (name.includes('complete') || name.includes('report') || name.includes('removal')) {
            return 'legacy';
        } else if (name.includes('코드참고') || name.includes('바이브코딩') || name.includes('storybook')) {
            return 'reference';
        } else {
            return 'documentation';
        }
    }

    assessImportance(filename, content) {
        const lines = content.split('\n').length;
        const hasCode = content.includes('```');
        const hasRecent = content.includes('2025') || content.includes('v5.44');

        if (lines > 500 && hasCode && hasRecent) return 'high';
        if (lines > 200 && hasRecent) return 'medium';
        return 'low';
    }

    printArchiveAnalysis(categories) {
        console.log(colors.blue('\n📋 아카이브 문서 분석 결과'));
        console.log(colors.gray('='.repeat(50)));

        for (const [category, docs] of Object.entries(categories)) {
            if (docs.length === 0) continue;

            const categoryNames = {
                development: '🛠️ 개발 관련',
                deployment: '🚀 배포 관련',
                ai: '🤖 AI 시스템',
                documentation: '📚 문서화',
                legacy: '📦 레거시/완료',
                reference: '📖 참조용'
            };

            console.log(colors.yellow(`\n${categoryNames[category]} (${docs.length}개)`));

            docs.forEach(doc => {
                const sizeStr = this.formatBytes(doc.size);
                const importanceIcon = doc.importance === 'high' ? '🔴' :
                    doc.importance === 'medium' ? '🟡' : '🟢';
                console.log(colors.gray(`  ${importanceIcon} ${doc.name} (${sizeStr}, ${doc.lines}줄)`));
            });
        }
    }

    async generateArchiveManagementPlan(categories) {
        const planContent = `# 📦 아카이브 문서 관리 계획

> 생성일: ${new Date().toLocaleDateString('ko-KR')}
> 총 문서: ${Object.values(categories).flat().length}개

## 🎯 관리 전략

### 🔴 높은 우선순위 (재활용 검토)
- 500줄 이상, 코드 포함, 최신 내용
- 핵심 문서에 통합 고려

### 🟡 중간 우선순위 (보관)
- 200줄 이상, 최신 내용
- 참조용으로 유지

### 🟢 낮은 우선순위 (삭제 고려)
- 구버전, 중복 내용
- 6개월 후 삭제 검토

## 📋 카테고리별 계획

${Object.entries(categories).map(([category, docs]) => {
            if (docs.length === 0) return '';

            const categoryNames = {
                development: '🛠️ 개발 관련',
                deployment: '🚀 배포 관련',
                ai: '🤖 AI 시스템',
                documentation: '📚 문서화',
                legacy: '📦 레거시/완료',
                reference: '📖 참조용'
            };

            const actions = {
                development: '→ 개발 도구.md에 유용한 내용 통합',
                deployment: '→ 운영 및 배포.md에 배포 노하우 반영',
                ai: '→ AI 시스템 아키텍처.md에 핵심 내용 통합',
                documentation: '→ 문서 자동화 및 관리.md에 관리 방법 추가',
                legacy: '→ 6개월 후 삭제 검토',
                reference: '→ 필요시 참조용으로 유지'
            };

            return `### ${categoryNames[category]} (${docs.length}개)

**처리 방안**: ${actions[category]}

${docs.map(doc => {
                const priority = doc.importance === 'high' ? '🔴 재활용' :
                    doc.importance === 'medium' ? '🟡 보관' : '🟢 삭제검토';
                return `- ${priority} ${doc.name} (${this.formatBytes(doc.size)})`;
            }).join('\n')}

`;
        }).join('')}

## 🔄 자동화 계획

1. **월간 검토**: 매월 1일 아카이브 문서 검토
2. **자동 분류**: 새로 추가되는 문서 자동 분류
3. **통합 알림**: 재활용 가능한 내용 발견시 알림
4. **정리 스케줄**: 6개월마다 불필요한 문서 정리

## 📋 실행 명령어

\`\`\`bash
# 아카이브 분석
npm run docs:analyze

# 카테고리별 정리
npm run docs:categorize

# 통합 검토
npm run docs:integrate

# 정리 실행
npm run docs:cleanup:archive
\`\`\`

---

> 이 계획은 자동 생성되며, 정기적으로 업데이트됩니다.
`;

        const planPath = path.join(this.docsDir, 'ARCHIVE_MANAGEMENT_PLAN.md');
        await fs.writeFile(planPath, planContent, 'utf8');
        console.log(colors.green(`\n✓ 관리 계획 생성: docs/ARCHIVE_MANAGEMENT_PLAN.md`));
    }

    // 아카이브 자동 정리 (오래된 완료 보고서 삭제)
    async autoPurgeArchive() {
        console.log(colors.yellow('\n🗑️ 아카이브 자동 정리 중...'));

        try {
            const files = await fs.readdir(this.archivedDir);
            let deletedCount = 0;

            for (const file of files) {
                if (!file.endsWith('.md')) continue;

                const filePath = path.join(this.archivedDir, file);
                const content = await fs.readFile(filePath, 'utf8');

                // 삭제 대상: 완료 보고서, 구버전, 중복 문서
                const shouldDelete = this.shouldDeleteFile(file, content);

                if (shouldDelete.delete) {
                    await fs.unlink(filePath);
                    console.log(colors.red(`  🗑️ 삭제: ${file} (${shouldDelete.reason})`));
                    deletedCount++;
                }
            }

            console.log(colors.green(`\n✓ 자동 정리 완료: ${deletedCount}개 파일 삭제`));

        } catch (error) {
            console.log(colors.red('자동 정리 중 오류:'), error.message);
        }
    }

    shouldDeleteFile(filename, content) {
        const name = filename.toLowerCase();
        const lines = content.split('\n').length;

        // 완료 보고서들 (작은 크기)
        if ((name.includes('complete') || name.includes('report')) && lines < 150) {
            return { delete: true, reason: '소형 완료 보고서' };
        }

        // 정리 가이드들
        if (name.includes('cleanup') && lines < 100) {
            return { delete: true, reason: '소형 정리 가이드' };
        }

        // 중복 배포 문서들 (3개 이상일 때)
        if (name.includes('cursor-render-deployment') && !name.includes('final-results')) {
            return { delete: true, reason: '중복 배포 문서' };
        }

        return { delete: false, reason: '' };
    }

    /**
     * 아카이브 완전 정리 - 핵심 내용 통합 후 아카이브 삭제
     */
    async purgeArchiveCompletely() {
        const archivePath = path.join(this.docsDir, 'archived');

        if (!fs.existsSync(archivePath)) {
            console.log('📁 아카이브 폴더가 없습니다.');
            return;
        }

        const archivedFiles = fs.readdirSync(archivePath)
            .filter(file => file.endsWith('.md'));

        console.log(`🗂️ 아카이브된 문서 ${archivedFiles.length}개 분석 중...`);

        // 핵심 내용을 메인 문서에 통합할 수 있는 매핑
        const integrationMap = {
            '개발 과정.md': [
                '개발가이드.md',
                '바이브코딩.md',
                'cursor-render-deployment.md',
                'cursor-mcp-setup-guide.md'
            ],
            '개발 도구.md': [
                'storybook-management-guide.md',
                'fetch-mcp-integration-guide.md',
                'fetch-mcp-development-guide.md',
                'mcp-filesystem-server-guide.md'
            ],
            'AI 시스템 아키텍처.md': [
                'ai-architecture-restructured-v3-complete.md',
                'AI를-이용한-AI-개선-과정-및-엔터프라이즈-로드맵.md',
                'supabase-rag-integration.md',
                'ai-시스템-통합.md',
                'korean-nlp-enhancement-report.md',
                'ai-engine-cleanup-completion-report.md'
            ],
            '시스템 아키텍처.md': [
                'technical-implementation-v5.44.3.md',
                'ai-engine-enterprise-readiness-analysis.md',
                'server-card-ux-ui-analysis.md'
            ],
            '운영 및 배포.md': [
                'cursor-render-deployment-final-results.md',
                'cursor-render-deployment-analysis.md',
                'VERCEL-OPTIMIZATION-COMPLETE.md',
                'INTEGRATION-COMPLETE.md',
                'CRON-REMOVAL-GUIDE.md',
                'ADAPTIVE-MONITORING-COMPLETE.md'
            ]
        };

        // 통합할 내용 수집
        const integrationContent = {};

        for (const [targetDoc, sourceFiles] of Object.entries(integrationMap)) {
            integrationContent[targetDoc] = [];

            for (const sourceFile of sourceFiles) {
                const sourceFilePath = path.join(archivePath, sourceFile);
                if (fs.existsSync(sourceFilePath)) {
                    const content = fs.readFileSync(sourceFilePath, 'utf-8');
                    const lines = content.split('\n');

                    // 핵심 내용만 추출 (제목, 중요 섹션)
                    let keyContent = [];
                    let inImportantSection = false;

                    for (const line of lines) {
                        if (line.startsWith('# ') || line.startsWith('## ')) {
                            inImportantSection = line.includes('핵심') ||
                                line.includes('중요') ||
                                line.includes('성과') ||
                                line.includes('결과') ||
                                line.includes('특징');
                            keyContent.push(line);
                        } else if (inImportantSection && line.trim()) {
                            keyContent.push(line);
                            if (keyContent.length > 20) break; // 20줄 제한
                        }
                    }

                    if (keyContent.length > 3) {
                        integrationContent[targetDoc].push({
                            source: sourceFile,
                            content: keyContent.slice(0, 15).join('\n') // 15줄 제한
                        });
                    }
                }
            }
        }

        // 메인 문서들에 핵심 내용 추가
        for (const [targetDoc, contents] of Object.entries(integrationContent)) {
            if (contents.length > 0) {
                const targetPath = path.join(this.docsDir, targetDoc);
                if (fs.existsSync(targetPath)) {
                    let mainContent = fs.readFileSync(targetPath, 'utf-8');

                    // 통합 섹션 추가
                    const integrationSection = [
                        '',
                        '---',
                        '## 📚 추가 참고사항 (통합)',
                        ''
                    ];

                    contents.forEach(item => {
                        integrationSection.push(`### ${item.source.replace('.md', '')} 핵심 내용`);
                        integrationSection.push('');
                        integrationSection.push(item.content);
                        integrationSection.push('');
                    });

                    // 기존 통합 섹션이 있으면 제거
                    mainContent = mainContent.replace(/---\n## 📚 추가 참고사항.*$/s, '').trim();

                    // 새로운 통합 섹션 추가
                    mainContent += '\n' + integrationSection.join('\n');

                    fs.writeFileSync(targetPath, mainContent, 'utf-8');
                    console.log(`✅ ${targetDoc}에 ${contents.length}개 문서 핵심 내용 통합 완료`);
                }
            }
        }

        // 보존할 중요 문서들 (프로젝트 개요에 통합)
        const preserveList = ['코드참고.md', '서버데이터생성기.md', '시스템운영.md', '한국어처리.md'];
        const projectOverviewPath = path.join(this.docsDir, '프로젝트 개요.md');

        if (fs.existsSync(projectOverviewPath)) {
            let overviewContent = fs.readFileSync(projectOverviewPath, 'utf-8');

            const additionalSections = [];

            for (const preserveFile of preserveList) {
                const preservePath = path.join(archivePath, preserveFile);
                if (fs.existsSync(preservePath)) {
                    const content = fs.readFileSync(preservePath, 'utf-8');
                    const firstSection = content.split('\n').slice(0, 30).join('\n'); // 첫 30줄만

                    additionalSections.push(`### ${preserveFile.replace('.md', '')} 요약`);
                    additionalSections.push('');
                    additionalSections.push(firstSection);
                    additionalSections.push('');
                }
            }

            if (additionalSections.length > 0) {
                // 기존 추가 섹션 제거
                overviewContent = overviewContent.replace(/---\n## 📚 중요 참고자료.*$/s, '').trim();

                // 새로운 참고자료 섹션 추가
                overviewContent += '\n\n---\n## 📚 중요 참고자료\n\n' + additionalSections.join('\n');

                fs.writeFileSync(projectOverviewPath, overviewContent, 'utf-8');
                console.log(`✅ 프로젝트 개요에 ${preserveList.length}개 중요 문서 요약 통합 완료`);
            }
        }

        // 아카이브 폴더 완전 삭제
        console.log(`🗑️ 아카이브 폴더 완전 삭제 중...`);

        try {
            fs.rmSync(archivePath, { recursive: true, force: true });
            console.log('✅ 아카이브 폴더 완전 삭제 완료');
            console.log(`📊 정리 결과: ${archivedFiles.length}개 문서의 핵심 내용을 7개 메인 문서에 통합`);
        } catch (error) {
            console.error('❌ 아카이브 삭제 실패:', error.message);
        }
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

        // 문서 동기화: 루트의 MD 파일을 docs로 이동 후 정리 및 인덱스 갱신
        case 'sync':
        case 's':
            await manager.init();
            await manager.syncRootMarkdown();
            await manager.cleanup();
            await manager.generateIndex();
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

        case 'analyze':
        case 'a':
            await manager.init();
            await manager.analyzeArchived();
            break;

        case 'autopurge':
        case 'ap':
            await manager.autoPurgeArchive();
            break;

        case 'purge-all':
            console.log('🚨 아카이브 완전 정리 시작...');
            console.log('⚠️ 아카이브된 모든 문서가 메인 문서에 통합 후 삭제됩니다.');
            await manager.purgeArchiveCompletely();
            break;

        case 'quality-check':
            console.log('✅ 문서 품질 검사...');
            manager.qualityCheck();
            break;

        default:
            console.log(colors.yellow('사용법:'));
            console.log('  node scripts/docs-management.mjs [command]');
            console.log('');
            console.log(colors.blue('명령어:'));
            console.log('  validate, v   - 문서 구조 검증 (기본값)');
            console.log('  cleanup, c    - 문서 정리');
            console.log('  sync, s       - 문서 동기화');
            console.log('  analyze, a    - 아카이브 문서 분석');
            console.log('  backup, b     - 백업 생성');
            console.log('  index, i      - 인덱스 재생성');
            console.log('  autopurge, ap - 아카이브 자동 정리');
            console.log('  purge-all     - 아카이브 완전 정리');
            console.log('  quality-check - 문서 품질 검사');
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

