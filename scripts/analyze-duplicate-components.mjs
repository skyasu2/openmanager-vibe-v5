import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DuplicateComponentAnalyzer {
    constructor() {
        this.rootPath = path.resolve(__dirname, '..');
        this.srcPath = path.join(this.rootPath, 'src');
        this.duplicates = [];
    }

    analyzeDuplicates() {
        console.log('🔍 중복 컴포넌트 분석 시작...');

        const serverCardFiles = [
            'src/components/dashboard/EnhancedServerCard.tsx',
            'src/components/dashboard/ServerCard/ImprovedServerCard.tsx',
            'src/components/dashboard/ServerCard/ServerCard.tsx'
        ];

        const serverModalFiles = [
            'src/components/dashboard/EnhancedServerModal.tsx',
            'src/components/dashboard/ServerDetailModal.tsx'
        ];

        console.log('\n📊 서버 카드 중복 분석:');
        this.analyzeFileGroup(serverCardFiles, 'ServerCard');

        console.log('\n📊 서버 모달 중복 분석:');
        this.analyzeFileGroup(serverModalFiles, 'ServerModal');

        return this.generateRecommendations();
    }

    analyzeFileGroup(files, groupName) {
        files.forEach(file => {
            const fullPath = path.join(this.rootPath, file);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n').length;

                console.log(`  📄 ${path.basename(file)}`);
                console.log(`     크기: ${(stats.size / 1024).toFixed(1)}KB`);
                console.log(`     줄수: ${lines}줄`);
                console.log(`     경로: ${file}`);

                // 사용처 분석
                this.findUsages(file, content);
                console.log('');
            }
        });
    }

    findUsages(file, content) {
        const fileName = path.basename(file, '.tsx');
        const usages = [];

        // grep으로 사용처 찾기 (간단한 검색)
        const searchDirs = ['src', 'tests'];
        searchDirs.forEach(dir => {
            const dirPath = path.join(this.rootPath, dir);
            if (fs.existsSync(dirPath)) {
                this.searchInDirectory(dirPath, fileName, usages);
            }
        });

        console.log(`     사용처: ${usages.length}개 파일`);
        if (usages.length > 0) {
            usages.slice(0, 3).forEach(usage => {
                console.log(`       - ${usage.replace(this.rootPath, '')}`);
            });
            if (usages.length > 3) {
                console.log(`       - ... 외 ${usages.length - 3}개`);
            }
        }
    }

    searchInDirectory(dir, fileName, usages) {
        try {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory() && !file.startsWith('.') && !file.includes('node_modules')) {
                    this.searchInDirectory(filePath, fileName, usages);
                } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        if (content.includes(fileName) && !filePath.includes(fileName)) {
                            usages.push(filePath);
                        }
                    } catch (error) {
                        // 파일 읽기 실패 시 무시
                    }
                }
            });
        } catch (error) {
            // 디렉토리 읽기 실패 시 무시
        }
    }

    generateRecommendations() {
        console.log('\n💡 정리 권장사항:');

        console.log('\n📋 서버 카드 통합 계획:');
        console.log('  🎯 ImprovedServerCard (현재 사용중) → 메인으로 유지');
        console.log('  🗑️ EnhancedServerCard → 삭제 (스토리북/테스트 이동)');
        console.log('  🗑️ ServerCard → 삭제 (모듈 구조는 ImprovedServerCard에 흡수)');

        console.log('\n📋 서버 모달 통합 계획:');
        console.log('  🎯 EnhancedServerModal (현재 사용중) → 메인으로 유지');
        console.log('  🗑️ ServerDetailModal → 삭제 (미사용)');

        console.log('\n📋 추가 정리 대상:');
        console.log('  🗑️ ServerCard/ 디렉토리 → 하위 모듈들 통합 후 삭제');
        console.log('  🗑️ server-detail/ 디렉토리 → EnhancedServerModal로 통합');

        return {
            toDelete: [
                'src/components/dashboard/EnhancedServerCard.tsx',
                'src/components/dashboard/ServerCard/',
                'src/components/dashboard/ServerDetailModal.tsx',
                'src/components/dashboard/server-detail/'
            ],
            toKeep: [
                'src/components/dashboard/ServerCard/ImprovedServerCard.tsx',
                'src/components/dashboard/EnhancedServerModal.tsx'
            ]
        };
    }

    async cleanupDuplicates() {
        console.log('\n🧹 중복 컴포넌트 정리 시작...');

        const plan = this.generateRecommendations();

        // 1. 스토리북/테스트 이동
        await this.moveStorybook();

        // 2. 사용처 업데이트
        await this.updateUsages();

        // 3. 중복 파일 삭제
        await this.deleteFiles(plan.toDelete);

        console.log('✅ 중복 컴포넌트 정리 완료!');
    }

    async moveStorybook() {
        console.log('📚 스토리북 파일 업데이트...');

        const storyPath = path.join(this.rootPath, 'src/stories/EnhancedServerCard.stories.tsx');
        if (fs.existsSync(storyPath)) {
            let content = fs.readFileSync(storyPath, 'utf-8');
            content = content.replace(
                "import EnhancedServerCard from '../components/dashboard/EnhancedServerCard';",
                "import ImprovedServerCard from '../components/dashboard/ServerCard/ImprovedServerCard';"
            );
            content = content.replace(/EnhancedServerCard/g, 'ImprovedServerCard');

            // 새 파일명으로 저장
            const newStoryPath = path.join(this.rootPath, 'src/stories/ImprovedServerCard.stories.tsx');
            fs.writeFileSync(newStoryPath, content, 'utf-8');
            fs.unlinkSync(storyPath);

            console.log('  ✅ 스토리북 파일 업데이트 완료');
        }
    }

    async updateUsages() {
        console.log('🔧 사용처 업데이트...');

        const usageFiles = [
            'src/app/dashboard/page.tsx',
            'src/components/dashboard/ServerDashboard.tsx',
            'tests/unit/enhanced-server-card.test.tsx'
        ];

        usageFiles.forEach(file => {
            const fullPath = path.join(this.rootPath, file);
            if (fs.existsSync(fullPath)) {
                let content = fs.readFileSync(fullPath, 'utf-8');

                // EnhancedServerCard → ImprovedServerCard
                content = content.replace(
                    /from.*EnhancedServerCard.*/g,
                    "from '@/components/dashboard/ServerCard/ImprovedServerCard';"
                );
                content = content.replace(/EnhancedServerCard/g, 'ImprovedServerCard');

                // EnhancedServerModal은 유지 (현재 사용중)

                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`  ✅ ${file} 업데이트 완료`);
            }
        });
    }

    async deleteFiles(filesToDelete) {
        console.log('🗑️ 중복 파일 삭제...');

        filesToDelete.forEach(file => {
            const fullPath = path.join(this.rootPath, file);
            if (fs.existsSync(fullPath)) {
                try {
                    const stats = fs.statSync(fullPath);
                    if (stats.isDirectory()) {
                        fs.rmSync(fullPath, { recursive: true, force: true });
                        console.log(`  🗂️ 디렉토리 삭제: ${file}`);
                    } else {
                        fs.unlinkSync(fullPath);
                        console.log(`  📄 파일 삭제: ${file}`);
                    }
                } catch (error) {
                    console.error(`  ❌ 삭제 실패: ${file} - ${error.message}`);
                }
            }
        });
    }
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new DuplicateComponentAnalyzer();
    const command = process.argv[2];

    switch (command) {
        case 'analyze':
            analyzer.analyzeDuplicates();
            break;
        case 'cleanup':
            await analyzer.cleanupDuplicates();
            break;
        default:
            console.log(`
사용법: node scripts/analyze-duplicate-components.mjs [명령어]

명령어:
  analyze  - 중복 컴포넌트 분석
  cleanup  - 중복 컴포넌트 정리 실행
            `);
    }
} 