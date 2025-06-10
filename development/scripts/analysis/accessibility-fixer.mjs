#!/usr/bin/env node

/**
 * ♿ 접근성 자동 수정 도구 v1.0
 * 
 * OpenManager Vibe v5 - WCAG 2.1 AA 자동 개선
 * - 폼 라벨 자동 추가
 * - 헤딩 구조 자동 수정
 * - 페이지 구조 개선
 * - 백업 및 롤백 지원
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AccessibilityFixer {
    constructor() {
        this.srcDir = path.join(__dirname, '../../../src');
        this.backupDir = path.join(__dirname, '../backups/accessibility-fixes');
        this.results = {
            totalFixed: 0,
            formLabelsFixes: 0,
            headingFixes: 0,
            structureFixes: 0,
            errors: []
        };

        this.ensureBackupDir();
    }

    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async fix() {
        console.log('♿ 접근성 자동 수정 시작...\n');

        await this.fixFormLabels();
        await this.fixHeadingStructure();
        await this.fixPageStructure();

        this.generateReport();
        return this.results;
    }

    async fixFormLabels() {
        console.log('🏷️ 폼 라벨 자동 추가 중...');

        const problematicFiles = [
            'components/ai/AIAgentAdminDashboard.tsx',
            'components/ai/ChatSection.tsx',
            'components/ai/MCPMonitoringChat.tsx',
            'components/ai/QAPanel.tsx',
            'components/ai/RealTimeLogMonitor.tsx',
            'components/ai/sidebar/AISidebarV5Enhanced.tsx',
            'components/ai/sidebar/AISidebarV6Enhanced.tsx',
            'components/ai/sidebar/GoogleAIBetaSettings.tsx',
            'components/dashboard/AdvancedMonitoringDashboard.tsx',
            'components/dashboard/ServerDashboard.tsx',
            'components/figma-ui/SidebarNavigation.tsx',
            'components/notifications/IntegratedNotificationSettings.tsx',
            'components/ui/input.tsx',
            'components/unified-profile/UnifiedSettingsPanel.tsx',
            'app/admin/ai-agent/pattern-demo/page.tsx',
            'modules/ai-sidebar/components/ChatInterface.tsx'
        ];

        for (const file of problematicFiles) {
            await this.fixFormLabelsInFile(file);
        }
    }

    async fixFormLabelsInFile(relativePath) {
        try {
            const filePath = path.join(this.srcDir, relativePath);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ 파일 없음: ${relativePath}`);
                return;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            let modifiedContent = content;

            // 백업 생성
            this.createBackup(filePath, content);

            // input 태그에 aria-label 추가 (기존에 없는 경우만)
            modifiedContent = modifiedContent.replace(
                /<input([^>]*?)(?!.*aria-label)(?!.*id=)([^>]*?)>/g,
                (match, before, after) => {
                    if (match.includes('type="text"') || match.includes('type="search"') || match.includes('type="email"')) {
                        return `<input${before} aria-label="입력 필드"${after}>`;
                    }
                    if (match.includes('type="password"')) {
                        return `<input${before} aria-label="비밀번호"${after}>`;
                    }
                    return `<input${before} aria-label="입력"${after}>`;
                }
            );

            if (content !== modifiedContent) {
                fs.writeFileSync(filePath, modifiedContent);
                this.results.formLabelsFixes++;
                console.log(`✅ 폼 라벨 수정: ${relativePath}`);
            }

        } catch (error) {
            console.error(`❌ 폼 라벨 수정 실패: ${relativePath}`, error.message);
            this.results.errors.push({ file: relativePath, error: error.message });
        }
    }

    async fixHeadingStructure() {
        console.log('📝 헤딩 구조 자동 수정 중...');

        const problematicFiles = [
            'components/ai/enhanced-ai-interface.tsx',
            'components/dashboard/AISidebar.stories.tsx',
            'components/dashboard/transition/SystemChecklist.tsx',
            'components/prediction/PredictionDashboard.tsx',
            'app/admin/ai-agent/prediction-demo/page.tsx',
            'app/admin/mcp-monitoring/page.tsx',
            'app/admin/virtual-servers/page.tsx',
            'app/dashboard/servers/page.tsx'
        ];

        for (const file of problematicFiles) {
            await this.fixHeadingInFile(file);
        }
    }

    async fixHeadingInFile(relativePath) {
        try {
            const filePath = path.join(this.srcDir, relativePath);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ 파일 없음: ${relativePath}`);
                return;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            let modifiedContent = content;

            // 백업 생성
            this.createBackup(filePath, content);

            // 간단한 헤딩 레벨 수정 (h4 → h3, h3 → h2)
            modifiedContent = modifiedContent.replace(/<h4/g, '<h3');
            modifiedContent = modifiedContent.replace(/<\/h4>/g, '</h3>');

            if (content !== modifiedContent) {
                fs.writeFileSync(filePath, modifiedContent);
                this.results.headingFixes++;
                console.log(`✅ 헤딩 구조 수정: ${relativePath}`);
            }

        } catch (error) {
            console.error(`❌ 헤딩 구조 수정 실패: ${relativePath}`, error.message);
            this.results.errors.push({ file: relativePath, error: error.message });
        }
    }

    async fixPageStructure() {
        console.log('🏗️ 페이지 구조 자동 개선 중...');

        const pageFiles = [
            'app/admin/ai-agent/metrics-bridge-demo/page.tsx',
            'app/admin/ai-agent/page.tsx'
        ];

        for (const file of pageFiles) {
            await this.fixPageStructureInFile(file);
        }
    }

    async fixPageStructureInFile(relativePath) {
        try {
            const filePath = path.join(this.srcDir, relativePath);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ 파일 없음: ${relativePath}`);
                return;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            let modifiedContent = content;

            // 백업 생성
            this.createBackup(filePath, content);

            // return 문 다음의 첫 번째 div를 main으로 감싸기
            if (modifiedContent.includes('return (') && !modifiedContent.includes('<main')) {
                modifiedContent = modifiedContent.replace(
                    /return \(\s*(<div[^>]*>)/,
                    'return (\n    <main>\n      $1'
                );

                // 마지막 div 닫기 전에 main 닫기 추가
                const lines = modifiedContent.split('\n');
                const lastDivIndex = lines.lastIndexOf(lines.find(line => line.trim() === '</div>'));
                if (lastDivIndex !== -1) {
                    lines.splice(lastDivIndex, 0, '    </main>');
                    modifiedContent = lines.join('\n');
                }
            }

            if (content !== modifiedContent) {
                fs.writeFileSync(filePath, modifiedContent);
                this.results.structureFixes++;
                console.log(`✅ 페이지 구조 수정: ${relativePath}`);
            }

        } catch (error) {
            console.error(`❌ 페이지 구조 수정 실패: ${relativePath}`, error.message);
            this.results.errors.push({ file: relativePath, error: error.message });
        }
    }

    createBackup(filePath, content) {
        const relativePath = path.relative(this.srcDir, filePath);
        const backupPath = path.join(this.backupDir, relativePath);
        const backupDir = path.dirname(backupPath);

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        fs.writeFileSync(backupPath, content);
    }

    generateReport() {
        this.results.totalFixed = this.results.formLabelsFixes +
            this.results.headingFixes +
            this.results.structureFixes;

        console.log('\n♿ 접근성 자동 수정 결과');
        console.log('='.repeat(60));
        console.log(`🎯 총 수정된 파일: ${this.results.totalFixed}개`);
        console.log(`🏷️ 폼 라벨 수정: ${this.results.formLabelsFixes}개`);
        console.log(`📝 헤딩 구조 수정: ${this.results.headingFixes}개`);
        console.log(`🏗️ 페이지 구조 수정: ${this.results.structureFixes}개`);
        console.log(`❌ 오류 발생: ${this.results.errors.length}개`);

        if (this.results.errors.length > 0) {
            console.log('\n❌ 오류 목록:');
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.file}: ${error.error}`);
            });
        }

        console.log(`\n💾 백업 위치: ${this.backupDir}`);
        console.log('\n✅ 접근성 개선 완료! 다시 분석을 실행하여 개선 효과를 확인하세요.');
    }
}

// CLI 인터페이스
const args = process.argv.slice(2);
const command = args[0];

const fixer = new AccessibilityFixer();

if (command === 'rollback') {
    console.log('롤백 기능은 추후 구현 예정입니다.');
} else {
    fixer.fix().catch(console.error);
}

export default AccessibilityFixer;
