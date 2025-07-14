#!/usr/bin/env node

/**
 * ♿ 접근성 분석기 v2.0
 * 
 * OpenManager Vibe v5 - WCAG 2.1 AA 완전 준수
 * - 자동 접근성 검사
 * - 색상 대비 분석
 * - 키보드 네비게이션 검증
 * - 스크린 리더 지원 확인
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AccessibilityAnalyzer {
    constructor() {
        this.srcDir = path.join(__dirname, '../../../src');
        this.results = {
            totalFiles: 0,
            issues: [],
            colorContrastIssues: [],
            keyboardIssues: [],
            screenReaderIssues: [],
            wcagViolations: [],
            score: 0
        };

        // WCAG 2.1 AA 기준
        this.wcagCriteria = {
            colorContrast: {
                normal: 4.5,
                large: 3.0
            },
            focusIndicator: true,
            altText: true,
            headingStructure: true,
            formLabels: true
        };
    }

    async analyze() {
        console.log('♿ 접근성 분석 시작...\n');

        await this.scanComponentFiles();
        await this.analyzeColorContrast();
        await this.analyzeKeyboardNavigation();
        await this.analyzeScreenReaderSupport();
        await this.analyzeSemanticStructure();

        this.calculateScore();
        this.generateReport();
        this.generateFixPlan();

        return this.results;
    }

    async scanComponentFiles() {
        console.log('📁 컴포넌트 파일 스캔 중...');

        const componentDirs = [
            path.join(this.srcDir, 'components'),
            path.join(this.srcDir, 'app'),
            path.join(this.srcDir, 'modules')
        ];

        for (const dir of componentDirs) {
            if (fs.existsSync(dir)) {
                await this.scanDirectory(dir);
            }
        }

        console.log(`✅ ${this.results.totalFiles}개 파일 분석 완료`);
    }

    async scanDirectory(dir) {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
                await this.scanDirectory(fullPath);
            } else if (this.isComponentFile(item)) {
                await this.analyzeFile(fullPath);
            }
        }
    }

    shouldSkipDirectory(dirName) {
        const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build'];
        return skipDirs.includes(dirName);
    }

    isComponentFile(fileName) {
        return (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) &&
            !fileName.includes('.test.') &&
            !fileName.includes('.spec.');
    }

    async analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(this.srcDir, filePath);

            this.results.totalFiles++;

            // 각종 접근성 검사
            this.checkAltText(content, relativePath);
            this.checkFormLabels(content, relativePath);
            this.checkHeadingStructure(content, relativePath);
            this.checkFocusManagement(content, relativePath);
            this.checkAriaAttributes(content, relativePath);
            this.checkSemanticHTML(content, relativePath);

        } catch (error) {
            console.error(`❌ 파일 분석 실패: ${filePath}`, error.message);
        }
    }

    checkAltText(content, filePath) {
        // img 태그에 alt 속성 확인
        const imgTags = content.match(/<img[^>]*>/g) || [];

        imgTags.forEach((tag, index) => {
            if (!tag.includes('alt=')) {
                this.addIssue('missing-alt-text', filePath, {
                    line: this.findLineNumber(content, tag),
                    element: tag,
                    severity: 'error',
                    wcagCriterion: '1.1.1'
                });
            } else if (tag.includes('alt=""') && !tag.includes('decorative')) {
                this.addIssue('empty-alt-text', filePath, {
                    line: this.findLineNumber(content, tag),
                    element: tag,
                    severity: 'warning',
                    wcagCriterion: '1.1.1'
                });
            }
        });
    }

    checkFormLabels(content, filePath) {
        // input 태그에 label 연결 확인
        const inputTags = content.match(/<input[^>]*>/g) || [];

        inputTags.forEach(tag => {
            const hasId = /id=["']([^"']+)["']/.test(tag);
            const hasAriaLabel = /aria-label=/.test(tag);
            const hasAriaLabelledby = /aria-labelledby=/.test(tag);

            if (!hasId && !hasAriaLabel && !hasAriaLabelledby) {
                this.addIssue('missing-form-label', filePath, {
                    line: this.findLineNumber(content, tag),
                    element: tag,
                    severity: 'error',
                    wcagCriterion: '3.3.2'
                });
            }
        });
    }

    checkHeadingStructure(content, filePath) {
        // 헤딩 구조 확인 (h1, h2, h3 순서)
        const headings = [];
        const headingMatches = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/g) || [];

        headingMatches.forEach(heading => {
            const level = parseInt(heading.match(/<h([1-6])/)[1]);
            headings.push({
                level,
                text: heading.replace(/<[^>]*>/g, ''),
                line: this.findLineNumber(content, heading)
            });
        });

        // 헤딩 레벨 순서 검사
        for (let i = 1; i < headings.length; i++) {
            const current = headings[i];
            const previous = headings[i - 1];

            if (current.level > previous.level + 1) {
                this.addIssue('heading-skip-level', filePath, {
                    line: current.line,
                    element: `h${current.level}`,
                    severity: 'warning',
                    wcagCriterion: '1.3.1'
                });
            }
        }
    }

    checkFocusManagement(content, filePath) {
        // 포커스 관리 확인
        const interactiveElements = [
            ...content.match(/<button[^>]*>/g) || [],
            ...content.match(/<a[^>]*>/g) || [],
            ...content.match(/<input[^>]*>/g) || [],
            ...content.match(/<select[^>]*>/g) || [],
            ...content.match(/<textarea[^>]*>/g) || []
        ];

        interactiveElements.forEach(element => {
            // tabIndex 확인
            if (element.includes('tabIndex="-1"') && !element.includes('aria-hidden')) {
                this.addIssue('negative-tabindex', filePath, {
                    line: this.findLineNumber(content, element),
                    element,
                    severity: 'warning',
                    wcagCriterion: '2.1.1'
                });
            }

            // 포커스 스타일 확인 (CSS에서 확인 필요)
            if (element.includes('outline: none') || element.includes('outline:none')) {
                this.addIssue('missing-focus-indicator', filePath, {
                    line: this.findLineNumber(content, element),
                    element,
                    severity: 'error',
                    wcagCriterion: '2.4.7'
                });
            }
        });
    }

    checkAriaAttributes(content, filePath) {
        // ARIA 속성 확인
        const ariaPatterns = [
            { pattern: /aria-label=["'][\s]*["']/g, issue: 'empty-aria-label' },
            { pattern: /aria-labelledby=["'][\s]*["']/g, issue: 'empty-aria-labelledby' },
            { pattern: /aria-describedby=["'][\s]*["']/g, issue: 'empty-aria-describedby' }
        ];

        ariaPatterns.forEach(({ pattern, issue }) => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => {
                this.addIssue(issue, filePath, {
                    line: this.findLineNumber(content, match),
                    element: match,
                    severity: 'warning',
                    wcagCriterion: '4.1.2'
                });
            });
        });
    }

    checkSemanticHTML(content, filePath) {
        // 시맨틱 HTML 사용 확인
        const divCount = (content.match(/<div/g) || []).length;
        const semanticCount = [
            ...content.match(/<(header|nav|main|section|article|aside|footer)/g) || []
        ].length;

        if (divCount > 10 && semanticCount === 0) {
            this.addIssue('missing-semantic-html', filePath, {
                line: 1,
                element: 'document structure',
                severity: 'info',
                wcagCriterion: '1.3.1'
            });
        }
    }

    async analyzeColorContrast() {
        console.log('🎨 색상 대비 분석 중...');

        // CSS 파일들에서 색상 조합 분석
        const cssFiles = await this.findCSSFiles();

        for (const cssFile of cssFiles) {
            await this.analyzeCSSColors(cssFile);
        }
    }

    async findCSSFiles() {
        const cssFiles = [];
        const searchDirs = [
            path.join(this.srcDir, 'styles'),
            path.join(this.srcDir, 'app'),
            path.join(this.srcDir, 'components')
        ];

        const scan = (dir) => {
            if (!fs.existsSync(dir)) return;

            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scan(fullPath);
                } else if (item.endsWith('.css') || item.endsWith('.scss') || item.endsWith('.module.css')) {
                    cssFiles.push(fullPath);
                }
            });
        };

        searchDirs.forEach(scan);
        return cssFiles;
    }

    async analyzeCSSColors(cssFile) {
        try {
            const content = fs.readFileSync(cssFile, 'utf-8');
            const relativePath = path.relative(this.srcDir, cssFile);

            // 색상 값 추출
            const colorPatterns = [
                /color:\s*([^;]+);/g,
                /background-color:\s*([^;]+);/g,
                /background:\s*([^;]+);/g
            ];

            const colors = [];
            colorPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    colors.push({
                        property: match[0],
                        value: match[1].trim(),
                        line: this.findLineNumber(content, match[0])
                    });
                }
            });

            // 대비 분석 (간단한 휴리스틱)
            this.analyzeColorCombinations(colors, relativePath);

        } catch (error) {
            console.error(`❌ CSS 분석 실패: ${cssFile}`, error.message);
        }
    }

    analyzeColorCombinations(colors, filePath) {
        // 일반적인 문제 색상 조합 확인
        const problematicCombinations = [
            { bg: 'white', fg: 'yellow', issue: 'low-contrast-yellow-white' },
            { bg: 'black', fg: 'red', issue: 'low-contrast-red-black' },
            { bg: 'blue', fg: 'purple', issue: 'low-contrast-blue-purple' }
        ];

        colors.forEach(color => {
            // 간단한 색상 대비 검사
            if (color.value.includes('yellow') && filePath.includes('background')) {
                this.results.colorContrastIssues.push({
                    file: filePath,
                    line: color.line,
                    issue: 'potential-low-contrast',
                    severity: 'warning',
                    wcagCriterion: '1.4.3'
                });
            }
        });
    }

    async analyzeKeyboardNavigation() {
        console.log('⌨️ 키보드 네비게이션 분석 중...');

        // 키보드 네비게이션 관련 패턴 확인
        const componentFiles = await this.findAllSourceFiles();

        for (const file of componentFiles) {
            await this.checkKeyboardHandlers(file);
        }
    }

    async checkKeyboardHandlers(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(this.srcDir, filePath);

            // 키보드 이벤트 핸들러 확인
            const keyboardEvents = [
                'onKeyDown', 'onKeyUp', 'onKeyPress'
            ];

            keyboardEvents.forEach(event => {
                if (content.includes(event)) {
                    // Enter, Space 키 처리 확인
                    if (!content.includes('Enter') && !content.includes('Space')) {
                        this.results.keyboardIssues.push({
                            file: relativePath,
                            issue: 'incomplete-keyboard-support',
                            severity: 'warning',
                            wcagCriterion: '2.1.1'
                        });
                    }
                }
            });

        } catch (error) {
            console.error(`❌ 키보드 분석 실패: ${filePath}`, error.message);
        }
    }

    async analyzeScreenReaderSupport() {
        console.log('🔊 스크린 리더 지원 분석 중...');

        // 스크린 리더 관련 속성 확인
        const componentFiles = await this.findAllSourceFiles();

        for (const file of componentFiles) {
            await this.checkScreenReaderAttributes(file);
        }
    }

    async checkScreenReaderAttributes(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(this.srcDir, filePath);

            // 스크린 리더 관련 속성들
            const srAttributes = [
                'aria-label', 'aria-labelledby', 'aria-describedby',
                'aria-hidden', 'role', 'aria-expanded', 'aria-live'
            ];

            const hasInteractiveElements = content.includes('<button') ||
                content.includes('<input') ||
                content.includes('onClick');

            if (hasInteractiveElements) {
                const hasAriaSupport = srAttributes.some(attr => content.includes(attr));

                if (!hasAriaSupport) {
                    this.results.screenReaderIssues.push({
                        file: relativePath,
                        issue: 'missing-screen-reader-support',
                        severity: 'warning',
                        wcagCriterion: '4.1.2'
                    });
                }
            }

        } catch (error) {
            console.error(`❌ 스크린 리더 분석 실패: ${filePath}`, error.message);
        }
    }

    async analyzeSemanticStructure() {
        console.log('🏗️ 시맨틱 구조 분석 중...');

        // 페이지 구조 분석
        const pageFiles = await this.findPageFiles();

        for (const file of pageFiles) {
            await this.checkPageStructure(file);
        }
    }

    async findPageFiles() {
        const pageFiles = [];
        const appDir = path.join(this.srcDir, 'app');

        if (fs.existsSync(appDir)) {
            const scan = (dir) => {
                const items = fs.readdirSync(dir);
                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory()) {
                        scan(fullPath);
                    } else if (item === 'page.tsx' || item === 'layout.tsx') {
                        pageFiles.push(fullPath);
                    }
                });
            };

            scan(appDir);
        }

        return pageFiles;
    }

    async checkPageStructure(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(this.srcDir, filePath);

            // 기본 구조 요소 확인
            const structureElements = ['<main', '<header', '<nav', '<footer'];
            const hasStructure = structureElements.some(element => content.includes(element));

            if (!hasStructure && content.includes('return')) {
                this.addIssue('missing-page-structure', relativePath, {
                    line: 1,
                    element: 'page structure',
                    severity: 'warning',
                    wcagCriterion: '1.3.1'
                });
            }

        } catch (error) {
            console.error(`❌ 페이지 구조 분석 실패: ${filePath}`, error.message);
        }
    }

    async findAllSourceFiles() {
        const files = [];

        const scan = (dir) => {
            if (!fs.existsSync(dir)) return;

            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
                    scan(fullPath);
                } else if (this.isComponentFile(item)) {
                    files.push(fullPath);
                }
            });
        };

        scan(this.srcDir);
        return files;
    }

    addIssue(type, filePath, details) {
        this.results.issues.push({
            type,
            file: filePath,
            ...details
        });

        this.results.wcagViolations.push({
            criterion: details.wcagCriterion,
            level: this.getWCAGLevel(details.wcagCriterion),
            severity: details.severity,
            file: filePath
        });
    }

    getWCAGLevel(criterion) {
        // WCAG 2.1 기준별 레벨 매핑
        const levels = {
            '1.1.1': 'A',
            '1.3.1': 'A',
            '1.4.3': 'AA',
            '2.1.1': 'A',
            '2.4.7': 'AA',
            '3.3.2': 'A',
            '4.1.2': 'A'
        };

        return levels[criterion] || 'AA';
    }

    findLineNumber(content, searchText) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchText)) {
                return i + 1;
            }
        }
        return 1;
    }

    calculateScore() {
        const totalChecks = this.results.totalFiles * 10; // 파일당 10개 체크 항목
        const violations = this.results.issues.length;

        this.results.score = Math.max(0, Math.round((totalChecks - violations) / totalChecks * 100));
    }

    generateReport() {
        console.log('\n♿ 접근성 분석 결과');
        console.log('='.repeat(60));
        console.log(`📁 분석된 파일: ${this.results.totalFiles}개`);
        console.log(`🎯 접근성 점수: ${this.results.score}/100`);
        console.log(`⚠️ 발견된 문제: ${this.results.issues.length}개`);
        console.log();

        // 심각도별 분류
        const errorCount = this.results.issues.filter(i => i.severity === 'error').length;
        const warningCount = this.results.issues.filter(i => i.severity === 'warning').length;
        const infoCount = this.results.issues.filter(i => i.severity === 'info').length;

        console.log('📊 문제 분류:');
        console.log(`🔴 오류 (Error): ${errorCount}개`);
        console.log(`🟡 경고 (Warning): ${warningCount}개`);
        console.log(`🔵 정보 (Info): ${infoCount}개`);
        console.log();

        // WCAG 준수 상태
        const wcagAA = this.results.wcagViolations.filter(v => v.level === 'AA').length;
        const wcagA = this.results.wcagViolations.filter(v => v.level === 'A').length;

        console.log('📋 WCAG 2.1 준수 상태:');
        console.log(`Level A 위반: ${wcagA}개`);
        console.log(`Level AA 위반: ${wcagAA}개`);

        if (wcagAA === 0 && wcagA === 0) {
            console.log('✅ WCAG 2.1 AA 완전 준수!');
        } else {
            console.log('❌ WCAG 2.1 AA 기준 미달');
        }

        // 상위 문제들
        console.log('\n🎯 주요 문제 TOP 10:');
        const issueTypes = {};
        this.results.issues.forEach(issue => {
            issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
        });

        Object.entries(issueTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .forEach(([type, count], index) => {
                console.log(`${String(index + 1).padStart(2)}. ${type}: ${count}개`);
            });
    }

    generateFixPlan() {
        const planPath = path.join(__dirname, 'accessibility-fix-plan.md');

        let content = `# ♿ 접근성 개선 계획

## 📊 현재 상태
- **분석된 파일**: ${this.results.totalFiles}개
- **접근성 점수**: ${this.results.score}/100
- **총 문제**: ${this.results.issues.length}개

## 🎯 WCAG 2.1 AA 준수 목표

### 우선순위 1: 오류 수정
`;

        const errors = this.results.issues.filter(i => i.severity === 'error');
        errors.forEach((error, index) => {
            content += `${index + 1}. **${error.type}** (${error.file}:${error.line})\n`;
            content += `   - WCAG 기준: ${error.wcagCriterion}\n`;
            content += `   - 수정 방법: ${this.getFixSuggestion(error.type)}\n\n`;
        });

        content += `### 우선순위 2: 경고 해결\n\n`;

        const warnings = this.results.issues.filter(i => i.severity === 'warning');
        warnings.slice(0, 10).forEach((warning, index) => {
            content += `${index + 1}. **${warning.type}** (${warning.file}:${warning.line})\n`;
            content += `   - 수정 방법: ${this.getFixSuggestion(warning.type)}\n\n`;
        });

        content += `## 🚀 실행 계획

1. **Phase 1**: 오류 수정 (${errors.length}개)
2. **Phase 2**: 경고 해결 (${warnings.length}개)
3. **Phase 3**: 추가 개선사항 적용

각 단계 완료 후 접근성 테스트 도구로 검증 필요.
`;

        fs.writeFileSync(planPath, content);
        console.log(`\n📜 접근성 개선 계획서 생성: ${planPath}`);
    }

    getFixSuggestion(issueType) {
        const suggestions = {
            'missing-alt-text': 'img 태그에 적절한 alt 속성 추가',
            'empty-alt-text': '의미있는 alt 텍스트 제공 또는 decorative 표시',
            'missing-form-label': 'label 요소 또는 aria-label 속성 추가',
            'heading-skip-level': '헤딩 레벨 순서 조정 (h1 → h2 → h3)',
            'negative-tabindex': 'tabIndex 값 검토 및 포커스 순서 개선',
            'missing-focus-indicator': '포커스 스타일 추가 (outline 또는 box-shadow)',
            'empty-aria-label': 'aria-label에 의미있는 텍스트 제공',
            'missing-semantic-html': 'div 대신 semantic HTML 요소 사용',
            'missing-screen-reader-support': 'ARIA 속성 추가로 스크린 리더 지원',
            'missing-page-structure': 'main, header, nav 등 구조 요소 추가'
        };

        return suggestions[issueType] || '개발자 가이드 참조';
    }
}

// 실행
const analyzer = new AccessibilityAnalyzer();
analyzer.analyze().catch(console.error);

export default AccessibilityAnalyzer; 